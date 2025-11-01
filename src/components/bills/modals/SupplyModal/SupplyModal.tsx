import React from "react";
import { modals } from "@mantine/modals";
import { useIsMobile } from "@/hooks/use-mobile";
import { SupplyDetails } from "@/@types/server/response";
import { FiTruck, FiMapPin } from "react-icons/fi";

type Props = {
  supplyDetails: SupplyDetails;
  invoiceNumber: string;
};

const SupplyModal = ({ supplyDetails, invoiceNumber }: Props) => {
  const isMobile = useIsMobile();

  const openSupplyModal = () => {
    modals.openContextModal({
      modal: "supplyModal",
      title: (
        <div className="flex items-center gap-2">
          <FiTruck className="text-gray-700 size-5" />
          <span className="font-semibold text-lg text-gray-700">
            Supply Details
          </span>
        </div>
      ),
      innerProps: {
        supplyDetails,
        invoiceNumber,
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
          maxWidth: "600px",
          overflow: "hidden",
        },
        body: {
          padding: "0",
        },
      },
      size: isMobile ? "xs" : "md",
      zIndex: 100,
    });
  };

  return (
    <button
      onClick={openSupplyModal}
      className="text-sm text-blue-700 hover:text-blue-800 cursor-pointer transition-all duration-200 hover:underline flex items-center gap-1 max-w-[150px] truncate"
      title={supplyDetails.supplyPlace}
    >
      <FiMapPin className="size-3 flex-shrink-0" />
      <span className="truncate">{supplyDetails.supplyPlace}</span>
    </button>
  );
};

export default SupplyModal;
