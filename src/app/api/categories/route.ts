import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { addCategorySchema, userTypeSchema } from "@/@types";
import { getPartyDetailsQuerySchema } from "@/@types/server/serverTypes";
import { CategoriesResponse } from "@/@types/server/response";
import { Filter } from "mongodb";

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

    let query: Filter<CategoriesResponse> = {};

    // Add search functionality
    if (search) {
      query = { title: { $regex: search, $options: "i" } };
    }

    const categoriesCollection = await getCollection<CategoriesResponse>(
      "categories"
    );

    const categories = await categoriesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const count = await categoriesCollection.countDocuments();

    return NextResponse.json({
      categories,
      count,
    });
  } catch (error) {
    console.error("Error fetching categories :", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const results = await addCategorySchema.safeParseAsync(await req.json());

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

    const categoriesCollection = await getCollection("categories");

    const existingCategory = await categoriesCollection.findOne({
      title: data.title,
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category already exists in the system" },
        { status: 409 }
      );
    }

    const result = await categoriesCollection.insertOne(data);

    return NextResponse.json(
      {
        message: "Category saved successfully",
        id: result.insertedId,
        category: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving category:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
