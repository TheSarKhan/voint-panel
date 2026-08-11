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
        active: true,
        hitCount: 0,
        lastUsedAt: null,
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

export function updateRagDocument(
  tenantId: string,
  docId: string,
  input: { content: string; category?: string },
): Promise<RagDocument> {
  return withFallback(
    async () => {
      const { data } = await http.put<RagDocument>(
        `/tenants/${tenantId}/rag/documents/${docId}`,
        input,
      );
      return data;
    },
    async () => {
      await delay(300);
      const doc = mockRagDocuments.find((d) => d.id === docId);
      if (!doc) throw new Error("Məlumat tapılmadı");
      Object.assign(doc, input);
      return doc;
    },
  );
}

/** Fayldan (.txt/.docx/.pdf) mətn çıxarır və bilik bazasına sənəd kimi əlavə edir. */
export function uploadRagDocument(
  tenantId: string,
  file: File,
  category?: string,
): Promise<RagDocument> {
  const body = new FormData();
  body.append("file", file);
  if (category) body.append("category", category);
  return withFallback(
    async () => {
      const { data } = await http.post<RagDocument>(
        `/tenants/${tenantId}/rag/documents/upload`,
        body,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    async () => {
      await delay(400);
      const doc: RagDocument = {
        id: `rag-${Date.now()}`,
        category: category ?? "",
        content: `[mock] ${file.name} faylından çıxarılan mətn`,
        source: file.name,
        active: true,
        hitCount: 0,
        lastUsedAt: null,
        createdAt: new Date().toISOString(),
      };
      mockRagDocuments.unshift(doc);
      return doc;
    },
  );
}

/** Sənədi dayandırır/aktivləşdirir - dayandırılan sənəddən agent artıq istifadə etmir. */
export function setRagDocumentStatus(
  tenantId: string,
  docId: string,
  active: boolean,
): Promise<RagDocument> {
  return withFallback(
    async () => {
      const { data } = await http.put<RagDocument>(
        `/tenants/${tenantId}/rag/documents/${docId}/status`,
        { active },
      );
      return data;
    },
    async () => {
      await delay(200);
      const doc = mockRagDocuments.find((d) => d.id === docId);
      if (!doc) throw new Error("Məlumat tapılmadı");
      doc.active = active;
      return doc;
    },
  );
}

/** Bir neçə sənədi birdən dayandırır/aktivləşdirir - tək təsdiq sorğusu, hər biri üçün ayrı deyil. */
export function setRagDocumentsStatusBulk(
  tenantId: string,
  ids: string[],
  active: boolean,
): Promise<RagDocument[]> {
  return withFallback(
    async () => {
      const { data } = await http.put<RagDocument[]>(
        `/tenants/${tenantId}/rag/documents/bulk-status`,
        { ids, active },
      );
      return data;
    },
    async () => {
      await delay(300);
      const changed: RagDocument[] = [];
      for (const doc of mockRagDocuments) {
        if (ids.includes(doc.id)) {
          doc.active = active;
          changed.push(doc);
        }
      }
      return changed;
    },
  );
}

export function deleteRagDocumentsBulk(tenantId: string, ids: string[]): Promise<void> {
  return withFallback(
    async () => {
      await http.delete(`/tenants/${tenantId}/rag/documents/bulk`, { data: { ids } });
    },
    async () => {
      await delay(300);
      for (const id of ids) {
        const index = mockRagDocuments.findIndex((d) => d.id === id);
        if (index >= 0) mockRagDocuments.splice(index, 1);
      }
    },
  );
}

/** Bu mətnə ən yaxın olan mövcud sənəd(lər) - eyni faktın iki dəfə yazılıb-yazılmadığını yoxlamaq üçün. */
export function findSimilarRagDocuments(tenantId: string, content: string): Promise<RagDocument[]> {
  return withFallback(
    async () => {
      const { data } = await http.post<RagDocument[]>(`/tenants/${tenantId}/rag/documents/similar`, {
        content,
      });
      return data;
    },
    async () => {
      await delay(200);
      return [];
    },
  );
}
