"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  TextInput,
  Textarea,
  Button,
  Loader,
  NumberInput,
} from "@mantine/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useProductsData, useCategoriesData } from "@/hooks/use-queries";
import { FiArrowLeft, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { Stock, stockSchema, AddProduct, AddCategory } from "@/@types";
import Layout from "@/components/common/layout/Layout";
import { useRouter } from "next/navigation";
import { FaFileImport } from "react-icons/fa6";
import { useDisclosure } from "@mantine/hooks";
import ImportModalAdd from "@/components/stocks/modals/ImportModalAdd";

const StockUpdateForm = () => {
  const [opened, { open, close }] = useDisclosure(false);

  const router = useRouter();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>();
  const [selectedCategory, setSelectedCategory] = useState("");

  const {
    handleSubmit,
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Stock>({
    resolver: zodResolver(stockSchema),
    defaultValues: {
      type: "IN",
      items: [{ productId: "", quantity: 1 }],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Fetch products and categories
  const { data: productsData, isLoading: productsLoading } = useProductsData({
    limit: 1000,
    offset: 0,
  });

  const {
    data: categoriesData,
    refetch: refetchCategories,
    isLoading: categoriesLoading,
  } = useCategoriesData({ limit: 100, offset: 0 });

  const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<
    { _id: string; title: string }[]
  >([]);

  const queryClient = useQueryClient();

  // Product form for creating new products
  const {
    register: registerProduct,
    watch: watchProduct,
    formState: { errors: productErrors },
    reset: resetProduct,
    setValue: setProductValue,
    getValues: productGetValues,
  } = useForm<AddProduct>({
    defaultValues: { unit: "pcs" },
  });

  // Category form
  const {
    register: registerCategory,
    formState: { errors: categoryErrors },
    getValues: categoryGetValues,
  } = useForm<AddCategory>();

  useEffect(() => {
    if (productsData?.products) {
      setProducts(
        productsData.products.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
        }))
      );
    }
  }, [productsData]);

  useEffect(() => {
    if (categoriesData?.categories) {
      setCategories(
        categoriesData.categories.map((c) => ({
          _id: c._id.toString(),
          title: c.title,
        }))
      );
    }
  }, [categoriesData]);

  // Create category mutation
  const { mutate: createCategory, isPending: isCreatingCategory } = useMutation(
    {
      mutationFn: async (data: AddCategory) => {
        const response = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
          return {
            error: responseData.error || "Failed to create category",
          };
        }
        return responseData;
      },
      onSuccess: (data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        toast.success("Category created successfully!");
        setCategories((prev) => [
          ...prev,
          {
            _id: data.id,
            title: categoryGetValues("title"),
          },
        ]);
        refetchCategories();
        setShowCategoryForm(false);
        setProductValue("categoryId", data.id, { shouldValidate: true });
        setSelectedCategory(data.id);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create category");
      },
    }
  );

  // Create product mutation
  const { mutate: createProduct, isPending: isCreatingProduct } = useMutation({
    mutationFn: async (data: AddProduct) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          error: responseData.error || "Failed to create product",
        };
      }
      return responseData;
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(data.error);
        return;
      }
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowAddProduct(false);
      setCurrentItemIndex(undefined);
      resetProduct();
      setSelectedCategory("");
      setValue(`items.${currentItemIndex || 0}.productId`, data.id);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  });

  // Stock add mutation
  const { mutate: addStock, isPending: isAddingStock } = useMutation({
    mutationFn: async (data: Stock) => {
      const response = await fetch("/api/stocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          toast.error("You're not authorized to update stock!", {
            style: {
              color: "#D32F2F",
              fontWeight: 500,
            },
            icon: "🔒",
          });
        } else if (response.status === 400) {
          toast.error(
            `${errorData.error}${
              errorData.productName && ` - ${errorData.productName}`
            }` || "Invalid stock data!",
            {
              style: {
                color: "#EF5026",
                fontWeight: 500,
              },
              icon: "⚠️",
            }
          );
        } else if (response.status === 404) {
          toast.error("Some products not found!", {
            style: {
              color: "#FF9800",
              fontWeight: 500,
            },
            icon: "🔍",
          });
        } else {
          toast.error(errorData.error || "Failed to update stock!");
        }
        return errorData;
      } else {
        toast.success("Stock updated successfully!", {
          iconTheme: {
            primary: "#fff",
            secondary: "#388E3C",
          },
          icon: "✅",
        });
        queryClient.invalidateQueries({ queryKey: ["stocks"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["low-stock-products"] });
        router.push("/operator/stocks");
      }
    },
  });

  const onSubmit = (data: Stock) => {
    addStock(data);
  };

  const addProductField = () => {
    append({ productId: "", quantity: 1 });
  };

  const removeProductField = (index: number) => {
    remove(index);
  };

  const handleProductChange = (index: number, productId: string) => {
    setValue(`items.${index}.productId`, productId, { shouldValidate: true });
  };

  const handleCancelProductCreation = () => {
    // Get the current quantity from the form
    const currentQuantity =
      watch(`items.${currentItemIndex || 0}.quantity`) || 1;

    // Update the item with preserved quantity, but empty productId
    setValue(`items.${currentItemIndex || 0}`, {
      productId: "",
      quantity: currentQuantity,
    });

    // Close the product creation form
    setShowAddProduct(false);
    setCurrentItemIndex(undefined);
    setSelectedCategory("");
  };

  const handleSubmitCategory = () => {
    const title = categoryGetValues("title");
    if (title) {
      createCategory({ title });
    } else {
      toast.error("Please add the category name!");
    }
  };

  const handleSubmitProduct = () => {
    const data: AddProduct = {
      categoryId: productGetValues("categoryId"),
      gstSlab: productGetValues("gstSlab"),
      hsnCode: productGetValues("hsnCode"),
      price: productGetValues("price"),
      name: productGetValues("name"),
      unit: productGetValues("unit"),
    };
    if (data) {
      createProduct(data);
    } else {
      toast.error("Please add the product!");
    }
  };

  const handleHSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setProductValue("hsnCode", value, { shouldValidate: true });
  };

  const handleBack = () => {
    router.push("/operator/stocks");
  };

  return (
    <Layout title="Update Stock" active={5}>
      <div className="flex flex-col h-[calc(100dvh-66px)] lg:h-[92.3dvh] bg-gray-50">
        <div
          className="flex-1 overflow-y-auto"
          style={{
            display: "flex",
            flexDirection: "column",
            overflowAnchor: "none",
          }}
        >
          <div className="w-full mx-auto p-4 md:p-6">
            <div className="mb-6 flex justify-between items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200 font-medium cursor-pointer group"
              >
                <div className="p-2 rounded-full bg-gray-200 group-hover:bg-gray-300 transition-colors duration-200">
                  <FiArrowLeft size={18} className="text-gray-700" />
                </div>
                <span className="font-medium">Back</span>
              </button>

              <button
                onClick={open}
                className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white px-4 py-2 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer border border-gray-600"
              >
                <FaFileImport size={14} />
                <span className="font-medium text-[14px]">Import</span>
              </button>

              <ImportModalAdd
                opened={opened}
                close={close}
                setValue={setValue}
              />
            </div>

            <div className="mx-auto md:px-4 px-2">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                  Update Stock
                </h1>
                <p className="text-gray-600">
                  Manage your inventory stock levels
                </p>
              </div>

              <form
                className="flex flex-col gap-6"
                onSubmit={handleSubmit(onSubmit)}
              >
                {/* Stock Type Selection */}
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={
                        <span className="font-medium text-gray-700">
                          Stock Type
                        </span>
                      }
                      placeholder="Select stock type"
                      data={[
                        { value: "IN", label: "Stock In (Add to inventory)" },
                        {
                          value: "OUT",
                          label: "Stock Out (Remove from inventory)",
                        },
                        {
                          value: "ADJUSTMENT",
                          label: "Stock Adjustment (Set exact quantity)",
                        },
                      ]}
                      value={field.value}
                      onChange={(value) => {
                        if (value)
                          field.onChange(value as "IN" | "OUT" | "ADJUSTMENT");
                      }}
                      required
                      classNames={{
                        input:
                          "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                        label: "!mb-1 !text-gray-700",
                      }}
                      error={errors.type?.message}
                      variant="filled"
                    />
                  )}
                />

                {/* Product Items */}
                <div className="space-y-4">
                  <label className="font-medium text-gray-700">Products</label>

                  {fields.map((field, index) => (
                    <div key={field.id}>
                      {currentItemIndex !== index && (
                        <div
                          className="p-4 border border-gray-200 rounded-lg relative flex flex-col sm:gap-4 gap-2 bg-white"
                          key={field.id}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-8 flex items-end gap-3">
                              <Controller
                                name={`items.${index}.productId`}
                                control={control}
                                render={({ field }) => (
                                  <Select
                                    label={
                                      <span className="font-medium text-gray-700">
                                        Product
                                      </span>
                                    }
                                    placeholder="Select product"
                                    data={products.map((p) => ({
                                      value: p._id,
                                      label: p.name,
                                    }))}
                                    value={field.value}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      if (value)
                                        handleProductChange(index, value);
                                    }}
                                    error={
                                      errors.items?.[index]?.productId?.message
                                    }
                                    classNames={{
                                      input:
                                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-white",
                                      label: "!text-sm !mb-1 !text-gray-700",
                                    }}
                                    className="w-full"
                                    required
                                    variant="filled"
                                    searchable
                                    disabled={productsLoading}
                                    rightSection={
                                      productsLoading ? (
                                        <Loader size={16} />
                                      ) : undefined
                                    }
                                  />
                                )}
                              />
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setCurrentItemIndex(index);
                                  setShowAddProduct(true);
                                }}
                                className="!text-gray-700 !border-gray-400 hover:!bg-gray-100"
                              >
                                <FiPlus size={14} />
                              </Button>
                            </div>

                            <div className="md:col-span-4">
                              <Controller
                                name={`items.${index}.quantity`}
                                control={control}
                                render={({ field }) => (
                                  <NumberInput
                                    label={
                                      <span className="font-medium text-gray-700">
                                        Quantity
                                      </span>
                                    }
                                    placeholder="Enter quantity"
                                    min={watch("type") === "ADJUSTMENT" ? 0 : 1}
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                    error={
                                      errors.items?.[index]?.quantity?.message
                                    }
                                    hideControls
                                    required
                                    classNames={{
                                      input:
                                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-white",
                                      label: "!text-sm !mb-1 !text-gray-700",
                                    }}
                                    variant="filled"
                                  />
                                )}
                              />
                            </div>
                          </div>
                          {fields.length > 1 && (
                            <div className="absolute top-0 right-0">
                              <Button
                                type="button"
                                variant="subtle"
                                color="red"
                                size="sm"
                                onClick={() => removeProductField(index)}
                                className="hover:!bg-transparent"
                              >
                                <FiTrash2 size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Add Product Form */}
                      {showAddProduct && currentItemIndex === index && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-700">
                              Create New Product
                            </h3>
                            <div
                              onClick={handleCancelProductCreation}
                              className="h-8 w-8 cursor-pointer hover:bg-gray-200 flex items-center justify-center rounded-md transition-colors"
                            >
                              <FiX size={16} className="text-gray-600" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <TextInput
                              type="text"
                              label={
                                <span className="font-medium text-gray-700">
                                  Product Name
                                </span>
                              }
                              placeholder="Enter product name here..."
                              {...registerProduct("name")}
                              required
                              classNames={{
                                input:
                                  "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                label: "!mb-1 !text-gray-700",
                              }}
                              error={productErrors.name?.message}
                              variant="filled"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <TextInput
                                type="text"
                                label={
                                  <span className="font-medium text-gray-700">
                                    HSN Code
                                  </span>
                                }
                                placeholder="Enter HSN code (4-8 digits)..."
                                {...registerProduct("hsnCode")}
                                onChange={handleHSNChange}
                                required
                                classNames={{
                                  input:
                                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                  label: "!mb-1 !text-gray-700",
                                }}
                                error={productErrors.hsnCode?.message}
                                variant="filled"
                                maxLength={8}
                              />

                              <NumberInput
                                label={
                                  <span className="font-medium text-gray-700">
                                    GST Slab
                                  </span>
                                }
                                placeholder="Enter GST slab here..."
                                value={watchProduct("gstSlab")}
                                onChange={(value) => {
                                  if (value)
                                    setProductValue(
                                      "gstSlab",
                                      value as number,
                                      {
                                        shouldValidate: true,
                                      }
                                    );
                                }}
                                required
                                classNames={{
                                  input:
                                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                  label: "!mb-1 !text-gray-700",
                                }}
                                error={productErrors.gstSlab?.message}
                                variant="filled"
                                allowNegative={false}
                                min={0}
                                max={18}
                                maxLength={2}
                                hideControls
                              />

                              <NumberInput
                                label={
                                  <span className="font-medium text-gray-700">
                                    Price
                                  </span>
                                }
                                placeholder="Enter price here..."
                                value={watchProduct("price")}
                                onChange={(value) => {
                                  if (value)
                                    setProductValue("price", value as number, {
                                      shouldValidate: true,
                                    });
                                }}
                                required
                                classNames={{
                                  input:
                                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                  label: "!mb-1 !text-gray-700",
                                }}
                                className="w-full"
                                error={productErrors.price?.message}
                                variant="filled"
                                allowNegative={false}
                                min={0}
                                hideControls
                                prefix="₹"
                              />

                              <Select
                                label={
                                  <span className="font-medium text-gray-700">
                                    Unit of Measurement
                                  </span>
                                }
                                placeholder="Select unit"
                                data={[
                                  { value: "pcs", label: "Pieces" },
                                  { value: "boxes", label: "Boxes" },
                                  { value: "bags", label: "Bags" },
                                  { value: "rolls", label: "Rolls" },
                                ]}
                                defaultValue="pcs"
                                onChange={(value) => {
                                  if (value)
                                    setProductValue(
                                      "unit",
                                      value as
                                        | "pcs"
                                        | "boxes"
                                        | "bags"
                                        | "rolls",
                                      {
                                        shouldValidate: true,
                                      }
                                    );
                                }}
                                classNames={{
                                  input:
                                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                  label: "!mb-1 !text-gray-700",
                                }}
                                error={productErrors.unit?.message}
                                variant="filled"
                                required
                              />
                            </div>

                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                {!showCategoryForm ? (
                                  <Select
                                    label={
                                      <span className="font-medium text-gray-700">
                                        Category
                                      </span>
                                    }
                                    placeholder="Select category"
                                    value={selectedCategory}
                                    data={
                                      categories?.map((category) => ({
                                        value: category._id.toString(),
                                        label: category.title,
                                      })) || []
                                    }
                                    onChange={(value) => {
                                      if (value) {
                                        setProductValue("categoryId", value, {
                                          shouldValidate: true,
                                        });
                                        setSelectedCategory(value);
                                      }
                                    }}
                                    required
                                    disabled={categoriesLoading}
                                    classNames={{
                                      input:
                                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                      label: "!mb-1 !text-gray-700",
                                    }}
                                    error={productErrors.categoryId?.message}
                                    variant="filled"
                                    rightSection={
                                      categoriesLoading ? (
                                        <Loader size={16} />
                                      ) : undefined
                                    }
                                    searchable
                                  />
                                ) : (
                                  <div className="bg-white px-3 pt-3 pb-4 border border-gray-200 rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                      <h3 className="font-semibold text-gray-700 text-sm">
                                        Create Category
                                      </h3>
                                      <div
                                        onClick={() =>
                                          setShowCategoryForm(false)
                                        }
                                        className="h-6 w-6 cursor-pointer hover:bg-gray-200 flex items-center justify-center rounded-md transition-colors"
                                      >
                                        <FiX
                                          size={12}
                                          className="text-gray-600"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-3">
                                      <TextInput
                                        type="text"
                                        placeholder="Enter category name here..."
                                        {...registerCategory("title")}
                                        error={categoryErrors.title?.message}
                                        classNames={{
                                          input:
                                            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                        }}
                                        className="flex-1"
                                      />
                                      <Button
                                        loading={isCreatingCategory}
                                        size="sm"
                                        className="!bg-gray-700 hover:!bg-gray-800 !text-white"
                                        onClick={handleSubmitCategory}
                                      >
                                        Add
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {!showCategoryForm && (
                                <Button
                                  variant="outline"
                                  onClick={() => setShowCategoryForm(true)}
                                  className="!text-gray-700 !border-gray-400 hover:!bg-gray-100"
                                >
                                  <FiPlus size={14} />
                                </Button>
                              )}
                            </div>

                            <div className="flex gap-4">
                              <Controller
                                name={`items.${currentItemIndex || 0}.quantity`}
                                control={control}
                                render={({ field }) => (
                                  <NumberInput
                                    label={
                                      <span className="font-medium text-gray-700">
                                        Quantity
                                      </span>
                                    }
                                    placeholder="Enter quantity"
                                    min={watch("type") === "ADJUSTMENT" ? 0 : 1}
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                    error={
                                      errors.items?.[currentItemIndex || 0]
                                        ?.quantity?.message
                                    }
                                    hideControls
                                    required
                                    classNames={{
                                      input:
                                        "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                      label: "!mb-1 !text-gray-700",
                                    }}
                                    className="flex-1"
                                    variant="filled"
                                  />
                                )}
                              />
                            </div>

                            <div className="flex gap-3 pt-2">
                              <Button
                                type="submit"
                                loading={isCreatingProduct}
                                className="!bg-gray-700 hover:!bg-gray-800 !text-white"
                                onClick={handleSubmitProduct}
                              >
                                Create Product
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleCancelProductCreation}
                                className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      No products added. Click &quot;Add Product&quot; to start.
                    </div>
                  )}

                  <div className="flex w-full justify-end items-center">
                    <Button
                      type="button"
                      size="xs"
                      onClick={addProductField}
                      disabled={products.length === 0 && !showAddProduct}
                      className="!bg-gray-700 hover:!bg-gray-800 !text-white"
                      leftSection={<FiPlus size={14} />}
                    >
                      Add More
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                <Textarea
                  label={
                    <span className="font-medium text-gray-700">Notes</span>
                  }
                  placeholder="Add any notes about this stock update (optional)..."
                  {...register("notes")}
                  rows={3}
                  classNames={{
                    input:
                      "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                    label: "!mb-1 !text-gray-700",
                  }}
                  error={errors.notes?.message}
                  variant="filled"
                />

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const form = watch();
                      const hasData =
                        form.items.some((item) => item.productId) || form.notes;

                      if (hasData) {
                        if (
                          confirm(
                            "Are you sure you want to cancel? Any unsaved changes will be lost."
                          )
                        ) {
                          setValue("items", [{ productId: "", quantity: 1 }]);
                          setValue("notes", "");
                          setValue("type", "IN");
                        }
                      } else {
                        setValue("items", [{ productId: "", quantity: 1 }]);
                        setValue("notes", "");
                        setValue("type", "IN");
                      }
                    }}
                    className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={isAddingStock}
                    disabled={isAddingStock || fields.length === 0}
                    className="!bg-gradient-to-r !from-gray-700 !to-gray-600 hover:!from-gray-800 hover:!to-gray-700 !text-white !border-none !w-[130px] shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {isAddingStock ? <Loader size={15} /> : "Update Stock"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StockUpdateForm;
