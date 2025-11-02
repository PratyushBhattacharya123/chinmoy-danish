import {
  Button,
  Group,
  Loader,
  NumberInput,
  Select,
  TextInput,
} from "@mantine/core";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Control,
  Controller,
  FieldErrors,
  useFieldArray,
  useForm,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { FaTrashCan } from "react-icons/fa6";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";
import {
  AddBill,
  AddCategory,
  addCategorySchema,
  AddProduct,
  productFormSchema,
} from "@/@types";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCategoriesData, useProductsData } from "@/hooks/use-queries";
import CustomLoader from "@/components/common/CustomLoader";

type Props = {
  setValue: UseFormSetValue<AddBill>;
  watch: UseFormWatch<AddBill>;
  control: Control<AddBill>;
  errors: FieldErrors<AddBill>;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
};

type DiscountType = "percentage" | "amount";

const ItemDetatilsStep = ({
  setValue,
  watch,
  control,
  errors,
  setActiveStep,
  containerRef,
}: Props) => {
  const [products, setProducts] = useState<
    { _id: string; name: string; price: number }[]
  >([]);
  const [categories, setCategories] = useState<
    { _id: string; title: string }[]
  >([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([]);

  useLayoutEffect(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, []);

  // Initialize discount types array based on fields
  useEffect(() => {
    const items = watch("items");
    if (items && items.length > discountTypes.length) {
      // Initialize new items with percentage discount type
      const newDiscountTypes = [...discountTypes];
      for (let i = discountTypes.length; i < items.length; i++) {
        newDiscountTypes.push("percentage");
      }
      setDiscountTypes(newDiscountTypes);
    }
  }, [watch("items"), discountTypes]);

  // Fetch data
  const {
    data: productsData,
    refetch: refetchProducts,
    isLoading,
  } = useProductsData({
    limit: 1000,
    offset: 0,
  });

  const {
    data: categoriesData,
    refetch: refetchCategories,
    isLoading: categoriesLoading,
  } = useCategoriesData({ limit: 100, offset: 0 });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Product form
  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    watch: watchProduct,
    formState: { errors: productErrors },
    reset: resetProduct,
    setValue: setProductValue,
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: { unit: "pcs" },
  });

  const handleHSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setProductValue("hsnCode", value, { shouldValidate: true });
  };

  const handleCancelProductCreation = () => {
    // Get the current quantity and price from the form
    const currentQuantity =
      watch(`items.${currentItemIndex || 0}.quantity`) || 1;
    const currentPrice = watch(`items.${currentItemIndex || 0}.price`) || 0;
    const currentDiscountPercentage =
      watch(`items.${currentItemIndex || 0}.discountPercentage`) || 0;

    // Update the item with preserved quantity and price, but empty productId
    setValue(`items.${currentItemIndex || 0}`, {
      productId: "",
      quantity: currentQuantity,
      price: currentPrice,
      discountPercentage: currentDiscountPercentage,
    });

    // Close the product creation form
    setShowAddProduct(false);
    setCurrentItemIndex(undefined);
    setSelectedCategory("");
  };

  // Category form
  const {
    register: registerCategory,
    formState: { errors: categoryErrors },
    getValues: categoryGetValues,
  } = useForm({
    resolver: zodResolver(addCategorySchema),
  });

  // Watch values for calculations
  const items = watch("items");

  // Calculate item totals with discount
  const calculateItemTotal = (index: number) => {
    const item = items?.[index];
    if (!item) return 0;

    const baseAmount = (item.quantity || 0) * (item.price || 0);
    const discountAmount = item.discountPercentage
      ? (baseAmount * (item.discountPercentage || 0)) / 100
      : 0;

    return Math.max(0, baseAmount - discountAmount);
  };

  const totalAmount =
    items?.reduce((sum, _, index) => sum + calculateItemTotal(index), 0) || 0;

  // Handle discount input changes
  const handleDiscountPercentageChange = (index: number, value: number) => {
    const item = items?.[index];
    if (!item) return;
    const baseAmount = item.price || 0;
    if (baseAmount === 0) {
      toast.error("Please set price first");
      return;
    }
    if (value > 100) {
      toast.error("Discount percentage cannot exceed 100%");
      return;
    }
    setValue(`items.${index}.discountPercentage`, value || 0);
  };

  const handleDiscountAmountChange = (index: number, amount: number) => {
    const item = items?.[index];
    if (!item) return;

    const baseAmount = item.price || 0;
    if (baseAmount === 0) {
      toast.error("Please set price first");
      return;
    }

    if (amount > baseAmount) {
      toast.error("Discount amount cannot exceed item price");
      return;
    }

    const percentage = (amount / baseAmount) * 100;
    setValue(`items.${index}.discountPercentage`, percentage);
  };

  // Get discount amount for display
  const getDiscountAmount = (index: number) => {
    const item = items?.[index];
    if (!item) return 0;

    const baseAmount = item.price || 0;
    return (baseAmount * (item.discountPercentage || 0)) / 100;
  };

  // Toggle discount type
  const toggleDiscountType = (index: number) => {
    const newDiscountTypes = [...discountTypes];
    newDiscountTypes[index] =
      newDiscountTypes[index] === "percentage" ? "amount" : "percentage";
    setDiscountTypes(newDiscountTypes);
  };

  useEffect(() => {
    if (productsData?.products) {
      setProducts(
        productsData.products.map((p) => ({
          _id: p._id.toString(),
          name: p.name,
          price: 0,
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
      refetchProducts();
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

  const handleSubmitCategory = () => {
    const title = categoryGetValues("title");
    if (title) {
      createCategory({ title });
    } else {
      toast.error("Please add the category name!");
    }
  };

  const onSubmitProduct = (data: AddProduct) => {
    createProduct(data);
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setActiveStep((current) => (current < 3 ? current + 1 : current));
    }
  };

  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  // Validation function
  const validateCurrentStep = () => {
    const currentItems = watch("items");
    if (!currentItems || currentItems.length === 0) {
      toast.error("Please add at least one item");
      return false;
    }

    // Check if any item is incomplete
    const incompleteItem = currentItems.find(
      (item) =>
        !item.productId ||
        !item.quantity ||
        !item.price ||
        item.quantity <= 0 ||
        item.price <= 0
    );

    if (incompleteItem) {
      toast.error("Please complete all item fields with valid values");
      return false;
    }

    // Check for valid discount percentages
    const invalidDiscount = currentItems.find(
      (item) => item.discountPercentage && item.discountPercentage > 100
    );

    if (invalidDiscount) {
      toast.error("Discount percentage cannot exceed 100%");
      return false;
    }

    return true;
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <CustomLoader />
      ) : (
        <>
          {fields.map((field, index) => (
            <div key={field.id}>
              {currentItemIndex !== index && (
                <div
                  className="p-4 border border-gray-200 rounded-lg relative flex flex-col sm:gap-4 gap-2 sm:pb-6"
                  key={field.id}
                >
                  <div className="grid grid-cols-1 md:grid-cols-15 sm:gap-6 gap-4 items-start relative">
                    <div className="md:col-span-6 flex items-end sm:gap-4 gap-3">
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
                            onChange={field.onChange}
                            error={errors.items?.[index]?.productId?.message}
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                              label: "!mb-1 !text-gray-700",
                            }}
                            className="w-full"
                            required
                            variant="filled"
                            searchable
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
                    <div className="md:col-span-2">
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
                            min={1}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            error={errors.items?.[index]?.quantity?.message}
                            hideControls
                            required
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                              label: "!mb-1 !text-gray-700",
                            }}
                            variant="filled"
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Controller
                        name={`items.${index}.price`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            label={
                              <span className="font-medium text-gray-700">
                                Price
                              </span>
                            }
                            placeholder="Enter price"
                            min={0}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            error={errors.items?.[index]?.price?.message}
                            hideControls
                            required
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                              label: "!mb-1 !text-gray-700",
                            }}
                            variant="filled"
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-medium text-gray-700 text-sm">
                            Discount
                          </label>
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => toggleDiscountType(index)}
                            className="!text-gray-600 !p-1 !h-6 hover:!bg-gray-200"
                          >
                            {discountTypes[index] === "percentage" ? "₹" : "%"}
                          </Button>
                        </div>
                        {discountTypes[index] === "percentage" ? (
                          <Controller
                            name={`items.${index}.discountPercentage`}
                            control={control}
                            render={({ field }) => (
                              <NumberInput
                                placeholder="Discount %"
                                min={0}
                                max={100}
                                value={field.value || 0}
                                onChange={(val) =>
                                  handleDiscountPercentageChange(
                                    index,
                                    Number(val) || 0
                                  )
                                }
                                error={
                                  errors.items?.[index]?.discountPercentage
                                    ?.message
                                }
                                hideControls
                                classNames={{
                                  input:
                                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                }}
                                rightSection={<span>%</span>}
                                variant="filled"
                              />
                            )}
                          />
                        ) : (
                          <NumberInput
                            placeholder="Discount ₹"
                            min={0}
                            value={getDiscountAmount(index)}
                            onChange={(val) =>
                              handleDiscountAmountChange(
                                index,
                                Number(val) || 0
                              )
                            }
                            max={items?.[index]?.price || 0}
                            hideControls
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                            }}
                            rightSection={<span>₹</span>}
                            variant="filled"
                          />
                        )}
                        {(items?.[index]?.discountPercentage || 0) > 0 && (
                          <div className="text-xs text-gray-600 flex justify-between">
                            <span>
                              {discountTypes[index] === "percentage"
                                ? `₹${getDiscountAmount(index).toFixed(2)}`
                                : `${(
                                    items?.[index]?.discountPercentage || 0
                                  ).toFixed(1)}%`}
                            </span>
                            <span>
                              Base : ₹
                              {(items?.[index]?.price || 0).toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2 flex sm:flex-col flex-row justify-center items-center gap-2 sm:gap-0 h-full">
                      <div className="text-sm font-semibold text-gray-700">
                        Total
                      </div>
                      <div className="text-lg font-bold text-gray-700">
                        ₹{calculateItemTotal(index).toLocaleString("en-IN")}
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <div
                        className="absolute bottom-2 right-1 text-red-500 cursor-pointer sm:hidden hover:text-red-600"
                        onClick={() => remove(index)}
                      >
                        <FaTrashCan size={14} />
                      </div>
                    )}
                  </div>

                  {fields.length > 1 && (
                    <div
                      className="absolute top-3.5 right-3.5 text-red-500 cursor-pointer hidden sm:block hover:text-red-600"
                      onClick={() => remove(index)}
                    >
                      <FaTrashCan size={14} />
                    </div>
                  )}
                </div>
              )}

              {showAddProduct && currentItemIndex === index && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
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
                  <form
                    onSubmit={handleSubmitProduct(onSubmitProduct)}
                    className="space-y-3"
                  >
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

                    <div className="flex sm:flex-row flex-col sm:gap-6 gap-4">
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
                        className="w-full"
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
                            setProductValue("gstSlab", value as number, {
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
                        error={productErrors.gstSlab?.message}
                        variant="filled"
                        allowNegative={false}
                        minLength={1}
                        max={18}
                        maxLength={2}
                        hideControls
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
                              value as "pcs" | "boxes" | "bags" | "rolls",
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
                        className="w-full"
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
                                onClick={() => setShowCategoryForm(false)}
                                className="h-6 w-6 cursor-pointer hover:bg-gray-200 flex items-center justify-center rounded-md transition-colors"
                              >
                                <FiX size={12} className="text-gray-600" />
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

                    <div className="flex sm:flex-row flex-col sm:gap-6 gap-4">
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
                            min={1}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            error={
                              errors.items?.[currentItemIndex || 0]?.quantity
                                ?.message
                            }
                            hideControls
                            required
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                              label: "!mb-1 !text-gray-700",
                            }}
                            className="w-full"
                            variant="filled"
                          />
                        )}
                      />

                      <Controller
                        name={`items.${currentItemIndex || 0}.price`}
                        control={control}
                        render={({ field }) => (
                          <NumberInput
                            label={
                              <span className="font-medium text-gray-700">
                                Price
                              </span>
                            }
                            placeholder="Enter price"
                            min={0}
                            value={field.value}
                            onChange={(val) => field.onChange(val)}
                            error={
                              errors.items?.[currentItemIndex || 0]?.price
                                ?.message
                            }
                            hideControls
                            required
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                              label: "!mb-1 !text-gray-700",
                            }}
                            className="w-full"
                            variant="filled"
                          />
                        )}
                      />

                      <div className="space-y-1 w-full">
                        <div className="flex items-center justify-between">
                          <label className="font-medium text-gray-700 text-sm">
                            Discount
                          </label>
                          <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => toggleDiscountType(index)}
                            className="!text-gray-600 !p-1 !h-6 hover:!bg-gray-200"
                          >
                            {discountTypes[index] === "percentage" ? "₹" : "%"}
                          </Button>
                        </div>
                        {discountTypes[index] === "percentage" ? (
                          <Controller
                            name={`items.${index}.discountPercentage`}
                            control={control}
                            render={({ field }) => (
                              <NumberInput
                                placeholder="Discount %"
                                min={0}
                                max={100}
                                value={field.value || 0}
                                onChange={(val) =>
                                  handleDiscountPercentageChange(
                                    index,
                                    Number(val) || 0
                                  )
                                }
                                error={
                                  errors.items?.[index]?.discountPercentage
                                    ?.message
                                }
                                hideControls
                                classNames={{
                                  input:
                                    "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                }}
                                rightSection={<span>%</span>}
                                variant="filled"
                              />
                            )}
                          />
                        ) : (
                          <NumberInput
                            placeholder="Discount ₹"
                            min={0}
                            value={getDiscountAmount(index)}
                            onChange={(val) =>
                              handleDiscountAmountChange(
                                index,
                                Number(val) || 0
                              )
                            }
                            max={
                              (items?.[index]?.quantity || 0) *
                              (items?.[index]?.price || 0)
                            }
                            hideControls
                            classNames={{
                              input:
                                "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                            }}
                            rightSection={<span>₹</span>}
                            variant="filled"
                          />
                        )}
                        {(items?.[index]?.discountPercentage || 0) > 0 && (
                          <div className="text-xs text-gray-600 flex justify-between">
                            <span>
                              {discountTypes[index] === "percentage"
                                ? `₹${getDiscountAmount(index).toFixed(2)}`
                                : `${(
                                    items?.[index]?.discountPercentage || 0
                                  ).toFixed(1)}%`}
                            </span>
                            <span>
                              Base : ₹
                              {(
                                (items?.[index]?.quantity || 0) *
                                (items?.[index]?.price || 0)
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Group mt={20} mb={4}>
                      <Button
                        type="submit"
                        loading={isCreatingProduct}
                        className="!bg-gray-700 hover:!bg-gray-800 !text-white"
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
                    </Group>
                  </form>
                </div>
              )}
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              append({
                productId: "",
                quantity: 1,
                price: 0,
                discountPercentage: 0,
              });
              setShowAddProduct(false);
              setCurrentItemIndex(undefined);
            }}
            className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
          >
            <FiPlus className="mr-2" /> Add Another Item
          </Button>

          <div className="text-right font-bold border-t border-gray-200 pt-4 sm:text-lg text-[16px] text-gray-800">
            Grand Total :{" "}
            <span className="text-gray-700 sm:text-xl text-lg">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </>
      )}

      <Group>
        <Button
          variant="outline"
          onClick={prevStep}
          className="!border-gray-400 !text-gray-700 hover:!bg-gray-100"
        >
          <FiArrowLeft className="mr-2" /> Back
        </Button>
        <Button
          onClick={handleNextStep}
          className="!bg-gray-700 hover:!bg-gray-800 !text-white"
        >
          Next : Review
        </Button>
      </Group>
    </div>
  );
};

export default ItemDetatilsStep;
