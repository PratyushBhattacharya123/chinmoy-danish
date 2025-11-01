import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { PartyDetailsUpdateSchema, userTypeSchema } from "@/@types";
import { BillsResponse, PartyDetailsResponse } from "@/@types/server/response";
import z from "zod";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
  rateLimit,
} from "@/components/utils/constants";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Party ID is required for update" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid party ID format" },
        { status: 400 }
      );
    }

    const resultsBody = await PartyDetailsUpdateSchema.safeParseAsync(
      await req.json()
    );

    if (resultsBody.success === false) {
      console.error(JSON.stringify(resultsBody.error));
      return NextResponse.json(
        {
          error: "Invalid data",
          details: resultsBody.error.format(),
        },
        { status: 400 }
      );
    }

    const data = resultsBody.data;

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Check if user has appropriate permissions
    if (
      session.user.userType !== userTypeSchema.enum.ADMIN &&
      session.user.userType !== userTypeSchema.enum.OPERATOR
    ) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if party exists and user has permission to update it
    const partiesCollection = await getCollection<PartyDetailsResponse>(
      "parties"
    );
    const existingParty = await partiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingParty) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    // If GST number is being updated, check for conflicts
    if (data.gstNumber && data.gstNumber !== existingParty.gstNumber) {
      const gstConflict = await partiesCollection.findOne({
        gstNumber: data.gstNumber,
        _id: { $ne: new ObjectId(id) },
      });

      if (gstConflict) {
        return NextResponse.json(
          { error: "GST number already exists in the system" },
          { status: 409 }
        );
      }
    }

    // If name is being updated, check for conflicts
    if (data.name && data.name !== existingParty.name) {
      const nameConflict = await partiesCollection.findOne({
        name: data.name,
        _id: { $ne: new ObjectId(id) },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Party name exists in the system" },
          { status: 409 }
        );
      }
    }

    const updateData: Partial<PartyDetailsResponse> = {
      updatedAt: new Date(),
    };

    // Only add fields that are provided in the request
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.stateCode !== undefined) updateData.stateCode = data.stateCode;

    const updateResult = await partiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const updatedParty = await partiesCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "Party updated successfully",
      party: updatedParty,
    });
  } catch (error) {
    console.error("Error updating party details:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Rate limiting check
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Clean up old entries
    for (const [key, timestamps] of rateLimit.entries()) {
      rateLimit.set(
        key,
        timestamps.filter((time: number) => time > windowStart)
      );
    }

    // Check if IP is rate limited
    const requestTimestamps = rateLimit.get(ip) || [];
    if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Add current request to rate limit
    requestTimestamps.push(now);
    rateLimit.set(ip, requestTimestamps);

    if (!id) {
      return NextResponse.json(
        { error: "Party ID is required for deletion" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid party ID format" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    if (
      session.user.userType !== userTypeSchema.enum.ADMIN &&
      session.user.userType !== userTypeSchema.enum.OPERATOR
    ) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const partiesCollection = await getCollection<PartyDetailsResponse>(
      "parties"
    );
    const existingParty = await partiesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingParty) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    const invoicesCollection = await getCollection<BillsResponse>("invoices");
    const invoicesWithPartyDetails = await invoicesCollection.countDocuments({
      partyId: new ObjectId(id),
    });

    if (invoicesWithPartyDetails > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete party details : It is being used in invoices",
          invoicesCount: invoicesWithPartyDetails,
        },
        { status: 409 }
      );
    }

    const proformaInvoicesCollection = await getCollection("proforma-invoices");
    const proformaInvoicesWithPartyDetails =
      await proformaInvoicesCollection.countDocuments({
        partyId: new ObjectId(id),
      });

    if (proformaInvoicesWithPartyDetails > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete party details : It is being used in invoices",
          invoicesCount: proformaInvoicesWithPartyDetails,
        },
        { status: 409 }
      );
    }

    const deleteResult = await partiesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Party deleted successfully",
      id: id,
    });
  } catch (error) {
    console.error("Error deleting party:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
