import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { createCustomer, getCustomers, updateCustomer } from "../api/customers";
import { getCalls } from "../api/calls";
import type { CallSummary, Customer } from "../api/types";
import { IconEdit, IconPlus } from "../components/icons";
import {
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
import { formatDateTime, formatDuration } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

interface FormState {
  phone: string;
  name: string;
  note: string;
}

const emptyForm: FormState = { phone: "", name: "", note: "" };

const callStatusLabels: Record<CallSummary["status"], string> = {
  RESOLVED: "Həll olundu",
  HANDOFF: "Operatora ötürüldü",
  ONGOING: "Davam edir",
};

function statusLabel(status: CallSummary["status"]): string {
  return callStatusLabels[status];
}

export function CustomersPage() {
  const tenantId = useTenantId();
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
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
        // Zəng detalından "Müştəri kartına bax" keçidi - uyğun nömrə tapılsa avtomatik açılır.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

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
      } else if (editing) {
        const updated = await updateCustomer(tenantId, editing.id, {
          phone: form.phone.trim(),
          name: form.name.trim(),
          note: form.note.trim() || undefined,
        });
        setCustomers((prev) =>
          prev ? prev.map((c) => (c.id === updated.id ? updated : c)) : prev,
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

  if (error && !customers) return <p className="text-sm text-err">{error}</p>;
  if (!customers) return <Spinner />;

  const history = selected
    ? calls.filter((c) => c.callerNumber === selected.phone)
    : [];

  return (
    <div>
      <PageHeader
        title="Müştərilər"
        subtitle="CRM — agentin danışdığı bütün müştərilər"
        actions={
          <button onClick={openNew} className={btnPrimary}>
            <IconPlus width={14} height={14} />
            Yeni müştəri
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          {customers.length === 0 ? (
            <EmptyState message="Hələ müştəri yoxdur." />
          ) : (
            <ul className="divide-y divide-border/60">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c)}
                    className={`flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2/60 ${
                      selected?.id === c.id ? "bg-surface-2" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {c.name}
                      </p>
                      <p className="text-xs text-fg-faint">{c.phone}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-fg-muted">
                        {formatDateTime(c.lastContactAt)}
                      </p>
                      <p className="text-[11px] text-fg-faint">
                        {c.callCount} zəng
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          {selected ? (
            <div>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-fg">
                    {selected.name}
                  </h2>
                  <p className="text-sm text-fg-muted">{selected.phone}</p>
                </div>
                <button
                  onClick={() => openEdit(selected)}
                  className={btnGhost}
                  title="Redaktə et"
                >
                  <IconEdit width={14} height={14} />
                </button>
              </div>
              {selected.note && (
                <p className="mb-4 rounded-md bg-surface-2 px-3 py-2 text-sm text-fg-muted">
                  {selected.note}
                </p>
              )}
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
                Zəng tarixçəsi
              </h3>
              {history.length === 0 ? (
                <p className="text-sm text-fg-faint">Zəng tarixçəsi boşdur.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((call) => (
                    <li
                      key={call.id}
                      className="rounded-md border border-border/60 px-3 py-2"
                    >
                      <p className="text-sm text-fg">
                        {statusLabel(call.status)}
                      </p>
                      <p className="text-xs text-fg-faint">
                        {formatDateTime(call.startedAt)}, {formatDuration(call.durationSec)}
                        {call.languageDetected ? `, ${call.languageDetected}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <EmptyState message="Tarixçəni görmək üçün müştəri seçin." />
          )}
        </Card>
      </div>

      {editing !== null && (
        <Modal
          title={editing === "new" ? "Yeni müştəri" : "Müştərini redaktə et"}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Ad">
              <input
                required
                className={inputCls}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Telefon">
              <input
                required
                className={inputCls}
                placeholder="+994 xx xxx xx xx"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Qeyd">
              <textarea
                rows={3}
                className={inputCls}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className={btnGhost}
              >
                Ləğv et
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saxlanılır…" : "Yadda saxla"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
