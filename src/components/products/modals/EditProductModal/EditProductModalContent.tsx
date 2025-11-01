"use client";

import { AddProduct, productFormSchema } from "@/@types";
import { ProductDataType } from "@/app/operator/products/page";
import { useCategoriesData } from "@/hooks/use-queries";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, NumberInput, Select, TextInput } from "@mantine/core";
import { ContextModalProps } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

const EditProductModalContent = ({
  context,
  id,
  innerProps,
}: ContextModalProps<{ data: ProductDataType; id: string }>) => {
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddProduct>({
    resolver: zodResolver(productFormSchema),
  });

  const [categoryValue, setCategoryValue] = useState<string>("");
  const [unitValue, setUnitValue] = useState<string>("");

  const categoryId = watch("categoryId");
  const unit = watch("unit");

  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategoriesData({
      limit: 100,
      offset: 0,
    });

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: AddProduct) => {
      const productData: AddProduct = {
        ...data,
        unit: data.unit || "pcs",
      };

      const response = await fetch(`/api/products/${innerProps.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to update products!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(errorData.error || "Product already exists!", {
            style: {
              color: "#EF5026",
              fontWeight: 500,
            },
            icon: "⚠️",
          });
        } else {
          const errorData = await response.json();
          toast.error(
            errorData.error ||
              "Failed to update the product, internal server error!"
          );
        }
        return errorData;
      } else {
        toast.success("Product updated successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        context.closeModal(id);
        return response.json();
      }
    },
  });

  const onSubmit = (data: AddProduct) => {
    mutate(data);
  };

  useEffect(() => {
    if (innerProps.data) {
      setValue("name", innerProps.data.name);
      setValue("hsnCode", innerProps.data.hsnCode);

      setValue("gstSlab", parseInt(innerProps.data.gstSlab) as 5 | 18);

      setValue("unit", innerProps.data.unit as "pcs" | "boxes" | "bags");
      setUnitValue(innerProps.data.unit);

      setValue("categoryId", innerProps.data.categoryId);
      setCategoryValue(innerProps.data.categoryId);
    }
  }, [innerProps.data, setValue, categoriesData]);

  useEffect(() => {
    if (categoryId !== undefined) {
      setCategoryValue(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    if (unit !== undefined) {
      setUnitValue(unit);
    }
  }, [unit]);

  const handleHSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setValue("hsnCode", value, { shouldValidate: true });
  };

  return (
    <div className="flex flex-col w-full sm:px-4 px-2 sm:pb-4 pb-3 pt-4 sm:gap-4 gap-3">
      <p className="text-sm text-gray-500">
        Edit the product details below. Changes will be saved instantly.
      </p>

      <form
        className="flex flex-col w-full gap-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <TextInput
          type="text"
          label={
            <span className="font-medium text-gray-700">Product Name</span>
          }
          placeholder="Enter product name here..."
          {...register("name")}
          required
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          error={errors.name?.message}
          variant="filled"
        />

        <TextInput
          type="text"
          label={<span className="font-medium text-gray-700">HSN Code</span>}
          placeholder="Enter HSN code (4-8 digits)..."
          {...register("hsnCode")}
          onChange={handleHSNChange}
          required
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          error={errors.hsnCode?.message}
          variant="filled"
          maxLength={8}
        />

        <NumberInput
          label={<span className="font-medium text-gray-700">GST Slab</span>}
          placeholder="Enter GST slab here..."
          value={watch("gstSlab")}
          onChange={(value) => {
            if (value)
              setValue("gstSlab", value as number, {
                shouldValidate: true,
              });
          }}
          required
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          className="w-full"
          error={errors.gstSlab?.message}
          variant="filled"
          allowNegative={false}
          minLength={1}
          max={18}
          maxLength={2}
          hideControls
        />

        <Select
          label={<span className="font-medium text-gray-700">Category</span>}
          placeholder="Select category"
          value={categoryValue}
          data={
            categoriesData?.categories?.map((category) => ({
              value: category._id.toString(),
              label: category.title,
            })) || []
          }
          onChange={(value) => {
            if (value) {
              setValue("categoryId", value, { shouldValidate: true });
              setCategoryValue(value);
            }
          }}
          required
          disabled={categoriesLoading}
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          error={errors.categoryId?.message}
          variant="filled"
          rightSection={categoriesLoading ? <Loader size={16} /> : undefined}
        />

        <Select
          label={
            <span className="font-medium text-gray-700">
              Unit of Measurement
            </span>
          }
          placeholder="Select unit"
          value={unitValue}
          data={[
            { value: "pcs", label: "Pieces" },
            { value: "boxes", label: "Boxes" },
            { value: "bags", label: "Bags" },
            { value: "rolls", label: "Rolls" },
          ]}
          onChange={(value) => {
            if (value) {
              setValue("unit", value as "pcs" | "boxes" | "bags" | "rolls", {
                shouldValidate: true,
              });
              setUnitValue(value);
            }
          }}
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          error={errors.unit?.message}
          variant="filled"
          required
        />

        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-800 hover:to-gray-700 rounded-md transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 cursor-pointer mt-2 border border-gray-600"
          disabled={isPending || categoriesLoading}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader size={16} color="white" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </form>
    </div>
  );
};

export default EditProductModalContent;
