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
import {
  QueryObserverResult,
  RefetchOptions,
  useMutation,
} from "@tanstack/react-query";
import {
  AddBill,
  AddCategory,
  addCategorySchema,
  AddProduct,
  productFormSchema,
} from "@/@types";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCategoriesData } from "@/hooks/use-queries";
import CustomLoader from "@/components/common/CustomLoader";
import { capitalize } from "@/components/utils/helper";
import { EnrichedProductsResponse } from "@/@types/server/response";
import { ProductPriceMap } from "@/app/operator/bills/invoices/add-invoice/page";

type Props = {
  setValue: UseFormSetValue<AddBill>;
  watch: UseFormWatch<AddBill>;
  control: Control<AddBill>;
  errors: FieldErrors<AddBill>;
  setActiveStep: React.Dispatch<React.SetStateAction<number>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setProductPrices: React.Dispatch<React.SetStateAction<ProductPriceMap>>;
  getItemPrice: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
  products: {
    _id: string;
    name: string;
    price: number;
    discountPercentage?: number | undefined;
    unit: string;
    hasSubUnit?: boolean | undefined;
    subUnit?:
      | {
          unit: string;
          conversionRate: number;
        }
      | undefined;
  }[];
  calculateItemTotal: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
  getDiscountAmount: (
    item: {
      productId: string;
      quantity: number;
      discountPercentage?: number | undefined;
      isSubUnit?: boolean | undefined;
    },
    index: number
  ) => number;
  refetchProducts: (options?: RefetchOptions | undefined) => Promise<
    QueryObserverResult<
      {
        products: EnrichedProductsResponse[];
        count: number;
      },
      Error
    >
  >;
  isLoading: boolean;
};

