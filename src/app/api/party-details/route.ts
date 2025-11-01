import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { Filter } from "mongodb";
import { addPartyDetailsSchema, userTypeSchema } from "@/@types";
import { getPartyDetailsQuerySchema } from "@/@types/server/serverTypes";
import { PartyDetailsResponse } from "@/@types/server/response";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const results = await getPartyDetailsQuerySchema.safeParseAsync(
      searchParams
    );

    if (results.success === false) {
      console.error(JSON.stringify(results.error));
      return NextResponse.json(
        { error: "Invalid query parameters", details: results.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset, search } = results.data;

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

    const query: Filter<PartyDetailsResponse> = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
      ];
    }

    const partiesCollection = await getCollection<PartyDetailsResponse>(
      "parties"
    );

    const parties = await partiesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const count = await partiesCollection.countDocuments(query);

    return NextResponse.json({
      parties,
      count,
    });
  } catch (error) {
    console.error("Error fetching party details:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const results = await addPartyDetailsSchema.safeParseAsync(
      await req.json()
    );

    if (results.success === false) {
      console.error(JSON.stringify(results.error));
      return NextResponse.json(
        {
          error: "Invalid data",
          details: results.error.format(),
        },
        { status: 400 }
      );
    }

    const data = results.data;

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

    const partiesCollection = await getCollection("parties");

    if (data.gstNumber && data.gstNumber.trim() !== "") {
      const existingParty = await partiesCollection.findOne({
        gstNumber: data.gstNumber,
      });

      if (existingParty) {
        return NextResponse.json(
          { error: "GST number already exists in the system" },
          { status: 409 }
        );
      }
    }

    const result = await partiesCollection.insertOne(data);

    return NextResponse.json(
      {
        message: "Party details saved successfully",
        id: result.insertedId,
        party: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving party details:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
