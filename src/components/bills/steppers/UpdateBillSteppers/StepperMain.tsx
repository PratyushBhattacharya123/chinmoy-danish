import React, { useState } from "react";
import { Stepper } from "@mantine/core";
import { FaTruckMoving, FaUserTie } from "react-icons/fa";
import PartyDetailsStep from "./PartyDetailsStep";
import SupplyDetailsStep from "./SupplyDetailsStep";
import { BsFillBoxSeamFill } from "react-icons/bs";
import ItemDetatilsStep from "./ItemDetatilsStep";
import FinalStep from "./FinalStep";
import {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { UpdateBill } from "@/@types";
import AddOnsStep from "./AddOnsStep";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { EnrichedProductsResponse } from "@/@types/server/response";
import { ProductPriceMap } from "@/app/operator/bills/invoices/add-invoice/page";

type Props = {
  register: UseFormRegister<UpdateBill>;
  setValue: UseFormSetValue<UpdateBill>;
  watch: UseFormWatch<UpdateBill>;
  control: Control<UpdateBill>;
  errors: FieldErrors<UpdateBill>;
  handleSubmit: () => void;
  isPending: boolean;
  type: "invoices" | "proforma-invoices";
  containerRef: React.RefObject<HTMLDivElement | null>;
  setProductPrices: React.Dispatch<React.SetStateAction<ProductPriceMap>>;
  getItemPrice: (
    item:
      | {
          productId: string;
          quantity: number;
          discountPercentage?: number | undefined;
          isSubUnit?: boolean | undefined;
        }
      | undefined,
    index: number
  ) => number;
  products: {
    _id: string;
    name: string;
    price: number;
    unit: string;
    hasSubUnit?: boolean | undefined;
    subUnit?:
      | {
          unit: string;
          conversionRate: number;
        }
      | undefined;
  }[];
  calculateItemTotal: (
    item:
      | {
          productId: string;
          quantity: number;
          discountPercentage?: number | undefined;
          isSubUnit?: boolean | undefined;
        }
      | undefined,
    index: number
  ) => number;
  calculateBaseAmount: (
    item:
      | {
          productId: string;
          quantity: number;
          discountPercentage?: number | undefined;
          isSubUnit?: boolean | undefined;
        }
      | undefined,
    index: number
  ) => number;
  getDiscountAmount: (
    item:
      | {
          productId: string;
          quantity: number;
          discountPercentage?: number | undefined;
          isSubUnit?: boolean | undefined;
        }
      | undefined,
    index: number
  ) => number;
  refetchProducts: (options?: RefetchOptions | undefined) => Promise<
    QueryObserverResult<
      {
        products: EnrichedProductsResponse[];
        count: number;
      },
      Error
    >
  >;
  isLoading: boolean;
};

const StepperMain = ({
  setValue,
  register,
  control,
  errors,
  watch,
  handleSubmit,
  isPending,
  type,
  containerRef,
  setProductPrices,
  getItemPrice,
  products,
  calculateBaseAmount,
  calculateItemTotal,
  getDiscountAmount,
  refetchProducts,
  isLoading,
}: Props) => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <Stepper
      active={activeStep}
      onStepClick={setActiveStep}
      className="mb-6 md:mb-8"
      classNames={{
        separator: "hidden",
        steps:
          "w-full flex sm:!justify-between !flex-col sm:!flex-row !items-start sm:items-center !gap-6",
      }}
      color="#475569"
      radius="lg"
      ref={containerRef}
    >
      <Stepper.Step
        label="Party"
        description="Select or create party"
        icon={<FaUserTie size={16} />}
        className="text-gray-700"
      >
        {activeStep === 0 && (
          <PartyDetailsStep
            setValue={setValue}
            watch={watch}
            control={control}
            errors={errors}
            setActiveStep={setActiveStep}
            containerRef={containerRef}
          />
        )}
      </Stepper.Step>

      <Stepper.Step
        label="Supply"
        description="Delivery information"
        icon={<FaTruckMoving size={18} />}
        className="text-gray-700"
      >
        {activeStep === 1 && (
          <SupplyDetailsStep
            register={register}
            watch={watch}
            control={control}
            errors={errors}
            setActiveStep={setActiveStep}
            type={type}
            containerRef={containerRef}
          />
        )}
      </Stepper.Step>

      <Stepper.Step
        label="Items"
        description="Add products"
        icon={<BsFillBoxSeamFill size={18} />}
        className="text-gray-700"
      >
        {activeStep === 2 && (
          <ItemDetatilsStep
            setValue={setValue}
            watch={watch}
            control={control}
            errors={errors}
            setActiveStep={setActiveStep}
            containerRef={containerRef}
            setProductPrices={setProductPrices}
            getItemPrice={getItemPrice}
            products={products}
            calculateItemTotal={calculateItemTotal}
            getDiscountAmount={getDiscountAmount}
            refetchProducts={refetchProducts}
            isLoading={isLoading}
          />
        )}
      </Stepper.Step>

      <Stepper.Step
        label="Add-ons"
        description="Additional charges"
        icon={<BsFillBoxSeamFill size={18} />}
        className="text-gray-700"
      >
        {activeStep === 3 && (
          <AddOnsStep
            watch={watch}
            control={control}
            errors={errors}
            setActiveStep={setActiveStep}
            containerRef={containerRef}
            calculateItemTotal={calculateItemTotal}
            calculateBaseAmount={calculateBaseAmount}
            getDiscountAmount={getDiscountAmount}
          />
        )}
      </Stepper.Step>

      <Stepper.Completed>
        <FinalStep
          watch={watch}
          handleSubmit={handleSubmit}
          setActiveStep={setActiveStep}
          isPending={isPending}
          containerRef={containerRef}
          type={type}
          calculateItemTotal={calculateItemTotal}
          calculateBaseAmount={calculateBaseAmount}
          getDiscountAmount={getDiscountAmount}
          products={products}
        />
      </Stepper.Completed>
    </Stepper>
  );
};

export default StepperMain;
