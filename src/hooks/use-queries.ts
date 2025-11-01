import { useQuery } from "@tanstack/react-query";
import {
  CategoriesResponse,
  EnrichedBillsResponse,
  EnrichedProductsResponse,
  EnrichedStocksResponse,
  PartyDetailsResponse,
  ProductsResponse,
  UsersResponse,
} from "@/@types/server/response";

interface PartyDetailsProps {
  limit: number;
  offset: number;
  search?: string;
}

interface ProductsProps extends PartyDetailsProps {
  categoryId?: string;
  stockFilter?: string;
}

interface BillsProps extends PartyDetailsProps {
  startDate?: string;
  endDate?: string;
  type: "invoices" | "proforma-invoices";
}

interface BillProps {
  type: "invoices" | "proforma-invoices";
  id: string;
}

interface StocksProps {
  limit: number;
  offset: number;
  type?: "IN" | "OUT" | "ADJUSTMENT";
  startDate?: string;
  endDate: string;
}

export const usePartyDetailsData = ({
  limit,
  offset,
  search,
}: PartyDetailsProps) => {
  return useQuery<{ parties: PartyDetailsResponse[]; count: number }>({
    queryKey: ["parties", limit, offset, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/party-details?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoriesData = ({
  limit,
  offset,
  search,
}: PartyDetailsProps) => {
  return useQuery<{ categories: CategoriesResponse[]; count: number }>({
    queryKey: ["categories", limit, offset, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/categories?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCategoryData = ({ id }: { id: string }) => {
  return useQuery<{ category: CategoriesResponse }>({
    queryKey: ["category", id],
    queryFn: async () => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductsData = ({
  limit,
  offset,
  search,
  categoryId,
  stockFilter,
}: ProductsProps) => {
  return useQuery<{ products: EnrichedProductsResponse[]; count: number }>({
    queryKey: ["products", limit, offset, search, categoryId, stockFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append("search", search);

      if (categoryId) params.append("categoryId", categoryId);

      if (stockFilter) params.append("stockFilter", stockFilter);

      const response = await fetch(`/api/products?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useBillsData = ({
  limit,
  offset,
  search,
  startDate,
  endDate,
  type,
}: BillsProps) => {
  return useQuery<{ bills: EnrichedBillsResponse[]; count: number }>({
    queryKey: [type, limit, offset, search, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append("search", search);

      if (startDate) params.append("startDate", startDate);

      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/bills/${type}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useBillData = ({ type, id }: BillProps) => {
  return useQuery<EnrichedBillsResponse>({
    queryKey: [type, id],
    queryFn: async () => {
      const response = await fetch(`/api/bills/${type}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUsersData = ({ limit, offset, search }: ProductsProps) => {
  return useQuery<{ users: UsersResponse[]; count: number }>({
    queryKey: ["users", limit, offset, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append("search", search);

      const response = await fetch(`/api/users?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useStocksData = ({
  limit,
  offset,
  type,
  startDate,
  endDate,
}: StocksProps) => {
  return useQuery<{ stocks: EnrichedStocksResponse[]; count: number }>({
    queryKey: ["stocks", limit, offset, type, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (type) params.append("type", type);

      if (startDate) params.append("startDate", startDate);

      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/stocks?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useStockData = ({ id }: { id: string }) => {
  return useQuery<EnrichedStocksResponse>({
    queryKey: [id],
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLowStockProducts = () => {
  return useQuery<ProductsResponse[]>({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const response = await fetch("/api/products/low-stock", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return data.products || [];
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    staleTime: 5 * 60 * 1000,
  });
};
