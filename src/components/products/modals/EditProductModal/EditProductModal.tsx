import React from "react";
import { modals } from "@mantine/modals";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductDataType } from "@/app/operator/products/page";

type Props = {
  data: ProductDataType;
  id: string;
  buttonAction: React.JSX.Element;
};

const EditProductModal = ({ data, id, buttonAction }: Props) => {
  const isMobile = useIsMobile();

  const openEditProductModal = () => {
    modals.openContextModal({
      modal: "editProductModal",
      title: (
        <div className="font-semibold text-lg text-gray-700">
          Edit Product Details
        </div>
      ),
      innerProps: {
        data,
        id,
      },
      centered: true,
      styles: {
        header: {
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e2e8f0",
          padding: "1rem 1.5rem",
        },
        content: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          maxWidth: "600px",
        },
      },
      size: isMobile ? "xs" : "md",
      zIndex: 100,
      withCloseButton: true,
    });
  };

  return <span onClick={openEditProductModal}>{buttonAction}</span>;
};

export default EditProductModal;
