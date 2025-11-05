import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { ObjectId } from "mongodb";
import { updateProductSchema, userTypeSchema } from "@/@types";
import { BillsResponse, ProductsResponse } from "@/@types/server/response";
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

    const resultsBody = await updateProductSchema.safeParseAsync(
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
    const productsCollection = await getCollection<ProductsResponse>(
      "products"
    );
    const existingProducts = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingProducts) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // If name is being updated, check for conflicts
    if (data.name && data.name !== existingProducts.name) {
      const nameConflict = await productsCollection.findOne({
        name: data.name,
        _id: { $ne: new ObjectId(id) },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Product name exists in the system" },
          { status: 409 }
        );
      }
    }

    const updateData: Partial<ProductsResponse> = {};

    // Only add fields that are provided in the request
    if (data.categoryId !== undefined)
      updateData.categoryId = new ObjectId(data.categoryId);
    if (data.name !== undefined) updateData.name = data.name;
    if (data.gstSlab !== undefined) updateData.gstSlab = data.gstSlab;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.hsnCode !== undefined) updateData.hsnCode = data.hsnCode;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.quantity !== undefined) updateData.currentStock = data.quantity;
    if (data.hasSubUnit !== undefined) updateData.hasSubUnit = data.hasSubUnit;

    if (data.hasSubUnit) {
      if (data.subUnit !== undefined) updateData.subUnit = data.subUnit;
    } else {
      updateData.subUnit = undefined;
    }

    const updateResult = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updatedParty = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      message: "Product updated successfully",
      party: updatedParty,
    });
  } catch (error) {
    console.error("Error updating product :", error);

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
        { error: "Product ID is required for deletion" },
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

    const productsCollection = await getCollection<ProductsResponse>(
      "products"
    );
    const existingProduct = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const invoicesCollection = await getCollection<BillsResponse>("invoices");
    const invoicesWithProduct = await invoicesCollection.countDocuments({
      "items.productId": new ObjectId(id),
    });

    if (invoicesWithProduct > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete product : It is being used in invoices",
          invoicesCount: invoicesWithProduct,
        },
        { status: 409 }
      );
    }

    const proformaInvoicesCollection = await getCollection("proforma-invoices");
    const proformaInvoicesWithProduct =
      await proformaInvoicesCollection.countDocuments({
        "items.productId": new ObjectId(id),
      });

    if (proformaInvoicesWithProduct > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete product : It is being used in invoices",
          invoicesCount: proformaInvoicesWithProduct,
        },
        { status: 409 }
      );
    }

    const deleteResult = await productsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Product deleted successfully",
      id: id,
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
