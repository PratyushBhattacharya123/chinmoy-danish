import { ObjectId } from "mongodb";

export interface PartyDetailsResponse {
  _id: ObjectId;
  name: string;
  address: string;
  gstNumber?: string;
  state: string;
  stateCode: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CategoriesResponse {
  _id: ObjectId;
  title: string;
}

export interface SubUnit {
  unit: "pcs" | "feets" | "mtrs" | "grams";
  conversionRate: number;
}

export interface ProductsResponse {
  _id: ObjectId;
  categoryId: ObjectId;
  name: string;
  hsnCode: string;
  gstSlab: number;
  unit: "pcs" | "boxes" | "pipes" | "rolls" | "kgs";
  price: number;
  discountPercentage?: number;
  currentStock: number;
  hasSubUnit?: boolean;
  subUnit?: SubUnit;
}

export interface EnrichedProductsResponse
  extends Omit<ProductsResponse, "categoryId"> {
  categoryDetails: CategoriesResponse | null;
}

export interface Item {
  productId: ObjectId;
  quantity: number;
  discountPercentage?: number;
  isSubUnit?: boolean;
}

export interface SupplyDetails {
  transporterName?: string;
  vehicleNumber?: string;
  supplyDate?: Date;
  supplyPlace: string;
}

export interface AddOn {
  title: string;
  price: number;
}

export interface BillsResponse {
  _id: ObjectId;
  billNumber: string;
  partyId: ObjectId;
  items: Item[];
  addOns?: AddOn[];
  totalAmount: number;
  invoiceDate: Date;
  supplyDetails: SupplyDetails;
}

export interface EnrichedItem extends Omit<Item, "productId"> {
  productDetails: {
    _id: ObjectId;
    categoryId: ObjectId;
    name: string;
    hsnCode: string;
    gstSlab: 5 | 18;
    unit: "pcs" | "boxes" | "bags" | "rolls" | "kgs";
    price: number;
    hasSubUnit?: boolean;
    subUnit?: SubUnit;
    categoryDetails: {
      _id: ObjectId;
      title: string;
    } | null;
  } | null;
}

export interface EnrichedBillsResponse
  extends Omit<BillsResponse, "items" | "partyId"> {
  partyDetails: PartyDetailsResponse | null;
  items: EnrichedItem[];
}

export interface UsersResponse {
  _id: ObjectId;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userType: "ADMIN" | "OPERATOR" | "USER";
}

export interface StocksResponse {
  _id: ObjectId;
  type: "IN" | "OUT" | "ADJUSTMENT";
  items: {
    isSubUnit: boolean;
    productId: ObjectId;
    quantity: number;
  }[];
  notes: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrichedItemStocks {
  quantity: number;
  isSubUnit: boolean;
  productDetails: {
    _id: ObjectId;
    name: string;
    currentStock: number;
    unit: "pcs" | "boxes" | "bags" | "rolls" | "kgs";
    hasSubUnit: 1;
    subUnit: SubUnit;
  };
}

export interface EnrichedStocksResponse
  extends Omit<StocksResponse, "items" | "createdBy"> {
  items: EnrichedItemStocks[];
  userDetails: {
    name: string;
  };
}
