import axios from "axios";
import { API_URL } from "./client";

/** Giris etmemis panelin muessisesi haqqinda bile bildiyi hər şey. */
export interface PublicTenant {
  id: string;
  name: string;
  subdomain: string;
}

/**
 * Subdomain-i muessiseye cevirir. Login-den EVVEL cagirilir, ona gore token yoxdur —
 * `http` yerine xam axios islenir ki, interceptor-un 401 axini ise dusmesin.
 *
 * Tapilmasa null qaytarir: bilinmeyen bir subdomain panelin acilmasina mane olmamalidir,
 * sadece adsiz giris ekrani gosterilir.
 */
export async function resolveTenantBySubdomain(
  subdomain: string,
): Promise<PublicTenant | null> {
  try {
    const { data } = await axios.get<PublicTenant>(
      `${API_URL}/api/v1/public/tenants/by-subdomain/${encodeURIComponent(subdomain)}`,
      { timeout: 6000 },
    );
    return data;
  } catch {
    return null;
  }
}
