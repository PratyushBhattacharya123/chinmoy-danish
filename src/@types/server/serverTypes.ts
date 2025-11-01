import z from "zod";

const numberString = z.string().regex(/^\d+$/).transform(Number);

export const paginationSchema = z.object({
  offset: numberString.optional().default(0),
  limit: numberString.optional().default(10),
});

export const getPartyDetailsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const getProductsQuerySchema = getPartyDetailsQuerySchema.extend({
  categoryId: z.string().optional(),
  stockFilter: z.string().optional(),
});

export const getBillsQuerySchema = getPartyDetailsQuerySchema.extend({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const getStocksQuerySchema = paginationSchema.extend({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
