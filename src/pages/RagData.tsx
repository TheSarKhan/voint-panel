import { useEffect, useState, type FormEvent } from "react";
import { createRagDocument, deleteRagDocument, getRagDocuments } from "../api/rag";
import type { RagDocType, RagDocument } from "../api/types";
import { IconPlus, IconTrash } from "../components/icons";
import {
  Badge,
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
} from "../components/ui";
import { formatDateTime } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";

const typeLabels: Record<RagDocType, string> = {
  PRICE: "Qiymətlər",
  SERVICE: "Xidmətlər",
  FAQ: "FAQ",
  HOURS: "İş saatları",
  OTHER: "Digər",
};

interface FormState {
  type: RagDocType;
  title: string;
  content: string;
}

const emptyForm: FormState = { type: "OTHER", title: "", content: "" };

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
        type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
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
                  <h3 className="text-sm font-semibold text-fg">{doc.title}</h3>
                  <p className="mt-0.5 text-[11px] text-fg-faint">
                    Yenilənib: {formatDateTime(doc.updatedAt)}
                  </p>
                </div>
                <Badge>{typeLabels[doc.type]}</Badge>
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
            <Field label="Növ">
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as RagDocType })
                }
              >
                {Object.entries(typeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Başlıq">
              <input
                required
                className={inputCls}
                placeholder="Məs.: Qiymət cədvəli"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
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
