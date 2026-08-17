import { delay, http, withFallback } from "./client";

export interface TelegramChat {
  id: string;
  label: string | null;
  linkedAt: string;
}

const MOCK_CHATS: TelegramChat[] = [
  { id: "mock-1", label: "Sahib", linkedAt: new Date().toISOString() },
];

export interface TelegramLinks {
  /** Şəxsi söhbət açır. */
  deepLink: string;
  /** Qrup seçim ekranı açır - bot seçilən qrupa əlavə olunur. */
  groupDeepLink: string;
}

/**
 * 15 dəqiqə etibarlı bir dəfəlik token - iki linkin hər ikisi eyni tokenə bağlıdır, hansı
 * ƏVVƏL açılsa o işləyir (tək istifadəlikdir), o birini bir də açmaq "keçərsizdir" deyəcək.
 */
export function createTelegramLink(tenantId: string): Promise<TelegramLinks> {
  return withFallback(
    async () => {
      const { data } = await http.post<TelegramLinks>(`/tenants/${tenantId}/telegram/link`);
      return data;
    },
    async () => {
      await delay();
      return {
        deepLink: "https://t.me/voint_bot?start=demo",
        groupDeepLink: "https://t.me/voint_bot?startgroup=demo",
      };
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
