import { delay, http, withFallback } from "./client";

export interface TelegramChat {
  id: string;
  label: string | null;
  linkedAt: string;
}

const MOCK_CHATS: TelegramChat[] = [
  { id: "mock-1", label: "Sahib", linkedAt: new Date().toISOString() },
];

/** 15 dəqiqə etibarlı bir dəfəlik t.me linki - açılıb /start basılanda bu tenant-a bağlanır. */
export function createTelegramLink(tenantId: string): Promise<string> {
  return withFallback(
    async () => {
      const { data } = await http.post<{ deepLink: string }>(`/tenants/${tenantId}/telegram/link`);
      return data.deepLink;
    },
    async () => {
      await delay();
      return "https://t.me/voint_bot?start=demo";
    },
  );
}

export function listTelegramChats(tenantId: string): Promise<TelegramChat[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<TelegramChat[]>(`/tenants/${tenantId}/telegram/chats`);
      return data;
    },
    async () => {
      await delay();
      return MOCK_CHATS;
    },
  );
}

export function deleteTelegramChat(tenantId: string, chatId: string): Promise<void> {
  return withFallback(
    async () => {
      await http.delete(`/tenants/${tenantId}/telegram/chats/${chatId}`);
    },
    async () => {
      await delay();
    },
  );
}
