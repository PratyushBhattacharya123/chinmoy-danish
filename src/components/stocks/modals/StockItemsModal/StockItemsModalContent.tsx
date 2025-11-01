"use client";

import { EnrichedItemStocks } from "@/@types/server/response";
import { ContextModalProps } from "@mantine/modals";
import React from "react";
import {
  FiPackage,
  FiUser,
  FiCalendar,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
} from "react-icons/fi";

const StockItemsModalContent = ({
  innerProps,
}: ContextModalProps<{
  items: EnrichedItemStocks[];
  stockType: "IN" | "OUT" | "ADJUSTMENT";
  totalQuantity: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}>) => {
  const { items, stockType, totalQuantity, notes, createdAt, createdBy } =
    innerProps;

  const getTypeStyles = () => {
    switch (stockType) {
      case "IN":
        return "bg-green-100 text-green-800 border-green-200";
      case "OUT":
        return "bg-red-100 text-red-800 border-red-200";
      case "ADJUSTMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = () => {
    switch (stockType) {
      case "IN":
        return <FiTrendingUp className="mr-1" size={16} />;
      case "OUT":
        return <FiTrendingDown className="mr-1" size={16} />;
      case "ADJUSTMENT":
        return <FiRefreshCw className="mr-1" size={16} />;
      default:
        return null;
    }
  };

  const getTypeDisplay = () => {
    switch (stockType) {
      case "IN":
        return "Stock In";
      case "OUT":
        return "Stock Out";
      case "ADJUSTMENT":
        return "Stock Adjustment";
      default:
        return stockType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white">
      {/* Header Summary */}
      <div className="bg-gray-50 p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeStyles()}`}
            >
              {getTypeIcon()}
              {getTypeDisplay()}
            </span>
            <div className="text-sm text-gray-600">
              Updated by:{" "}
              <span className="font-medium text-gray-700">{createdBy}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar size={14} />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-700">
              Products
            </div>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1">
              {items.length}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-700">
              Total Quantity
            </div>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1">
              {totalQuantity}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-700">
              Stock Type
            </div>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1 capitalize">
              {stockType.toLowerCase()}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-700">
              Status
            </div>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1">
              Completed
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="p-4 md:p-6">
        {/* Products Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FiPackage className="text-gray-600 size-4 md:size-5" />
            <h3 className="font-semibold text-gray-700 text-base md:text-lg">
              Products ({items.length})
            </h3>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold text-sm">
              <div className="col-span-6 flex items-center gap-2">
                <span>Product</span>
              </div>
              <div className="col-span-3 flex items-center justify-center">
                <span>Current Stock</span>
              </div>
              <div className="col-span-3 flex items-center justify-center">
                <span>Quantity</span>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden grid grid-cols-12 gap-2 px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold text-xs">
              <div className="col-span-7 flex items-center gap-1">
                <span>Product</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <span>Stock</span>
              </div>
              <div className="col-span-3 flex items-center justify-center">
                <span>Qty</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-48 md:max-h-60 overflow-y-auto">
              {items.map((item, index) => (
                <div key={index}>
                  {/* Desktop View */}
                  <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors duration-150">
                    <div className="col-span-6">
                      <div className="font-medium text-gray-900 text-sm">
                        {item.productDetails?.name || "Unknown Product"}
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          item.productDetails?.currentStock &&
                          item.productDetails.currentStock < 10
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {item.productDetails?.currentStock || 0}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          stockType === "IN"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : stockType === "OUT"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {stockType === "IN"
                          ? "+"
                          : stockType === "OUT"
                          ? "-"
                          : ""}
                        {item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden grid grid-cols-12 gap-2 px-3 py-2 hover:bg-gray-50 transition-colors duration-150">
                    <div className="col-span-7">
                      <div className="font-medium text-gray-900 text-xs">
                        {item.productDetails?.name || "Unknown Product"}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Stock: {item.productDetails?.currentStock || 0}
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          item.productDetails?.currentStock &&
                          item.productDetails.currentStock < 10
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        }`}
                      >
                        {item.productDetails?.currentStock || 0}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center justify-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          stockType === "IN"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : stockType === "OUT"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }`}
                      >
                        {stockType === "IN"
                          ? "+"
                          : stockType === "OUT"
                          ? "-"
                          : ""}
                        {item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {notes && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <FiFileText className="text-gray-600 size-4" />
              <h3 className="font-semibold text-gray-700 text-base">Notes</h3>
            </div>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-700 leading-relaxed">{notes}</p>
            </div>
          </div>
        )}

        {/* Summary Section */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total Products Updated:</span>
              <span className="font-medium text-gray-700">{items.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total Quantity Changed:</span>
              <span
                className={`font-medium ${
                  stockType === "IN"
                    ? "text-green-600"
                    : stockType === "OUT"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {stockType === "IN" ? "+" : stockType === "OUT" ? "-" : ""}
                {totalQuantity}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Update Type:</span>
              <span
                className={`font-medium capitalize ${
                  stockType === "IN"
                    ? "text-green-600"
                    : stockType === "OUT"
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              >
                {getTypeDisplay()}
              </span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-600 size-4" />
                  <span className="text-sm font-semibold text-gray-700">
                    Updated by {createdBy}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockItemsModalContent;
