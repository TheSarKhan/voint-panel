import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const MOCK_MODE = import.meta.env.VITE_USE_MOCK ?? "auto";

export const http = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 8000,
});

// JWT-ni her sorguya elave et
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → sessiyani bitir ve login sehifesine yonlendir
http.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
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
