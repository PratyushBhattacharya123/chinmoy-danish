"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addBillSchema, AddBill } from "@/@types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FaFileImport } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import ImportModalAdd from "@/components/bills/modals/ImportModalAdd";
import StepperMain from "@/components/bills/steppers/AddBillSteppers/StepperMain";
import { useProductsData } from "@/hooks/use-queries";

export interface ProductPriceMap {
  [key: number]: number; // index -> price
}

const AddInvoice = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<
    {
      _id: string;
      name: string;
      price: number;
      unit: string;
      hasSubUnit?: boolean;
      subUnit?: {
        unit: string;
        conversionRate: number;
      };
    }[]
  >([]);
  const [productPrices, setProductPrices] = useState<ProductPriceMap>({});

  const {
    data: productsData,
    refetch: refetchProducts,
    isLoading,
  } = useProductsData({
    limit: 1000,
    offset: 0,
  });

  useEffect(() => {
    if (productsData?.products) {
      setProducts(
        productsData.products.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
          price: p.price,
          unit: p.unit,
          hasSubUnit: p.hasSubUnit,
          subUnit: p.subUnit,
        }))
      );
    }
  }, [productsData, setProducts]);

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<AddBill>({
    resolver: zodResolver(addBillSchema),
    defaultValues: {
      items: [{ productId: "", quantity: 0 }],
      invoiceDate: String(new Date()),
      supplyDetails: {
        supplyPlace: "",
        transporterName: "",
        vehicleNumber: "",
        supplyDate: undefined,
      },
    },
  });

  // Create invoice mutation
  const { mutate: createInvoice, isPending } = useMutation({
    mutationFn: async (data: AddBill) => {
      const response = await fetch("/api/bills/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return { error: responseData.error || "Failed to create invoice" };
      }
      return responseData;
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Invoice created successfully!");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      router.push("/operator/bills/invoices");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create invoice");
    },
  });

  const handleSubmit = () => {
    const data: AddBill = {
      partyId: getValues("partyId"),
      invoiceDate: getValues("invoiceDate"),
      supplyDetails: getValues("supplyDetails"),
      items: getValues("items"),
      addOns: getValues("addOns"),
    };
    createInvoice(data);
  };

  const handleBack = () => {
    router.push("/operator/bills/invoices");
  };

  // Get price for a specific item index
  const getItemPrice = (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ): number => {
    let price = productPrices[index];
    if (item.isSubUnit && item.productId) {
      const conversionRate = getConversionRate(item.productId);
      price = price / conversionRate;
    }
    return price;
  };

  // Get conversion rate for a product
  const getConversionRate = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product?.subUnit?.conversionRate || 1;
  };

  const calculateItemTotal = (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ): number => {
    const itemPrice = productPrices[index] || 0;
    let quantity = item.quantity || 0;

    // If billing in subunit, convert quantity
    if (item.isSubUnit && item.productId) {
      const conversionRate = getConversionRate(item.productId);
      quantity = quantity / conversionRate;
    }

    const baseAmount = quantity * itemPrice;
    const discountAmount = item.discountPercentage
      ? (baseAmount * (item.discountPercentage || 0)) / 100
      : 0;

    return Math.max(0, baseAmount - discountAmount);
  };

  const calculateBaseAmount = (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ): number => {
    const itemPrice = productPrices[index] || 0;
    let quantity = item.quantity || 0;

    // If billing in subunit, convert quantity
    if (item.isSubUnit && item.productId) {
      const conversionRate = getConversionRate(item.productId);
      quantity = quantity / conversionRate;
    }

    return quantity * itemPrice;
  };

  const getDiscountAmount = (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ): number => {
    const baseAmount = calculateBaseAmount(item, index);
    return (baseAmount * (item.discountPercentage || 0)) / 100;
  };

  return (
    <Layout title="Create Invoice" active={1} subActive={1}>
      <div className="flex flex-col h-[calc(100dvh-66px)] lg:h-[92.3dvh]">
        <div
          className="flex-1 overflow-y-auto"
          style={{
            display: "flex",
            flexDirection: "column",
            overflowAnchor: "none",
          }}
        >
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

              <ImportModalAdd
                opened={opened}
                close={close}
                setValue={setValue}
                products={products}
                setProductPrices={setProductPrices}
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
              type="invoices"
              containerRef={containerRef}
              setProductPrices={setProductPrices}
              getItemPrice={getItemPrice}
              products={products}
              calculateItemTotal={calculateItemTotal}
              calculateBaseAmount={calculateBaseAmount}
              getDiscountAmount={getDiscountAmount}
              refetchProducts={refetchProducts}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddInvoice;
