/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_FUJI_RPC_URL?: string;
  readonly VITE_ALLOW_MOCK_AUTH?: string;
}
