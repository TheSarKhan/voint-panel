/**
 * Tarix formatlari — platforma qaydasi: BUTUN tarixler dd.mm.yyyy.
 *
 * toLocaleDateString("az-AZ") ISLEDILMIR ve bu qesdendir: az-AZ locale melumati
 * brauzerden brauzere deyisir, ICU qurulusunda olmayanda sessizce defolt locale-a
 * dusur ve tarix "7/27/2026" kimi cixa biler. Standart mecburi oldugu ucun formati
 * burada acig-aydin quraq — hansi brauzerde acilmasindan asili olmasin.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Xarab ve ya bos tarix — panelde "Invalid Date" gostermekdense tire. */
function parse(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** dd.mm.yyyy */
export function formatDate(iso: string): string {
  const d = parse(iso);
  if (!d) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** dd.mm.yyyy hh:mm */
export function formatDateTime(iso: string): string {
  const d = parse(iso);
  if (!d) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/**
 * Yalniz qrafik oxu ucun qisa forma: gun.ay.
 * 7 sutunun altinda tam tarix yazsaq etiketler ust-uste dusur; tam tarix
 * sutunun tooltip-inde qalir, yeni oxunan yerde standart pozulmur.
 */
export function formatDayShort(iso: string): string {
  const d = parse(iso);
  if (!d) return "—";
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

export function formatDuration(sec: number): string {
  if (!sec) return "—";
  // ƏVVƏLCƏ tam saniyəyə yuvarlaqlaşdır, SONRA böl. Əks halda 59.6 saniyə "0:60" verir:
  // dəqiqə 0-a yuvarlaqlaşır, saniyə isə ayrıca 60-a. Backend orta müddəti onluq kəsrlə
  // qaytardığı üçün bu hal real məlumatda yaranır.
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
