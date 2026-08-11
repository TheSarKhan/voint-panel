import { http } from "./client";
import type { RoleDetail } from "./roles";

export interface Department {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  /** Neçə rol bu departamentə aiddir. Departament silinsə, rollar qalır — sadəcə qruplaşmır. */
  roleCount: number;
}

export interface DepartmentUpsert {
  name: string;
  description?: string;
}

export async function listDepartments(tenantId: string): Promise<Department[]> {
  const { data } = await http.get<Department[]>(`/tenants/${tenantId}/departments`);
  return data;
}

/** Platform departament şablonları — köçürmək üçün göz atmaq. */
export async function listDepartmentTemplates(tenantId: string): Promise<Department[]> {
  const { data } = await http.get<Department[]>(`/tenants/${tenantId}/departments/templates`);
  return data;
}

export async function createDepartment(
  tenantId: string,
  input: DepartmentUpsert,
): Promise<Department> {
  const { data } = await http.post<Department>(`/tenants/${tenantId}/departments`, input);
  return data;
}

export async function updateDepartment(
  tenantId: string,
  id: string,
  input: DepartmentUpsert,
): Promise<Department> {
  const { data } = await http.put<Department>(`/tenants/${tenantId}/departments/${id}`, input);
  return data;
}

export async function deleteDepartment(tenantId: string, id: string): Promise<void> {
  await http.delete(`/tenants/${tenantId}/departments/${id}`);
}

/** Bir (öz və ya şablon) departamentin rolları — köçürmədən əvvəlki seçim siyahısı üçün. */
export async function getDepartmentRoles(
  tenantId: string,
  departmentId: string,
): Promise<RoleDetail[]> {
  const { data } = await http.get<RoleDetail[]>(
    `/tenants/${tenantId}/departments/${departmentId}/roles`,
  );
  return data;
}

export interface DepartmentCopyResult {
  department: Department;
  copiedRoles: RoleDetail[];
}

/**
 * Şablon departamenti (və seçilən rolları) bu müəssisəyə köçürür. roleIds verilməsə hamısı
 * köçürülür. Ad toqquşması xəta vermir — backend avtomatik "Operator 2" kimi adlandırır.
 */
export async function copyDepartmentFromTemplate(
  tenantId: string,
  departmentId: string,
  roleIds?: string[],
): Promise<DepartmentCopyResult> {
  const { data } = await http.post<DepartmentCopyResult>(
    `/tenants/${tenantId}/departments/${departmentId}/copy-from-template`,
    roleIds ? { roleIds } : undefined,
  );
  return data;
}
