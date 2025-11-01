"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CustomTable from "@/components/common/table/CustomTable";
import {
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiFilter,
  FiTrash2,
} from "react-icons/fi";
import CustomLoader from "@/components/common/CustomLoader";
import { Pagination } from "@/@types";
import { Select } from "@mantine/core";
import {
  EnrichedItemStocks,
  EnrichedStocksResponse,
} from "@/@types/server/response";
import { useStocksData } from "@/hooks/use-queries";
import { FaFilter } from "react-icons/fa6";
import DateFilterModal from "@/components/bills/modals/DateFilterModal";
import Link from "next/link";
import DeleteModal from "@/components/common/modals/deleteModal/DeleteModal";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import StockItemsModal from "@/components/stocks/modals/StockItemsModal/StockItemsModal";

export interface StockDataType {
  _id: string;
  name: string;
  typeDisplay: string;
  items: string;
  totalItems: string;
  totalQuantity: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  delete: () => void;
}

const Stocks = () => {
  const [data, setData] = useState<EnrichedStocksResponse[]>([]);
  const [tableData, setTableData] = useState<StockDataType[]>([]);
  const [stockType, setStockType] = useState<"IN" | "OUT" | "ADJUSTMENT">();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(Pagination.limit);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const columnHelper = createColumnHelper<StockDataType>();

  const {
    data: stocksData,
    isSuccess,
    isLoading,
  } = useStocksData({
    limit,
    offset,
    type: stockType,
    startDate: startDate || "",
    endDate: endDate || "",
  });

  useEffect(() => {
    if (isSuccess && stocksData) {
      setData(stocksData.stocks || []);
    }
  }, [stocksData, isSuccess]);

  const queryClient = useQueryClient();

  const columns = [
    columnHelper.accessor("name", {
      id: "type",
      cell: (info) => {
        const type = info.row.original.name;
        const getTypeStyles = () => {
          switch (type) {
            case "IN":
              return "bg-green-100 text-green-800 border-green-200";
            case "OUT":
              return "bg-red-100 text-red-800 border-red-200";
            case "ADJUSTMENT":
              return "bg-blue-100 text-blue-800 border-blue-200";
            default:
              return "bg-gray-100 text-gray-800 border-gray-200";
          }
        };

        const getTypeIcon = () => {
          switch (type) {
            case "IN":
              return <FiTrendingUp className="mr-1" size={12} />;
            case "OUT":
              return <FiTrendingDown className="mr-1" size={12} />;
            case "ADJUSTMENT":
              return <FiRefreshCw className="mr-1" size={12} />;
            default:
              return null;
          }
        };

        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeStyles()}`}
          >
            {getTypeIcon()}
            {info.getValue()}
          </span>
        );
      },
      header: () => "Type",
    }),
    columnHelper.accessor("items", {
      id: "products",
      cell: (info) => {
        const items: EnrichedItemStocks[] = JSON.parse(info.getValue());
        const stockType = info.row.original.name as "IN" | "OUT" | "ADJUSTMENT";
        const totalQuantity = Number(info.row.original.totalQuantity);
        const notes = info.row.original.notes;
        const createdAt = info.row.original.createdAt;
        const createdBy = info.row.original.createdBy;

        return (
          <StockItemsModal
            items={items}
            stockType={stockType}
            totalQuantity={totalQuantity}
            notes={notes}
            createdAt={createdAt}
            createdBy={createdBy}
          />
        );
      },
      header: () => "Products",
    }),
    columnHelper.accessor("totalQuantity", {
      id: "totalQuantity",
      cell: (info) => (
        <span className="text-sm font-semibold text-gray-900">
          {info.getValue()}
        </span>
      ),
      header: () => "Total Qty",
    }),
    columnHelper.accessor("notes", {
      id: "notes",
      cell: (info) => (
        <span className="text-sm text-gray-600 line-clamp-2 max-w-[150px] text-wrap">
          {info.getValue() || "-"}
        </span>
      ),
      header: () => "Notes",
    }),
    columnHelper.accessor("createdBy", {
      id: "userName",
      cell: (info) => (
        <span className="text-sm text-gray-700 text-wrap">
          {info.getValue()}
        </span>
      ),
      header: () => "Updated By",
    }),
    columnHelper.accessor("createdAt", {
      id: "createdAt",
      cell: (info) => (
        <span className="text-sm text-gray-500">
          {new Date(info.getValue()).toLocaleDateString()}
        </span>
      ),
      header: () => "Date",
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <DeleteModal<StockDataType>
          type="stock history"
          info={info}
          buttonAction={
            <button className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
              <FiTrash2 className="mr-1.5" size={14} />
              Delete
            </button>
          }
        />
      ),
    }),
  ];

  const { mutate } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stocks/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to delete stock history!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else {
          toast.error(errorData.error || "Failed to delete stock history!");
        }
        return errorData;
      } else {
        toast.success("Stock history deleted successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        return response.json();
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      mutate(id);
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toast.error("Failed to delete invoice. Please try again.", {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      const transformedData = data.map((stock) => ({
        _id: stock._id.toString(),
        name: String(stock.type),
        typeDisplay: getTypeDisplay(stock.type),
        items: JSON.stringify(stock.items),
        totalItems: String(stock.items.length),
        totalQuantity: String(
          stock.items.reduce(
            (sum: number, item: EnrichedItemStocks) => sum + item.quantity,
            0
          )
        ),
        notes: stock.notes,
        createdAt: String(stock.createdAt),
        updatedAt: String(stock.updatedAt),
        createdBy: stock.userDetails.name,
        delete: () => handleDelete(stock._id.toString()),
      }));
      setTableData(transformedData);
    } else {
      setTableData([]);
    }
  }, [data]);

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "IN":
        return "Stock In";
      case "OUT":
        return "Stock Out";
      case "ADJUSTMENT":
        return "Stock Adjustment";
      default:
        return type;
    }
  };

  // Check if filters are active
  const isFilterActive = startDate || endDate;

  return (
    <Layout title="Inventory" active={5}>
      <div className="flex flex-col h-[calc(100dvh-66px)] lg:h-[92.3dvh]">
        <div
          className="flex-1 overflow-y-auto"
          style={{
            display: "flex",
            flexDirection: "column",
            overflowAnchor: "none",
          }}
        >
          <div className="pb-6 px-6">
            <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-start sm:items-center my-6">
              <div className="w-full sm:w-auto flex-1 sm:flex-initial flex justify-between gap-3">
                <Select
                  placeholder="Filter by type"
                  value={stockType}
                  onChange={(value) =>
                    setStockType((value as "IN" | "OUT" | "ADJUSTMENT") || "")
                  }
                  data={[
                    { value: "", label: "All Types" },
                    { value: "IN", label: "Stock In" },
                    { value: "OUT", label: "Stock Out" },
                    { value: "ADJUSTMENT", label: "Adjustment" },
                  ]}
                  className="w-full sm:w-[200px]"
                  classNames={{
                    input: "!border-gray-400 !rounded-md !h-9 !bg-transparent",
                    dropdown: "!rounded-md !border-gray-400/30",
                    option: "!text-sm hover:!bg-gray-50",
                  }}
                  clearable
                />

                <button
                  onClick={() => setIsFilterModalOpen(true)}
                  className="p-3 bg-gray-200 rounded-lg text-gray-700 cursor-pointer"
                >
                  {isFilterActive ? (
                    <FaFilter size={14} />
                  ) : (
                    <FiFilter size={14} />
                  )}
                </button>
              </div>

              <Link
                className="bg-gradient-to-br from-gray-700 to-gray-400 font-medium text-white rounded-md h-9 text-[18px] cursor-pointer w-full sm:w-[150px] flex items-center justify-center"
                href={"/operator/stocks/add-stock"}
              >
                <FiPlus className="mr-1.5" size={16} />
                <span className="text-[14px] font-medium">Stock Update</span>
              </Link>
            </div>

            {isLoading ? (
              <CustomLoader />
            ) : (
              <CustomTable<StockDataType>
                data={tableData}
                columns={columns}
                count={stocksData?.count || 0}
                limit={limit}
                offset={offset}
                setOffset={setOffset}
                sortBy=""
                setSortBy={() => {}}
                sortOrder="desc"
                setSortOrder={() => {}}
                sortOptions={[]}
              />
            )}

            <DateFilterModal
              isOpen={isFilterModalOpen}
              onClose={() => setIsFilterModalOpen(false)}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              type="stocks"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Stocks;
