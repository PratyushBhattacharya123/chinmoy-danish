import { AddProduct, productFormSchema } from "@/@types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader, TextInput, Select, NumberInput } from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useCategoriesData } from "@/hooks/use-queries";

type Props = {
  onClose: () => void;
};

const ProductAdd = ({ onClose }: Props) => {
  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddProduct>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      unit: "pcs",
      hasSubUnit: false,
    },
  });

  // Watch form values
  const unitValue = watch("unit");
  const hasSubUnitValue = watch("hasSubUnit");
  const subUnitValue = watch("subUnit");

  // Fetching categories for dropdown
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
        ...(data.hasSubUnit ? {} : { subUnit: undefined }),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error("You're not authorized to add products!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(errorData || "Product already exists!", {
            style: {
              color: "#EF5026",
              fontWeight: 500,
            },
            icon: "⚠️",
          });
        } else {
          toast.error(
            errorData.error || "Failed to add product, internal server error"
          );
        }
        return errorData;
      } else {
        toast.success("Product added successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        onClose();
        return response.json();
      }
    },
  });

  const onSubmit = (data: AddProduct) => {
    mutate(data);
  };

  const handleHSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setValue("hsnCode", value, { shouldValidate: true });
  };

  useEffect(() => {
    if (!hasSubUnitValue) {
      setValue("subUnit", undefined);
    } else {
      const defaultSubUnits: Record<string, string> = {
        boxes: "pcs",
        pipes: "feets",
        rolls: "mtrs",
      };

      const defaultSubUnit = defaultSubUnits[unitValue];
      if (
        defaultSubUnit &&
        (!subUnitValue?.unit || !isValidSubUnit(unitValue, subUnitValue.unit))
      ) {
        setValue("subUnit.unit", defaultSubUnit as "pcs" | "feets" | "mtrs");
      }
    }
  }, [unitValue, hasSubUnitValue, setValue, subUnitValue]);

  const isValidSubUnit = (
    mainUnit: string,
    subUnit: string | undefined
  ): boolean => {
    const validSubUnits: Record<string, string[]> = {
      boxes: ["pcs"],
      pipes: ["feets"],
      rolls: ["mtrs"],
    };
    return validSubUnits[mainUnit]?.includes(subUnit || "") || false;
  };

  const getAvailableSubUnits = (mainUnit: string) => {
    const subUnitOptions: Record<string, { value: string; label: string }[]> = {
      boxes: [{ value: "pcs", label: "Pieces" }],
      pipes: [{ value: "feets", label: "Feets" }],
      rolls: [{ value: "mtrs", label: "Metres" }],
    };
    return subUnitOptions[mainUnit] || [];
  };

  const supportsSubUnits = ["boxes", "pipes", "rolls"].includes(unitValue);

  return (
    <form
      className="flex flex-col w-full sm:px-4 px-2 sm:pb-4 pb-3 sm:pt-6 pt-4 sm:gap-4 gap-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <TextInput
        type="text"
        label={<span className="font-medium text-gray-700">Product Name</span>}
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

      <div className="flex sm:flex-row flex-col sm:gap-4 gap-3">
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

        <NumberInput
          label={<span className="font-medium text-gray-700">Price</span>}
          placeholder="Enter price here..."
          value={watch("price")}
          onChange={(value) => {
            if (value)
              setValue("price", value as number, {
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
          error={errors.price?.message}
          variant="filled"
          allowNegative={false}
          min={0}
          hideControls
          prefix="₹"
        />
      </div>

      <div className="flex sm:flex-row flex-col sm:gap-4 gap-3">
        <Select
          label={<span className="font-medium text-gray-700">Category</span>}
          placeholder="Select category"
          data={
            categoriesData?.categories?.map((category) => ({
              value: category._id.toString(),
              label: category.title,
            })) || []
          }
          onChange={(value) => {
            if (value) setValue("categoryId", value, { shouldValidate: true });
          }}
          required
          disabled={categoriesLoading}
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          className="!w-full"
          error={errors.categoryId?.message}
          variant="filled"
          rightSection={categoriesLoading ? <Loader size={16} /> : undefined}
        />

        <NumberInput
          label={<span className="font-medium text-gray-700">Quantity</span>}
          placeholder="Enter quantity here..."
          value={watch("quantity")}
          onChange={(value) => {
            setValue("quantity", value as number);
          }}
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          className="w-full"
          error={errors.quantity?.message}
          variant="filled"
          allowNegative={false}
          hideControls
        />
      </div>

      <Select
        label={
          <span className="font-medium text-gray-700">Unit of Measurement</span>
        }
        placeholder="Select unit"
        data={[
          { value: "pcs", label: "Pieces" },
          { value: "boxes", label: "Boxes" },
          { value: "pipes", label: "Pipes" },
          { value: "rolls", label: "Rolls" },
        ]}
        defaultValue="pcs"
        onChange={(value) => {
          if (value) {
            setValue("unit", value as "pcs" | "boxes" | "pipes" | "rolls", {
              shouldValidate: true,
            });
            if (!["boxes", "pipes", "rolls"].includes(value)) {
              setValue("hasSubUnit", false);
            }
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

      {/* SubUnit Configuration */}
      {supportsSubUnits && (
        <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasGST"
              checked={hasSubUnitValue}
              onChange={(event) => {
                setValue("hasSubUnit", event.currentTarget.checked, {
                  shouldValidate: true,
                });
              }}
              className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
              style={{ accentColor: "#475569" }}
            />
            <label
              htmlFor="hasGST"
              className="text-sm font-medium text-gray-700"
            >
              Enable Sub Unit
            </label>
          </div>

          {hasSubUnitValue && (
            <div className="flex sm:flex-row flex-col sm:gap-4 gap-3 mt-3 sm:items-end">
              <Select
                label={
                  <span className="font-medium text-gray-700">Sub Unit</span>
                }
                placeholder="Select sub unit"
                data={getAvailableSubUnits(unitValue)}
                value={subUnitValue?.unit || ""}
                onChange={(value) => {
                  if (value) {
                    setValue(
                      "subUnit.unit",
                      value as "pcs" | "feets" | "mtrs",
                      {
                        shouldValidate: true,
                      }
                    );
                  }
                }}
                classNames={{
                  input:
                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                  label: "!mb-1 !text-gray-700",
                }}
                className="w-full"
                error={errors.subUnit?.unit?.message}
                variant="filled"
                required
              />

              <NumberInput
                label={
                  <span className="font-medium text-gray-700">
                    Conversion Rate
                  </span>
                }
                placeholder="e.g., 1000"
                description={`1 ${unitValue} = ${
                  subUnitValue?.conversionRate
                    ? subUnitValue?.conversionRate
                    : "?"
                } ${
                  subUnitValue?.unit ||
                  getAvailableSubUnits(unitValue)[0]?.label
                }`}
                value={subUnitValue?.conversionRate || ""}
                onChange={(value) => {
                  if (value !== "") {
                    setValue("subUnit.conversionRate", value as number, {
                      shouldValidate: true,
                    });
                  }
                }}
                classNames={{
                  input:
                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                  label: "!mb-1 !text-gray-700",
                  description: "!text-gray-500 !text-xs",
                }}
                className="w-full"
                error={errors.subUnit?.conversionRate?.message}
                variant="filled"
                allowNegative={false}
                min={0.001}
                step={0.001}
                hideControls
                required
              />
            </div>
          )}
        </div>
      )}

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
          "Submit"
        )}
      </button>
    </form>
  );
};

export default ProductAdd;
