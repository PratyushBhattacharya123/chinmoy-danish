import { userTypeSchema } from "@/@types";
import { UsersResponse } from "@/@types/server/response";
import { getPartyDetailsQuerySchema } from "@/@types/server/serverTypes";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { Filter } from "mongodb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

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

    if (session.user.userType !== userTypeSchema.enum.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Insufficient permissions" },
        { status: 403 }
      );
    }

    let query: Filter<UsersResponse> = {};

    // Add search functionality
    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }

    const usersCollection = await getCollection<UsersResponse>("users");

    const users = await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const count = await usersCollection.countDocuments();

    return NextResponse.json({
      users,
      count,
    });
  } catch (error) {
    console.error("Error fetching users :", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
