import { delay, http, withFallback } from "./client";
import { mockReservations } from "./mockData";
import type { Reservation, ReservationStatus } from "./types";

export function getReservations(tenantId: string): Promise<Reservation[]> {
  return withFallback(
    async () => {
      const { data } = await http.get<Reservation[]>(
        `/tenants/${tenantId}/reservations`,
      );
      return data;
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
      const { data } = await http.patch<Reservation>(
        `/tenants/${tenantId}/reservations/${reservationId}`,
        { status },
      );
      return data;
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
