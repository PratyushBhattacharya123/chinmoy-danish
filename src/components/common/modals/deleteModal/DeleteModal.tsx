import React from "react";
import { modals } from "@mantine/modals";
import { CellContext } from "@tanstack/react-table";

interface Deletable {
  delete: () => void;
}

type Props<T extends Deletable> = {
  info: CellContext<T, unknown>;
  type: string;
  buttonAction: React.JSX.Element;
};

const DeleteModal = <T extends Deletable>({
  info,
  type,
  buttonAction,
}: Props<T>) => {
  const openDeleteModal = () => {
    modals.openContextModal({
      modal: "deleteModal",
      title: (
        <span className="text-lg font-semibold text-gray-700">
          Confirm Deletion
        </span>
      ),
      innerProps: {
        onConfirm: info.row.original.delete,
        type,
      },
      centered: true,
      styles: {
        header: {
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e2e8f0",
          padding: "1.2rem 1.5rem",
        },
        content: {
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        },
      },
      closeOnClickOutside: true,
      withCloseButton: true,
    });
  };

  return <span onClick={openDeleteModal}>{buttonAction}</span>;
};

export default DeleteModal;
