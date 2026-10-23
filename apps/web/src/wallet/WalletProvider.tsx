import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { WagmiProvider, type Config } from 'wagmi';
import { defaultAuthApi, type AuthApi } from './authApi';
import { makeWagmiConfig } from './config';
import { createSessionStore, type Session, type SessionStore } from './session';

interface Ctx {
  api: AuthApi;
  store: SessionStore;
}
const WalletCtx = createContext<Ctx | null>(null);

export interface WalletProviderProps {
  children: ReactNode;
  /** Overrides, mainly for tests. */
  config?: Config;
  api?: AuthApi;
  store?: SessionStore;
}

export function WalletProvider({ children, config, api, store }: WalletProviderProps) {
  const wagmiConfig = useMemo(() => config ?? makeWagmiConfig(), [config]);
  const queryClient = useMemo(() => new QueryClient(), []);
  const ctx = useMemo<Ctx>(
    () => ({ api: api ?? defaultAuthApi(), store: store ?? createSessionStore() }),
    [api, store],
  );
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletCtx.Provider value={ctx}>{children}</WalletCtx.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function useAuthContext(): Ctx {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('WalletProvider missing');
  return ctx;
}

export function useSession(): Session | null {
  const { store } = useAuthContext();
  return useSyncExternalStore(store.subscribe, store.get);
}
