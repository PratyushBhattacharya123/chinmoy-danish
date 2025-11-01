import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { userTypeSchema } from "@/@types";
import { CategoriesResponse } from "@/@types/server/response";
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

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required for deletion" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
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

    const categoriesCollection = await getCollection<CategoriesResponse>(
      "categories"
    );

    const category = await categoriesCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      category,
    });
  } catch (error) {
    console.error("Error fetching category :", error);
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
        { error: "Category ID is required for deletion" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid category ID format" },
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

    const categoriesCollection = await getCollection<CategoriesResponse>(
      "categories"
    );

    const categoryExists = await categoriesCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!categoryExists) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const productsCollection = await getCollection("products");
    const productsWithCategory = await productsCollection.countDocuments({
      categoryId: new ObjectId(id),
    });

    if (productsWithCategory > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category : It is being used by products",
          productsCount: productsWithCategory,
        },
        { status: 409 }
      );
    }

    const deleteResult = await categoriesCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "Category not found or already deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Category deleted successfully",
      id: id,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
