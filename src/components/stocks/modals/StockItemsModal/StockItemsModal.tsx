import React from "react";
import { modals } from "@mantine/modals";
import { useIsMobile } from "@/hooks/use-mobile";
import { EnrichedItemStocks } from "@/@types/server/response";
import { FiEye } from "react-icons/fi";

type Props = {
  items: EnrichedItemStocks[];
  stockType: "IN" | "OUT" | "ADJUSTMENT";
  totalQuantity: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
};

const StockItemsModal = ({
  items,
  stockType,
  totalQuantity,
  notes,
  createdAt,
  createdBy,
}: Props) => {
  const isMobile = useIsMobile();

  const openStockItemsModal = () => {
    modals.openContextModal({
      modal: "stockItemsModal",
      title: (
        <div className="font-semibold text-lg text-gray-700">
          Stock Update Details
        </div>
      ),
      innerProps: {
        items,
        stockType,
        totalQuantity,
        notes,
        createdAt,
        createdBy,
      },
      centered: true,
      styles: {
        header: {
          backgroundColor: "#f3f4f6",
          borderBottom: "1px solid #d1d5db",
          padding: "1.2rem 1.5rem",
        },
        content: {
          borderRadius: "16px",
          boxShadow: "0 4px 20px #6b728040",
          maxWidth: "700px",
        },
        body: {
          padding: "0",
        },
      },
      size: isMobile ? "xs" : "lg",
      zIndex: 100,
    });
  };

  return (
    <button
      onClick={openStockItemsModal}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 cursor-pointer transition-all duration-200 transform hover:scale-[1.03] shadow-sm hover:shadow-md"
    >
      <FiEye className="mr-1.5 size-3 text-white" />
      {items.length} {items.length === 1 ? "item" : "items"}
    </button>
  );
};

export default StockItemsModal;
