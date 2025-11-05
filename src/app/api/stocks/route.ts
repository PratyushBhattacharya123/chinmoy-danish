import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { stockSchema, userTypeSchema } from "@/@types";
import { Filter, ObjectId } from "mongodb";
import { getStocksQuerySchema } from "@/@types/server/serverTypes";
import { ProductsResponse, StocksResponse } from "@/@types/server/response";
import { applyStockChanges } from "@/components/utils/helper";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const results = await getStocksQuerySchema.safeParseAsync(searchParams);

    if (results.success === false) {
      console.error(JSON.stringify(results.error));
      return NextResponse.json(
        { error: "Invalid query parameters", details: results.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset, type, startDate, endDate } = results.data;

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

    const stocksCollection = await getCollection<StocksResponse>("stocks");

    const query: Filter<StocksResponse> = {};

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const aggregationPipeline = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "items.productDetails",
        },
      },
      {
        $unwind: {
          path: "$items.productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          type: { $first: "$type" },
          notes: { $first: "$notes" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          userDetails: { $first: "$userDetails" },
          items: { $push: "$items" },
        },
      },
      {
        $project: {
          _id: 1,
          type: 1,
          items: {
            quantity: 1,
            isSubUnit: 1,
            productDetails: {
              _id: 1,
              name: 1,
              currentStock: 1,
              unit: 1,
              hasSubUnit: 1,
              subUnit: {
                unit: 1,
                conversionRate: 1,
              },
            },
          },
          notes: 1,
          createdAt: 1,
          updatedAt: 1,
          userDetails: {
            name: 1,
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const [stocks, count] = await Promise.all([
      stocksCollection.aggregate(aggregationPipeline).toArray(),
      stocksCollection.countDocuments(query),
    ]);

    return NextResponse.json({
      stocks,
      count,
    });
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const results = await stockSchema.safeParseAsync(await req.json());

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

    const stockData = results.data;
    const items = stockData.items;

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

    const productsCollection = await getCollection<ProductsResponse>(
      "products"
    );
    const stocksCollection = await getCollection("stocks");

    const productIds = items.map((item) => new ObjectId(item.productId));

    // Check if all products exist
    const existingProducts = await productsCollection
      .find({
        _id: { $in: productIds },
      })
      .toArray();

    if (existingProducts.length !== items.length) {
      const existingProductIds = existingProducts.map((p) => p._id.toString());
      const missingProducts = items
        .filter((item) => !existingProductIds.includes(item.productId))
        .map((item) => item.productId);

      return NextResponse.json(
        {
          error: "Some products not found",
          missingProducts,
        },
        { status: 404 }
      );
    }

    // Validate stock availability for OUT operations with subunit conversion
    for (const item of items) {
      if (stockData.type === "OUT") {
        const product = existingProducts.find(
          (p) => p._id.toString() === item.productId
        );

        if (product) {
          let effectiveQuantity = item.quantity;

          // Convert subunit quantity to main unit quantity for validation
          if (item.isSubUnit && product.subUnit) {
            effectiveQuantity = item.quantity / product.subUnit.conversionRate;
          }

          if (product.currentStock < effectiveQuantity) {
            return NextResponse.json(
              {
                error: "Insufficient stock",
                productId: item.productId,
                productName: product.name,
                currentStock: product.currentStock,
                requested: effectiveQuantity,
                isSubUnit: item.isSubUnit,
                ...(item.isSubUnit &&
                  product.subUnit && {
                    subUnitRequested: item.quantity,
                    conversionRate: product.subUnit.conversionRate,
                  }),
              },
              { status: 400 }
            );
          }
        }
      }
    }

    const now = new Date();

    // Apply the new stock changes with subunit conversion
    await applyStockChanges(
      stockData.type,
      items,
      existingProducts,
      productsCollection
    );

    const stockDocument = {
      type: stockData.type,
      items: items.map((item) => {
        return {
          productId: new ObjectId(item.productId),
          quantity: item.quantity,
          isSubUnit: item.isSubUnit || false,
        };
      }),
      notes: stockData.notes,
      createdBy: new ObjectId(session.user.id),
      createdAt: now,
      updatedAt: now,
    };

    const result = await stocksCollection.insertOne(stockDocument);

    return NextResponse.json(
      {
        message: "Stock update completed successfully",
        stockId: result.insertedId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in stock update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
