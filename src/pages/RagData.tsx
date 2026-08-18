import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createRagDocument,
  deleteRagDocument,
  deleteRagDocumentsBulk,
  findSimilarRagDocuments,
  getRagDocuments,
  setRagDocumentStatus,
  setRagDocumentsStatusBulk,
  updateRagDocument,
  uploadRagDocument,
} from "../api/rag";
import { createRagCategory, deleteRagCategory, listRagCategories, type RagCategory } from "../api/ragCategories";
import { getQuestions } from "../api/questions";
import type { RagDocument, UnansweredQuestion } from "../api/types";
import { RagChatModal } from "../components/RagChatModal";
import { UnansweredQuestions } from "../components/UnansweredQuestions";
import {
  IconChat,
  IconCheck,
  IconClose,
  IconDownload,
  IconEdit,
  IconLock,
  IconPlus,
  IconPrint,
  IconTrash,
} from "../components/icons";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  FileUpload,
  Modal,
  PageHeader,
  SearchInput,
  Select,
  Spinner,
  StatusText,
  Tabs,
  Textarea,
} from "../components/ui";
import { formatDate } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { useTenantStore } from "../store/tenant";
import { apiErrorText, isPendingApproval } from "../lib/apiError";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Backend kateqoriyani serbest metn kimi saxlayir - bu siyahi sadece sade, taniş bir secim
// vermek ucundur. Deyeri (value) her zaman ingiliscedir ki, kohne (seed) senedlerle uzlaşsin;
// istifadeciye yalniz Azerbaycanca etiket gorunur.
const CATEGORY_OPTIONS = [
  { value: "pricing", label: "Qiymətlər" },
  { value: "services", label: "Xidmətlər" },
  { value: "working-hours", label: "İş saatları" },
  { value: "delivery", label: "Çatdırılma" },
  { value: "deposit", label: "Depozit" },
  { value: "terms", label: "Şərtlər" },
  { value: "faq", label: "Tez-tez verilən suallar" },
];

const OTHER = "other";

interface FormState {
  category: string;
  customCategory: string;
  content: string;
}

const emptyForm: FormState = { category: "pricing", customCategory: "", content: "" };

function resolveCategory(form: FormState): string {
  return form.category === OTHER ? form.customCategory.trim() : form.category;
}

interface CategoryOption {
  value: string;
  label: string;
}

/** Sənədləri mövzuya görə qruplaşdırır: sabit siyahının sırası ilə, sonra qalanlar əlifba sırası ilə. */
function groupByCategory(list: RagDocument[], allCategories: CategoryOption[], categoryLabel: (v: string) => string) {
  const byCategory = new Map<string, RagDocument[]>();
  for (const d of list) {
    const key = d.category || "";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(d);
  }
  const known = allCategories.map((o) => o.value).filter((v) => byCategory.has(v));
  const rest = Array.from(byCategory.keys())
    .filter((k) => !known.includes(k))
    .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
  return [...known, ...rest].map((key) => ({ key, label: categoryLabel(key), docs: byCategory.get(key)! }));
}

