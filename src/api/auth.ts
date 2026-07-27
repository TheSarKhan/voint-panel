import { delay, http, withFallback } from "./client";
import { DEMO_EMAIL, DEMO_PASSWORD, MOCK_TOKEN, mockUser } from "./mockData";
import type { AuthUser, LoginResponse } from "./types";
import { useAuthStore } from "../store/auth";

// Backend (com.starsoft.voint.auth) sekilleri — panelin daxili LoginResponse/AuthUser
// tipl huri ile fergli olduguna gore burada map edilir.
interface BackendTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

interface BackendMeResponse {
  id: string;
  tenantId: string;
  email: string;
  role: string;
}

function toAuthUser(me: BackendMeResponse): AuthUser {
  return {
    id: me.id,
    email: me.email,
    name: me.email.split("@")[0],
    tenantId: me.tenantId,
    role: me.role,
  };
}

/** /auth/me-ni verilmis access token ile cagirir — hele store-a yazilmamis tokenler ucun. */
async function fetchMeWithToken(accessToken: string): Promise<AuthUser> {
  const { data } = await http.get<BackendMeResponse>("/auth/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return toAuthUser(data);
}

/**
 * Bu panel bir muessiseye baglidir.
 *
 * Platforma admininin (SUPER_ADMIN) tenantId-si yoxdur, ona gore burada her sehife
 * `/tenants/undefined/...` cagirar ve bos qalar. Girisde deyilmese, sebeb gorunmez olur.
 */
export class WrongPanelError extends Error {
  constructor() {
    super(
      "Bu hesab platforma adminidir. Admin panelə daxil olun: voint-admin.sarkhan.az",
    );
    this.name = "WrongPanelError";
  }
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return withFallback(
    async () => {
      const { data } = await http.post<BackendTokenResponse>("/auth/login", {
        email,
        password,
      });
      const user = await fetchMeWithToken(data.accessToken);
      if (!user.tenantId) {
        throw new WrongPanelError();
      }
      return { token: data.accessToken, refreshToken: data.refreshToken, user };
    },
    async () => {
      await delay(400);
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        return { token: MOCK_TOKEN, user: mockUser };
      }
      throw new Error("E-poçt və ya şifrə yanlışdır (demo: admin@ces.az / voint123)");
    },
  );
}

export function refresh(): Promise<LoginResponse> {
  return withFallback(
    async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) throw new Error("No refresh token available");
      const { data } = await http.post<BackendTokenResponse>("/auth/refresh", { refreshToken });
      const user = await fetchMeWithToken(data.accessToken);
      return { token: data.accessToken, refreshToken: data.refreshToken, user };
    },
    async () => {
      await delay(150);
      return { token: MOCK_TOKEN, user: mockUser };
    },
  );
}

export function me(): Promise<AuthUser> {
  return withFallback(
    async () => {
      const { data } = await http.get<BackendMeResponse>("/auth/me");
      return toAuthUser(data);
    },
    async () => {
      await delay(150);
      return mockUser;
    },
  );
}
