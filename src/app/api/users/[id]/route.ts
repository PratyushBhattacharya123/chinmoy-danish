import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { updateUserSchema, userTypeSchema } from "@/@types";
import { UsersResponse } from "@/@types/server/response";
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
        { error: "User ID is required for update" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const resultsBody = await updateUserSchema.safeParseAsync(await req.json());

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

    const { userType } = resultsBody.data;

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Check if user has appropriate permissions
    if (session.user.userType !== userTypeSchema.enum.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    // Check if user exists and user has permission to update it
    const usersCollection = await getCollection<UsersResponse>("users");
    const existingUser = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          userType,
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "User updated successfully",
      party: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user :", error);

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
        { error: "User ID is required for deletion" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
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

    if (session.user.userType !== userTypeSchema.enum.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    const usersCollection = await getCollection<UsersResponse>("users");

    const userExists = await usersCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deleteResult = await usersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "User not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "User deleted successfully",
      id: id,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
