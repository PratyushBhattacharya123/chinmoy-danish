"use client";

import React from "react";
import { Button, Text } from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { capitalize } from "@/components/utils/helper";

const DeleteModalContent = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{ onConfirm: () => void; type: string }>) => (
  <div className="p-4">
    <Text size="sm" className="text-gray-700 mb-6">
      This action cannot be undone. This will permanently delete the{" "}
      <span className="font-medium text-gray-700">
        {capitalize(innerProps.type)}
      </span>{" "}
      data from our servers.
    </Text>
    <div className="flex justify-end gap-3 mt-6">
      <Button
        onClick={() => context.closeModal(id)}
        className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
        variant="outline"
        radius="md"
      >
        Cancel
      </Button>
      <Button
        radius="md"
        className="!bg-gradient-to-r !from-gray-700 !to-gray-600 hover:!from-gray-800 hover:!to-gray-700 !text-white !border-none shadow-md hover:shadow-lg transition-all duration-200"
        onClick={() => {
          innerProps.onConfirm();
          context.closeModal(id);
        }}
      >
        Confirm Delete
      </Button>
    </div>
  </div>
);

export default DeleteModalContent;
