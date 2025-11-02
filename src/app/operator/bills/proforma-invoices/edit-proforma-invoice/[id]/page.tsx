"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateBill, updateBillSchema } from "@/@types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FaFileImport } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { useParams, useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import ImportModalUpdate from "@/components/bills/modals/ImportModalUpdate";
import StepperMain from "@/components/bills/steppers/UpdateBillSteppers/StepperMain";
import { useBillData } from "@/hooks/use-queries";
import CustomLoader from "@/components/common/CustomLoader";

const UpdateProformaInvoice = () => {
  const { id } = useParams<{ id: string }>();
  const [opened, { open, close }] = useDisclosure(false);
  const [billNumber, setBillNumber] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<UpdateBill>({
    resolver: zodResolver(updateBillSchema),
    defaultValues: {
      items: [{ productId: "", quantity: 1 }],
      invoiceDate: String(new Date()),
      supplyDetails: {
        supplyPlace: "",
        transporterName: "",
        vehicleNumber: "",
        supplyDate: undefined,
      },
    },
  });

  // Update invoice mutation
  const { mutate: updateInvoice, isPending } = useMutation({
    mutationFn: async (data: UpdateBill) => {
      const response = await fetch(`/api/bills/proforma-invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          error: responseData.error || "Failed to update proforma-invoice",
        };
      }
      return responseData;
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Proforma Invoice updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["proforma-invoices"] });
      router.push("/operator/bills/proforma-invoices");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update Proforma Invoice");
    },
  });

  const {
    data: billData,
    isSuccess: billSuccess,
    isPending: billPending,
  } = useBillData({
    type: "proforma-invoices",
    id,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (billSuccess && billData) {
      setLoading(true);

      setBillNumber(billData.billNumber);

      // Set form values from imported invoice
      setValue("partyId", billData.partyDetails?._id.toString());
      setValue("invoiceDate", String(billData.invoiceDate));
      setValue("supplyDetails", {
        ...billData.supplyDetails,
        supplyDate: billData.supplyDetails.supplyDate
          ? String(billData.supplyDetails.supplyDate)
          : undefined,
      });
      setValue(
        "items",
        billData.items.map((item) => ({
          ...item,
          productId: item.productDetails?._id.toString() || "",
        }))
      );
      setValue("addOns", billData.addOns);

      setLoading(false);
    }
  }, [billSuccess, billData, setValue]);

  const handleSubmit = () => {
    const data: UpdateBill = {
      partyId: getValues("partyId"),
      invoiceDate: getValues("invoiceDate"),
      supplyDetails: getValues("supplyDetails"),
      items: getValues("items"),
      addOns: getValues("addOns"),
    };
    updateInvoice(data);
  };

  const handleBack = () => {
    router.push("/operator/bills/proforma-invoices");
  };

  return (
    <Layout title={`Update - ${billNumber}`} active={1} subActive={1}>
      <div className="flex flex-col h-[calc(100dvh-66px)] lg:h-[92.3dvh]">
        <div
          className="flex-1 overflow-y-auto"
          style={{
            display: "flex",
            flexDirection: "column",
            overflowAnchor: "none",
          }}
        >
          {loading || billPending ? (
            <CustomLoader />
          ) : (
            <div className="w-full mx-auto p-4 md:p-6" ref={containerRef}>
              <div className="mb-6 flex justify-between items-center gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium cursor-pointer group"
                >
                  <div className="p-2 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors duration-200">
                    <FiArrowLeft size={18} className="text-gray-700" />
                  </div>
                  <span className="font-medium">Back</span>
                </button>

                <button
                  onClick={open}
                  className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer border border-gray-600"
                >
                  <FaFileImport size={14} />
                  <span className="font-medium text-[14px]">Import</span>
                </button>

                <ImportModalUpdate
                  opened={opened}
                  close={close}
                  setValue={setValue}
                />
              </div>

              <StepperMain
                register={register}
                control={control}
                errors={errors}
                handleSubmit={handleSubmit}
                setValue={setValue}
                watch={watch}
                isPending={isPending}
                type="proforma-invoices"
                containerRef={containerRef}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UpdateProformaInvoice;
