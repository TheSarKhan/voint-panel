import { useEffect, useState } from "react";
import { getReservations, updateReservationStatus } from "../api/reservations";
import type { Reservation, ReservationStatus } from "../api/types";
import {
  btnDanger,
  btnPrimary,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  StatusText,
} from "../components/ui";
import { formatDateTime } from "../lib/format";
import { useTenantId } from "../lib/useTenantId";
import { apiErrorText } from "../lib/apiError";

const statusMeta: Record<
  ReservationStatus,
  { label: string; tone: "ok" | "warn" | "err" | "neutral" }
> = {
  PENDING: { label: "Gözləyir", tone: "warn" },
  CONFIRMED: { label: "Təsdiqləndi", tone: "ok" },
  REJECTED: { label: "Rədd edildi", tone: "err" },
};

export function ReservationsPage() {
  const tenantId = useTenantId();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getReservations(tenantId)
      .then((res) => {
        if (!cancelled) setReservations(res);
      })
      .catch(() => {
        if (!cancelled) setError("Rezervasiyalar yüklənə bilmədi.");
      });
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const setStatus = async (id: string, status: ReservationStatus) => {
    setBusyId(id);
    try {
      const updated = await updateReservationStatus(tenantId, id, status);
      setReservations((prev) =>
        prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev,
      );
    } catch (e) {
      setError(apiErrorText(e, "Status yenilənə bilmədi."));
    } finally {
      setBusyId(null);
    }
  };

  if (error && !reservations) return <p className="text-sm text-err">{error}</p>;
  if (!reservations) return <Spinner />;

  const pending = reservations.filter((r) => r.status === "PENDING");
  const others = reservations.filter((r) => r.status !== "PENDING");

  const renderCard = (r: Reservation) => {
    const meta = statusMeta[r.status];
    return (
      <Card key={r.id} className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-fg">{r.customerName}</h3>
              <StatusText tone={meta.tone}>{meta.label}</StatusText>
            </div>
            <p className="mt-1 text-sm text-fg-muted">{r.service}</p>
            <p className="mt-1 text-xs text-fg-faint">
              Sorğu: {formatDateTime(r.requestedAt)}
            </p>
            {r.scheduledFor && (
              <p className="mt-2 text-sm text-fg">
                Vaxt: <span className="font-medium">{r.scheduledFor}</span>
              </p>
            )}
          </div>
          {r.status === "PENDING" && (
            <div className="flex shrink-0 gap-2">
              <button
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "CONFIRMED")}
                className={btnPrimary}
              >
                Təsdiqlə
              </button>
              <button
                disabled={busyId === r.id}
                onClick={() => setStatus(r.id, "REJECTED")}
                className={btnDanger}
              >
                Rədd et
              </button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title="Rezervasiyalar"
        subtitle="Agentin topladığı rezervasiya sorğuları"
      />

      {error && <p className="mb-4 text-sm text-err">{error}</p>}

      {reservations.length === 0 ? (
        <Card>
          <EmptyState message="Hələ rezervasiya sorğusu yoxdur." />
        </Card>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-faint">
                Gözləyən ({pending.length})
              </h2>
              <div className="space-y-3">{pending.map(renderCard)}</div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-fg-faint">
                Nəticələnmiş
              </h2>
              <div className="space-y-3">{others.map(renderCard)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
