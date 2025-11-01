"use client";

import { SupplyDetails } from "@/@types/server/response";
import { ContextModalProps } from "@mantine/modals";
import React from "react";
import { FiTruck, FiCalendar, FiMapPin } from "react-icons/fi";

const SupplyModalContent = ({
  innerProps,
}: ContextModalProps<{
  supplyDetails: SupplyDetails;
  invoiceNumber: string;
}>) => {
  const formatDate = (date?: Date): string => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const hasTransportDetails =
    innerProps.supplyDetails.transporterName ||
    innerProps.supplyDetails.vehicleNumber;

  return (
    <div className="bg-white">
      {/* Header Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 border-b border-gray-300/40">
        <div className="text-center">
          <div className="text-xs md:text-sm font-semibold text-gray-600 mb-1">
            Invoice Number
          </div>
          <div className="text-lg md:text-xl font-bold text-blue-600">
            {innerProps.invoiceNumber}
          </div>
        </div>
      </div>

      {/* Supply Details */}
      <div className="p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          {/* Supply Place */}
          <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <FiMapPin className="text-gray-700 size-4 md:size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                  Supply Place
                </h3>
                <p className="text-gray-600 text-xs md:text-sm">
                  Delivery location
                </p>
              </div>
            </div>
            <div className="text-lg md:text-xl font-bold text-gray-700 pl-11">
              {innerProps.supplyDetails.supplyPlace}
            </div>
          </div>

          {/* Transport Details */}
          {hasTransportDetails && (
            <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <FiTruck className="text-gray-700 size-4 md:size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                    Transport Details
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm">
                    Delivery information
                  </p>
                </div>
              </div>

              <div className="space-y-2 pl-11">
                {innerProps.supplyDetails.transporterName && (
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xs md:text-sm text-gray-600">
                        Transporter :
                      </span>
                      <span className="ml-2 font-medium text-gray-800 text-sm md:text-base">
                        {innerProps.supplyDetails.transporterName}
                      </span>
                    </div>
                  </div>
                )}

                {innerProps.supplyDetails.vehicleNumber && (
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-xs md:text-sm text-gray-600">
                        Vehicle No :
                      </span>
                      <span className="ml-2 font-medium text-gray-800 text-sm md:text-base">
                        {innerProps.supplyDetails.vehicleNumber}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supply Date */}
          {innerProps.supplyDetails.supplyDate && (
            <div className="bg-white rounded-lg border border-gray-300 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <FiCalendar className="text-gray-700 size-4 md:size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                    Supply Date
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm">
                    Expected delivery date
                  </p>
                </div>
              </div>
              <div className="text-lg md:text-xl font-bold text-gray-700 pl-11">
                {formatDate(innerProps.supplyDetails.supplyDate)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 md:p-6 border-t border-gray-300/40">
        <div className="text-center">
          <div className="text-xs md:text-sm font-semibold text-gray-700">
            Delivery Information Complete
          </div>
          <div className="text-[10px] md:text-xs text-gray-500 mt-1">
            All supply details are confirmed and ready for dispatch
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyModalContent;
