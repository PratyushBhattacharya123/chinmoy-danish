"use client";

import Layout from "@/components/common/layout/Layout";
import React, { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import CustomTable from "@/components/common/table/CustomTable";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiPackage,
  FiAlertTriangle,
} from "react-icons/fi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomLoader from "@/components/common/CustomLoader";
import CustomModal from "@/components/common/modals/CustomModal";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import DeleteModal from "@/components/common/modals/deleteModal/DeleteModal";
import toast from "react-hot-toast";
import { Pagination } from "@/@types";
import { BiSearch } from "react-icons/bi";
import { useLowStockProducts, useProductsData } from "@/hooks/use-queries";
import { EnrichedProductsResponse } from "@/@types/server/response";
import ProductAdd from "@/components/products/forms/AddProduct";
import { useCategoriesData } from "@/hooks/use-queries";
import { Select, Loader } from "@mantine/core";
import EditProductModal from "@/components/products/modals/EditProductModal/EditProductModal";
import LowStockAlertModal from "@/components/common/modals/LowStockAlert";

export interface ProductDataType {
  _id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  hsnCode: string;
  gstSlab: string;
  unit: string;
  currentStock: string;
  delete: () => void;
}

// Stock filter options
const stockFilterOptions = [
  { value: "", label: "All Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "low", label: "Low Stock (1-25)" },
  { value: "medium", label: "Medium Stock (26-100)" },
  { value: "high", label: "High Stock (100+)" },
];

const Products = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [data, setData] = useState<EnrichedProductsResponse[]>([]);
  const [categories, setCategories] = useState<
    { _id: string; title: string }[]
  >([]);
  const [tableData, setTableData] = useState<ProductDataType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(Pagination.limit);
  const [showLowStockAlert, setShowLowStockAlert] = useState(false);

  // Fetch low stock products
  const { data: lowStockProducts } = useLowStockProducts();

  useEffect(() => {
    if (lowStockProducts && lowStockProducts.length > 0) {
      const timer = setTimeout(() => {
        setShowLowStockAlert(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [lowStockProducts]);

  const columnHelper = createColumnHelper<ProductDataType>();

  const [debouncedQueryInput] = useDebouncedValue(searchQuery, 200);

  const {
    data: productsData,
    isSuccess,
    isLoading,
  } = useProductsData({
    limit,
    offset,
    search: debouncedQueryInput,
    categoryId,
    stockFilter,
  });

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isSuccess: categoriesSuccess,
  } = useCategoriesData({
    limit: 100,
    offset: 0,
  });

  useEffect(() => {
    if (categoriesSuccess && categoriesData) {
      const transformedCategories = categoriesData.categories.map(
        (category) => ({
          _id: category._id.toString(),
          title: category.title,
        })
      );
      setCategories(transformedCategories);
    }
  }, [categoriesData, categoriesSuccess]);

  useEffect(() => {
    if (isSuccess && productsData) {
      setData(productsData.products || []);
    }
  }, [productsData, isSuccess]);

  const queryClient = useQueryClient();

  // Function to get stock display configuration
  const getStockDisplayConfig = (stock: number) => {
    if (isNaN(stock)) {
      return {
        text: "Empty",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: FiAlertTriangle,
        iconColor: "text-red-500",
      };
    }

    if (stock === 0) {
      return {
        text: "Out of Stock",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: FiAlertTriangle,
        iconColor: "text-red-500",
      };
    } else if (stock <= 25) {
      return {
        text: `Low (${stock})`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        icon: FiAlertTriangle,
        iconColor: "text-orange-500",
      };
    } else if (stock <= 100) {
      return {
        text: `Medium (${stock})`,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: FiPackage,
        iconColor: "text-blue-500",
      };
    } else {
      return {
        text: `High (${stock})`,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        icon: FiPackage,
        iconColor: "text-green-500",
      };
    }
  };

  const columns = [
    columnHelper.accessor("name", {
      id: "name",
      cell: (info) => (
        <span className="text-[13px] font-medium text-gray-900 text-wrap">
          {info.getValue()}
        </span>
      ),
      header: () => "Product Name",
    }),
    columnHelper.accessor("categoryName", {
      id: "categoryName",
      cell: (info) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {info.getValue()}
        </span>
      ),
      header: () => "Category",
    }),
    columnHelper.accessor("hsnCode", {
      id: "hsnCode",
      cell: (info) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-gray-100 text-gray-700 border border-gray-300">
          {info.getValue()}
        </span>
      ),
      header: () => "HSN Code",
    }),
    columnHelper.accessor("gstSlab", {
      id: "gstSlab",
      cell: (info) => (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
          {info.getValue()}%
        </span>
      ),
      header: () => "GST Slab",
    }),
    columnHelper.accessor("currentStock", {
      id: "currentStock",
      cell: (info) => {
        const stockValue = info.getValue();
        const config = getStockDisplayConfig(Number(stockValue));
        const IconComponent = config.icon;

        return (
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}
          >
            <IconComponent className={`mr-1.5 ${config.iconColor}`} size={12} />
            {config.text}
          </div>
        );
      },
      header: () => "Stock Status",
    }),
    columnHelper.accessor("unit", {
      id: "unit",
      cell: (info) => (
        <span className="text-sm text-gray-700 capitalize">
          {info.getValue()}
        </span>
      ),
      header: () => "Unit",
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex space-x-2">
          <EditProductModal
            id={info.row.original._id}
            data={info.row.original}
            buttonAction={
              <button className="flex items-center justify-center h-8 px-3 rounded-md text-xs font-medium transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer">
                <FiEdit2 className="mr-1.5" size={14} />
                Edit
              </button>
            }
          />

          <DeleteModal<ProductDataType>
            type="product"
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
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to delete products!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 409) {
          toast.error(
            errorData.error ||
              "Cannot delete product : It is being used in invoices!",
            {
              icon: "⚠️",
            }
          );
        } else {
          toast.error(errorData.error || "Failed to delete product!");
        }
        return errorData;
      } else {
        toast.success("Product deleted successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
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
      const transformedData = data.map((product) => ({
        _id: product._id.toString(),
        name: product.name,
        categoryId: product.categoryDetails?._id.toString() || "",
        categoryName: product.categoryDetails?.title || "Unknown Category",
        hsnCode: product.hsnCode,
        gstSlab: String(product.gstSlab),
        unit: product.unit,
        currentStock: String(product.currentStock),
        delete: () => handleDelete(product._id.toString()),
      }));
      setTableData(transformedData);
    } else {
      setTableData([]);
    }
  }, [data]);

  return (
    <Layout title="Products" active={3}>
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
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4 w-full">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Select
                    placeholder="Filter by category"
                    value={categoryId}
                    onChange={(value) => setCategoryId(value || "")}
                    data={[
                      { value: "", label: "All Categories" },
                      ...categories.map((category) => ({
                        value: category._id,
                        label: category.title,
                      })),
                    ]}
                    clearable
                    className="w-full sm:w-[200px]"
                    classNames={{
                      input:
                        "!border-gray-400 !rounded-md !h-9 !bg-transparent",
                      dropdown: "!rounded-md !border-gray-400/30",
                      option: "!text-sm hover:!bg-gray-50",
                    }}
                    rightSection={
                      categoriesLoading ? <Loader size={16} /> : null
                    }
                    disabled={categoriesLoading}
                  />
                  <Select
                    placeholder="Filter by stock"
                    value={stockFilter}
                    onChange={(value) => setStockFilter(value || "")}
                    data={stockFilterOptions}
                    clearable
                    className="w-full sm:w-[250px]"
                    classNames={{
                      input:
                        "!border-gray-400 !rounded-md !h-9 !bg-transparent",
                      dropdown: "!rounded-md !border-gray-400/30",
                      option: "!text-sm hover:!bg-gray-50",
                    }}
                  />
                </div>

                <button
                  className="bg-gradient-to-br from-gray-700 to-gray-400 font-medium text-white rounded-md h-9 text-[18px] cursor-pointer w-full sm:w-[150px] flex items-center justify-center"
                  onClick={open}
                >
                  <FiPlus className="mr-1.5" size={16} />
                  <span className="text-[14px] font-medium">Add Product</span>
                </button>
              </div>

              <CustomModal
                title="Add Product"
                component={ProductAdd}
                opened={opened}
                onClose={close}
              />
            </div>

            {isLoading ? (
              <CustomLoader />
            ) : (
              <CustomTable<ProductDataType>
                data={tableData}
                columns={columns}
                count={productsData?.count || 0}
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

            <LowStockAlertModal
              opened={showLowStockAlert}
              onClose={() => setShowLowStockAlert(false)}
              lowStockProducts={lowStockProducts || []}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Products;
