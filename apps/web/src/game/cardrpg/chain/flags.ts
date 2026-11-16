export interface ChainFlags { guestWallet: boolean; chainLoop: boolean; itemTrading: boolean; yarnToken: boolean; yarnCosmetics:boolean; relicForge:boolean; campaign:boolean; campaignRewards:boolean; economyV3:boolean }

/** Build switches only: a URL cannot activate a feature on the live build. */
export function chainFlags(env: Record<string, unknown> = import.meta.env): ChainFlags {
  const demo = env.VITE_CHAIN_DEMO === '1';
  return {
    economyV3: demo || env.VITE_ECONOMY_V3 === '1',
    guestWallet: demo || env.VITE_GUEST_WALLET === '1',
    chainLoop: demo || env.VITE_CHAIN_LOOP === '1',
    itemTrading: demo || env.VITE_ITEM_TRADING === '1',
    yarnToken: demo || env.VITE_YARN_TOKEN === '1',
    // Explicit opt-in, including demo builds, until the backend is deployed.
    yarnCosmetics: env.VITE_YARN_COSMETICS === '1',
    relicForge: env.VITE_RELIC_FORGE === '1',
    campaign:env.VITE_CHAIN_CAMPAIGN==='1',
    campaignRewards:env.VITE_CHAIN_CAMPAIGN_REWARDS==='1',
  };
}

/** Deploy-time opt-in; requires the existing guest, economy and chain services. */
export function shipJourneyEnabled(env: Record<string, unknown> = import.meta.env) {
  const flags=chainFlags(env);
  return env.VITE_SHIP_JOURNEY==='1'&&flags.guestWallet&&flags.chainLoop&&flags.economyV3;
}
