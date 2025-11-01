import { Table } from "@tanstack/react-table";
import React, { SetStateAction } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Props<T> = {
  table: Table<T>;
  pageIndex: number;
  setPageIndex: (pageIndex: number) => void;
  totalPages: number;
  limit: number;
  setOffset: React.Dispatch<SetStateAction<number>>;
};

const Pagination = <T,>({
  table,
  pageIndex,
  setPageIndex,
  totalPages,
  limit,
  setOffset,
}: Props<T>) => {
  const handlePreviousPage = () => {
    const newPageIndex = Math.max(pageIndex - 1, 0);
    setPageIndex(newPageIndex);
    setOffset(newPageIndex * limit);
    table.setPageIndex(newPageIndex);
  };

  const handleNextPage = () => {
    const newPageIndex = Math.min(pageIndex + 1, totalPages - 1);
    setPageIndex(newPageIndex);
    setOffset(newPageIndex * limit);
    table.setPageIndex(newPageIndex);
  };

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-3">
      <button
        onClick={handlePreviousPage}
        disabled={pageIndex === 0}
        className={`p-1.5 sm:p-2 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed ${
          pageIndex === 0
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-[#9f6e0c]/50"
        }`}
        aria-label="Previous page"
      >
        <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>

      <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
        Page <span className="font-semibold">{pageIndex + 1}</span> of{" "}
        <span className="font-semibold">{totalPages}</span>
      </span>

      <button
        onClick={handleNextPage}
        disabled={pageIndex >= totalPages - 1}
        className={`p-1.5 sm:p-2 rounded-md border transition-colors cursor-pointer disabled:cursor-not-allowed ${
          pageIndex >= totalPages - 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-[#9f6e0c]/50"
        }`}
        aria-label="Next page"
      >
        <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>
    </div>
  );
};

export default Pagination;
