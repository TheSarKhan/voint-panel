import { delay, http, withFallback } from "./client";
import type { RagDocument } from "./types";

export interface RagChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** Söhbətin növbəti addımı - köməkçinin cavabı. */
export function sendRagChatTurn(
  tenantId: string,
  history: RagChatTurn[],
): Promise<string> {
  return withFallback(
    async () => {
      const { data } = await http.post<{ reply: string }>(
        `/tenants/${tenantId}/rag/chat`,
        { history },
      );
      return data.reply;
    },
    async () => {
      await delay(400);
      return "Anladım. Başqa nə haqda deyə bilərsiniz - iş saatları, xidmətlər, qiymətlər?";
    },
  );
}

/** Bütün söhbəti oxuyub RAG sənədlərinə çevirir - bir dəfə, söhbət bitəndə çağırılır. */
export function finishRagChat(
  tenantId: string,
  history: RagChatTurn[],
): Promise<RagDocument[]> {
  return withFallback(
    async () => {
      const { data } = await http.post<RagDocument[]>(
        `/tenants/${tenantId}/rag/chat/finish`,
        { history },
      );
      return data;
    },
    async () => {
      await delay(600);
      return [];
    },
  );
}
