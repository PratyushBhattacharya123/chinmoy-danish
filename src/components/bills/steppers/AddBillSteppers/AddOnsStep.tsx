import { Button, Group, NumberInput, TextInput } from "@mantine/core";
import React, { useLayoutEffect } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  UseFormWatch,
} from "react-hook-form";
import { FaTrashCan } from "react-icons/fa6";
import { FiArrowLeft, FiPlus } from "react-icons/fi";
import { AddBill } from "@/@types";

type Props = {
  watch: UseFormWatch<AddBill>;
  control: Control<AddBill>;
  errors: FieldErrors<AddBill>;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  calculateItemTotal: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
  calculateBaseAmount: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
  getDiscountAmount: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
};

const AddOnsStep = ({
  watch,
  control,
  errors,
  setActiveStep,
  containerRef,
  calculateItemTotal,
  calculateBaseAmount,
  getDiscountAmount,
}: Props) => {
  useLayoutEffect(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, []);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "addOns",
  });

  // Watch values for calculations
  const addOns = watch("addOns") || [];
  const items = watch("items") || [];

  // Calculate totals
  const itemsSubtotal = items.reduce(
    (sum, item, index) => sum + calculateBaseAmount(item, index),
    0
  );

  const totalDiscount = items.reduce(
    (sum, item, index) => sum + getDiscountAmount(item, index),
    0
  );

  const itemsTotal = items.reduce(
    (sum, item, index) => sum + calculateItemTotal(item, index),
    0
  );

  const addOnsTotal = addOns.reduce(
    (sum, addOn) => sum + (addOn.price || 0),
    0
  );
  const grandTotal = itemsTotal + addOnsTotal;

  const handleNextStep = () => {
    setActiveStep((current) => (current < 4 ? current + 1 : current));
  };

  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Additional Charges
        </h3>
        <p className="text-sm text-gray-600">
          Add local transportation, packaging charges, or any other additional
          costs
        </p>
      </div>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-4 border border-gray-200 rounded-lg relative flex flex-col sm:gap-4 gap-2 sm:pb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-15 sm:gap-6 gap-4 items-end relative">
            <div className="md:col-span-11">
              <Controller
                name={`addOns.${index}.title`}
                control={control}
                render={({ field }) => (
                  <TextInput
                    label={
                      <span className="font-medium text-gray-700">
                        Charge Description
                      </span>
                    }
                    placeholder="e.g., Local Transportation, Packaging, Handling, etc."
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.addOns?.[index]?.title?.message}
                    classNames={{
                      input:
                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                      label: "!mb-1 !text-gray-700",
                    }}
                    className="w-full"
                    required
                    variant="filled"
                    minLength={1}
                    maxLength={60}
                  />
                )}
              />
            </div>

            <div className="md:col-span-4">
              <Controller
                name={`addOns.${index}.price`}
                control={control}
                render={({ field }) => (
                  <NumberInput
                    label={
                      <span className="font-medium text-gray-700">Amount</span>
                    }
                    placeholder="Enter amount"
                    min={0}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    error={errors.addOns?.[index]?.price?.message}
                    hideControls
                    required
                    classNames={{
                      input:
                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                      label: "!mb-1 !text-gray-700",
                    }}
                    variant="filled"
                  />
                )}
              />
            </div>
          </div>

          {fields.length > 0 && (
            <div
              className="absolute top-3.5 right-3.5 text-red-500 cursor-pointer hover:text-red-600"
              onClick={() => remove(index)}
            >
              <FaTrashCan size={14} />
            </div>
          )}
        </div>
      ))}

      <Button
        variant="outline"
        onClick={() => append({ title: "", price: 0 })}
        className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
      >
        <FiPlus className="mr-2" /> Add Additional Charge
      </Button>

      {/* Summary Section */}
      <div className="my-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Summary</h4>

        <div className="space-y-2">
          {totalDiscount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items Subtotal :</span>
                <span className="font-medium">
                  ₹{itemsSubtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Discount :</span>
                <span className="font-medium text-green-600">
                  -₹{totalDiscount.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}

          {addOns.length > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Items Total :</span>
                <span className="font-medium">
                  ₹{itemsTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Additional Charges :</span>
                <span className="font-medium">
                  ₹{addOnsTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}

          <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-base">
            <span className="text-gray-800">Grand Total :</span>
            <span className="text-gray-700">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      <Group>
        <Button
          variant="outline"
          onClick={prevStep}
          className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
        >
          <FiArrowLeft className="mr-2" /> Back
        </Button>
        <Button
          onClick={handleNextStep}
          className="!bg-gray-700 hover:!bg-gray-800 !text-white"
        >
          Next : Review
        </Button>
      </Group>
    </div>
  );
};

export default AddOnsStep;
