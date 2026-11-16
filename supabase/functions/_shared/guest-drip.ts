import { createPublicClient, getAddress, http, keccak256, parseEther, type Address, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const DRIP_WEI = parseEther('0.05');
export interface DripRow {
  wallet: string; sponsor: string; nonce: number | string; gas_price: string | number;
  raw_tx: Hex | null; tx_hash: Hex | null; status: 'reserved' | 'pending' | 'confirmed' | 'failed';
}
export interface DripStore {
  reserve(input: {player: string; wallet: string; ip: string; sponsor: string; nonce: number; gasPrice: string; balance: string}): Promise<DripRow>;
  signed(wallet: string, raw: Hex, hash: Hex): Promise<boolean>;
  result(wallet: string, hash: Hex, success: boolean): Promise<unknown>;
}
export function createDrip({key, rpcUrl, store}: {key: Hex; rpcUrl: string; store: DripStore}) {
  const sponsor = privateKeyToAccount(key);
  const rpc = createPublicClient({ transport: http(rpcUrl, {timeout: 10_000, retryCount: 1}), pollingInterval: 500 });
  return async function drip(player: string, wallet: Address, ip: string) {
    if (await rpc.getChainId() !== 43113) throw new Error('wrong_chain');
    const [balance, nonce, gasPrice] = await Promise.all([
      rpc.getBalance({address: sponsor.address}), rpc.getTransactionCount({address: sponsor.address, blockTag: 'pending'}), rpc.getGasPrice(),
    ]);
    const row = await store.reserve({player, wallet: wallet.toLowerCase(), ip, sponsor: sponsor.address.toLowerCase(), nonce, gasPrice: gasPrice.toString(), balance: balance.toString()});
    if (row.status === 'confirmed' || row.status === 'failed') return {status: row.status, txHash: row.tx_hash};
    if (getAddress(row.sponsor) !== sponsor.address) throw new Error('sponsor_changed');
    if (!Number.isSafeInteger(Number(row.nonce))) throw new Error('invalid_nonce');
    const raw = row.raw_tx ?? await sponsor.signTransaction({chainId: 43113, type: 'legacy', nonce: Number(row.nonce),
      to: getAddress(row.wallet), value: DRIP_WEI, gas: 21000n, gasPrice: BigInt(row.gas_price)});
    const hash = keccak256(raw);
    // Save the exact signed transaction before broadcasting. All retries resend
    // the same nonce/bytes/hash; a timeout can never allocate another payment.
    if (!await store.signed(row.wallet, raw, hash)) throw new Error('reservation_changed');
    const submittedAt=performance.now();
    try { await rpc.sendRawTransaction({serializedTransaction: raw}); }
    catch { /* already known, mined, or temporarily unavailable: reconcile below */ }
    try {
      const receipt = await rpc.waitForTransactionReceipt({hash, timeout: 15_000});
      await store.result(row.wallet, hash, receipt.status === 'success');
      return {status: receipt.status === 'success' ? 'confirmed' : 'failed', txHash: hash,confirmationMs:Math.round(performance.now()-submittedAt)};
    } catch { return {status: 'pending', txHash: hash}; }
  };
}

/** Only trust the gateway-appended final hop. Missing headers share a fail-closed bucket.
 * Never store plaintext IPs. Deployment must preserve/append the trusted gateway header. */
export async function dripIpHash(header: string | null, secret: string) {
  const ip = header?.split(',').at(-1)?.trim() || 'unknown';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const value = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`guest-drip:${ip}`)));
  return Array.from(value, b => b.toString(16).padStart(2,'0')).join('');
}
