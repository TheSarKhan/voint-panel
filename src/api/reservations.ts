import { delay, http, withFallback } from "./client";
import { mockReservations } from "./mockData";
import type { Reservation, ReservationStatus } from "./types";

// Backend (com.starsoft.voint.reservation.dto.ReservationResponse) sahe adlari panelin daxili
// Reservation tipinden ferqlidir (requestedService vs service, createdAt vs requestedAt,
// callId vs sourceCallId). requestedDate serbest metndir (VARCHAR, ISO deyil) - scheduledFor
// kimi ham metn saxlanilir. Backend-de musterinin telefonu ReservationRequest-de yoxdur,
// buna gore panel phone sahesini uydurmur.
interface BackendReservationResponse {
  id: string;
  tenantId: string;
  callId: string | null;
  customerName: string;
  requestedService: string;
  requestedDate: string | null;
  status: ReservationStatus;
  createdAt: string;
}

function toReservation(r: BackendReservationResponse): Reservation {
  return {
    id: r.id,
    customerName: r.customerName,
    service: r.requestedService,
    requestedAt: r.createdAt,
    scheduledFor: r.requestedDate ?? "",
    status: r.status,
    sourceCallId: r.callId ?? undefined,
  };
}

export function getReservations(tenantId: string): Promise<Reservation[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendReservationResponse[]>(
        `/tenants/${tenantId}/reservations`,
      );
      return data.map(toReservation);
    },
    async () => {
      await delay();
      return [...mockReservations];
    },
  );
}

export function updateReservationStatus(
  tenantId: string,
  reservationId: string,
  status: ReservationStatus,
): Promise<Reservation> {
  return withFallback(
    async () => {
      const { data } = await http.patch<BackendReservationResponse>(
        `/tenants/${tenantId}/reservations/${reservationId}`,
        { status },
      );
      return toReservation(data);
    },
    async () => {
      await delay(300);
      const reservation = mockReservations.find((r) => r.id === reservationId);
      if (!reservation) throw new Error("Rezervasiya tapilmadi");
      reservation.status = status;
      return reservation;
    },
  );
}
