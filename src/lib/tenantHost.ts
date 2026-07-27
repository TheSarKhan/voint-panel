/**
 * Panelin hansi muessiseye aid oldugunu unvandan tapir: ces.voint.az -> "ces".
 *
 * Vacib olan budur ki, panel ozu COXALMIR — eyni tetbiq her subdomainde islenir,
 * host sadece kimin panelinde oldugumuzu deyir. Hansi melumatin gorunecEyini yene
 * JWT teyin edir; bu ad yalniz giris ekranini adlandirmaq ve sehv panelde girisi
 * tutmaq ucundur.
 */

/** Platformanin oz unvanlari — muessise adi kimi sayilmamalidir. */
const RESERVED = new Set([
  "admin",
  "admin-panel",
  "api",
  "www",
  "app",
  "panel",
  "voint",
  "localhost",
  "demo",
  "test",
  "staging",
  "dev",
]);

/** @returns subdomain, ve ya null — koken domen, rezerv ad, IP ve ya localhost olduqda */
export function tenantSubdomainFromHost(
  host: string = window.location.hostname,
): string | null {
  if (!host) return null;
  const clean = host.trim().toLowerCase().split(":")[0];

  // IP unvani subdomain dasimir
  if (/^\d+\.\d+\.\d+\.\d+$/.test(clean)) return null;

  const labels = clean.split(".");
  // En azi label.domen.tld olmalidir
  if (labels.length < 3) return null;

  const first = labels[0];
  return RESERVED.has(first) ? null : first;
}
