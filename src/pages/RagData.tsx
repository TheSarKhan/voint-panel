import { useEffect, useState, type FormEvent } from "react";
import { createRagDocument, deleteRagDocument, getRagDocuments } from "../api/rag";
import type { RagDocument } from "../api/types";
import { IconPlus, IconTrash } from "../components/icons";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  Card,
  EmptyState,
  Field,
  inputCls,
  Modal,
  PageHeader,
  Spinner,
  StatusText,
} from "../components/ui";
import { formatDateTime } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

interface FormState {
  category: string;
  content: string;
}

const emptyForm: FormState = { category: "", content: "" };

export function RagDataPage() {
  const tenantId = useTenantId();
  const [docs, setDocs] = useState<RagDocument[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRagDocuments(tenantId)
      .then((res) => {
        if (!cancelled) setDocs(res);
      })
      .catch(() => {
        if (!cancelled) setError("Sənədlər yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const doc = await createRagDocument(tenantId, {
        category: form.category.trim(),
        content: form.content.trim(),
        source: "panel",
      });
      setDocs((prev) => (prev ? [doc, ...prev] : [doc]));
      setAdding(false);
      setForm(emptyForm);
    } catch {
      setError("Sənəd əlavə edilə bilmədi.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteRagDocument(tenantId, id);
      setDocs((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
    } catch {
      setError("Sənəd silinə bilmədi.");
    } finally {
      setDeletingId(null);
    }
  };

  if (error && !docs) return <p className="text-sm text-err">{error}</p>;
  if (!docs) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="RAG Data"
        subtitle="Agentin istifadə etdiyi biznes məlumatları — qiymətlər, xidmətlər, FAQ, iş saatları"
        actions={
          <button onClick={() => setAdding(true)} className={btnPrimary}>
            <IconPlus width={14} height={14} />
            Yeni sənəd
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-err">{error}</p>}

      {docs.length === 0 ? (
        <Card>
          <EmptyState message="Hələ məlumat əlavə edilməyib. Agentin düzgün cavab verməsi üçün biznes məlumatlarınızı əlavə edin." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <Card key={doc.id} className="flex flex-col p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <StatusText>{doc.category || "digər"}</StatusText>
                  <p className="mt-1 text-[11px] text-fg-faint">
                    Yaradılıb: {formatDateTime(doc.createdAt)}
                  </p>
                </div>
              </div>
              <pre className="mb-4 flex-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-fg-muted">
                {doc.content}
              </pre>
              <div className="flex justify-end">
                <button
                  disabled={deletingId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                  className={btnDanger}
                >
                  <IconTrash width={14} height={14} />
                  Sil
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {adding && (
        <Modal title="Yeni sənəd" onClose={() => setAdding(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Kateqoriya">
              <input
                required
                className={inputCls}
                placeholder="Məs.: pricing, working-hours, delivery, faq"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </Field>
            <Field label="Məzmun">
              <textarea
                required
                rows={6}
                className={inputCls}
                placeholder="Agentin biləcəyi məlumatı bura yazın…"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className={btnGhost}
              >
                Ləğv et
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saxlanılır…" : "Əlavə et"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