export function RagDataPage() {
  const tenantId = useTenantId();
  const tenant = useTenantStore((s) => s.tenant);
  const [docs, setDocs] = useState<RagDocument[] | null>(null);
  const [categories, setCategories] = useState<RagCategory[]>([]);
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryBusy, setCategoryBusy] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [chatting, setChatting] = useState(false);
  const [viewing, setViewing] = useState<RagDocument | null>(null);
  const [editing, setEditing] = useState<RagDocument | "new" | null>(null);
  const [mode, setMode] = useState<"text" | "file">("text");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [pendingDuplicate, setPendingDuplicate] = useState<RagDocument | null>(null);

  // Sabit 7 mövzu + tenant-in özünün əlavə etdiyi başlıqlar - hamısı eyni siyahıda seçilə bilir.
  const allCategories = useMemo(
    () => [...CATEGORY_OPTIONS, ...categories.map((c) => ({ value: c.name, label: c.name }))],
    [categories],
  );
  const categoryLabel = useMemo(() => {
    const map = new Map(allCategories.map((o) => [o.value, o.label]));
    return (value: string) => map.get(value) || value || "Digər";
  }, [allCategories]);

  const loadDocs = () => getRagDocuments(tenantId).then(setDocs);

  useEffect(() => {
    loadDocs().catch(() => setError("Məlumatlar yüklənə bilmədi."));
    listRagCategories(tenantId)
      .then(setCategories)
      .catch(() => undefined);
    getQuestions(tenantId, "OPEN")
      .then(setQuestions)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  const handleQuestionChanged = (updated: UnansweredQuestion) => {
    setQuestions((prev) => prev.filter((q) => q.id !== updated.id));
    if (updated.status === "ANSWERED") {
      loadDocs().catch(() => undefined);
    }
  };

  const presentCategories = useMemo(() => new Set((docs ?? []).map((d) => d.category)), [docs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs ?? [];
    return (docs ?? []).filter(
      (d) => categoryLabel(d.category).toLowerCase().includes(q) || d.content.toLowerCase().includes(q),
    );
  }, [docs, query, categoryLabel]);

  const groups = useMemo(
    () => groupByCategory(filtered, allCategories, categoryLabel),
    [filtered, allCategories, categoryLabel],
  );

  // Axtarış nə olursa olsun - ixrac/çap HƏMİŞƏ bütün bilik bazasını əhatə edir, yalnız o an
  // görünəni yox, çünki "yedəkləmə" natamam görünüb sonra fərq edilməyən bir şey olmamalıdır.
  const exportGroups = useMemo(
    () => groupByCategory(docs ?? [], allCategories, categoryLabel),
    [docs, allCategories, categoryLabel],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkStatus = async (active: boolean) => {
    const ids = Array.from(selected);
    setBulkBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await setRagDocumentsStatusBulk(tenantId, ids, active);
      const byId = new Map(updated.map((d) => [d.id, d]));
      setDocs((prev) => (prev ? prev.map((d) => byId.get(d.id) ?? d) : prev));
      setSelected(new Set());
    } catch (e) {
      if (isPendingApproval(e)) {
        setNotice(apiErrorText(e, "Dəyişiklik təsdiq gözləyir."));
        setSelected(new Set());
      } else {
        setError(apiErrorText(e, "Dəyişdirilmədi."));
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`${selected.size} məlumat silinsin? Agent artıq onlardan istifadə etməyəcək.`)) return;
    const ids = Array.from(selected);
    setBulkBusy(true);
    setError(null);
    setNotice(null);
    try {
      await deleteRagDocumentsBulk(tenantId, ids);
      setDocs((prev) => (prev ? prev.filter((d) => !ids.includes(d.id)) : prev));
      setSelected(new Set());
    } catch (e) {
      if (isPendingApproval(e)) {
        setNotice(apiErrorText(e, "Silmə təsdiq gözləyir."));
        setSelected(new Set());
      } else {
        setError(apiErrorText(e, "Silinmədi."));
      }
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = () => {
    const lines = ["Bilik bazası", tenant?.name ?? "", formatDate(new Date().toISOString()), ""];
    for (const g of exportGroups) {
      lines.push(`## ${g.label}`);
      for (const d of g.docs) {
        lines.push(`- ${d.content}${d.active ? "" : " (deaktiv)"}`);
      }
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bilik-bazasi-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    // public/-dəki hazır loqo fayli - vərəq ağ olduğu üçün açıq fon üçün olan versiya.
    // Mütləq URL: aşağıdakı sənəd ayrıca bir blob: ünvanından yüklənir, nisbi yol onun öz
    // yerinə (deyil bu səhifənin) görə həll olunardı.
    const logoUrl = new URL("/Minimalist logo with wireless signal.png", window.location.origin).href;
    const body = exportGroups
      .map(
        (g) =>
          `<h2>${escapeHtml(g.label)}</h2><ul>${g.docs
            .map((d) => `<li>${escapeHtml(d.content)}${d.active ? "" : " <em>(deaktiv)</em>"}</li>`)
            .join("")}</ul>`,
      )
      .join("");
    const html = `<!doctype html><html><head><title>Bilik bazası</title><meta charset="utf-8">
      <style>
      /* Brauzerin öz çap başlığı/altlığı (səhifə adı, saat, URL) səhifə kənar boşluğunda
         çəkilir - kənar boşluğu 0 olanda Chrome-da göstərməyə yer qalmır. */
      @page{margin:0}
      body{font-family:sans-serif;padding:2rem;color:#111}
      img.logo{height:32px;display:block;margin-bottom:1.5rem}
      h2{font-size:1rem;margin-top:1.5rem}li{margin-bottom:.6rem;white-space:pre-wrap;line-height:1.5}
      </style></head><body>
      <img class="logo" src="${escapeHtml(logoUrl)}" alt="Voint" />
      ${body}</body></html>`;

    // window.open("", "_blank") + document.write buraxılıb: yeni pəncərənin ünvan çubuğu
    // HƏMİŞƏ "about:blank" göstərirdi (document.write naviqasiya sayılmır) - istifadəçiyə
    // "yönləndirmə boş səhifəyə gedir" kimi görünürdü. Əvəzinə həqiqi bir ünvana (blob:)
    // açırıq ki, pəncərə əsl məzmununu yükləsin.
    const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const win = window.open(blobUrl, "_blank");
    if (!win) {
      URL.revokeObjectURL(blobUrl);
      return;
    }
    win.addEventListener("load", () => {
      win.focus();
      win.print();
    });
    // Pəncərə bağlanana/çap edilənə qədər saxla - tez sildikdə şəkil (loqo) hələ
    // yüklənməmiş ola bilər.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  };

  const openNew = (presetCategory?: string) => {
    setForm({ ...emptyForm, category: presetCategory ?? "pricing" });
    setFile([]);
    setMode("text");
    setPendingDuplicate(null);
    setFormError(null);
    setEditing("new");
  };

  const openEdit = (doc: RagDocument) => {
    const known = allCategories.some((o) => o.value === doc.category);
    setForm({
      category: known ? doc.category : OTHER,
      customCategory: known ? "" : doc.category,
      content: doc.content,
    });
    setFormError(null);
    setPendingDuplicate(null);
    setViewing(null);
    setEditing(doc);
  };

  const performSave = async () => {
    const category = resolveCategory(form);
    setSaving(true);
    try {
      if (editing === "new") {
        const doc =
          mode === "file"
            ? await uploadRagDocument(tenantId, file[0], category || undefined)
            : await createRagDocument(tenantId, { content: form.content.trim(), category, source: "panel" });
        setDocs((prev) => (prev ? [doc, ...prev] : [doc]));
      } else if (editing) {
        const updated = await updateRagDocument(tenantId, editing.id, {
          content: form.content.trim(),
          category,
        });
        setDocs((prev) => (prev ? prev.map((d) => (d.id === updated.id ? updated : d)) : prev));
      }
      setEditing(null);
      setPendingDuplicate(null);
    } catch (e) {
      if (isPendingApproval(e)) {
        // Xəta deyil - dəyişiklik növbəyə düşüb, heç nə pozulmayıb. Formu qapadıb səhifə
        // səviyyəsində sakit bir bildiriş göstəririk ki, "səhv oldu, yenidən cəhd et" təəssüratı
        // yaranmasın.
        setEditing(null);
        setPendingDuplicate(null);
        setNotice(apiErrorText(e, "Dəyişiklik təsdiq gözləyir."));
      } else {
        setFormError(apiErrorText(e, "Yadda saxlanmadı."));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const category = resolveCategory(form);
    const usingFile = editing === "new" && mode === "file";
    if (!category) {
      setFormError("Mövzu seçin.");
      return;
    }
    if (usingFile && file.length === 0) {
      setFormError("Fayl seçin.");
      return;
    }
    if (!usingFile && !form.content.trim()) {
      setFormError("Məlumat boş ola bilməz.");
      return;
    }

    // Yalnız yeni, əl ilə yazılan mətn üçün - redaktədə (artıq mövcud sənədin özüdür) və fayldan
    // (mətn hələ bilinmir) yoxlamağın mənası yoxdur.
    if (editing === "new" && mode === "text" && !pendingDuplicate) {
      setCheckingDuplicate(true);
      try {
        const similar = await findSimilarRagDocuments(tenantId, form.content.trim());
        if (similar.length > 0) {
          setCheckingDuplicate(false);
          setPendingDuplicate(similar[0]);
          return;
        }
      } catch {
        // Yoxlama özü uğursuz olsa əlavə etməyi bloklamırıq - bu yalnız köməkçi bir xəbərdarlıqdır.
      }
      setCheckingDuplicate(false);
    }

    await performSave();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu məlumat silinsin? Agent artıq ondan istifadə etməyəcək.")) return;
    setActionBusy(id);
    setError(null);
    setNotice(null);
    try {
      await deleteRagDocument(tenantId, id);
      setDocs((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
      setViewing((v) => (v && v.id === id ? null : v));
    } catch (e) {
      if (isPendingApproval(e)) {
        setNotice(apiErrorText(e, "Silmə təsdiq gözləyir."));
      } else {
        setError(apiErrorText(e, "Silinmədi."));
      }
    } finally {
      setActionBusy(null);
    }
  };

  const handleToggleActive = async (doc: RagDocument) => {
    setActionBusy(doc.id);
    setError(null);
    setNotice(null);
    try {
      const updated = await setRagDocumentStatus(tenantId, doc.id, !doc.active);
      setDocs((prev) => (prev ? prev.map((d) => (d.id === updated.id ? updated : d)) : prev));
      setViewing((v) => (v && v.id === updated.id ? updated : v));
    } catch (e) {
      if (isPendingApproval(e)) {
        setNotice(apiErrorText(e, "Dəyişiklik təsdiq gözləyir."));
      } else {
        setError(apiErrorText(e, doc.active ? "Dayandırılmadı." : "Aktivləşdirilmədi."));
      }
    } finally {
      setActionBusy(null);
    }
  };

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCategoryBusy("new");
    setCategoryError(null);
    try {
      const cat = await createRagCategory(tenantId, name);
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategoryName("");
      setAddingCategory(false);
    } catch (e) {
      setCategoryError(apiErrorText(e, "Əlavə edilmədi."));
    } finally {
      setCategoryBusy(null);
    }
  };

  const handleDeleteCategory = async (cat: RagCategory) => {
    if (!window.confirm(`"${cat.name}" başlığı silinsin? Onun altındakı məlumatlar qalır, sadəcə başlıq siyahıdan çıxır.`))
      return;
    setCategoryBusy(cat.id);
    setCategoryError(null);
    try {
      await deleteRagCategory(tenantId, cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (e) {
      if (isPendingApproval(e)) {
        setNotice(apiErrorText(e, "Başlığın silinməsi təsdiq gözləyir."));
      } else {
        setCategoryError(apiErrorText(e, "Silinmədi."));
      }
    } finally {
      setCategoryBusy(null);
    }
  };

  if (error && !docs) return <p className="text-sm text-err">{error}</p>;
  if (!docs) return <Spinner />;

  const canSubmit =
    editing === "new"
      ? mode === "file"
        ? file.length > 0 && (form.category !== OTHER || form.customCategory.trim())
        : form.content.trim() && (form.category !== OTHER || form.customCategory.trim())
      : form.content.trim() && (form.category !== OTHER || form.customCategory.trim());

  return (
    <div>
      <PageHeader
        title="Bilik bazası"
        subtitle="Agentinizin bildiyi məlumatlar — qiymətlər, xidmətlər, iş saatları, tez-tez verilən suallar"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleExport} icon={IconDownload}>
              Yüklə
            </Button>
            <Button variant="ghost" onClick={handlePrint} icon={IconPrint}>
              Çap et
            </Button>
            <Button variant="secondary" onClick={() => setChatting(true)} icon={IconChat}>
              Söhbətlə doldur
            </Button>
            <Button onClick={() => openNew()} icon={IconPlus}>
              Yeni məlumat
            </Button>
          </div>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert tone="err">{error}</Alert>
        </div>
      )}

      {notice && (
        <div className="mb-4">
          <Alert tone="warn" onDismiss={() => setNotice(null)}>
            {notice}
          </Alert>
        </div>
      )}

      <UnansweredQuestions tenantId={tenantId} questions={questions} onChanged={handleQuestionChanged} />

      <Card className="mb-6 p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-muted">Tamamlanma</p>
        {categoryError && (
          <div className="mb-3">
            <Alert tone="err">{categoryError}</Alert>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_OPTIONS.map((opt) => {
            const done = presentCategories.has(opt.value);
            return done ? (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-fg-muted"
              >
                <IconCheck width={12} height={12} className="text-ok" />
                {opt.label}
              </span>
            ) : (
              <button
                key={opt.value}
                type="button"
                onClick={() => openNew(opt.value)}
                className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-fg-faint transition-colors hover:border-border-strong hover:text-fg"
              >
                {opt.label}
              </button>
            );
          })}

          {categories.map((cat) => {
            const done = presentCategories.has(cat.name);
            const busy = categoryBusy === cat.id;
            return (
              <span
                key={cat.id}
                className={
                  done
                    ? "inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-fg-muted"
                    : "inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1 text-xs text-fg-faint"
                }
              >
                {done && <IconCheck width={12} height={12} className="text-ok" />}
                {done ? (
                  cat.name
                ) : (
                  <button type="button" onClick={() => openNew(cat.name)} className="transition-colors hover:text-fg">
                    {cat.name}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDeleteCategory(cat)}
                  aria-label={`${cat.name} başlığını sil`}
                  className="rounded p-0.5 text-fg-faint transition-colors hover:text-err disabled:opacity-40"
                >
                  <IconClose width={11} height={11} />
                </button>
              </span>
            );
          })}

          {addingCategory ? (
            <form onSubmit={handleAddCategory} className="inline-flex items-center gap-1.5">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Başlığın adı"
                className="h-7 w-36 rounded-md border border-border bg-surface-2 px-2 text-xs text-fg outline-none focus-visible:border-border-strong"
              />
              <Button type="submit" size="sm" variant="ghost" loading={categoryBusy === "new"} disabled={!newCategoryName.trim()}>
                Əlavə et
              </Button>
              <button
                type="button"
                onClick={() => {
                  setAddingCategory(false);
                  setNewCategoryName("");
                }}
                aria-label="Ləğv et"
                className="rounded p-1 text-fg-faint transition-colors hover:text-fg"
              >
                <IconClose width={12} height={12} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border-strong px-2.5 py-1 text-xs text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
            >
              <IconPlus width={12} height={12} />
              Yeni başlıq
            </button>
          )}
        </div>
      </Card>

      {docs.length === 0 ? (
        <Card>
          <EmptyState
            title="Hələ məlumat yoxdur"
            message="Agent zəngə cavab verəndə bu bilikdən istifadə edir. Qiymətlər, iş saatları, tez-tez verilən suallar kimi məlumatları əlavə edin ki, agent düzgün cavab versin."
            action={
              <Button onClick={() => openNew()} icon={IconPlus}>
                Yeni məlumat
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Mövzu və ya məzmunda axtar…"
            className="mb-4 max-w-sm"
          />

          {selected.size > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border-strong bg-surface-2 px-4 py-2.5">
              <span className="text-sm text-fg">{selected.size} seçildi</span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" loading={bulkBusy} onClick={() => handleBulkStatus(false)}>
                  Dayandır
                </Button>
                <Button size="sm" variant="ghost" loading={bulkBusy} onClick={() => handleBulkStatus(true)}>
                  Aktivləşdir
                </Button>
                <Button size="sm" variant="danger" loading={bulkBusy} onClick={handleBulkDelete}>
                  Sil
                </Button>
                <Button size="sm" variant="ghost" disabled={bulkBusy} onClick={() => setSelected(new Set())}>
                  Ləğv et
                </Button>
              </div>
            </div>
          )}

          {groups.length === 0 ? (
            <Card>
              <EmptyState message="Axtarışa uyğun məlumat tapılmadı." />
            </Card>
          ) : (
            <div className="space-y-8">
              {groups.map((g) => (
                <div key={g.key || "digər"}>
                  <div className="mb-3 flex items-center gap-1.5">
                    <h2 className="text-sm font-semibold text-fg">{g.label}</h2>
                    {g.key && (
                      <button
                        type="button"
                        onClick={() => openNew(g.key)}
                        aria-label={`${g.label} mövzusuna yeni məlumat əlavə et`}
                        className="rounded p-0.5 text-fg-faint transition-colors hover:text-fg"
                      >
                        <IconPlus width={13} height={13} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {g.docs.map((doc) => (
                      <Card
                        key={doc.id}
                        className={`flex h-64 flex-col p-5 ${doc.active ? "" : "opacity-60"} ${
                          selected.has(doc.id) ? "border-fg-muted" : ""
                        }`}
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <input
                            type="checkbox"
                            checked={selected.has(doc.id)}
                            onChange={() => toggleSelect(doc.id)}
                            aria-label="Seç"
                            className="h-3.5 w-3.5 accent-accent"
                          />
                          {!doc.active && <StatusText tone="neutral">Deaktiv</StatusText>}
                        </div>
                        {/* line-clamp elementin OZUNUN flex-item olmasi Chrome-da bloklanir (display:-webkit-box
                            flex-item hesablamasi ile toqquşur, kesme sessizce isləmir) - buna gore flex-1
                            ayrı bir sarğı div-dedir, kesilen <p> ozu adi block kimi qalir. */}
                        <div className="flex-1 overflow-hidden">
                          <p className="line-clamp-5 text-sm leading-relaxed text-fg">{doc.content}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-fg-faint">
                            {formatDate(doc.createdAt)}
                            {doc.hitCount > 0 ? ` · ${doc.hitCount} dəfə istifadə olunub` : " · istifadə olunmayıb"}
                          </p>
                          <Button size="sm" variant="ghost" onClick={() => setViewing(doc)}>
                            Bax
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {chatting && (
        <RagChatModal
          tenantId={tenantId}
          onClose={() => setChatting(false)}
          onSaved={(docs) => {
            if (docs.length > 0) {
              setDocs((prev) => (prev ? [...docs, ...prev] : docs));
            }
          }}
        />
      )}

      {viewing && (
        <Modal title={categoryLabel(viewing.category)} onClose={() => setViewing(null)} size="lg">
          <div className="space-y-4">
            {!viewing.active && <StatusText tone="neutral">Bu məlumat hazırda dayandırılıb — agent istifadə etmir.</StatusText>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{viewing.content}</p>
            <p className="text-xs text-fg-faint">
              Əlavə edilib: {formatDate(viewing.createdAt)}
              <br />
              {viewing.hitCount > 0
                ? `${viewing.hitCount} dəfə istifadə olunub, son dəfə: ${
                    viewing.lastUsedAt ? formatDate(viewing.lastUsedAt) : "—"
                  }`
                : "Hələ real zənglərdə istifadə olunmayıb."}
            </p>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button
                variant="ghost"
                icon={viewing.active ? IconLock : IconCheck}
                loading={actionBusy === viewing.id}
                onClick={() => handleToggleActive(viewing)}
              >
                {viewing.active ? "Dayandır" : "Aktivləşdir"}
              </Button>
              <Button variant="secondary" icon={IconEdit} onClick={() => openEdit(viewing)}>
                Redaktə et
              </Button>
              <Button
                variant="danger"
                icon={IconTrash}
                loading={actionBusy === viewing.id}
                onClick={() => handleDelete(viewing.id)}
              >
                Sil
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editing !== null && (
        <Modal title={editing === "new" ? "Yeni məlumat" : "Məlumatı redaktə et"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <Alert tone="err">{formError}</Alert>}

            {editing === "new" && (
              <Tabs
                items={[
                  { value: "text", label: "Mətn yaz" },
                  { value: "file", label: "Fayl yüklə" },
                ]}
                value={mode}
                onChange={(v) => setMode(v as "text" | "file")}
                className="mb-1"
              />
            )}

            <Select
              label="Mövzu"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={[...allCategories, { value: OTHER, label: "Digər (birdəfəlik)" }]}
            />
            {form.category === OTHER && (
              <input
                required
                placeholder="Məs.: Zəmanət şərtləri"
                value={form.customCategory}
                onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
                className="block w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus-visible:border-border-strong"
              />
            )}

            {editing === "new" && mode === "file" ? (
              <FileUpload
                files={file}
                onChange={setFile}
                multiple={false}
                accept=".txt,.docx,.pdf"
                maxSizeMb={10}
                help="Faylın mətni avtomatik çıxarılır. Sonra istəsəniz redaktə edə bilərsiniz."
              />
            ) : (
              <Textarea
                label="Məlumat"
                required
                rows={6}
                placeholder="Məs.: Diş təmizliyi 60 AZN, plomb 40-80 AZN. Sığorta qəbul olunmur."
                value={form.content}
                onChange={(e) => {
                  setForm({ ...form, content: e.target.value });
                  setPendingDuplicate(null);
                }}
              />
            )}

            {pendingDuplicate && (
              <Alert tone="warn">
                <p>
                  Bu, artıq mövcud olan bir məlumata bənzəyir ({categoryLabel(pendingDuplicate.category)}):
                </p>
                <p className="mt-1.5 line-clamp-3 text-fg">{pendingDuplicate.content}</p>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {pendingDuplicate ? (
                <>
                  <Button type="button" variant="ghost" onClick={() => setPendingDuplicate(null)}>
                    Fərqli yazım
                  </Button>
                  <Button type="button" loading={saving} onClick={performSave}>
                    Yenə də əlavə et
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                    Ləğv et
                  </Button>
                  <Button type="submit" loading={saving || checkingDuplicate} disabled={!canSubmit}>
                    {checkingDuplicate ? "Yoxlanılır…" : editing === "new" ? "Əlavə et" : "Yadda saxla"}
                  </Button>
                </>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
