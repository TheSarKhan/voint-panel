import { AxiosError } from "axios";
import { PendingApprovalError } from "../api/client";

/**
 * Ekrana yazılası mesaj.
 *
 * Təsdiq gözləyən əməliyyat AYRICA hal kimi tutulur: "Silinmədi" yazmaq texniki cəhətdən
 * doğru olsa da yanlış təəssürat verir — sanki nəsə xarab olub və yenidən cəhd etmək lazımdır.
 * Halbuki əməliyyat qaydasında qeydə alınıb və bir nəfərin qərarını gözləyir.
 */
export function apiErrorText(e: unknown, fallback: string): string {
  if (e instanceof PendingApprovalError) {
    return e.message;
  }
  const err = e as AxiosError<{ detail?: string; message?: string }>;
  return err.response?.data?.detail ?? err.response?.data?.message ?? fallback;
}

/** Xəbərdarlıq qırmızı yox, sarı göstərilsin deyə: bu, uğursuzluq deyil. */
export function isPendingApproval(e: unknown): boolean {
  return e instanceof PendingApprovalError;
}
