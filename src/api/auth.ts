import { delay, http, withFallback } from "./client";
import { DEMO_EMAIL, DEMO_PASSWORD, MOCK_TOKEN, mockUser } from "./mockData";
import type { AuthUser, LoginResponse } from "./types";

export function login(email: string, password: string): Promise<LoginResponse> {
  return withFallback(
    async () => {
      const { data } = await http.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      return data;
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
      const { data } = await http.post<LoginResponse>("/auth/refresh");
      return data;
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
      const { data } = await http.get<AuthUser>("/auth/me");
      return data;
    },
    async () => {
      await delay(150);
      return mockUser;
    },
  );
}
