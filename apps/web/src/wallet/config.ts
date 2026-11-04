import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { avalancheFuji } from 'viem/chains';
import { defineChain } from 'viem';
import { isOfflineDemo } from '../demo/mode';
import { createConfig, custom, http, injected } from 'wagmi';

/** Fuji with the RPC overridden by VITE_FUJI_RPC_URL when set (public RPC otherwise). */
export function makeFujiChain(rpcUrl?: string) {
  if (!rpcUrl) return avalancheFuji;
  return defineChain({ ...avalancheFuji, rpcUrls: { default: { http: [rpcUrl] } } });
}

export const fuji = makeFujiChain(import.meta.env.VITE_FUJI_RPC_URL || undefined);

if (fuji.id !== FUJI_CHAIN_ID) throw new Error('Fuji chain id mismatch');

export function makeWagmiConfig() {
  return createConfig({
    chains: [fuji],
    connectors: isOfflineDemo() ? [] : [injected()],
    multiInjectedProviderDiscovery: !isOfflineDemo(),
    ...(isOfflineDemo() ? { storage: null } : {}),
    transports: { [fuji.id]: isOfflineDemo() ? custom({ request: async () => { throw new Error('Chain access is disabled in the offline demo'); } }, { retryCount: 0 }) : http() },
  });
}
