import React from "react";
import { modals } from "@mantine/modals";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddOn, EnrichedItem } from "@/@types/server/response";
import { FiEye } from "react-icons/fi";

type Props = {
  items: EnrichedItem[];
  addOns?: AddOn[];
  totalAmount: number;
  itemsCount: number;
};

const ItemsModal = ({ items, addOns, totalAmount, itemsCount }: Props) => {
  const isMobile = useIsMobile();

  const openItemsModal = () => {
    modals.openContextModal({
      modal: "itemsModal",
      title: (
        <div className="font-semibold text-lg text-gray-700">
          Item Details {addOns && addOns.length > 0 && "& Additional Charges"}
        </div>
      ),
      innerProps: {
        items,
        addOns,
        totalAmount,
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
      size: isMobile ? "xs" : "xl",
      zIndex: 100,
    });
  };

  return (
    <button
      onClick={openItemsModal}
      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500 text-white hover:bg-gray-600 cursor-pointer transition-all duration-200 transform hover:scale-[1.03] shadow-sm hover:shadow-md"
    >
      <FiEye className="mr-1.5 size-3 text-white" />
      {itemsCount} {itemsCount === 1 ? "item" : "items"}
    </button>
  );
};

export default ItemsModal;
