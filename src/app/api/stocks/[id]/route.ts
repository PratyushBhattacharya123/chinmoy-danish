import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { userTypeSchema } from "@/@types";
import { ProductsResponse, StocksResponse } from "@/@types/server/response";
import z from "zod";

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
        { error: "Bill ID is required" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid bill ID format" },
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

    const stocksCollection = await getCollection<StocksResponse>("stocks");

    const aggregationPipeline = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
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
            productDetails: {
              _id: 1,
              name: 1,
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
    ];

    const stocks = await stocksCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (stocks.length === 0) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 });
    }

    const stock = stocks[0];

    return NextResponse.json(stock);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Stock ID is required for deletion" },
        { status: 400 }
      );
    }

    const idValidation = z.string().min(1).safeParse(id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid stock ID format" },
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

    // Only ADMIN can delete stock entries (more restrictive than update)
    if (session.user.userType !== userTypeSchema.enum.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Only admin can delete stock entries" },
        { status: 403 }
      );
    }

    const stocksCollection = await getCollection<StocksResponse>("stocks");
    const productsCollection = await getCollection<ProductsResponse>(
      "products"
    );

    // Check if stock entry exists
    const existingStock = await stocksCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: "Stock entry not found" },
        { status: 404 }
      );
    }

    // Revert product stock changes before deleting the stock entry
    for (const item of existingStock.items) {
      const product = await productsCollection.findOne({
        _id: item.productId,
      });

      if (product) {
        let revertedStock = product.currentStock;

        // Reverse the stock change
        if (existingStock.type === "IN") {
          revertedStock -= item.quantity; // Remove what was added
        } else if (existingStock.type === "OUT") {
          revertedStock += item.quantity; // Add back what was removed
        }
        // For ADJUSTMENT, we can't reliably revert without knowing the original value
        // So we'll skip reverting and just delete the record

        if (existingStock.type !== "ADJUSTMENT") {
          await productsCollection.updateOne(
            { _id: item.productId },
            {
              $set: {
                currentStock: Math.max(0, revertedStock), // Ensure non-negative
                updatedAt: new Date(),
              },
            }
          );
        }
      }
    }

    // Delete the stock entry
    const deleteResult = await stocksCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: "Stock entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Stock entry deleted successfully and product stocks reverted",
      id: id,
      type: existingStock.type,
    });
  } catch (error) {
    console.error("Error deleting stock entry:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
