import { http } from "./client";

export interface PermissionCatalog {
  resources: { value: string; label: string }[];
  actions: { value: string; label: string }[];
}

export interface RoleDetail {
  id: string;
  tenantId: string | null;
  /** Departamentə aid deyilsə null — siyahıda "Departamentsiz" başlığı altında görünür. */
  departmentId: string | null;
  departmentName: string | null;
  name: string;
  description: string | null;
  template: boolean;
  /** Sistem rolu (Sahib): adı dəyişdirilə bilər, silinə bilməz. */
  system: boolean;
  userCount: number;
  /** resurs -> icazə verilmiş əməliyyatlar. Sətir yoxdursa = icazə yoxdur. */
  permissions: Record<string, string[]>;
}

export interface RoleUpsert {
  name: string;
  description?: string;
  departmentId?: string | null;
  permissions: Record<string, string[]>;
}

export async function getCatalog(tenantId: string): Promise<PermissionCatalog> {
  const { data } = await http.get<PermissionCatalog>(
    `/tenants/${tenantId}/roles/permissions/catalog`,
  );
  return data;
}

export async function listRoles(tenantId: string): Promise<RoleDetail[]> {
  const { data } = await http.get<RoleDetail[]>(`/tenants/${tenantId}/roles`);
  return data;
}

/** Platform şablonları — bu müəssisə bunlardan öz rolunu köçürə bilər. */
export async function listRoleTemplates(tenantId: string): Promise<RoleDetail[]> {
  const { data } = await http.get<RoleDetail[]>(`/tenants/${tenantId}/roles/templates`);
  return data;
}

export async function createRole(tenantId: string, input: RoleUpsert): Promise<RoleDetail> {
  const { data } = await http.post<RoleDetail>(`/tenants/${tenantId}/roles`, input);
  return data;
}

export async function updateRole(
  tenantId: string,
  roleId: string,
  input: RoleUpsert,
): Promise<RoleDetail> {
  const { data } = await http.put<RoleDetail>(`/tenants/${tenantId}/roles/${roleId}`, input);
  return data;
}

export async function deleteRole(tenantId: string, roleId: string): Promise<void> {
  await http.delete(`/tenants/${tenantId}/roles/${roleId}`);
}

/** Ad toqquşması xəta vermir - backend avtomatik "Operator 2" kimi adlandırır. */
export async function copyRoleFromTemplate(
  tenantId: string,
  templateId: string,
  departmentId?: string | null,
): Promise<RoleDetail> {
  const { data } = await http.post<RoleDetail>(
    `/tenants/${tenantId}/roles/${templateId}/copy-from-template`,
    null,
    { params: departmentId ? { departmentId } : undefined },
  );
  return data;
}
