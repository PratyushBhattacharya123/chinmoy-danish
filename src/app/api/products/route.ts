import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { productFormSchema, userTypeSchema } from "@/@types";
import { getProductsQuerySchema } from "@/@types/server/serverTypes";
import { CategoriesResponse, ProductsResponse } from "@/@types/server/response";
import { Filter, ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const results = await getProductsQuerySchema.safeParseAsync(searchParams);

    if (results.success === false) {
      console.error(JSON.stringify(results.error));
      return NextResponse.json(
        { error: "Invalid query parameters", details: results.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset, search, categoryId, stockFilter } = results.data;

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

    let query: Filter<ProductsResponse> = {};

    // Add search functionality
    if (search) {
      query = { name: { $regex: search, $options: "i" } };
    }

    if (categoryId) {
      if (!ObjectId.isValid(categoryId)) {
        return NextResponse.json(
          { error: "Invalid category ID format" },
          { status: 400 }
        );
      }
      query.categoryId = new ObjectId(categoryId);
    }

    // Add stock filtering
    if (stockFilter) {
      switch (stockFilter) {
        case "out_of_stock":
          query.currentStock = { $eq: 0 };
          break;
        case "low":
          query.currentStock = { $gt: 0, $lte: 25 };
          break;
        case "medium":
          query.currentStock = { $gt: 25, $lte: 100 };
          break;
        case "high":
          query.currentStock = { $gt: 100 };
          break;
      }
    }

    const productsCollection = await getCollection<ProductsResponse>(
      "products"
    );

    const categoriesCollection = await getCollection<CategoriesResponse>(
      "categories"
    );

    const products = await productsCollection
      .find(query)
      .sort({ name: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Enrich products with party details and item details
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        // Get party details
        const categoryDetails = await categoriesCollection.findOne({
          _id: product.categoryId,
        });

        return {
          ...product,
          categoryDetails,
        };
      })
    );

    const count = await productsCollection.countDocuments(query);

    return NextResponse.json({
      products: enrichedProducts,
      count,
    });
  } catch (error) {
    console.error("Error fetching products :", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const results = await productFormSchema.safeParseAsync(await req.json());

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

    const productsCollection = await getCollection("products");

    const existingProduct = await productsCollection.findOne({
      name: data.name,
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product already exists in the system" },
        { status: 409 }
      );
    }

    const productDocument = {
      ...data,
      categoryId: new ObjectId(data.categoryId),
      currentStock: 0,
    };

    const result = await productsCollection.insertOne(productDocument);

    return NextResponse.json(
      {
        message: "Product saved successfully",
        id: result.insertedId,
        product: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving product:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
