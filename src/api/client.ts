import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const MOCK_MODE = import.meta.env.VITE_USE_MOCK ?? "auto";

export const http = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 8000,
});

/**
 * JWT-ni her sorguya elave edir — AMMA sorgu oz tokenini gətiribsə ona toxunmur.
 *
 * Giriş anında `fetchMeWithToken` təzəcə alınmış tokeni özü ötürür; store-da isə hələ
 * KÖHNƏ (çox vaxt vaxtı bitmiş) token oturur, çünki sessiya yalnız /auth/me uğurla
 * cavab verəndən sonra yazılır. Bu sətir onu üstələyəndə giriş öz düzgün tokeni ilə
 * deyil, keçən dəfənin ölü tokeni ilə gedirdi: 401, və ekranda "məlumatları yoxlayın"
 * yazan bir mesaj — halbuki məlumatlar düz idi.
 */
http.interceptors.request.use((config) => {
  if (config.headers.Authorization) {
    return config;
  }
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Access token 60 deqiqe yasayir. Vaxti bitende backend 401 qaytarir; biz refresh
 * token ile sessiyani sessizce yenileyib sorgunu tekrarlayiriq — istifadeci saatda
 * bir defe login sehifesine atilmasin.
 *
 * Eyni anda bir nece sorgu 401 alsa, hamisi eyni refresh emeliyyatini gozleyir
 * (asagidaki `pending`), yoxsa her biri ayrica refresh cagirar ve bir-birinin
 * tokenini kohnelder.
 */
let pending: Promise<string> | null = null;

async function refreshSession(): Promise<string> {
  const { refreshToken, setSession, user } = useAuthStore.getState();
  if (!refreshToken || !user) {
    throw new Error("refresh token yoxdur");
  }
  // Bu interceptor-a yeniden dusmesin deye xam axios ile cagirilir.
  const { data } = await axios.post<{
    accessToken: string;
    refreshToken: string;
  }>(`${API_URL}/api/v1/auth/refresh`, { refreshToken });
  setSession(data.accessToken, user, data.refreshToken);
  return data.accessToken;
}

function forceLogout() {
  useAuthStore.getState().logout();
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

/**
 * Təsdiq gözləyən əməliyyat.
 *
 * Backend 202 qaytaranda əməliyyat BAŞ VERMƏYİB — sadəcə növbəyə düşüb. HTTP-də bu uğurdur,
 * ona görə heç nə etməsək hər ekran "silindi" deyib sətri siyahıdan çıxarardı: istifadəçi
 * baş verməmiş bir işi görmüş sayardı, və bu, təsdiq mexanizmini olduğundan da pis edərdi
 * (heç olmasa nə vaxt işlədiyini bilməzdin).
 *
 * Ona görə burada rədd edilmiş vədə çevrilir: hər ekranın onsuz da olan xəta yolu mesajı
 * göstərir, və heç bir ekran özünü aldadılmış siyahı ilə tapmır.
 */
export class PendingApprovalError extends Error {
  readonly approvalId: string;

  constructor(detail: string, approvalId: string) {
    super(detail);
    this.name = "PendingApprovalError";
    this.approvalId = approvalId;
  }
}

http.interceptors.response.use(
  (res) => {
    if (res.status === 202 && res.data?.status === "PENDING_APPROVAL") {
      return Promise.reject(
        new PendingApprovalError(
          res.data.detail ?? "Əməliyyat təsdiq gözləyir.",
          res.data.approvalId,
        ),
      );
    }
    return res;
  },
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Yalniz GIRIS ve YENILEME sorgulari — onlar 401 verirse yeniden yeniləmək dövrə yaradır.
    // Əvvəl bura "/auth/" ilə başlayan hər şey düşürdü, o cümlədən /auth/me — yəni tokenin
    // vaxtı bitdiyini bildirən ƏSAS sorğu. Nəticədə sessiya yenilənmək əvəzinə bağlanırdı.
    const isAuthCall =
      original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    if (original && !original._retried && !isAuthCall) {
      original._retried = true;
      try {
        pending =
          pending ??
          refreshSession().finally(() => {
            pending = null;
          });
        const token = await pending;
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch {
        // Refresh token da bitib — sessiya hequqeten qurtarib.
        forceLogout();
        return Promise.reject(error);
      }
    }

    forceLogout();
    return Promise.reject(error);
  },
);

function isBackendUnavailable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  // Sebeke xetasi (backend isaresi yoxdur) ve ya 5xx
  if (!error.response) return true;
  return error.response.status >= 500;
}

/**
 * Real API cagirisini yerine yetirir; backend elcatan deyilse mock data qaytarir.
 *  - VITE_USE_MOCK=true  → hemise mock
 *  - VITE_USE_MOCK=false → hemise real API
 *  - VITE_USE_MOCK=auto  → real cagiris, sebeke xetasinda mock fallback (default)
 */
export async function withFallback<T>(
  real: () => Promise<T>,
  mock: () => Promise<T> | T,
): Promise<T> {
  if (MOCK_MODE === "true") return mock();
  if (MOCK_MODE === "false") return real();
  try {
    return await real();
  } catch (error) {
    if (isBackendUnavailable(error)) {
      console.warn("[voint] Backend elcatan deyil — mock data istifade olunur.");
      return mock();
    }
    throw error;
  }
}

/** Mock gecikmesi — UI axinlarinin realliga yaxin gorunmesi ucun */
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
