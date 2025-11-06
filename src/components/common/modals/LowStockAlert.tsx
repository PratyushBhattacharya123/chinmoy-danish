"use client";

import { Modal } from "@mantine/core";
import { ProductsResponse } from "@/@types/server/response";
import { FiAlertTriangle, FiPackage, FiPlus } from "react-icons/fi";
import Link from "next/link";

interface LowStockAlertModalProps {
  opened: boolean;
  onClose: () => void;
  lowStockProducts: ProductsResponse[];
}

const LowStockAlertModal = ({
  opened,
  onClose,
  lowStockProducts,
}: LowStockAlertModalProps) => {
  const getStockLevelColor = (stock: number) => {
    if (stock <= 5) return "text-red-600 bg-red-50 border-red-200";
    if (stock <= 10) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  };

  const getStockLevelText = (stock: number) => {
    if (stock <= 5) return "Very Low";
    if (stock <= 10) return "Low";
    return "Running Low";
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FiAlertTriangle className="text-red-500" size={20} />
          <span className="font-semibold text-lg text-gray-900">
            Low Stock Alert
          </span>
        </div>
      }
      centered
      size="lg"
      fullScreen={false}
      styles={{
        header: {
          backgroundColor: "#fef2f2",
          borderBottom: "1px solid #fecaca",
          padding: "1rem 1.25rem",
        },
        content: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(239, 68, 68, 0.3)",
          margin: "1rem",
        },
        body: {
          padding: "0",
        },
        close: {
          outline: "0",
          focus: "0",
        },
      }}
      withCloseButton
      closeOnClickOutside
    >
      <div className="bg-white">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-gray-600 text-sm sm:text-base">
                {lowStockProducts.length} product
                {lowStockProducts.length !== 1 ? "s" : ""} are running low on
                stock
              </p>
              <p className="text-gray-500 text-xs mt-1 sm:mt-1">
                Consider restocking these items to avoid running out
              </p>
            </div>
            <div className="bg-red-100 text-red-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex-shrink-0">
              {lowStockProducts.length}
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="max-h-60 sm:max-h-80 overflow-y-auto">
          {lowStockProducts.map((product, index) => (
            <div
              key={product._id.toString()}
              className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                index === lowStockProducts.length - 1 ? "border-b-0" : ""
              }`}
            >
              <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="bg-gray-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0 mt-0.5 sm:mt-0">
                    <FiPackage className="text-gray-600" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate leading-tight sm:leading-normal">
                      {product.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium border text-center ${getStockLevelColor(
                      product.currentStock
                    )}`}
                  >
                    <span className="hidden sm:inline">
                      {getStockLevelText(product.currentStock)} :{" "}
                    </span>
                    <span className="sm:hidden">
                      {getStockLevelText(product.currentStock).split(" ")[0]} :{" "}
                    </span>
                    {product.currentStock
                      ? product.hasSubUnit
                        ? product.currentStock.toFixed(2)
                        : product.currentStock
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer w-full sm:w-auto text-center sm:text-left"
            >
              Dismiss
            </button>
            <Link
              href="/operator/stocks/add-stock"
              className="flex items-center justify-center gap-2 bg-gradient-to-br from-gray-700 to-gray-500 text-white px-4 py-2 rounded-lg hover:from-gray-800 hover:to-gray-600 transition-all duration-200 text-sm font-medium cursor-pointer w-full sm:w-auto"
              onClick={onClose}
            >
              <FiPlus size={14} />
              Update Stock
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LowStockAlertModal;
