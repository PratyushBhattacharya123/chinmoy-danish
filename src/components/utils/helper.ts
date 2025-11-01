import { AddOn, Item } from "@/@types";
import { gstStateMapping } from "./constants";

export function convertToDateFormat(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function convertToDateFormatWithTimeWithoutSeconds(dateString: string) {
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strTime = `${hours}:${minutes} ${ampm}`;

  return `${day} ${month} ${year}, ${strTime}`;
}

export const capitalize = (word: string) => {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

export const stateOptions = Object.entries(gstStateMapping).map((val) => ({
  value: val[1],
  label: val[1],
}));

export const calculateTotalAmount = (items: Item[], addOns?: AddOn[]) => {
  const itemsTotal = items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );

  const addOnsTotal =
    addOns?.reduce((total, addOn) => total + addOn.price, 0) || 0;

  return itemsTotal + addOnsTotal;
};

export const convertToWords = (num: number): string => {
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  let words = "";

  // Crores
  if (num >= 10000000) {
    words += convertToWords(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }

  // Lakhs
  if (num >= 100000) {
    words += convertToWords(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }

  // Thousands
  if (num >= 1000) {
    words += convertToWords(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }

  // Hundreds
  if (num >= 100) {
    words += convertToWords(Math.floor(num / 100)) + " Hundred ";
    num %= 100;
  }

  // Tens and Ones
  if (num > 0) {
    if (num < 10) {
      words += ones[num];
    } else if (num < 20) {
      words += teens[num - 10];
    } else {
      words += tens[Math.floor(num / 10)];
      if (num % 10 > 0) {
        words += " " + ones[num % 10];
      }
    }
  }

  return words.trim();
};

import { ProductsResponse } from "@/@types/server/response";
import { Collection } from "mongodb";

// Helper function to apply new stock changes
export async function applyStockChanges(
  type: "IN" | "OUT" | "ADJUSTMENT",
  items: Array<{ productId: string; quantity: number }>,
  existingProducts: ProductsResponse[],
  productsCollection: Collection<ProductsResponse>
) {
  for (const item of items) {
    const product = existingProducts.find(
      (p) => p._id.toString() === item.productId
    );

    if (!product) continue;

    let newStock = product.currentStock;
    if (type === "IN") {
      newStock += item.quantity;
    } else if (type === "OUT") {
      newStock -= item.quantity;
    } else {
      // ADJUSTMENT - set directly to the quantity provided
      newStock = item.quantity;
    }

    await productsCollection.updateOne(
      { _id: product._id },
      {
        $set: {
          currentStock: newStock,
          updatedAt: new Date(),
        },
      }
    );
  }
}
