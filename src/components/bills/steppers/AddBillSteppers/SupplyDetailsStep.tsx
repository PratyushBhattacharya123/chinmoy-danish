import { AddBill } from "@/@types";
import { Button, Group, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import React, { useLayoutEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import toast from "react-hot-toast";

type Props = {
  register: UseFormRegister<AddBill>;
  watch: UseFormWatch<AddBill>;
  control: Control<AddBill>;
  errors: FieldErrors<AddBill>;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  type: "invoices" | "proforma-invoices";
  containerRef: React.RefObject<HTMLDivElement | null>;
};

const SupplyDetailsStep = ({
  register,
  watch,
  control,
  errors,
  setActiveStep,
  type,
  containerRef,
}: Props) => {
  const invoiceDate = watch("invoiceDate");
  const supplyDate = watch("supplyDetails.supplyDate");

  const validateCurrentStep = () => {
    const supplyPlace = watch("supplyDetails.supplyPlace");
    if (!supplyPlace || !invoiceDate) {
      toast.error("Please complete all required supply fields");
      return false;
    }
    return true;
  };

  useLayoutEffect(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, []);

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setActiveStep((current) => (current < 3 ? current + 1 : current));
    }
  };

  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <div className="space-y-4">
      <TextInput
        type="text"
        label={
          <span className="font-medium text-gray-700">Transporter Name</span>
        }
        placeholder="Enter transporter name here..."
        {...register("supplyDetails.transporterName")}
        classNames={{
          input:
            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
          label: "!mb-1 !text-gray-700",
        }}
        error={errors.supplyDetails?.transporterName?.message}
        variant="filled"
      />
      <div className="flex sm:flex-row flex-col sm:gap-6 gap-4">
        <TextInput
          type="text"
          label={
            <span className="font-medium text-gray-700">Vehicle Number</span>
          }
          placeholder="Enter vehicle number here..."
          {...register("supplyDetails.vehicleNumber")}
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          className="w-full"
          error={errors.supplyDetails?.vehicleNumber?.message}
          variant="filled"
        />
        <TextInput
          type="text"
          label={
            <span className="font-medium text-gray-700">Supply Place</span>
          }
          placeholder="Enter supply place here..."
          {...register("supplyDetails.supplyPlace")}
          required
          classNames={{
            input:
              "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
            label: "!mb-1 !text-gray-700",
          }}
          className="w-full"
          error={errors.supplyDetails?.supplyPlace?.message}
          variant="filled"
        />
      </div>

      <div className="flex sm:flex-row flex-col sm:gap-6 gap-4">
        <Controller
          name="invoiceDate"
          control={control}
          render={({ field }) => (
            <DatePickerInput
              label={
                <span className="font-medium text-gray-700">Invoice Date</span>
              }
              placeholder="Select invoice date here..."
              value={field.value ? new Date(field.value) : null}
              onChange={(date) => {
                field.onChange(date ? new Date(date).toISOString() : null);
              }}
              classNames={{
                input:
                  "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                label: "!mb-1 !text-gray-700",
              }}
              maxDate={supplyDate ? new Date(supplyDate) : undefined}
              className="w-full"
              error={errors.invoiceDate?.message}
              required
              variant="filled"
              clearable
            />
          )}
        />
        <Controller
          name="supplyDetails.supplyDate"
          control={control}
          render={({ field }) => (
            <DatePickerInput
              label={
                <span className="font-medium text-gray-700">Supply Date</span>
              }
              placeholder="Select supply date here..."
              value={field.value ? new Date(field.value) : null}
              onChange={(date) => {
                field.onChange(date ? new Date(date).toISOString() : null);
              }}
              classNames={{
                input:
                  "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                label: "!mb-1 !text-gray-700",
              }}
              minDate={invoiceDate ? new Date(invoiceDate) : undefined}
              className="w-full"
              error={errors.supplyDetails?.supplyDate?.message}
              variant="filled"
              required={type === "invoices"}
              clearable
            />
          )}
        />
      </div>
      <Group className="sm:mt-7 mt-6">
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
          Next : Items
        </Button>
      </Group>
    </div>
  );
};

export default SupplyDetailsStep;
