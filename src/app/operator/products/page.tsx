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
  FiDownload,
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
import { Select, Loader, Menu, Button } from "@mantine/core";
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
  price: string;
  hasSubUnit: string;
  subUnit: string;
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
  const [isExporting, setIsExporting] = useState(false);

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

  // Function to format price display
  const formatPriceDisplay = (price: number) => {
    if (isNaN(price) || price === 0) {
      return {
        text: "₹0",
        color: "text-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        iconColor: "text-gray-400",
      };
    }

    return {
      text: `₹${price.toLocaleString("en-IN")}`,
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      iconColor: "text-gray-500",
    };
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
    columnHelper.accessor("price", {
      id: "price",
      cell: (info) => {
        const priceValue = Number(info.getValue());
        const config = formatPriceDisplay(priceValue);

        return (
          <div
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}
          >
            {config.text}
          </div>
        );
      },
      header: () => "Price",
    }),
    columnHelper.accessor("currentStock", {
      id: "currentStock",
      cell: (info) => {
        const stockValue =
          info.row.original.hasSubUnit === "true"
            ? Number(info.getValue()).toFixed(2)
            : Number(info.getValue());
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
    columnHelper.accessor("subUnit", {
      id: "subUnit",
      cell: (info) => {
        const subUnitStr = info.getValue();
        if (!subUnitStr || subUnitStr === '""') return "-";

        try {
          const subUnit = JSON.parse(subUnitStr);

          console.log({ subUnit });
          return (
            <div className="text-xs text-gray-600">
              <div>
                1 {info.row.original.unit} = {subUnit.conversionRate}{" "}
                {subUnit.unit}
              </div>
            </div>
          );
        } catch {
          return "-";
        }
      },
      header: () => "Sub Unit Details",
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

  // Export to Excel function
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/products?limit=10000&offset=0&search=${encodeURIComponent(
          debouncedQueryInput
        )}&categoryId=${categoryId}&stockFilter=${stockFilter}`
      );

      if (!response.ok) {
        console.error("Failed to fetch products for export");
        return;
      }

      const exportData = await response.json();
      const products = exportData.products || [];

      // Calculate totals
      let totalMaterialInStock = 0;
      let totalValueInStock = 0;

      const excelData = products.map(
        (product: EnrichedProductsResponse, index: number) => {
          const currentStock = product.currentStock || 0;
          const price = product.price || 0;
          const itemTotalValue = currentStock * price;

          totalMaterialInStock += currentStock;
          totalValueInStock += itemTotalValue;

          return {
            "Sl.No.": index + 1,
            "Product Name": product.name,
            Category: product.categoryDetails?.title || "Unknown Category",
            "Price (₹)": price,
            "Current Stock": currentStock,
            "Item Total Value (₹)": itemTotalValue,
          };
        }
      );

      // Add summary rows
      const summaryRows = [
        {}, // Empty row for spacing
        {
          "Sl.No.": "SUMMARY",
          "Product Name": "TOTAL MATERIAL IN STOCK",
          "Current Stock": totalMaterialInStock,
          "Item Total Value (₹)": totalValueInStock,
        },
      ];

      const finalData = [...excelData, ...summaryRows];

      // Create worksheet
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(finalData);

      // Set column widths for better formatting
      const columnWidths = [
        { wch: 15 }, // Sl.No.
        { wch: 40 }, // Product Name (wider for wrapping)
        { wch: 25 }, // Category
        { wch: 15 }, // Price
        { wch: 15 }, // Current Stock
        { wch: 20 }, // Item Total Value
      ];
      worksheet["!cols"] = columnWidths;

      // Apply styles for summary row
      if (worksheet["!ref"]) {
        const range = XLSX.utils.decode_range(worksheet["!ref"]);
        const summaryRow = range.e.r + 2; // +2 because of empty row and summary row

        // Style summary row
        ["A", "B", "E", "F"].forEach((col) => {
          const cellAddress = `${col}${summaryRow}`;
          if (worksheet[cellAddress]) {
            // Make summary bold and add background color
            worksheet[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: "FFE6CC" } },
              alignment: {
                horizontal: "left",
                vertical: "top",
                wrapText: true,
              },
            };
          }
        });
      }

      // Apply text wrapping to all cells
      const range = XLSX.utils.decode_range(worksheet["!ref"] as string);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (!worksheet[cell_ref]) continue;

          // Ensure wrap text is enabled for all cells
          if (!worksheet[cell_ref].s) {
            worksheet[cell_ref].s = {};
          }
          if (!worksheet[cell_ref].s.alignment) {
            worksheet[cell_ref].s.alignment = {};
          }
          worksheet[cell_ref].s.alignment.wrapText = true;
          worksheet[cell_ref].s.alignment.vertical = "top";
        }
      }

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      // Generate Excel file and trigger download
      XLSX.writeFile(
        workbook,
        `products_${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast.success("Products exported to Excel successfully!");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export products to Excel");
    } finally {
      setIsExporting(false);
    }
  };

  interface PdfProductData {
    name: string;
    category: string;
    price: number;
    currentStock: number;
    itemTotalValue: number;
  }

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/products?limit=10000&offset=0&search=${encodeURIComponent(
          debouncedQueryInput
        )}&categoryId=${categoryId}&stockFilter=${stockFilter}`
      );

      if (!response.ok) {
        console.error("Failed to fetch products for export");
        return;
      }

      const exportData = await response.json();
      const products = exportData.products || [];

      // Calculate totals
      let totalMaterialInStock = 0;
      let totalValueInStock = 0;

      // Prepare data with calculations
      const pdfData: PdfProductData[] = products.map(
        (product: EnrichedProductsResponse) => {
          const currentStock = product.currentStock || 0;
          const price = product.price || 0;
          const itemTotalValue = currentStock * price;

          totalMaterialInStock += currentStock;
          totalValueInStock += itemTotalValue;

          return {
            name: product.name,
            category: product.categoryDetails?.title || "Unknown Category",
            price: price,
            currentStock: currentStock,
            itemTotalValue: itemTotalValue,
          };
        }
      );

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      // Column positions and widths
      const COLUMNS = {
        SERIAL_NO: { x: 10, width: 15 },
        PRODUCT_NAME: { x: 25, width: 70 },
        CATEGORY: { x: 95, width: 30 },
        PRICE: { x: 125, width: 25 },
        STOCK: { x: 150, width: 20 },
        TOTAL_VALUE: { x: 170, width: 30 },
      };

      // Page settings
      const PAGE_MARGIN = 10;
      const TABLE_HEADER_Y = 35;
      const ROW_HEIGHT = 8;
      const MAX_Y = 280;
      let currentPage = 1;
      let yPosition = TABLE_HEADER_Y + 10;

      // Function to split long text into multiple lines
      const splitText = (text: string, maxWidth: number): string[] => {
        const words = text.split(" ");
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = doc.getTextWidth(currentLine + " " + word);
          if (width < maxWidth) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        return lines;
      };

      // Function to get right-aligned x position for text
      const getRightAlignedX = (
        text: string,
        columnX: number,
        columnWidth: number
      ): number => {
        const textWidth = doc.getTextWidth(text);
        return columnX + columnWidth - textWidth - 2; // -2 for small padding
      };

      // Function to add a complete page header
      const addPageHeader = (pageNumber: number) => {
        // Title
        doc.setFontSize(16);
        doc.setFont("bold");
        doc.text("Products List", PAGE_MARGIN, 15);

        // Export date
        doc.setFontSize(10);
        doc.setFont("normal");
        doc.text(
          `Exported on: ${new Date().toLocaleDateString()}`,
          PAGE_MARGIN,
          22
        );
        doc.text(`Page: ${pageNumber}`, 180, 22);

        // Table headers - right align numeric columns
        doc.setFontSize(11);
        doc.setFont("bold");
        doc.text("Sl.No.", COLUMNS.SERIAL_NO.x, TABLE_HEADER_Y);
        doc.text("Product Name", COLUMNS.PRODUCT_NAME.x, TABLE_HEADER_Y);
        doc.text("Category", COLUMNS.CATEGORY.x, TABLE_HEADER_Y);

        // Right-aligned headers for numeric columns
        doc.text(
          "Price",
          getRightAlignedX("Price", COLUMNS.PRICE.x, COLUMNS.PRICE.width),
          TABLE_HEADER_Y
        );
        doc.text(
          "Stock",
          getRightAlignedX("Stock", COLUMNS.STOCK.x, COLUMNS.STOCK.width),
          TABLE_HEADER_Y
        );
        doc.text(
          "Total Value",
          getRightAlignedX(
            "Total Value",
            COLUMNS.TOTAL_VALUE.x,
            COLUMNS.TOTAL_VALUE.width
          ),
          TABLE_HEADER_Y
        );

        // Header line
        doc.setLineWidth(0.5);
        doc.line(
          PAGE_MARGIN,
          TABLE_HEADER_Y + 2,
          210 - PAGE_MARGIN,
          TABLE_HEADER_Y + 2
        );

        // Reset to data style
        doc.setFontSize(9);
        doc.setFont("normal");
      };

      // Add first page header
      addPageHeader(currentPage);

      pdfData.forEach((product: PdfProductData, index: number) => {
        // Check if we need a new page
        if (yPosition > MAX_Y) {
          doc.addPage();
          currentPage++;
          yPosition = TABLE_HEADER_Y + 10;
          addPageHeader(currentPage);
        }

        const serialNo = (index + 1).toString();
        const currentY = yPosition;

        // Split long product names into multiple lines
        const productNameLines = splitText(
          product.name,
          COLUMNS.PRODUCT_NAME.width - 5
        );

        // Calculate the height needed for this row
        const lineHeight = 4;
        const rowHeight = Math.max(
          ROW_HEIGHT,
          productNameLines.length * lineHeight
        );

        // Add row data
        doc.text(serialNo, COLUMNS.SERIAL_NO.x, currentY);

        // Add product name with wrapping
        productNameLines.forEach((line, lineIndex) => {
          doc.text(
            line,
            COLUMNS.PRODUCT_NAME.x,
            currentY + lineIndex * lineHeight
          );
        });

        doc.text(product.category, COLUMNS.CATEGORY.x, currentY);

        // Right-aligned numeric values
        const priceText = `Rs. ${product.price.toLocaleString("en-IN")}`;
        doc.text(
          priceText,
          getRightAlignedX(priceText, COLUMNS.PRICE.x, COLUMNS.PRICE.width),
          currentY
        );

        const stockText = product.currentStock.toString();
        doc.text(
          stockText,
          getRightAlignedX(stockText, COLUMNS.STOCK.x, COLUMNS.STOCK.width),
          currentY
        );

        const totalValueText = `Rs. ${product.itemTotalValue.toLocaleString(
          "en-IN"
        )}`;
        doc.text(
          totalValueText,
          getRightAlignedX(
            totalValueText,
            COLUMNS.TOTAL_VALUE.x,
            COLUMNS.TOTAL_VALUE.width
          ),
          currentY
        );

        yPosition += rowHeight;
      });

      // Add summary section
      if (yPosition > MAX_Y - 20) {
        doc.addPage();
        currentPage++;
        yPosition = TABLE_HEADER_Y + 10;
        addPageHeader(currentPage);
      }

      // Ending starting line
      doc.setLineWidth(0.3);
      doc.line(PAGE_MARGIN, yPosition + 2, 210 - PAGE_MARGIN, yPosition + 2);

      // Add empty row before summary
      yPosition += 10;

      // Summary title
      doc.setFontSize(11);
      doc.setFont("bold");
      doc.text("SUMMARY", COLUMNS.SERIAL_NO.x, yPosition);
      yPosition += 8;

      // Total Material in Stock - right aligned
      doc.setFontSize(10);
      doc.text("Total Material in Stock :", COLUMNS.SERIAL_NO.x, yPosition);
      const totalStockText = totalMaterialInStock.toString();
      doc.text(
        totalStockText,
        getRightAlignedX(
          totalStockText,
          COLUMNS.PRODUCT_NAME.x,
          COLUMNS.PRODUCT_NAME.width
        ),
        yPosition
      );
      yPosition += 6;

      // Total Value in Stock
      doc.text(
        "Total Value of Material in Stock :",
        COLUMNS.SERIAL_NO.x,
        yPosition
      );
      const totalValueText = `Rs. ${totalValueInStock.toLocaleString("en-IN")}`;
      doc.text(
        totalValueText,
        getRightAlignedX(
          totalValueText,
          COLUMNS.PRODUCT_NAME.x,
          COLUMNS.PRODUCT_NAME.width
        ),
        yPosition
      );

      // Add empty row after summary
      yPosition += 5;

      // Ending ending line
      doc.setLineWidth(0.3);
      doc.line(PAGE_MARGIN, yPosition + 2, 210 - PAGE_MARGIN, yPosition + 2);

      doc.save(`products_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Products exported to PDF successfully!");
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast.error("Failed to export products to PDF");
    } finally {
      setIsExporting(false);
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
        price: String(product.price || 0),
        hasSubUnit: product.hasSubUnit ? String(product.hasSubUnit) : "",
        subUnit: product.subUnit ? JSON.stringify(product.subUnit) : "",
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

                <div className="flex gap-2">
                  {/* Export Menu */}
                  <Menu shadow="md" width={180} position="bottom-end">
                    <Menu.Target>
                      <Button
                        leftSection={<FiDownload size={16} />}
                        className="bg-gradient-to-br from-blue-600 to-blue-400 font-medium text-white rounded-md h-9 text-[18px] cursor-pointer !w-[160px] flex items-center justify-center"
                        loading={isExporting}
                      >
                        <span className="text-[14px] font-medium">Export</span>
                      </Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>Export Options</Menu.Label>
                      <Menu.Item
                        onClick={exportToExcel}
                        leftSection={<FiDownload size={14} />}
                      >
                        Export as Excel
                      </Menu.Item>
                      <Menu.Item
                        onClick={exportToPDF}
                        leftSection={<FiDownload size={14} />}
                      >
                        Export as PDF
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  <button
                    className="bg-gradient-to-br from-gray-700 to-gray-400 font-medium text-white rounded-md h-9 text-[18px] cursor-pointer w-full sm:w-[150px] flex items-center justify-center"
                    onClick={open}
                  >
                    <FiPlus className="mr-1.5" size={16} />
                    <span className="text-[14px] font-medium">Add Product</span>
                  </button>
                </div>
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
