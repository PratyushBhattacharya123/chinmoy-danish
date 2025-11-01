"use client";

import { DatePickerInput } from "@mantine/dates";
import React, { useEffect, useState } from "react";
import { FiFilter, FiX } from "react-icons/fi";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  startDate: string | null;
  setStartDate: React.Dispatch<React.SetStateAction<string | null>>;
  endDate: string | null;
  setEndDate: React.Dispatch<React.SetStateAction<string | null>>;
  type: string;
};

const DateFilterModal = ({
  isOpen,
  onClose,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  type,
}: Props) => {
  const isMobile = useIsMobile();
  const [localStartDate, setLocalStartDate] = useState<string | null>(
    startDate
  );
  const [localEndDate, setLocalEndDate] = useState<string | null>(endDate);

  useEffect(() => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
  }, [startDate, endDate, isOpen]);

  const setStartOfDay = (dateString: string | null): string | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  };

  const setEndOfDay = (dateString: string | null): string | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    date.setHours(23, 59, 59, 999);
    return date.toISOString();
  };

  const formatDateForDisplay = (date: string | null): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleApplyFilters = () => {
    setStartDate(setStartOfDay(localStartDate));
    setEndDate(setEndOfDay(localEndDate));
    onClose();
  };

  const handleClearFilters = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setStartDate(null);
    setEndDate(null);
  };

  const handleStartDateChange = (value: string | null) => {
    setLocalStartDate(value);
    if (value && localEndDate && new Date(value) > new Date(localEndDate)) {
      setLocalEndDate(value);
    }
  };

  const handleEndDateChange = (value: string | null) => {
    if (value) {
      const date = new Date(value);
      const today = new Date();
      if (date > today) {
        setLocalEndDate(today.toISOString().split("T")[0]);
      } else if (localStartDate && date < new Date(localStartDate)) {
        setLocalEndDate(localStartDate);
      } else {
        setLocalEndDate(value);
      }
    } else {
      setLocalEndDate(null);
    }
  };

  // Handle escape key for desktop
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // MOBILE VIEW
  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
          onClick={onClose}
        />

        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 animate-slide-up">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FiFilter className="text-gray-700" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    Date Filters
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select date range for {type}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Date Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <DatePickerInput
                    dropdownType="modal"
                    placeholder="Select start date"
                    value={localStartDate}
                    onChange={handleStartDateChange}
                    maxDate={localEndDate ? new Date(localEndDate) : new Date()}
                    classNames={{
                      input: "!h-12 !border-gray-300 !rounded-xl !text-base",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePickerInput
                    dropdownType="modal"
                    placeholder="Select end date"
                    value={localEndDate}
                    onChange={handleEndDateChange}
                    minDate={
                      localStartDate ? new Date(localStartDate) : undefined
                    }
                    maxDate={new Date()}
                    classNames={{
                      input: "!h-12 !border-gray-300 !rounded-xl !text-base",
                    }}
                  />
                </div>
              </div>

              {/* Selected Range Display */}
              {(localStartDate || localEndDate) && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Range:
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="bg-white px-3 py-1 rounded-lg border border-gray-200">
                      {formatDateForDisplay(localStartDate) || "Any"}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-white px-3 py-1 rounded-lg border border-gray-200">
                      {formatDateForDisplay(localEndDate) || "Any"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl">
            <div className="flex gap-3">
              {(localStartDate || localEndDate) && (
                <button
                  onClick={handleClearFilters}
                  className="flex-1 h-11 px-3 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={handleApplyFilters}
                className="flex-1 h-11 px-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-medium shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // DESKTOP VIEW
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" />

      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <FiFilter className="text-gray-700" size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">
                    Date Filters
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select date range for {type}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <DatePickerInput
                    dropdownType="popover"
                    placeholder="Start date"
                    value={localStartDate}
                    onChange={handleStartDateChange}
                    maxDate={localEndDate ? new Date(localEndDate) : new Date()}
                    classNames={{
                      input: "!h-10 !border-gray-300 !rounded-lg !text-sm",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePickerInput
                    dropdownType="popover"
                    placeholder="End date"
                    value={localEndDate}
                    onChange={handleEndDateChange}
                    minDate={
                      localStartDate ? new Date(localStartDate) : undefined
                    }
                    maxDate={new Date()}
                    classNames={{
                      input: "!h-10 !border-gray-300 !rounded-lg !text-sm",
                    }}
                  />
                </div>
              </div>

              {(localStartDate || localEndDate) && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Selected Range :
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-white px-2 py-1 rounded border border-gray-200">
                      {formatDateForDisplay(localStartDate) || "Any"}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="bg-white px-2 py-1 rounded border border-gray-200">
                      {formatDateForDisplay(localEndDate) || "Any"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex gap-3 justify-end">
              {(localStartDate || localEndDate) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 h-10 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors !text-sm font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleApplyFilters}
                className="px-6 h-10 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all !text-sm font-medium shadow-sm cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DateFilterModal;
