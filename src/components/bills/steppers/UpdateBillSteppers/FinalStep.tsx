import { UpdateBill } from "@/@types";
import { usePartyDetailsData } from "@/hooks/use-queries";
import { Button, Group, Loader } from "@mantine/core";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { UseFormWatch } from "react-hook-form";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

type Props = {
  watch: UseFormWatch<UpdateBill>;
  handleSubmit: () => void;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  isPending: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  type: "invoices" | "proforma-invoices";
  calculateItemTotal: (
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
  calculateBaseAmount: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
  products: {
    _id: string;
    name: string;
    price: number;
    discountPercentage?: number | undefined;
    unit: string;
    hasSubUnit?: boolean | undefined;
    subUnit?:
      | {
          unit: string;
          conversionRate: number;
        }
      | undefined;
  }[];
};

const FinalStep = ({
  watch,
  handleSubmit,
  setActiveStep,
  isPending,
  containerRef,
  type,
  calculateItemTotal,
  getDiscountAmount,
  calculateBaseAmount,
  products,
}: Props) => {
  const [parties, setParties] = useState<{ _id: string; name: string }[]>([]);

  const { data: partiesData } = usePartyDetailsData({
    limit: 100,
    offset: 0,
  });

  useLayoutEffect(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, []);

  // Watch values for calculations
  const items = watch("items") || [];
  const addOns = watch("addOns") || [];

  // Calculate all totals
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

  // Helper function to get unit display for an item
  const getUnitDisplay = (item: {
    productId: string;
    quantity: number;
    discountPercentage?: number | undefined;
    isSubUnit?: boolean | undefined;
  }): string => {
    if (!item?.productId) return "";

    const product = products.find((p) => p._id === item.productId);
    if (!product) return "";

    // If billing in subunit and product supports subunits, show subunit
    if (item.isSubUnit && product.subUnit) {
      return product.subUnit.unit;
    }

    // Otherwise show main unit
    return product.unit;
  };

  // Helper function to capitalize unit names for display
  const capitalizeUnit = (unit: string): string => {
    const unitMap: { [key: string]: string } = {
      pcs: "Pieces",
      boxes: "Boxes",
      pipes: "Pipes",
      rolls: "Rolls",
      feets: "Feets",
      mtrs: "Metres",
    };
    return unitMap[unit] || unit.charAt(0).toUpperCase() + unit.slice(1);
  };

  useEffect(() => {
    if (partiesData?.parties) {
      setParties(
        partiesData.parties.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
        }))
      );
    }
  }, [partiesData]);

  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center text-green-700">
          <FiCheck className="mr-2" size={20} />
          <span className="font-semibold">
            Ready to update{" "}
            {type === "invoices" ? "invoice" : "proforma-invoice"}!
          </span>
        </div>
      </div>

      {/* Party and Supply Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-700 text-lg">
            Party Details
          </h3>
          <p className="text-gray-700 font-medium text-sm">
            {parties.find((p) => p._id === watch("partyId"))?.name ||
              "No party selected"}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-700 text-lg">
            Supply Details
          </h3>
          <p className="text-gray-700 text-sm">
            {watch("supplyDetails.supplyPlace") || "No supply place specified"}
          </p>
        </div>
      </div>

      {/* Items Grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-gray-700 text-lg">
          Items Summary
        </h3>

        {/* Desktop Grid View */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-semibold text-gray-700 text-sm">
            <div className="col-span-3">Product</div>
            <div className="col-span-2 text-center">Qty & Unit</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Discount</div>
            <div className="col-span-3 text-right">Amount</div>
          </div>

          {items.map((item, index) => {
            const baseAmount = calculateBaseAmount(item, index);
            const discountAmount = getDiscountAmount(item, index);
            const itemTotal = calculateItemTotal(item, index);
            const unitDisplay = getUnitDisplay(item);
            const capitalizedUnit = capitalizeUnit(unitDisplay);

            return (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm"
              >
                <div className="col-span-3 text-gray-800 font-medium">
                  {products.find((p) => p._id === item.productId)?.name ||
                    "Unknown Product"}
                </div>
                <div className="col-span-2 text-center text-gray-600">
                  <div>{item.quantity}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {capitalizedUnit}
                  </div>
                </div>
                <div className="col-span-2 text-right text-gray-600">
                  ₹{baseAmount.toLocaleString("en-IN")}
                </div>
                <div className="col-span-2 text-right">
                  {item.discountPercentage && item.discountPercentage > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <div className="text-red-500 text-xs">
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-gray-500 text-xs">
                        ({item.discountPercentage}%)
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No discount</span>
                  )}
                </div>
                <div className="col-span-3 text-right font-semibold text-gray-700">
                  ₹{itemTotal.toLocaleString("en-IN")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {items.map((item, index) => {
            const baseAmount = calculateBaseAmount(item, index);
            const discountAmount = getDiscountAmount(item, index);
            const itemTotal = calculateItemTotal(item, index);
            const unitDisplay = getUnitDisplay(item);
            const capitalizedUnit = capitalizeUnit(unitDisplay);

            return (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-800 text-sm">
                    {products.find((p) => p._id === item.productId)?.name ||
                      "Unknown Product"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="text-gray-600">
                    <span className="font-medium">Qty :</span> {item.quantity}{" "}
                    {capitalizedUnit}
                  </div>
                  <div className="text-gray-600 text-right">
                    <span className="font-medium">Price :</span> ₹
                    {baseAmount.toLocaleString("en-IN")}
                  </div>
                </div>

                {item.discountPercentage && item.discountPercentage > 0 && (
                  <div className="mb-2 p-2 bg-red-50 rounded border border-red-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-red-700 font-medium">
                        Discount ({item.discountPercentage}%):
                      </span>
                      <span className="text-red-700 font-bold">
                        -₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 text-sm">
                      Amount :
                    </span>
                    <span className="font-bold text-gray-700">
                      ₹{itemTotal.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items added to the invoice
          </div>
        )}
      </div>

      {/* Additional Charges Section */}
      {addOns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4 text-gray-700 text-lg">
            Additional Charges
          </h3>

          {/* Desktop Grid View */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-semibold text-gray-700 text-sm">
              <div className="col-span-9">Description</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            {addOns.map((addOn, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm"
              >
                <div className="col-span-9 text-gray-800 font-medium">
                  {addOn.title}
                </div>
                <div className="col-span-3 text-right font-semibold text-gray-700">
                  ₹{addOn.price.toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {addOns.map((addOn, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-gray-800 text-sm">
                    {addOn.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 text-sm">
                    Amount :
                  </span>
                  <span className="font-bold text-gray-700">
                    ₹{addOn.price.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Total Amount Breakdown */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          {totalDiscount > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Items Subtotal :</span>
                <span className="font-medium">
                  ₹{itemsSubtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total Discount :</span>
                <span className="font-medium text-red-600">
                  -₹{totalDiscount.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}

          {addOns.length > 0 && (
            <>
              <div className="flex justify-between items-center border-gray-300">
                <span className="text-gray-700 font-medium">Items Total :</span>
                <span className="font-medium text-gray-700">
                  ₹{itemsTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Additional Charges :</span>
                <span className="font-medium">
                  ₹{addOnsTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </>
          )}

          <div className="border-t border-gray-300 pt-3 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800 text-lg">
                Grand Total :
              </span>
              <span className="font-bold text-gray-700 text-xl">
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <Group className="pt-4">
        <Button
          variant="outline"
          onClick={prevStep}
          className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
          size="sm"
        >
          <FiArrowLeft className="mr-2" /> Back
        </Button>
        <Button
          onClick={handleSubmit}
          loading={isPending}
          className="!bg-gray-700 hover:!bg-gray-800 !text-white !w-[160px]"
        >
          {isPending ? (
            <Loader size={15} />
          ) : (
            `Update ${type === "invoices" ? "Invoice" : "Proforma"}`
          )}
        </Button>
      </Group>
    </div>
  );
};

export default FinalStep;
