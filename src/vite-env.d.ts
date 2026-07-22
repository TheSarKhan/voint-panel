/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_USE_MOCK?: "true" | "false" | "auto";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
