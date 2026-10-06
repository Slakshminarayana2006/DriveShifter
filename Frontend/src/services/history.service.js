
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

const DEFAULT_LIMIT = 10;

// Get all transfer history
export const getTransferHistory = async () => {
  const response = await api.get("/api/transfer/history");
  return response.data;
};

// Get paginated history
export const getNextTransferHistory = async (page = 1, limit = DEFAULT_LIMIT) => {
  const response = await api.get("/api/transfer/history/next-page", {
    params: { page, limit },
  });

  return response.data;
};

// Search history
export const searchTransferHistory = async (
  search,
  page = 1,
  limit = DEFAULT_LIMIT
) => {
  const response = await api.get(
    "/api/transfer/history/next-page-by-search",
    {
      params: { search, page, limit },
    }
  );

  return response.data;
};

// Filter history by status
export const filterTransferHistory = async (
  status,
  page = 1,
  limit = DEFAULT_LIMIT,
  search = ""
) => {
  const response = await api.get(
    "/api/transfer/history/next-page-by-filter",
    {
      params: { status, page, limit, search },
    }
  );

  return response.data;
};
