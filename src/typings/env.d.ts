/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OSS_ACCESS_KEY_ID: string;
  readonly VITE_OSS_ACCESS_KEY_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
