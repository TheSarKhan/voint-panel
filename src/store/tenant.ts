import { create } from "zustand";
import type { Tenant } from "../api/types";
import { getTenant } from "../api/tenants";

interface TenantState {
  tenant: Tenant | null;
  loading: boolean;
  loadTenant: (tenantId: string) => Promise<void>;
  setTenant: (tenant: Tenant) => void;
  clear: () => void;
}

export const useTenantStore = create<TenantState>()((set) => ({
  tenant: null,
  loading: false,
  loadTenant: async (tenantId) => {
    set({ loading: true });
    try {
      const tenant = await getTenant(tenantId);
      set({ tenant });
    } finally {
      set({ loading: false });
    }
  },
  setTenant: (tenant) => set({ tenant }),
  clear: () => set({ tenant: null }),
}));
