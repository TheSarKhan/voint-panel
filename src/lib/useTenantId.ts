import { MOCK_TENANT_ID } from "../api/mockData";
import { useAuthStore } from "../store/auth";

/** Aktiv istifadəçinin tenant ID-si (mock rejimdə demo tenant). */
export function useTenantId(): string {
  const user = useAuthStore((s) => s.user);
  return user?.tenantId ?? MOCK_TENANT_ID;
}
