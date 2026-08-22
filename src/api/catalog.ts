import { http } from "./client";

export type CatalogItemType = "SERVICE" | "PRODUCT" | "FOOD_DRINK" | "RENTAL";

export interface CatalogItem {
  id: string;
  tenantId: string;
  sku: string | null;
  name: string;
  category: string;
  itemType: CatalogItemType;
  price: number | null;
  priceDaily: number | null;
  priceMonthly: number | null;
  priceHourly: number | null;
  deposit: number | null;
  currency: string;
  unit: string;
  durationMinutes: number | null;
  inStock: boolean;
  stockQuantity: number;
  specs: string | null;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItemInput {
  sku?: string;
  name: string;
  category?: string;
  itemType?: CatalogItemType;
  price?: number | null;
  priceDaily?: number | null;
  priceMonthly?: number | null;
  priceHourly?: number | null;
  deposit?: number | null;
  currency?: string;
  unit?: string;
  durationMinutes?: number | null;
  inStock?: boolean;
  stockQuantity?: number;
  specs?: string;
  description?: string;
}

export async function getCatalogItems(tenantId: string): Promise<CatalogItem[]> {
  const { data } = await http.get<CatalogItem[]>(`/tenants/${tenantId}/catalog`);
  return data;
}

export async function createCatalogItem(tenantId: string, item: CatalogItemInput): Promise<CatalogItem> {
  const { data } = await http.post<CatalogItem>(`/tenants/${tenantId}/catalog`, item);
  return data;
}

export async function updateCatalogItem(
  tenantId: string,
  itemId: string,
  item: CatalogItemInput & { active?: boolean }
): Promise<CatalogItem> {
  const { data } = await http.put<CatalogItem>(`/tenants/${tenantId}/catalog/${itemId}`, item);
  return data;
}

export async function updateCatalogItemStock(
  tenantId: string,
  itemId: string,
  stock: { inStock?: boolean; stockQuantity?: number }
): Promise<CatalogItem> {
  const { data } = await http.patch<CatalogItem>(`/tenants/${tenantId}/catalog/${itemId}/stock`, stock);
  return data;
}

export async function deleteCatalogItem(tenantId: string, itemId: string): Promise<void> {
  await http.delete(`/tenants/${tenantId}/catalog/${itemId}`);
}

export async function uploadCatalogFile(tenantId: string, file: File): Promise<CatalogItem[]> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await http.post<CatalogItem[]>(`/tenants/${tenantId}/catalog/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
