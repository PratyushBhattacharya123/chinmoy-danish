import { z } from "zod";

export const Pagination = {
  limit: 10,
};

export const userTypeSchema = z.enum(["ADMIN", "OPERATOR", "USER"]);

export type UserType = z.infer<typeof userTypeSchema>;

export const userSchema = z.object({
  id: z.string().min(1, "ID is required"),
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
  userType: userTypeSchema.optional().default("USER"),
});

export type User = z.infer<typeof userSchema>;

export const SessionSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  error: z.string().default(""),
  lastUsed: z.number().int().nonnegative(),
  user: userSchema,
});

export type Session = z.infer<typeof SessionSchema>;

// GST number validation regex (basic Indian GST format)
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// State code validation (Indian state codes are 2 digits)
const stateCodeRegex = /^[0-9]{2}$/;

// HSN code validation (4-8 digits as per Indian tax system)
const hsnCodeRegex = /^[0-9]{4,8}$/;

export const addPartyDetailsSchema = z.object({
  name: z
    .string()
    .min(1, "Party name is required")
    .max(50, "Party name must be less than 50 characters")
    .trim(),

  address: z
    .string()
    .min(1, "Address is required")
    .max(100, "Address must be less than 100 characters")
    .trim(),

  gstNumber: z
    .string()
    .min(1, "GST number is required")
    .regex(gstRegex, "Invalid GST number format")
    .toUpperCase()
    .trim()
    .optional()
    .or(z.literal("")),

  state: z
    .string()
    .min(1, "State is required")
    .max(50, "State name must be less than 30 characters")
    .trim(),

  stateCode: z
    .string()
    .min(1, "State code is required")
    .regex(stateCodeRegex, "State code must be 2 digits")
    .trim(),
});

export type AddPartyDetails = z.infer<typeof addPartyDetailsSchema>;

export const PartyDetailsUpdateSchema = addPartyDetailsSchema
  .pick({
    name: true,
    address: true,
    gstNumber: true,
    state: true,
    stateCode: true,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      for (const value of Object.values(data)) {
        if (value === "" || value === null || value === undefined) {
          return false;
        }
      }
      return true;
    },
    { message: "Fields cannot be updated to empty, null, or undefined values" }
  );

export const addCategorySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(50, "Title must be less than 50 characters")
    .trim(),
});

export type AddCategory = z.infer<typeof addCategorySchema>;

const addProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Product name must be less than 100 characters")
    .trim(),

  hsnCode: z
    .string()
    .min(1, "HSN code is required")
    .regex(hsnCodeRegex, "HSN code must be 4-8 digits")
    .trim(),

  gstSlab: z
    .number()
    .min(1, "GST number must be atleast 1")
    .max(18, "GST number cannot exceed 18"),

  price: z.number().min(0, "Price cannot be negative"),

  categoryId: z.string().min(1, "Category ID is required"),

  unit: z
    .enum(["pcs", "boxes", "bags", "rolls"])
    .default("pcs")
    .transform((val) => val || "pcs"),
});

export const productFormSchema = addProductSchema.required({
  unit: true,
});

export type AddProduct = z.infer<typeof productFormSchema>;

export const updateProductSchema = addProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      // Check that no fields are being updated to empty values
      for (const [key, value] of Object.entries(data)) {
        if (value === "" || value === null) {
          return false;
        }
      }
      return true;
    },
    { message: "Fields cannot be updated to empty or null values" }
  );

export type UpdateProduct = z.infer<typeof updateProductSchema>;

export const itemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  discountPercentage: z
    .number()
    .min(0, "Discount percentage cannot be negative")
    .max(100, "Discount percentage cannot exceed 100")
    .optional(),
});

export type Item = z.infer<typeof itemSchema>;

export const supplyDetailsSchema = z.object({
  transporterName: z
    .string()
    .max(100, "Transporter name must be less than 100 characters")
    .trim()
    .optional(),
  vehicleNumber: z
    .string()
    .max(20, "Vehicle number must be less than 20 characters")
    .trim()
    .optional(),
  supplyDate: z.string().optional().or(z.null()),
  supplyPlace: z
    .string()
    .min(1, "Supply place is required")
    .max(30, "Supply place must be less than 30 characters")
    .trim(),
});

export type SupplyDetails = z.infer<typeof supplyDetailsSchema>;

export const addOnSchema = z.object({
  title: z
    .string()
    .min(1, "Add-on title is required")
    .max(60, "Add-on title can't exceed 60 characters."),
  price: z.number().min(0, "Price cannot be negative"),
});

export type AddOn = z.infer<typeof addOnSchema>;

export const addBillSchema = z.object({
  partyId: z.string().min(1, "Party ID is required"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  invoiceDate: z.string(),
  supplyDetails: supplyDetailsSchema,
  addOns: z.array(addOnSchema).optional(),
});

export type AddBill = z.infer<typeof addBillSchema>;

export const updateBillSchema = addBillSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  })
  .refine(
    (data) => {
      for (const [key, value] of Object.entries(data)) {
        const isOptionalField = [
          "transporterName",
          "vehicleNumber",
          "supplyDate",
        ].includes(key);

        if (!isOptionalField && (value === "" || value === null)) {
          return false;
        }
      }
      return true;
    },
    { message: "Required fields cannot be updated to empty or null values" }
  );

export type UpdateBill = z.infer<typeof updateBillSchema>;

export const updateUserSchema = z.object({
  userType: userTypeSchema,
});

export type UpdateUser = z.infer<typeof updateUserSchema>;

export const stockSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().min(1, "Quantity is required"),
      })
    )
    .min(1, "At least one stock update required"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export type Stock = z.infer<typeof stockSchema>;

export const updateStockSchema = stockSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateStock = z.infer<typeof updateStockSchema>;
