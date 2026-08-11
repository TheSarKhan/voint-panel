import { http } from "./client";

export interface PanelUser {
  id: string;
  tenantId: string;
  email: string;
  fullName: string | null;
  roleId: string;
  roleName: string | null;
  status: "ACTIVE" | "BLOCKED";
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PanelUserCreated {
  user: PanelUser;
  password: string;
  emailed: boolean;
}

export interface AssignableRole {
  id: string;
  name: string;
  description: string;
}

export async function listUsers(tenantId: string): Promise<PanelUser[]> {
  const { data } = await http.get<PanelUser[]>(`/tenants/${tenantId}/users`);
  return data;
}

export async function listAssignableRoles(tenantId: string): Promise<AssignableRole[]> {
  const { data } = await http.get<AssignableRole[]>(`/tenants/${tenantId}/users/assignable-roles`);
  return data;
}

export async function createUser(
  tenantId: string,
  input: { email: string; fullName?: string; roleId: string },
): Promise<PanelUserCreated> {
  const { data } = await http.post<PanelUserCreated>(`/tenants/${tenantId}/users`, input);
  return data;
}

export async function updateUser(
  tenantId: string,
  userId: string,
  input: { email: string; fullName?: string },
): Promise<PanelUser> {
  const { data } = await http.put<PanelUser>(`/tenants/${tenantId}/users/${userId}`, input);
  return data;
}

export async function resetPassword(tenantId: string, userId: string): Promise<PanelUserCreated> {
  const { data } = await http.post<PanelUserCreated>(
    `/tenants/${tenantId}/users/${userId}/reset-password`,
  );
  return data;
}

export async function setUserStatus(
  tenantId: string,
  userId: string,
  status: "ACTIVE" | "BLOCKED",
): Promise<PanelUser> {
  const { data } = await http.put<PanelUser>(`/tenants/${tenantId}/users/${userId}/status`, {
    status,
  });
  return data;
}

export async function changeUserRole(
  tenantId: string,
  userId: string,
  roleId: string,
): Promise<PanelUser> {
  const { data } = await http.put<PanelUser>(`/tenants/${tenantId}/users/${userId}/role`, {
    roleId,
  });
  return data;
}

export async function deleteUser(tenantId: string, userId: string): Promise<void> {
  await http.delete(`/tenants/${tenantId}/users/${userId}`);
}
