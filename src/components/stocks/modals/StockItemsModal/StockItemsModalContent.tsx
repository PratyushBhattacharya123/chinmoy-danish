"use client";

import { EnrichedItemStocks } from "@/@types/server/response";
import { capitalize } from "@/components/utils/helper";
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

  // Helper function to get unit display
  const getUnitDisplay = (item: EnrichedItemStocks): string => {
    if (!item.productDetails) return "";

    // If it's a subunit transaction, show subunit
    if (item.isSubUnit && item.productDetails.subUnit) {
      return item.productDetails.subUnit.unit;
    }

    // Otherwise show main unit
    return item.productDetails.unit;
  };

  // Helper function to capitalize unit names
  const capitalizeUnit = (unit: string): string => {
    const unitMap: { [key: string]: string } = {
      pcs: "Pieces",
      boxes: "Boxes",
      pipes: "Pipes",
      rolls: "Rolls",
      bags: "Bags",
      feets: "Feets",
      mtrs: "Metres",
    };
    return unitMap[unit] || capitalize(unit);
  };

  // Calculate effective quantity (convert subunit to main unit for display context)
  const getEffectiveQuantity = (item: EnrichedItemStocks): number => {
    if (item.isSubUnit && item.productDetails?.subUnit) {
      return item.quantity / item.productDetails.subUnit.conversionRate;
    }
    return item.quantity;
  };

  // Get conversion info for display
  const getConversionInfo = (item: EnrichedItemStocks) => {
    if (!item.isSubUnit || !item.productDetails?.subUnit) return null;

    return {
      mainUnit: item.productDetails.unit,
      subUnit: item.productDetails.subUnit.unit,
      rate: item.productDetails.subUnit.conversionRate,
    };
  };

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

  // Calculate totals
  const itemsWithSubUnits = items.filter((item) => item.isSubUnit).length;
  const totalEffectiveQuantity = items.reduce(
    (sum, item) => sum + getEffectiveQuantity(item),
    0
  );

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
              Updated by :{" "}
              <span className="font-medium text-gray-700">{createdBy}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FiCalendar size={14} />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
              Total Qty
            </div>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1">
              {totalQuantity}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs md:text-sm font-semibold text-gray-700">
              Stock Type
            </div>
            <div className="text-lg md:text-2xl font-bold text-gray-700 mt-1">
              {stockType}
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
              <div className="col-span-5 flex items-center gap-2">
                <span>Product</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <span>Unit</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <span>Current Stock</span>
              </div>
              <div className="col-span-3 flex items-center justify-center">
                <span>Quantity</span>
              </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden grid grid-cols-12 gap-2 px-3 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-semibold text-xs">
              <div className="col-span-5 flex items-center gap-1">
                <span>Product</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <span>Unit</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <span>Stock</span>
              </div>
              <div className="col-span-3 flex items-center justify-center">
                <span>Qty</span>
              </div>
            </div>

            <div className="divide-y divide-gray-100 max-h-48 md:max-h-60 overflow-y-auto">
              {items.map((item, index) => {
                const unitDisplay = getUnitDisplay(item);
                const capitalizedUnit = capitalizeUnit(unitDisplay);
                const isSubUnit =
                  item.isSubUnit && item.productDetails?.subUnit;
                const conversionInfo = getConversionInfo(item);
                const effectiveQuantity = getEffectiveQuantity(item);

                return (
                  <div key={index}>
                    {/* Desktop View */}
                    <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 transition-colors duration-150">
                      <div className="col-span-5">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.productDetails?.name || "Unknown Product"}
                        </div>
                        {isSubUnit && conversionInfo && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            1 {conversionInfo.mainUnit} = {conversionInfo.rate}{" "}
                            {conversionInfo.subUnit}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {capitalizedUnit}
                        </span>
                      </div>
                      <div className="col-span-2 flex  flex-col items-center justify-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${
                            item.productDetails?.currentStock &&
                            item.productDetails.currentStock < 10
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-green-100 text-green-800 border-green-200"
                          }`}
                        >
                          {item.productDetails?.currentStock.toFixed(2) || 0}
                        </span>
                        {isSubUnit && (
                          <span className="text-xs text-blue-600 mt-0.5 capitalize">
                            {item.productDetails.unit}
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 flex flex-col items-center justify-center gap-1">
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
                          {item.quantity} {capitalizedUnit}
                        </span>
                        {isSubUnit && (
                          <div className="text-xs text-gray-500 text-center">
                            ({effectiveQuantity.toFixed(2)}{" "}
                            {item.productDetails?.unit})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden grid grid-cols-12 gap-2 px-3 py-2 hover:bg-gray-50 transition-colors duration-150">
                      <div className="col-span-5">
                        <div className="font-medium text-gray-900 text-xs">
                          {item.productDetails?.name || "Unknown Product"}
                        </div>
                        {isSubUnit && conversionInfo && (
                          <div className="text-xs text-blue-600 mt-0.5">
                            1:{conversionInfo.rate}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-gray-700">
                          {capitalizedUnit}
                        </span>
                        {isSubUnit && (
                          <span className="text-xs text-blue-600">(sub)</span>
                        )}
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
                      <div className="col-span-3 flex flex-col items-center justify-center">
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
                        {isSubUnit && (
                          <div className="text-xs text-gray-500 text-center mt-0.5">
                            {effectiveQuantity.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <span className="text-gray-700">Total Products Updated :</span>
              <span className="font-medium text-gray-700">{items.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Items with Sub Units :</span>
              <span className="font-medium text-gray-700">
                {itemsWithSubUnits}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Total Quantity Changed :</span>
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
            {itemsWithSubUnits > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Effective Main Units :</span>
                <span className="font-medium text-gray-700">
                  {totalEffectiveQuantity.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">Update Type :</span>
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
