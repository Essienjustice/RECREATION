import { apiJson } from "./apiClient.js";

export function hasFootageApiKeys() {
  return true;
}

export async function searchStockFootage(query, page = 1) {
  const params = new URLSearchParams({
    query: String(query || ""),
    page: String(page)
  });

  return apiJson(`/api/footage?${params.toString()}`);
}
