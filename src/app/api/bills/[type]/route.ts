import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCollection } from "@/lib/db";
import { addBillSchema, userTypeSchema } from "@/@types";
import { getBillsQuerySchema } from "@/@types/server/serverTypes";
import { BillsResponse, PartyDetailsResponse } from "@/@types/server/response";
import { Filter, ObjectId } from "mongodb";
import z from "zod";
import { calculateTotalAmount } from "@/components/utils/helper";

interface RouteParams {
  params: Promise<{
    type: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;

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

    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const cleanedParams = Object.fromEntries(
      Object.entries(searchParams).map(([key, value]) => [
        key,
        value === "undefined" ? undefined : value === "null" ? null : value,
      ])
    );

    const results = await getBillsQuerySchema.safeParseAsync(cleanedParams);

    if (results.success === false) {
      console.error(JSON.stringify(results.error));
      return NextResponse.json(
        { error: "Invalid query parameters", details: results.error.format() },
        { status: 400 }
      );
    }

    const { limit, offset, search, startDate, endDate } = results.data;

    // validating date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return NextResponse.json(
          { error: "End date must be newer than or equal to start date" },
          { status: 400 }
        );
      }
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

    const query: Filter<BillsResponse> = {};

    if (search) {
      const matchingParties = await (
        await getCollection<PartyDetailsResponse>("parties")
      )
        .find({ name: { $regex: search, $options: "i" } })
        .project({ _id: 1 })
        .toArray();

      query.partyId = { $in: matchingParties.map((party) => party._id) };
    }

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const aggregationPipeline = [
      { $match: query },
      { $sort: { invoiceDate: -1 } },
      { $skip: offset },
      { $limit: limit },
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
            discountPercentage: 1,
            productDetails: {
              _id: 1,
              name: 1,
              hsnCode: 1,
              gstSlab: 1,
              price: 1,
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
      { $sort: { invoiceDate: -1 } },
    ];

    const [bills, count] = await Promise.all([
      billsCollection.aggregate(aggregationPipeline).toArray(),
      billsCollection.countDocuments(query),
    ]);

    return NextResponse.json({
      bills,
      count,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { type } = await params;

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

    const results = await addBillSchema.safeParseAsync(await req.json());

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

    const billsCollection = await getCollection(
      type === "invoices" ? "invoices" : "proforma-invoices"
    );

    // Checking if party exists
    const partiesCollection = await getCollection("parties");
    const partyExists = await partiesCollection.findOne({
      _id: new ObjectId(data.partyId),
    });

    if (!partyExists) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }

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

    // Generate bill number
    // Get financial year based on invoice date
    const getFinancialYear = (date: Date): string => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (month >= 4) {
        // April to December - current year to next year
        return `${year}-${(year + 1).toString().slice(-2)}`;
      } else {
        // January to March - previous year to current year
        return `${year - 1}-${year.toString().slice(-2)}`;
      }
    };

    const invoiceDate = new Date(data.invoiceDate);
    const financialYear = getFinancialYear(invoiceDate);

    const lastBill = await billsCollection
      .find()
      .sort({ billNumber: -1 })
      .limit(1)
      .toArray();

    let nextNumber = 1;
    if (lastBill.length > 0 && lastBill[0].billNumber) {
      const billNumberMatch = lastBill[0].billNumber.match(/\d+$/);
      if (billNumberMatch) {
        const lastNumber = parseInt(billNumberMatch[0]);
        nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
      }
    }

    const billNumber =
      type === "invoices"
        ? `INV-${financialYear}-${nextNumber.toString().padStart(4, "0")}`
        : `PRO-${financialYear}-${nextNumber.toString().padStart(4, "0")}`;

    const itemsWithPrices = data.items.map((item) => {
      const product = existingProducts.find(
        (p) => p._id.toString() === item.productId
      );
      return {
        quantity: item.quantity,
        price: Number(product?.price) || 0,
        discountPercentage: item.discountPercentage,
      };
    });

    // Preparing the bill document
    const billDocument = {
      ...data,
      billNumber,
      partyId: new ObjectId(data.partyId),
      items: data.items.map((item) => ({
        ...item,
        productId: new ObjectId(item.productId),
      })),
      invoiceDate: new Date(data.invoiceDate),
      totalAmount: calculateTotalAmount(itemsWithPrices, data.addOns),
      supplyDetails: {
        ...data.supplyDetails,
        supplyDate: data.supplyDetails.supplyDate
          ? new Date(data.supplyDetails.supplyDate)
          : undefined,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Inserting the bill
    const result = await billsCollection.insertOne(billDocument);

    return NextResponse.json(
      {
        message: `${
          type === "invoices" ? "Invoice" : "Proforma Invoice"
        } created successfully`,
        id: result.insertedId,
        billNumber,
        bill: {
          ...billDocument,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bill:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
