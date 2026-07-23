import { delay, http, withFallback } from "./client";
import { mockRagDocuments } from "./mockData";
import type { RagDocument, RagDocumentInput } from "./types";

export function getRagDocuments(tenantId: string): Promise<RagDocument[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<RagDocument[]>(
        `/tenants/${tenantId}/rag/documents`,
      );
      return data;
    },
    async () => {
      await delay();
      return [...mockRagDocuments];
    },
  );
}

export function createRagDocument(
  tenantId: string,
  input: RagDocumentInput,
): Promise<RagDocument> {
  return withFallback(
    async () => {
      const { data } = await http.post<RagDocument>(
        `/tenants/${tenantId}/rag/documents`,
        input,
      );
      return data;
    },
    async () => {
      await delay(300);
      const doc: RagDocument = {
        id: `rag-${Date.now()}`,
        ...input,
        createdAt: new Date().toISOString(),
      };
      mockRagDocuments.unshift(doc);
      return doc;
    },
  );
}

export function deleteRagDocument(
  tenantId: string,
  docId: string,
): Promise<void> {
  return withFallback(
    async () => {
      await http.delete(`/tenants/${tenantId}/rag/documents/${docId}`);
    },
    async () => {
      await delay(250);
      const index = mockRagDocuments.findIndex((d) => d.id === docId);
      if (index >= 0) mockRagDocuments.splice(index, 1);
    },
  );
}
