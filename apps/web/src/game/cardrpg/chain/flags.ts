export interface ChainFlags { guestWallet: boolean; chainLoop: boolean; itemTrading: boolean; yarnToken: boolean }

/** Build switches only: a URL cannot activate a feature on the live build. */
export function chainFlags(env: Record<string, unknown> = import.meta.env): ChainFlags {
  const demo = env.VITE_CHAIN_DEMO === '1';
  return {
    guestWallet: demo || env.VITE_GUEST_WALLET === '1',
    chainLoop: demo || env.VITE_CHAIN_LOOP === '1',
    itemTrading: demo || env.VITE_ITEM_TRADING === '1',
    yarnToken: demo || env.VITE_YARN_TOKEN === '1',
  };
}
