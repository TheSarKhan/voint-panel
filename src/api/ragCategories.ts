import { http, withFallback, delay } from "./client";

/** Tenant-in bilik bazasına özü əlavə etdiyi başlıq - sabit mövzu siyahısından savayı. */
export interface RagCategory {
  id: string;
  name: string;
}

// Real backend yoxdursa (mock rejim) ekranı boş qoymamaq üçün yaddaşda saxlanılan siyahı.
const mockCategories: RagCategory[] = [];

export function listRagCategories(tenantId: string): Promise<RagCategory[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<RagCategory[]>(`/tenants/${tenantId}/rag/categories`);
      return data;
    },
    async () => {
      await delay(150);
      return [...mockCategories];
    },
  );
}

export function createRagCategory(tenantId: string, name: string): Promise<RagCategory> {
  return withFallback(
    async () => {
      const { data } = await http.post<RagCategory>(`/tenants/${tenantId}/rag/categories`, { name });
      return data;
    },
    async () => {
      await delay(200);
      const category: RagCategory = { id: `cat-${Date.now()}`, name };
      mockCategories.push(category);
      return category;
    },
  );
}

export function deleteRagCategory(tenantId: string, categoryId: string): Promise<void> {
  return withFallback(
    async () => {
      await http.delete(`/tenants/${tenantId}/rag/categories/${categoryId}`);
    },
    async () => {
      await delay(150);
      const index = mockCategories.findIndex((c) => c.id === categoryId);
      if (index >= 0) mockCategories.splice(index, 1);
    },
  );
}
