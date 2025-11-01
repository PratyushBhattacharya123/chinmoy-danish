import { EnrichedBillsResponse } from "@/@types/server/response";
import { useIsMobile } from "@/hooks/use-mobile";
import { useBillsData } from "@/hooks/use-queries";
import { Button, Group, Modal, Select } from "@mantine/core";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiDownload } from "react-icons/fi";
import { UseFormSetValue } from "react-hook-form";
import { Stock } from "@/@types";

type Props = {
  opened: boolean;
  close: () => void;
  setValue: UseFormSetValue<Stock>;
};

const ImportModalAdd = ({ opened, close, setValue }: Props) => {
  const isMobile = useIsMobile();
  const [bills, setBills] = useState<EnrichedBillsResponse[]>([]);
  const [importBillId, setImportBillId] = useState<string | null>(null);

  const {
    data: billsData,
    isSuccess,
    isLoading,
  } = useBillsData({
    limit: 1000,
    offset: 0,
    type: "invoices",
  });

  useEffect(() => {
    if (isSuccess && billsData) {
      setBills(billsData.bills || []);
    }
  }, [billsData, isSuccess]);

  // Import invoice data
  const handleImport = async () => {
    if (!importBillId) {
      toast.error("Please select a bill to import");
      return;
    }

    try {
      const response = await fetch(`/api/bills/invoices/${importBillId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) toast.error("Failed to fetch bill details");
      const billData: EnrichedBillsResponse = await response.json();

      // Set form values from imported invoice
      setValue(
        "items",
        billData.items.map((item) => ({
          productId: item.productDetails?._id.toString() || "",
          quantity: item.quantity,
        }))
      );
      setValue("type", "OUT");
      setValue("notes", `#${billData.billNumber} updated`);

      toast.success("Bill imported successfully!");
      close();
    } catch {
      toast.error("Failed to import bill!");
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={
        <div className="flex items-center gap-2 text-gray-700">
          <FiDownload size={20} />
          <span className="font-semibold">Import Bill</span>
        </div>
      }
      centered
      size={isMobile ? "xs" : "md"}
      styles={{
        header: {
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e2e8f0",
          padding: "1.2rem 1.5rem",
        },
        content: {
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        },
      }}
      withCloseButton
    >
      <div className="space-y-6 p-1 my-2">
        <Select
          label="Select Invoice"
          placeholder="Choose an invoice to import"
          value={importBillId}
          onChange={setImportBillId}
          data={bills.map((bill) => ({
            label: bill.billNumber,
            value: bill._id.toString(),
          }))}
          disabled={bills.length === 0 || isLoading}
          styles={{
            input: {
              borderColor: "#cbd5e1",
              borderRadius: "8px",
              "&:focus": {
                borderColor: "#475569",
                boxShadow: "0 0 0 1px #475569",
              },
            },
            label: {
              fontWeight: 600,
              color: "#374151",
              marginBottom: "8px",
            },
          }}
        />

        {bills.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-2">
            No invoices found
          </div>
        )}

        <Group justify="flex-end" className="mt-8">
          <Button
            onClick={close}
            variant="outline"
            className="!border-gray-400 !text-gray-700 hover:!bg-gray-100 hover:!border-gray-500"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!importBillId}
            className="!bg-gradient-to-r !from-gray-700 !to-gray-600 hover:!from-gray-800 hover:!to-gray-700 !text-white !border-none shadow-md hover:shadow-lg transition-all duration-200"
          >
            Import
          </Button>
        </Group>
      </div>
    </Modal>
  );
};

export default ImportModalAdd;
