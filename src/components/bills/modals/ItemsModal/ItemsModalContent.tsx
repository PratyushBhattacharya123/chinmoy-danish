"use client";

import { AddOn, EnrichedItem } from "@/@types/server/response";
import { ContextModalProps } from "@mantine/modals";
import React from "react";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { FiTrendingUp, FiPackage, FiTag } from "react-icons/fi";

const ItemsModalContent = ({
  innerProps,
}: ContextModalProps<{
  items: EnrichedItem[];
  addOns?: AddOn[];
  totalAmount: number;
}>) => {
  const { items, addOns = [], totalAmount } = innerProps;

  // Helpers
  const calculateItemTotal = (item: EnrichedItem) => {
    const base = (item.quantity || 0) * (item.productDetails?.price || 0);
    const discount = item.discountPercentage
      ? (base * (item.discountPercentage || 0)) / 100
      : 0;
    return Math.max(0, base - discount);
  };

  const getDiscountAmount = (item: EnrichedItem) => {
    const base = (item.quantity || 0) * (item.productDetails?.price || 0);
    return (base * (item.discountPercentage || 0)) / 100;
  };

  // Totals
  const itemsSubtotal = items.reduce(
    (sum, i) => sum + i.quantity * (i.productDetails?.price || 0),
    0
  );
  const totalDiscount = items.reduce((sum, i) => sum + getDiscountAmount(i), 0);
  const itemsTotal = items.reduce((sum, i) => sum + calculateItemTotal(i), 0);
  const addOnsTotal = addOns.reduce((sum, a) => sum + (a.price || 0), 0);
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const itemsWithDiscount = items.filter(
    (i) => i.discountPercentage && i.discountPercentage > 0
  ).length;

  return (
    <div className="bg-white">
      {/* Header Summary */}
      <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-300">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {[
            { label: "Products", value: items.length },
            { label: "Total Qty", value: totalQuantity },
            { label: "Discounts", value: itemsWithDiscount },
            { label: "Add-ons", value: addOns.length },
            {
              label: "Grand Total",
              value: `₹${totalAmount.toLocaleString("en-IN")}`,
            },
          ].map((info, i) => (
            <div key={i} className="text-center">
              <div className="text-xs md:text-sm font-semibold text-gray-600">
                {info.label}
              </div>
              <div className="text-lg md:text-2xl font-bold text-gray-800 mt-1">
                {info.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Items Section */}
      <div className="p-4 md:p-6">
        {/* Products Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FiPackage className="text-gray-700 size-4 md:size-5" />
            <h3 className="font-semibold text-gray-700 text-base md:text-lg">
              Products ({items.length})
            </h3>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-gray-700 text-white font-semibold text-sm">
              <div className="col-span-5">Product</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-2 text-center">Discount</div>
              <div className="col-span-2 text-center">Amount</div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden grid grid-cols-12 gap-2 px-3 py-2 bg-gray-700 text-white font-semibold text-xs">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-4 text-center">Amount</div>
            </div>

            <div className="divide-y divide-gray-100 max-h-48 md:max-h-60 overflow-y-auto">
              {items.map((item, index) => {
                const discount = getDiscountAmount(item);
                const total = calculateItemTotal(item);
                return (
                  <div key={index}>
                    {/* Desktop */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors duration-150">
                      <div className="col-span-5">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.productDetails?.name || "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          ₹{item.productDetails?.price.toLocaleString("en-IN")}{" "}
                          × {item.quantity}
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm font-medium border border-gray-300">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center text-gray-600 text-sm">
                        ₹{item.productDetails?.price.toLocaleString("en-IN")}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        {item.discountPercentage ? (
                          <div className="text-center space-y-1">
                            <div className="text-red-500 text-xs font-medium">
                              -₹{discount.toLocaleString("en-IN")}
                            </div>
                            <div className="text-gray-500 text-xs">
                              ({item.discountPercentage}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center text-gray-800 font-medium text-sm">
                        ₹{total.toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden grid grid-cols-12 gap-2 px-3 py-2 hover:bg-gray-50 transition-colors duration-150">
                      <div className="col-span-6">
                        <div className="font-medium text-gray-900 text-xs">
                          {item.productDetails?.name || "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          ₹{item.productDetails?.price.toLocaleString("en-IN")}{" "}
                          × {item.quantity}
                        </div>
                        {item.discountPercentage && (
                          <div className="mt-1 flex items-center gap-1">
                            <FiTag className="text-red-500 size-3" />
                            <span className="text-red-500 text-xs font-medium">
                              {item.discountPercentage}% off (-₹
                              {discount.toLocaleString("en-IN")})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full text-xs font-medium border border-gray-300">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center justify-center text-gray-800 font-medium text-xs">
                        ₹{total.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Charges */}
        {addOns.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaIndianRupeeSign className="text-gray-700 size-4" />
              <h3 className="font-semibold text-gray-700 text-base md:text-lg">
                Additional Charges ({addOns.length})
              </h3>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 bg-gray-700 text-white font-semibold text-xs md:text-sm">
                <div className="col-span-9 md:col-span-10">Description</div>
                <div className="col-span-3 md:col-span-2 text-center">
                  Amount
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {addOns.map((addOn, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 md:gap-4 px-3 md:px-4 py-2 md:py-3 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <div className="col-span-9 md:col-span-10 font-medium text-gray-900 text-xs md:text-sm">
                      {addOn.title}
                    </div>
                    <div className="col-span-3 md:col-span-2 flex items-center justify-center text-gray-800 font-medium text-xs md:text-sm">
                      ₹{addOn.price.toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Total Breakdown */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="space-y-2">
            {totalDiscount > 0 && (
              <>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-700">Products Subtotal :</span>
                  <span className="font-medium">
                    ₹{itemsSubtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-gray-700">Total Discount :</span>
                  <span className="font-medium text-red-600">
                    -₹{totalDiscount.toLocaleString("en-IN")}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center text-sm md:text-base">
              <span className="text-gray-700 font-medium">
                Products Total :
              </span>
              <span className="font-medium text-gray-800">
                ₹{itemsTotal.toLocaleString("en-IN")}
              </span>
            </div>

            {addOns.length > 0 && (
              <div className="flex justify-between items-center text-sm md:text-base pt-2">
                <span className="text-gray-700">Additional Charges :</span>
                <span className="font-medium">
                  ₹{addOnsTotal.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiTrendingUp className="text-gray-700 size-4 md:size-5" />
                  <span className="text-base md:text-lg font-semibold text-gray-800">
                    Grand Total
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-800 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-sm border border-gray-300">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsModalContent;
