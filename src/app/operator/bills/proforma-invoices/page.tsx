"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CustomTable from "@/components/common/table/CustomTable";
import { FiEdit2, FiTrash2, FiPlus, FiFilter } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomLoader from "@/components/common/CustomLoader";
import { useDebouncedValue } from "@mantine/hooks";
import DeleteModal from "@/components/common/modals/deleteModal/DeleteModal";
import toast from "react-hot-toast";
import { Pagination } from "@/@types";
import { BiSearch } from "react-icons/bi";
import { useBillsData } from "@/hooks/use-queries";
import {
  EnrichedBillsResponse,
  EnrichedItem,
  SupplyDetails,
} from "@/@types/server/response";
import { convertToDateFormat } from "@/components/utils/helper";
import ItemsModal from "@/components/bills/modals/ItemsModal/ItemsModal";
import SupplyModal from "@/components/bills/modals/SupplyModal/SupplyModal";
import Link from "next/link";
import { FaFilter } from "react-icons/fa6";
import DateFilterModal from "@/components/bills/modals/DateFilterModal";
import { InvoiceDataType } from "../invoices/page";
import { IoMdCloudDownload } from "react-icons/io";

const ProformaInvoices = () => {
  const [data, setData] = useState<EnrichedBillsResponse[]>([]);
  const [tableData, setTableData] = useState<InvoiceDataType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(Pagination.limit);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const columnHelper = createColumnHelper<InvoiceDataType>();

  const [debouncedQueryInput] = useDebouncedValue(searchQuery, 200);

  // Fetch bills with filters
  const {
    data: billsData,
    isSuccess,
    isLoading,
  } = useBillsData({
    limit,
    offset,
    search: debouncedQueryInput,
    startDate: startDate || "",
    endDate: endDate || "",
    type: "proforma-invoices",
  });

  useEffect(() => {
    if (isSuccess && billsData) {
      setData(billsData.bills || []);
    }
  }, [billsData, isSuccess]);

  const queryClient = useQueryClient();

  const columns = [
    columnHelper.accessor("name", {
      id: "billNumber",
      cell: (info) => (
        <span className="text-[13px] font-bold text-blue-700 font-mono">
          {info.getValue()}
        </span>
      ),
      header: () => "Invoice Number",
    }),
    columnHelper.accessor("partyName", {
      id: "partyName",
      cell: (info) => (
        <span className="text-[13px] font-medium text-gray-900">
          {info.getValue()}
        </span>
      ),
      header: () => "Party Name",
    }),
    columnHelper.accessor("invoiceDate", {
      id: "invoiceDate",
      cell: (info) => (
        <span className="text-sm text-gray-700">{info.getValue()}</span>
      ),
      header: () => "Date",
    }),
    columnHelper.accessor("itemsCount", {
      id: "itemsCount",
      cell: (info) => {
        const items: EnrichedItem[] = JSON.parse(info.row.original.items);
        const totalAmount = Number(info.row.original.totalAmount);
        return (
          <ItemsModal
            items={items}
            totalAmount={totalAmount}
            itemsCount={items.length}
          />
        );
      },
      header: () => "Items",
    }),
    columnHelper.accessor("supplyPlace", {
      id: "supplyPlace",
      cell: (info) => {
        const supplyDetails: SupplyDetails = JSON.parse(
          info.row.original.supplyDetails
        );
        const invoiceNumber = info.row.original.name;
        return (
          <SupplyModal
            supplyDetails={supplyDetails}
            invoiceNumber={invoiceNumber}
          />
        );
      },
      header: () => "Supply Place",
    }),
    columnHelper.display({
      id: "downloadBill",
      cell: ({
        row: {
          original: { _id },
        },
      }) => (
        <Link
          href={`/operator/bills/download/proforma-invoices/${_id}`}
          className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 cursor-pointer"
        >
          <IoMdCloudDownload className="mr-1.5" size={14} />
          Download
        </Link>
      ),
      header: () => "Download",
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <Link
            href={`/operator/bills/proforma-invoices/edit-proforma-invoice/${info.row.original._id}`}
            className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer"
          >
            <FiEdit2 className="mr-1.5" size={14} />
            Edit
          </Link>

          <DeleteModal<InvoiceDataType>
            type="invoice"
            info={info}
            buttonAction={
              <button className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer">
                <FiTrash2 className="mr-1.5" size={14} />
                Delete
              </button>
            }
          />
        </div>
      ),
    }),
  ];

  const { mutate } = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bills/proforma-invoices/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to delete Proforma Invoice!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(
            "Cannot delete Proforma Invoice - it may be referenced elsewhere",
            {
              icon: "⚠️",
            }
          );
        } else {
          toast.error(errorData.error || "Failed to delete Proforma Invoice!");
        }
        return errorData;
      } else {
        toast.success("Proforma Invoice deleted successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["proforma-invoices"] });
        return response.json();
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      mutate(id);
    } catch (error) {
      console.error("Failed to delete Proforma Invoice:", error);
      toast.error("Failed to delete Proforma Invoice. Please try again.", {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      const transformedData = data.map((invoice) => ({
        _id: invoice._id.toString(),
        name: invoice.billNumber,
        partyName: invoice.partyDetails?.name || "Unknown Party",
        invoiceDate: convertToDateFormat(String(invoice.invoiceDate)),
        totalAmount: String(invoice.totalAmount),
        addOns:
          invoice.addOns && invoice.addOns?.length > 0
            ? JSON.stringify(invoice.addOns)
            : "",
        items: JSON.stringify(invoice.items),
        itemsCount: String(invoice.items.length),
        supplyDetails: JSON.stringify(invoice.supplyDetails),
        supplyPlace: invoice.supplyDetails.supplyPlace,
        downloadBill: JSON.stringify(invoice),
        delete: () => handleDelete(invoice._id.toString()),
      }));
      setTableData(transformedData);
    } else {
      setTableData([]);
    }
  }, [data]);

  const isFilterActive = startDate || endDate;

  return (
    <Layout title="Proforma Invoices" active={1} subActive={2}>
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
                <div className="flex items-center justify-center flex-1">
                  <div className="text-muted-foreground/50 border h-9 w-9 rounded-tl-sm rounded-bl-sm flex items-center justify-center border-gray-400 border-r-0">
                    <BiSearch className="size-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full sm:w-[200px] rounded-tr-sm rounded-br-sm border border-gray-400 pl-2 bg-transparent text-[12px] placeholder:text-gray-500 text-black/70 outline-none"
                  />
                </div>

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
                href={"/operator/bills/proforma-invoices/add-proforma-invoice"}
              >
                <FiPlus className="mr-1.5" size={16} />
                <span className="text-[14px] font-medium">New Invoice</span>
              </Link>
            </div>

            {isLoading ? (
              <CustomLoader />
            ) : (
              <CustomTable<InvoiceDataType>
                data={tableData}
                columns={columns}
                count={billsData?.count || 0}
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
              type="proforma-invoices"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProformaInvoices;