const ItemDetailsStep = ({
  setValue,
  watch,
  control,
  errors,
  setActiveStep,
  containerRef,
  setProductPrices,
  getItemPrice,
  products,
  calculateItemTotal,
  getDiscountAmount,
  refetchProducts,
  isLoading,
}: Props) => {
  const [categories, setCategories] = useState<
    { _id: string; title: string }[]
  >([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>();
  const [selectedCategory, setSelectedCategory] = useState("");

  useLayoutEffect(() => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "instant",
        block: "start",
      });
    }
  }, []);

  // Fetch data

  const {
    data: categoriesData,
    refetch: refetchCategories,
    isLoading: categoriesLoading,
  } = useCategoriesData({ limit: 100, offset: 0 });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Product form with subunit functionality
  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    watch: watchProduct,
    formState: { errors: productErrors },
    reset: resetProduct,
    setValue: setProductValue,
  } = useForm<AddProduct>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      unit: "pcs",
      hasSubUnit: false,
    },
  });

  // Watch product form values for subunit functionality
  const unitValue = watchProduct("unit");
  const hasSubUnitValue = watchProduct("hasSubUnit");
  const subUnitValue = watchProduct("subUnit");

  const handleHSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setProductValue("hsnCode", value, { shouldValidate: true });
  };

  // Subunit logic for product form
  useEffect(() => {
    if (!hasSubUnitValue) {
      setProductValue("subUnit", undefined);
    } else {
      const defaultSubUnits: Record<string, string> = {
        boxes: "pcs",
        pipes: "feets",
        rolls: "mtrs",
        kgs: "grams",
      };

      const defaultSubUnit = defaultSubUnits[unitValue];
      if (
        defaultSubUnit &&
        (!subUnitValue?.unit || !isValidSubUnit(unitValue, subUnitValue.unit))
      ) {
        setProductValue(
          "subUnit.unit",
          defaultSubUnit as "pcs" | "feets" | "mtrs" | "grams"
        );
      }

      // Set conversion rate to 1000 and make readonly for kgs
      if (unitValue === "kgs") {
        setProductValue("subUnit.conversionRate", 1000, {
          shouldValidate: true,
        });
      }
    }
  }, [unitValue, hasSubUnitValue, setProductValue, subUnitValue]);

  const isValidSubUnit = (
    mainUnit: string,
    subUnit: string | undefined
  ): boolean => {
    const validSubUnits: Record<string, string[]> = {
      boxes: ["pcs"],
      pipes: ["feets"],
      rolls: ["mtrs"],
      kgs: ["grams"],
    };
    return validSubUnits[mainUnit]?.includes(subUnit || "") || false;
  };

  const getAvailableSubUnits = (mainUnit: string) => {
    const subUnitOptions: Record<string, { value: string; label: string }[]> = {
      boxes: [{ value: "pcs", label: "Pieces" }],
      pipes: [{ value: "feets", label: "Feets" }],
      rolls: [{ value: "mtrs", label: "Metres" }],
      kgs: [{ value: "grams", label: "Grams" }],
    };
    return subUnitOptions[mainUnit] || [];
  };

  const supportsSubUnits = ["boxes", "pipes", "rolls", "kgs"].includes(
    unitValue
  );

  const handleCancelProductCreation = () => {
    // Get the current quantity and price from the form
    const currentQuantity =
      watch(`items.${currentItemIndex || 0}.quantity`) || 0;
    const currentDiscountPercentage =
      watch(`items.${currentItemIndex || 0}.discountPercentage`) || 0;
    const currentIsSubUnit =
      watch(`items.${currentItemIndex || 0}.isSubUnit`) || false;

    // Update the item with preserved quantity and price, but empty productId
    setValue(`items.${currentItemIndex || 0}`, {
      productId: "",
      quantity: currentQuantity,
      discountPercentage: currentDiscountPercentage,
      isSubUnit: currentIsSubUnit,
    });

    if (currentItemIndex !== undefined) {
      setProductPrices((prev) => {
        const newPrices = { ...prev };
        delete newPrices[currentItemIndex];
        return newPrices;
      });
    }

    // Close the product creation form
    setShowAddProduct(false);
    setCurrentItemIndex(undefined);
    setSelectedCategory("");
    resetProduct();
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

  // Handle product selection
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = products.find((p) => p._id === productId);

    if (selectedProduct) {
      setValue(`items.${index}.productId`, productId);
      setProductPrices((prev) => ({
        ...prev,
        [index]: selectedProduct.price,
      }));
      setValue(
        `items.${index}.discountPercentage`,
        selectedProduct.discountPercentage
      );
    }
  };

  // Check if product supports subunits
  const productSupportsSubUnits = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product?.hasSubUnit && product?.subUnit;
  };

  const totalAmount =
    items?.reduce(
      (sum, item, index) => sum + calculateItemTotal(item, index),
      0
    ) || 0;

  // Handle discount input changes
  const handleDiscountPercentageChange = (index: number, value: number) => {
    const item = items?.[index];
    const itemPrice = getItemPrice(item, index);
    if (itemPrice === 0) {
      toast.error("Please set price first");
      return;
    }
    if (value > 100) {
      toast.error("Discount percentage cannot exceed 100%");
      return;
    }
    setValue(`items.${index}.discountPercentage`, value || 0);
  };

  // Handle subunit toggle
  const handleSubUnitToggle = (index: number, checked: boolean) => {
    const productId = items?.[index]?.productId;
    if (!productId) {
      toast.error("Please select a product first");
      return;
    }

    if (checked && !productSupportsSubUnits(productId)) {
      toast.error("This product does not support subunits");
      return;
    }

    setValue(`items.${index}.isSubUnit`, checked);
  };

  // Get unit display for an item
  const getUnitDisplay = (index: number) => {
    const item = items?.[index];
    if (!item?.productId) return "";

    const product = products.find((p) => p._id === item.productId);
    if (!product) return "";

    if (item.isSubUnit && product.subUnit) {
      return product.subUnit.unit;
    }

    return product.unit;
  };

  // Get conversion info for display
  const getConversionInfo = (index: number) => {
    const item = items?.[index];
    if (!item?.productId || !item.isSubUnit) return null;

    const product = products.find((p) => p._id === item.productId);
    if (!product?.subUnit) return null;

    return {
      mainUnit: product.unit,
      subUnit: product.subUnit.unit,
      rate: product.subUnit.conversionRate,
    };
  };

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
      const productData: AddProduct = {
        ...data,
        unit: data.unit || "pcs",
        ...(data.hasSubUnit ? {} : { subUnit: undefined }),
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
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
      (item) => !item.productId || !item.quantity || item.quantity <= 0
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

  const isKgsSubUnit = unitValue === "kgs" && hasSubUnitValue;

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
                  <div
                    className={`grid grid-cols-1 ${
                      watch(`items.${index}.productId`) &&
                      productSupportsSubUnits(items?.[index]?.productId || "")
                        ? "md:grid-cols-18"
                        : "md:grid-cols-14"
                    } sm:gap-6 gap-4 items-start relative`}
                  >
                    <div className="md:col-span-5 flex items-end sm:gap-4 gap-3">
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
                              if (value) {
                                handleProductSelect(index, value);
                              }
                            }}
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
                          setValue(`items.${index}.quantity`, 0);
                          setValue(`items.${index}.discountPercentage`, 0);
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
                            min={0}
                            allowNegative={false}
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

                    {watch(`items.${index}.productId`) &&
                      productSupportsSubUnits(
                        items?.[index]?.productId || ""
                      ) && (
                        <>
                          {/* Unit Display */}
                          <div className="md:col-span-2">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-700 mb-1">
                                Unit
                              </div>
                              <div className="h-10 flex items-center px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm">
                                {capitalize(getUnitDisplay(index))}
                              </div>
                              {getConversionInfo(index) && (
                                <div className="text-xs text-gray-500">
                                  1 {getConversionInfo(index)?.mainUnit} ={" "}
                                  {getConversionInfo(index)?.rate}{" "}
                                  {getConversionInfo(index)?.subUnit}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* SubUnit Toggle */}
                          <div className="md:col-span-2 h-full flex items-center">
                            <Controller
                              name={`items.${index}.isSubUnit`}
                              control={control}
                              render={({ field }) => (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="hasSubUnit"
                                    checked={field.value || false}
                                    onChange={(event) =>
                                      handleSubUnitToggle(
                                        index,
                                        event.currentTarget.checked
                                      )
                                    }
                                    disabled={
                                      !productSupportsSubUnits(
                                        items?.[index]?.productId || ""
                                      )
                                    }
                                    className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                                    style={{ accentColor: "#475569" }}
                                  />
                                  <label
                                    htmlFor="hasSubUnit"
                                    className="text-sm font-medium text-gray-700"
                                  >
                                    Bill in Sub Unit
                                  </label>
                                </div>
                              )}
                            />
                          </div>
                        </>
                      )}

                    <div className="md:col-span-2">
                      <NumberInput
                        label={
                          <span className="font-medium text-gray-700">
                            Price
                          </span>
                        }
                        placeholder="Price will auto-fill"
                        min={0}
                        value={getItemPrice(items?.[index], index)}
                        readOnly
                        hideControls
                        classNames={{
                          input:
                            "!border-gray-300 !bg-gray-100 !text-gray-600 !rounded-md",
                          label: "!mb-1 !text-gray-700",
                        }}
                        variant="filled"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <div className="space-y-1">
                        <Controller
                          name={`items.${index}.discountPercentage`}
                          control={control}
                          render={({ field }) => (
                            <NumberInput
                              label={
                                <span className="font-medium text-gray-700">
                                  Discount
                                </span>
                              }
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
                                label: "!mb-1 !text-gray-700",
                              }}
                              rightSection={<span>%</span>}
                              variant="filled"
                            />
                          )}
                        />
                        {(items?.[index]?.discountPercentage || 0) > 0 && (
                          <div className="text-xs text-gray-600 flex justify-between">
                            <span>
                              ₹
                              {(
                                getDiscountAmount(items[index], index) /
                                items?.[index].quantity
                              ).toFixed(2)}
                            </span>
                            <span>
                              Base : ₹
                              {getItemPrice(
                                items?.[index],
                                index
                              ).toLocaleString("en-IN")}
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
                        ₹
                        {calculateItemTotal(items[index], index).toLocaleString(
                          "en-IN"
                        )}
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <div
                        className="absolute bottom-2 right-1 text-red-500 cursor-pointer sm:hidden hover:text-red-600"
                        onClick={() => {
                          remove(index);
                          setProductPrices((prev) => {
                            const newPrices = { ...prev };
                            delete newPrices[index];
                            return newPrices;
                          });
                        }}
                      >
                        <FaTrashCan size={14} />
                      </div>
                    )}
                  </div>

                  {fields.length > 1 && (
                    <div
                      className="absolute top-3.5 right-3.5 text-red-500 cursor-pointer hidden sm:block hover:text-red-600"
                      onClick={() => {
                        remove(index);
                        setProductPrices((prev) => {
                          const newPrices = { ...prev };
                          delete newPrices[index];
                          return newPrices;
                        });
                      }}
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

                    <div className="flex sm:flex-row flex-col sm:gap-4 gap-3">
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
                    </div>

                    <div className="flex sm:flex-row flex-col sm:gap-4 gap-3">
                      <NumberInput
                        label={
                          <span className="font-medium text-gray-700">
                            Current Stock (optional)
                          </span>
                        }
                        placeholder="Enter current stock here..."
                        value={watchProduct("quantity")}
                        onChange={(value) => {
                          setProductValue("quantity", value as number);
                        }}
                        classNames={{
                          input:
                            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                          label: "!mb-1 !text-gray-700",
                        }}
                        className="w-full"
                        error={productErrors.quantity?.message}
                        variant="filled"
                        allowNegative={false}
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
                          { value: "pipes", label: "Pipes" },
                          { value: "rolls", label: "Rolls" },
                          { value: "kgs", label: "Kilograms" },
                        ]}
                        defaultValue="pcs"
                        onChange={(value) => {
                          if (value) {
                            setProductValue(
                              "unit",
                              value as
                                | "pcs"
                                | "boxes"
                                | "pipes"
                                | "rolls"
                                | "kgs",
                              {
                                shouldValidate: true,
                              }
                            );
                            if (
                              !["boxes", "pipes", "rolls", "kgs"].includes(
                                value
                              )
                            ) {
                              setProductValue("hasSubUnit", false);
                            }
                          }
                        }}
                        classNames={{
                          input:
                            "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                          label: "!mb-1 !text-gray-700",
                        }}
                        className="!w-full"
                        error={productErrors.unit?.message}
                        variant="filled"
                        required
                      />
                    </div>

                    {/* SubUnit Configuration */}
                    {supportsSubUnits && (
                      <div className="space-y-3 p-4 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="hasSubUnitProduct"
                            checked={hasSubUnitValue}
                            onChange={(event) => {
                              setProductValue(
                                "hasSubUnit",
                                event.currentTarget.checked,
                                {
                                  shouldValidate: true,
                                }
                              );
                            }}
                            className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 cursor-pointer"
                            style={{ accentColor: "#475569" }}
                          />
                          <label
                            htmlFor="hasSubUnitProduct"
                            className="text-sm font-medium text-gray-700"
                          >
                            Enable Sub Unit
                          </label>
                        </div>

                        {hasSubUnitValue && (
                          <div className="flex sm:flex-row flex-col sm:gap-4 gap-3 mt-3 sm:items-end">
                            <Select
                              label={
                                <span className="font-medium text-gray-700">
                                  Sub Unit
                                </span>
                              }
                              placeholder="Select sub unit"
                              data={getAvailableSubUnits(unitValue)}
                              value={subUnitValue?.unit || ""}
                              onChange={(value) => {
                                if (value) {
                                  setProductValue(
                                    "subUnit.unit",
                                    value as "pcs" | "feets" | "mtrs" | "grams",
                                    {
                                      shouldValidate: true,
                                    }
                                  );
                                }
                              }}
                              classNames={{
                                input:
                                  "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                label: "!mb-1 !text-gray-700",
                              }}
                              className="w-full"
                              error={productErrors.subUnit?.unit?.message}
                              variant="filled"
                              required
                            />

                            <NumberInput
                              label={
                                <span className="font-medium text-gray-700">
                                  Conversion Rate
                                </span>
                              }
                              placeholder="e.g., 1000"
                              description={`1 ${unitValue} = ${
                                subUnitValue?.conversionRate
                                  ? subUnitValue?.conversionRate
                                  : isKgsSubUnit
                                  ? "1000"
                                  : "?"
                              } ${
                                subUnitValue?.unit ||
                                getAvailableSubUnits(unitValue)[0]?.label
                              }`}
                              value={subUnitValue?.conversionRate || ""}
                              onChange={(value) => {
                                if (value !== "") {
                                  setProductValue(
                                    "subUnit.conversionRate",
                                    value as number,
                                    {
                                      shouldValidate: true,
                                    }
                                  );
                                }
                              }}
                              classNames={{
                                input:
                                  "!border-gray-300 focus:!border-gray-600 focus:!ring-gray-500 !rounded-md !bg-gray-50",
                                label: "!mb-1 !text-gray-700",
                                description: "!text-gray-500 !text-xs",
                              }}
                              className="w-full"
                              error={
                                productErrors.subUnit?.conversionRate?.message
                              }
                              variant="filled"
                              allowNegative={false}
                              min={0.001}
                              step={0.001}
                              hideControls
                              required
                              readOnly={isKgsSubUnit}
                              disabled={isKgsSubUnit}
                            />
                          </div>
                        )}
                      </div>
                    )}

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

                    <div className="flex sm:flex-row flex-col gap-4">
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
                            min={0}
                            allowNegative={false}
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

                      <div className="space-y-1 w-full">
                        <Controller
                          name={`items.${index}.discountPercentage`}
                          control={control}
                          render={({ field }) => (
                            <NumberInput
                              label={
                                <span className="font-medium text-gray-700">
                                  Discount
                                </span>
                              }
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
                                label: "!mb-1 !text-gray-700",
                              }}
                              rightSection={<span>%</span>}
                              variant="filled"
                            />
                          )}
                        />
                        {(items?.[index]?.discountPercentage || 0) > 0 && (
                          <div className="text-xs text-gray-600 flex justify-between">
                            <span>
                              ₹
                              {(
                                getDiscountAmount(items[index], index) /
                                items?.[index].quantity
                              ).toFixed(2)}
                            </span>
                            <span>
                              Base : ₹
                              {getItemPrice(
                                items?.[index],
                                index
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
                quantity: 0,
                discountPercentage: 0,
                isSubUnit: undefined,
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

export default ItemDetailsStep;
