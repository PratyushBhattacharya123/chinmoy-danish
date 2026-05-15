import { AddOn } from "@/@types";
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

export const calculateTotalAmount = (
  itemsWithPrices: {
    quantity: number;
    price: number;
    discountPercentage?: number;
    conversion?: number;
  }[],
  addOns?: AddOn[],
) => {
  const itemsTotal = itemsWithPrices.reduce((total, item) => {
    const baseAmount =
      item.quantity *
      (item?.conversion ? item.price / item.conversion : item.price);
    const discountAmount = item.discountPercentage
      ? (baseAmount * item.discountPercentage) / 100
      : 0;
    const itemTotal = baseAmount - discountAmount;
    return total + Math.max(0, itemTotal);
  }, 0);

  const addOnsTotal =
    addOns?.reduce((total, addOn) => total + addOn.price, 0) || 0;

  return itemsTotal + addOnsTotal;
};

export const convertToWords = (num: number): string => {
  // Handle zero case
  if (num === 0) return "Zero Rupees";

  // Separate rupees and paise (2 decimal places)
  let rupees = Math.floor(num);
  let paise = Math.round((num - rupees) * 100);

  // Fix floating point rounding issues
  if (paise === 100) {
    rupees++;
    paise = 0;
  }

  // Helper to convert integer part (0-99,99,999+) to words
  const integerToWords = (n: number): string => {
    if (n === 0) return "";

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
    if (n >= 10000000) {
      words += integerToWords(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    // Lakhs
    if (n >= 100000) {
      words += integerToWords(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    // Thousands
    if (n >= 1000) {
      words += integerToWords(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    // Hundreds
    if (n >= 100) {
      words += integerToWords(Math.floor(n / 100)) + " Hundred ";
      n %= 100;
    }
    // Tens and ones
    if (n > 0) {
      if (n < 10) {
        words += ones[n];
      } else if (n < 20) {
        words += teens[n - 10];
      } else {
        words += tens[Math.floor(n / 10)];
        if (n % 10 > 0) {
          words += " " + ones[n % 10];
        }
      }
    }
    return words.trim();
  };

  // Convert rupees part
  const rupeesWords = integerToWords(rupees);
  const rupeesText = rupeesWords
    ? rupees === 1
      ? `${rupeesWords} Rupee`
      : `${rupeesWords} Rupees`
    : "";

  // Convert paise part
  let paiseText = "";
  if (paise > 0) {
    const paiseWords = integerToWords(paise);
    paiseText = paise === 1 ? `${paiseWords} Paisa` : `${paiseWords} Paise`;
  }

  // Combine
  if (rupeesText && paiseText) {
    return `${rupeesText} and ${paiseText}`;
  }
  return rupeesText || paiseText;
};

import { ProductsResponse } from "@/@types/server/response";
import { Collection } from "mongodb";

// Helper function to apply new stock changes
export async function applyStockChanges(
  type: "IN" | "OUT" | "ADJUSTMENT",
  items: Array<{ productId: string; quantity: number; isSubUnit?: boolean }>,
  existingProducts: ProductsResponse[],
  productsCollection: Collection<ProductsResponse>,
) {
  for (const item of items) {
    const product = existingProducts.find(
      (p) => p._id.toString() === item.productId,
    );

    if (!product) continue;

    let effectiveQuantity = item.quantity;

    // Convert subunit quantity to main unit quantity
    if (item.isSubUnit && product.subUnit) {
      effectiveQuantity = item.quantity / product.subUnit.conversionRate;
    }

    let newStock = product.currentStock;
    if (type === "IN") {
      newStock += effectiveQuantity;
    } else if (type === "OUT") {
      newStock -= effectiveQuantity;
    } else {
      // ADJUSTMENT - set directly to the effective quantity
      newStock = effectiveQuantity;
    }

    await productsCollection.updateOne(
      { _id: product._id },
      {
        $set: {
          currentStock: newStock,
          updatedAt: new Date(),
        },
      },
    );
  }
}
