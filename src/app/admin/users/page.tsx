"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CustomTable from "@/components/common/table/CustomTable";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomLoader from "@/components/common/CustomLoader";
import { useDebouncedValue } from "@mantine/hooks";
import DeleteModal from "@/components/common/modals/deleteModal/DeleteModal";
import toast from "react-hot-toast";
import { Pagination } from "@/@types";
import { BiSearch } from "react-icons/bi";
import { useUsersData } from "@/hooks/use-queries";
import { UsersResponse } from "@/@types/server/response";
import { convertToDateFormat } from "@/components/utils/helper";
import EditUserModal from "@/components/users/modals/EditUserModal/EditUserModal";

export interface UserDataType {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  userType: string;
  delete: () => void;
}

const Users = () => {
  const [data, setData] = useState<UsersResponse[]>([]);
  const [tableData, setTableData] = useState<UserDataType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(Pagination.limit);

  const columnHelper = createColumnHelper<UserDataType>();

  const [debouncedQueryInput] = useDebouncedValue(searchQuery, 200);

  const {
    data: usersData,
    isSuccess,
    isLoading,
  } = useUsersData({
    limit,
    offset,
    search: debouncedQueryInput,
  });

  useEffect(() => {
    if (isSuccess && usersData) {
      setData(usersData.users || []);
    }
  }, [usersData, isSuccess]);

  const queryClient = useQueryClient();

  const columns = [
    columnHelper.accessor("name", {
      id: "name",
      cell: (info) => (
        <span className="text-[13px] font-medium text-gray-900 text-wrap">
          {info.getValue()}
        </span>
      ),
      header: () => "Name",
    }),
    columnHelper.accessor("email", {
      id: "email",
      cell: (info) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {info.getValue()}
        </span>
      ),
      header: () => "Email Address",
    }),
    columnHelper.accessor("userType", {
      id: "hsnCode",
      cell: (info) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-700 border border-gray-300">
          {info.getValue()}
        </span>
      ),
      header: () => "User Type",
    }),
    columnHelper.accessor("createdAt", {
      id: "createdAt",
      cell: (info) => (
        <span className="text-sm text-gray-700">{info.getValue()}</span>
      ),
      header: () => "Joined Date",
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <EditUserModal
            id={info.row.original._id}
            data={info.row.original}
            buttonAction={
              <button className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                <FiEdit2 className="mr-1.5" size={14} />
                Edit
              </button>
            }
          />

          <DeleteModal<UserDataType>
            type="user"
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
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to delete user!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else {
          toast.error(errorData.error || "Failed to delete user!");
        }
        return errorData;
      } else {
        toast.success("User deleted successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["users"] });
        return response.json();
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      mutate(id);
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product. Please try again.", {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      const transformedData = data.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: convertToDateFormat(String(user.createdAt)),
        updatedAt: convertToDateFormat(String(user.updatedAt)),
        userType: String(user.userType),
        delete: () => handleDelete(user._id.toString()),
      }));
      setTableData(transformedData);
    } else {
      setTableData([]);
    }
  }, [data]);

  return (
    <Layout title="Users" active={6}>
      <div className="pb-6 px-6">
        <div className="flex justify-between my-6">
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
        </div>

        {isLoading ? (
          <CustomLoader />
        ) : (
          <CustomTable<UserDataType>
            data={tableData}
            columns={columns}
            count={usersData?.count || 0}
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
    </Layout>
  );
};

export default Users;
