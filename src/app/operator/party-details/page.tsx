"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CustomTable from "@/components/common/table/CustomTable";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomLoader from "@/components/common/CustomLoader";
import CustomModal from "@/components/common/modals/CustomModal";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import PartyDetailsAdd from "@/components/partyDetails/forms/AddPartyDetails";
import DeleteModal from "@/components/common/modals/deleteModal/DeleteModal";
import toast from "react-hot-toast";
import EditPartyDetailsModal from "@/components/partyDetails/modals/EditPartyDetailsModal/EditPartyDetailsModal";
import { Pagination } from "@/@types";
import { BiSearch } from "react-icons/bi";
import { usePartyDetailsData } from "@/hooks/use-queries";
import { PartyDetailsResponse } from "@/@types/server/response";

export interface PartyDetailsDataType {
  _id: string;
  name: string;
  address: string;
  gstNumber: string;
  state: string;
  stateCode: string;
  delete: () => void;
}

const PartyDetails = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const [data, setData] = useState<PartyDetailsResponse[]>([]);
  const [tableData, setTableData] = useState<PartyDetailsDataType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(Pagination.limit);

  const columnHelper = createColumnHelper<PartyDetailsDataType>();

  const [debouncedQueryInput] = useDebouncedValue(searchQuery, 200);

  const {
    data: partyDetailsData,
    isSuccess,
    isLoading,
  } = usePartyDetailsData({ limit, offset, search: debouncedQueryInput });

  useEffect(() => {
    if (isSuccess && partyDetailsData) {
      setData(partyDetailsData.parties || []);
    }
  }, [partyDetailsData, isSuccess]);

  const queryClient = useQueryClient();

  const columns = [
    columnHelper.accessor("name", {
      id: "name",
      cell: (info) => (
        <span className="text-[13px] font-medium text-gray-900 text-wrap">
          {info.getValue()}
        </span>
      ),
      header: () => "Party Name",
    }),
    columnHelper.accessor("address", {
      id: "address",
      cell: (info) => (
        <div className="max-w-[250px] text-wrap text-sm text-gray-600">
          {info.getValue()}
        </div>
      ),
      header: () => "Address",
    }),
    columnHelper.accessor("gstNumber", {
      id: "gstNumber",
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[12px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {info.getValue()}
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-md text-[12px] font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
            GST Missing
          </span>
        ),
      header: () => "GST Number",
    }),
    columnHelper.accessor("state", {
      id: "state",
      cell: (info) => (
        <span className="text-sm text-gray-700">{info.getValue()}</span>
      ),
      header: () => "State",
    }),
    columnHelper.accessor("stateCode", {
      id: "stateCode",
      cell: (info) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold bg-gray-100 text-gray-700">
          {info.getValue()}
        </span>
      ),
      header: () => "State Code",
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <EditPartyDetailsModal
            id={info.row.original._id}
            data={info.row.original}
            buttonAction={
              <button className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                <FiEdit2 className="mr-1.5" size={14} />
                Edit
              </button>
            }
          />

          <DeleteModal<PartyDetailsDataType>
            type="party"
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
      const response = await fetch(`/api/party-details/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("You're not authorized to delete party!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
          return response.json();
        } else {
          toast.error("Internal server error");
          return;
        }
      } else {
        toast.success("Party details deleted successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["parties"] });
        return response.json();
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      mutate(id);
    } catch (error) {
      console.error("Failed to delete party:", error);
      toast.error("Failed to delete party. Please try again.", {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      const transformedData = data.map((party) => ({
        _id: party._id.toString(),
        name: party.name,
        address: party.address,
        gstNumber: party.gstNumber || "",
        state: party.state,
        stateCode: party.stateCode,
        delete: () => handleDelete(party._id.toString()),
      }));
      setTableData(transformedData);
    } else {
      setTableData([]);
    }
  }, [data]);

  return (
    <Layout title="Party Details" active={2}>
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
              <div className="w-full sm:w-auto flex-1 sm:flex-initial">
                <div className="flex items-center justify-center">
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
              </div>
              <button
                className="bg-gradient-to-br from-gray-700 to-gray-400 font-medium text-white rounded-md h-9 text-[18px] cursor-pointer w-full sm:w-[130px] flex items-center justify-center"
                onClick={open}
              >
                <span className="flex items-center justify-center text-[14px] font-medium">
                  <span className="mr-[5px] font-normal text-[20px] -mt-[3px]">
                    +
                  </span>
                  Add Party
                </span>
              </button>
              <CustomModal
                title="Add Party"
                component={PartyDetailsAdd}
                opened={opened}
                onClose={close}
              />
            </div>

            {isLoading ? (
              <CustomLoader />
            ) : (
              <CustomTable<PartyDetailsDataType>
                data={tableData}
                columns={columns}
                count={partyDetailsData?.count || 0}
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartyDetails;
