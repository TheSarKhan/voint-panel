import { useEffect, useState, useMemo, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Users,
  UserPlus,
  Edit2,
  Search,
  Clock,
} from "lucide-react";
import { createCustomer, getCustomers, updateCustomer } from "../api/customers";
import { getCalls } from "../api/calls";
import type { CallSummary, Customer } from "../api/types";
import {
  GlassButton,
  GlassCard,
  StatusText,
} from "../components/kit";
import { formatDateTime, formatDuration } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

interface FormState {
  phone: string;
  name: string;
  note: string;
}

const emptyForm: FormState = { phone: "", name: "", note: "" };

const callStatusLabels: Record<CallSummary["status"], { label: string; variant: "ok" | "warn" | "muted" }> = {
  RESOLVED: { label: "Həll olundu", variant: "ok" },
  HANDOFF: { label: "Operatora yönləndirildi", variant: "warn" },
  ONGOING: { label: "Davam edir", variant: "muted" },
};

export function CustomersPage() {
  const tenantId = useTenantId();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCustomers(tenantId), getCalls(tenantId)])
      .then(([cs, cl]) => {
        if (cancelled) return;
        setCustomers(cs);
        setCalls(cl);
        const phone = searchParams.get("phone");
        if (phone) {
          const match = cs.find((c) => c.phone === phone);
          if (match) setSelected(match);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Müştərilər yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId, searchParams]);

  const filteredCustomers = useMemo(() => {
    let list = customers ?? [];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, query]);

  const openNew = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (c: Customer) => {
    setForm({ phone: c.phone, name: c.name, note: c.note ?? "" });
    setEditing(c);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing === "new") {
        const created = await createCustomer(tenantId, {
          phone: form.phone.trim(),
          name: form.name.trim(),
          note: form.note.trim() || undefined,
        });
        setCustomers((prev) => (prev ? [created, ...prev] : [created]));
        setSelected(created);
      } else if (editing) {
        const updated = await updateCustomer(tenantId, editing.id, {
          phone: form.phone.trim(),
          name: form.name.trim(),
          note: form.note.trim() || undefined,
        });
        setCustomers((prev) =>
          prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev
        );
        setSelected((s) => (s?.id === updated.id ? updated : s));
      }
      setEditing(null);
    } catch (e) {
      setError(apiErrorText(e, "Yadda saxlamaq mümkün olmadı."));
    } finally {
      setSaving(false);
    }
  };

  if (error && !customers) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (!customers) {
    return (
      <div className="py-8 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-[#f5f5f5] rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
          <div className="lg:col-span-5 h-96 bg-[#fafafa] rounded-3xl border border-[#e5e5e5]" />
        </div>
      </div>
    );
  }

  const history = selected
    ? calls.filter((c) => c.callerNumber === selected.phone)
    : [];

  return (
    <div className="space-y-8 font-sans">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e5e5e5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#0a0a0a] tracking-tight">
            Müştərilər (CRM)
          </h1>
          <p className="text-xs sm:text-sm text-[#6b6b6b] mt-1">
            Səsli agentlə əlaqə saxlayan bütün müştərilərin profili və zəng tarixçəsi
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="sm"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={openNew}
        >
          Yeni Müştəri
        </GlassButton>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b6b]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ad və ya nömrəyə görə axtar..."
          className="h-10 w-full rounded-full border border-[#e5e5e5] bg-white pl-10 pr-4 text-xs sm:text-sm text-[#0a0a0a] placeholder:text-[#6b6b6b] focus:border-[#0a0a0a] focus:outline-none transition-colors shadow-xs"
        />
      </div>

      {/* ── TWO COLUMN CRM LAYOUT ── */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Customer List (Left 7 Cols) */}
        <div className="lg:col-span-7">
          <GlassCard className="bg-white/95 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0a0a0a]">
                Bütün Müştərilər ({filteredCustomers.length})
              </span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#6b6b6b]">
                Heç bir müştəri tapılmadı.
              </div>
            ) : (
              <div className="divide-y divide-[#e5e5e5]">
                {filteredCustomers.map((c) => {
                  const isSelected = selected?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className={`flex items-center justify-between p-4 sm:px-6 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-[#0a0a0a] text-white"
                          : "hover:bg-[#fafafa] text-[#0a0a0a]"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs sm:text-sm font-semibold">
                          {c.name}
                        </p>
                        <p className={`font-mono text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-[#6b6b6b]"}`}>
                          {c.phone}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-[11px] block ${isSelected ? "text-white/70" : "text-[#6b6b6b]"}`}>
                          {formatDateTime(c.lastContactAt)}
                        </span>
                        <span className={`text-[11px] font-mono mt-0.5 block ${isSelected ? "text-white/90 font-medium" : "text-[#0a0a0a]"}`}>
                          {c.callCount} zəng
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Customer Detail & Call History (Right 5 Cols) */}
        <div className="lg:col-span-5">
          <GlassCard className="p-6 bg-white/95 space-y-6">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-[#e5e5e5] pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#0a0a0a]">
                      {selected.name}
                    </h2>
                    <p className="font-mono text-xs text-[#6b6b6b] mt-0.5">
                      {selected.phone}
                    </p>
                  </div>

                  <GlassButton
                    size="xs"
                    variant="secondary"
                    leftIcon={<Edit2 className="h-3 w-3" />}
                    onClick={() => openEdit(selected)}
                  >
                    Redaktə
                  </GlassButton>
                </div>

                {selected.note && (
                  <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-[#e5e5e5] text-xs text-[#0a0a0a] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#6b6b6b] block">
                      Müştəri Qeydi
                    </span>
                    <p className="leading-relaxed">{selected.note}</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0a0a0a] mb-3">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Zəng Tarixçəsi ({history.length})</span>
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-[#6b6b6b] py-4 text-center">
                      Bu müştəri üçün zəng qeydə alınmayıb.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {history.map((call) => {
                        const st = callStatusLabels[call.status] ?? { label: call.status, variant: "muted" as const };
                        return (
                          <div
                            key={call.id}
                            className="p-3 rounded-xl border border-[#e5e5e5] bg-white flex items-center justify-between text-xs hover:border-[#0a0a0a] transition-all"
                          >
                            <div>
                              <StatusText variant={st.variant}>
                                {st.label}
                              </StatusText>
                              <span className="text-[11px] text-[#6b6b6b] block mt-1">
                                {formatDateTime(call.startedAt)} ({formatDuration(call.durationSec)})
                              </span>
                            </div>

                            {call.languageDetected && (
                              <span className="text-[10px] text-[#6b6b6b] font-mono">
                                {call.languageDetected}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-xs text-[#6b6b6b] space-y-2">
                <Users className="h-8 w-8 mx-auto text-[#6b6b6b]/40" />
                <p>Tarixçəni və qeydləri görmək üçün sol tərəfdən müştəri seçin.</p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* ── EDIT / CREATE MODAL ── */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#e5e5e5] space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-semibold text-[#0a0a0a]">
              {editing === "new" ? "Yeni Müştəri Əlavə Et" : "Müştərini Redaktə Et"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#0a0a0a] mb-1.5">
                  Ad və Soyad
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Məs: Əli Məmmədov"
                  className="h-10 w-full rounded-xl border border-[#e5e5e5] px-3.5 text-xs sm:text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a0a0a] mb-1.5">
                  Telefon Nömrəsi
                </label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+994 50 123 45 67"
                  className="h-10 w-full rounded-xl border border-[#e5e5e5] px-3.5 text-xs sm:text-sm text-[#0a0a0a] font-mono focus:border-[#0a0a0a] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0a0a0a] mb-1.5">
                  Qeyd (İstəyə bağlı)
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="Müştəri haqqında xüsusi qeydlər..."
                  className="w-full rounded-xl border border-[#e5e5e5] p-3 text-xs sm:text-sm text-[#0a0a0a] focus:border-[#0a0a0a] focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e5e5]">
                <GlassButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(null)}
                >
                  Ləğv et
                </GlassButton>
                <GlassButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? "Yadda saxlanılır..." : "Yadda Saxla"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
