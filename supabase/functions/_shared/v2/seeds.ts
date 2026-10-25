/** First four bytes, big-endian, of HMAC-SHA256, exactly as in v1. */
async function hmacSeed(secret: string, message: string): Promise<number> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return ((mac[0]! << 24) | (mac[1]! << 16) | (mac[2]! << 8) | mac[3]!) >>> 0;
}

export const v2ClaimSeed = (secret: string, playerId: string, lastClaimMicros: number): Promise<number> =>
  hmacSeed(secret, `v2claim:${playerId}:${lastClaimMicros}`);
export const v2BossSeed = (secret: string, playerId: string, fightNo: number): Promise<number> =>
  hmacSeed(secret, `v2boss:${playerId}:${fightNo}`);
export const v2CraftSeed = (secret: string, playerId: string, key: string | number): Promise<number> =>
  hmacSeed(secret, `v2craft:${playerId}:${key}`);
