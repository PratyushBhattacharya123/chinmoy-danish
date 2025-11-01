"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CustomTable from "@/components/common/table/CustomTable";
import { FiTrash2 } from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomLoader from "@/components/common/CustomLoader";
import CustomModal from "@/components/common/modals/CustomModal";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import DeleteModal from "@/components/common/modals/deleteModal/DeleteModal";
import toast from "react-hot-toast";
import { Pagination } from "@/@types";
import { BiSearch } from "react-icons/bi";
import { useCategoriesData } from "@/hooks/use-queries";
import { CategoriesResponse } from "@/@types/server/response";
import CategoryAdd from "@/components/categories/forms/AddCategory";

export interface CategoriesDataType {
  _id: string;
  name: string;
  delete: () => void;
}

const Categories = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const [data, setData] = useState<CategoriesResponse[]>([]);
  const [tableData, setTableData] = useState<CategoriesDataType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(Pagination.limit);

  const columnHelper = createColumnHelper<CategoriesDataType>();

  const [debouncedQueryInput] = useDebouncedValue(searchQuery, 200);

  const {
    data: categoriesData,
    isSuccess,
    isLoading,
  } = useCategoriesData({ limit, offset, search: debouncedQueryInput });

  useEffect(() => {
    if (isSuccess && categoriesData) {
      setData(categoriesData.categories || []);
    }
  }, [categoriesData, isSuccess]);

  const queryClient = useQueryClient();

  const columns = [
    columnHelper.accessor("name", {
      id: "name",
      cell: (info) => (
        <span className="text-[13px] font-medium text-gray-900 text-wrap">
          {info.getValue()}
        </span>
      ),
      header: () => "Title",
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <DeleteModal<CategoriesDataType>
          type="category"
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
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to delete category!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(
            errorData.error ||
              "Cannot delete category : It is being used in products!",
            {
              icon: "⚠️",
            }
          );
        } else {
          toast.error(errorData.error || "Failed to delete category!");
        }
        return errorData;
      } else {
        toast.success("Category deleted successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        return response.json();
      }
    },
  });

  const handleDelete = async (id: string) => {
    try {
      mutate(id);
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast.error("Failed to delete category. Please try again.", {
        icon: "❌",
        duration: 4000,
      });
    }
  };

  useEffect(() => {
    if (data.length > 0) {
      const transformedData = data.map((party) => ({
        _id: party._id.toString(),
        name: party.title,
        delete: () => handleDelete(party._id.toString()),
      }));
      setTableData(transformedData);
    } else {
      setTableData([]);
    }
  }, [data]);

  return (
    <Layout title="Categories" active={4}>
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
                className="bg-gradient-to-br from-gray-700 to-gray-400 font-medium text-white rounded-md h-9 text-[18px] cursor-pointer w-full sm:w-[150px] flex items-center justify-center"
                onClick={open}
              >
                <span className="flex items-center justify-center text-[14px] font-medium">
                  <span className="mr-[5px] font-normal text-[20px] -mt-[3px]">
                    +
                  </span>
                  Add Category
                </span>
              </button>
              <CustomModal
                title="Add Category"
                component={CategoryAdd}
                opened={opened}
                onClose={close}
              />
            </div>

            {isLoading ? (
              <CustomLoader />
            ) : (
              <CustomTable<CategoriesDataType>
                data={tableData}
                columns={columns}
                count={categoriesData?.count || 0}
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

export default Categories;
