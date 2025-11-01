import React from "react";
import { modals } from "@mantine/modals";
import { PartyDetailsDataType } from "@/app/operator/party-details/page";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  data: PartyDetailsDataType;
  id: string;
  buttonAction: React.JSX.Element;
};

const EditPartyDetailsModal = ({ data, id, buttonAction }: Props) => {
  const isMobile = useIsMobile();

  const openEditPartyDetailsModal = () => {
    modals.openContextModal({
      modal: "editPartyDetailsModal",
      title: (
        <div className="font-semibold text-lg text-gray-700">
          Edit Party Details
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

  return <span onClick={openEditPartyDetailsModal}>{buttonAction}</span>;
};

export default EditPartyDetailsModal;
