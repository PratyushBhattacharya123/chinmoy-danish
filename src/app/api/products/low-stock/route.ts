import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { userTypeSchema } from "@/@types";
import { ProductsResponse } from "@/@types/server/response";

export async function GET() {
  try {
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

    const products = await productsCollection
      .find({ currentStock: { $gte: 0, $lte: 25 } })
      .sort({ name: 1 })
      .toArray();

    const count = await productsCollection.countDocuments();

    return NextResponse.json({
      products,
      count,
    });
  } catch (error) {
    console.error("Error fetching low stock products :", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
