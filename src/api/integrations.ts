import { http } from "./client";

export interface ApiKeyItem {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  permissions: string;
  lastUsedAt: string | null;
  createdAt: string;
  active: boolean;
}

export interface ApiKeyCreatedResult {
  id: string;
  name: string;
  rawApiKey: string;
  keyPrefix: string;
  permissions: string;
  createdAt: string;
}

export interface WebhookConfig {
  id: string;
  tenantId: string;
  url: string;
  secret: string | null;
  eventTypes: string;
  active: boolean;
  createdAt: string;
}

export async function listApiKeys(tenantId: string): Promise<ApiKeyItem[]> {
  const { data } = await http.get<ApiKeyItem[]>(`/tenants/${tenantId}/integrations/keys`);
  return data;
}

export async function createApiKey(
  tenantId: string,
  input: { name: string; permissions?: string }
): Promise<ApiKeyCreatedResult> {
  const { data } = await http.post<ApiKeyCreatedResult>(`/tenants/${tenantId}/integrations/keys`, input);
  return data;
}

export async function revokeApiKey(tenantId: string, keyId: string): Promise<void> {
  await http.delete(`/tenants/${tenantId}/integrations/keys/${keyId}`);
}

export async function getWebhook(tenantId: string): Promise<WebhookConfig | null> {
  const { data } = await http.get<WebhookConfig | null>(`/tenants/${tenantId}/integrations/webhook`);
  return data;
}

export async function updateWebhook(
  tenantId: string,
  input: { url: string; secret?: string; eventTypes?: string; active?: boolean }
): Promise<WebhookConfig> {
  const { data } = await http.put<WebhookConfig>(`/tenants/${tenantId}/integrations/webhook`, input);
  return data;
}
