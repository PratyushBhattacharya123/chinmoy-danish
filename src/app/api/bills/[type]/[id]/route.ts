import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { updateBillSchema, userTypeSchema } from "@/@types";
import { BillsResponse, ProductsResponse } from "@/@types/server/response";
import z from "zod";
import {
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW,
  rateLimit,
} from "@/components/utils/constants";
import { calculateTotalAmount } from "@/components/utils/helper";

interface RouteParams {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { type, id } = await params;

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const typeValidation = z
      .enum(["invoices", "proforma-invoices"])
      .safeParse(type);
    if (!typeValidation.success) {
      return NextResponse.json(
        { error: "Invalid type format" },
        { status: 400 }
      );
    }

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

    const billsCollection = await getCollection<BillsResponse>(
      type === "invoices" ? "invoices" : "proforma-invoices"
    );

    const aggregationPipeline = [
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "parties",
          localField: "partyId",
          foreignField: "_id",
          as: "partyDetails",
        },
      },
      { $unwind: { path: "$partyDetails", preserveNullAndEmptyArrays: true } },
      { $unwind: "$items" },
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
        $lookup: {
          from: "categories",
          localField: "items.productDetails.categoryId",
          foreignField: "_id",
          as: "items.productDetails.categoryDetails",
        },
      },
      {
        $unwind: {
          path: "$items.productDetails.categoryDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          items: { $push: "$items" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", { items: "$items" }],
          },
        },
      },
      {
        $project: {
          _id: 1,
          billNumber: 1,
          invoiceDate: 1,
          totalAmount: 1,
          partyDetails: {
            _id: 1,
            name: 1,
            address: 1,
            gstNumber: 1,
            state: 1,
            stateCode: 1,
          },
          items: {
            quantity: 1,
            price: 1,
            productDetails: {
              _id: 1,
              name: 1,
              hsnCode: 1,
              gstSlab: 1,
              unit: 1,
              categoryDetails: {
                _id: 1,
                title: 1,
              },
            },
          },
          supplyDetails: 1,
          addOns: 1,
          createdAt: 1,
        },
      },
    ];

    const bills = await billsCollection
      .aggregate(aggregationPipeline)
      .toArray();

    if (bills.length === 0) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const bill = bills[0];

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Error fetching bill:", error);

    if (error instanceof Error && error.message.includes("ObjectId")) {
      return NextResponse.json(
        { error: "Invalid bill ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { type, id } = await params;

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const typeValidation = z
      .enum(["invoices", "proforma-invoices"])
      .safeParse(type);
    if (!typeValidation.success) {
      return NextResponse.json(
        { error: "Invalid type format" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required for update" },
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

    const resultsBody = await updateBillSchema.safeParseAsync(await req.json());

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

    // Check if party exists
    const billsCollection = await getCollection<ProductsResponse>(
      type === "invoices" ? "invoices" : "proforma-invoices"
    );
    const existingBills = await billsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingBills) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const updateData: Partial<BillsResponse> = {};

    // Only add fields that are provided in the request
    if (data.partyId !== undefined)
      updateData.partyId = new ObjectId(data.partyId);
    if (data.items !== undefined && data.items.length > 0) {
      // Check for duplicate products in the same bill
      const productIds = data.items.map((item) => item.productId);
      const uniqueProductIds = [...new Set(productIds)];

      if (productIds.length !== uniqueProductIds.length) {
        // Find the duplicate product IDs
        const duplicateProductIds = productIds.filter(
          (productId, index) => productIds.indexOf(productId) !== index
        );

        // Get product names for better error message
        const productsCollection = await getCollection("products");
        const duplicateProducts = await productsCollection
          .find({
            _id: { $in: duplicateProductIds.map((id) => new ObjectId(id)) },
          })
          .toArray();

        const duplicateProductNames = duplicateProducts.map((p) => p.name);

        return NextResponse.json(
          {
            error: "Duplicate products found in the bill",
            message:
              "Same product cannot be added multiple times in the same bill",
            duplicateProducts: duplicateProductNames,
            duplicateProductIds: [...new Set(duplicateProductIds)],
          },
          { status: 409 }
        );
      }

      // Checking if all products exist
      const productsCollection = await getCollection("products");

      const existingProducts = await productsCollection
        .find({
          _id: { $in: productIds.map((id) => new ObjectId(id)) },
        })
        .toArray();

      if (existingProducts.length !== data.items.length) {
        const foundProductIds = existingProducts.map((p) => p._id.toString());
        const missingProductIds = data.items
          .filter((item) => !foundProductIds.includes(item.productId))
          .map((item) => item.productId);

        return NextResponse.json(
          {
            error: "Some products not found",
            missingProducts: missingProductIds,
          },
          { status: 404 }
        );
      }

      updateData.items = data.items.map((item) => ({
        ...item,
        productId: new ObjectId(item.productId),
      }));

      if (data.addOns !== undefined && data.addOns.length > 0) {
        updateData.addOns = data.addOns;
      }
      updateData.totalAmount = calculateTotalAmount(data.items, data.addOns);
    }

    if (data.supplyDetails !== undefined)
      updateData.supplyDetails = {
        ...data.supplyDetails,
        supplyDate: data.supplyDetails.supplyDate
          ? new Date(data.supplyDetails.supplyDate)
          : undefined,
      };
    if (data.invoiceDate !== undefined)
      updateData.invoiceDate = new Date(data.invoiceDate);

    const updateResult = await billsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updateData } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const updatedBill = await billsCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "Bill updated successfully",
      party: updatedBill,
    });
  } catch (error) {
    console.error("Error updating bill :", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { type, id } = await params;

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

    if (!type) {
      return NextResponse.json({ error: "Type is required" }, { status: 400 });
    }

    const typeValidation = z
      .enum(["invoices", "proforma-invoices"])
      .safeParse(type);
    if (!typeValidation.success) {
      return NextResponse.json(
        { error: "Invalid type format" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Bill ID is required for deletion" },
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

    const billsCollection = await getCollection<BillsResponse>(
      type === "invoices" ? "invoices" : "proforma-invoices"
    );

    const existingBill = await billsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const deleteResult = await billsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Bill deleted successfully",
      id,
    });
  } catch (error) {
    console.error("Error deleting bill:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
