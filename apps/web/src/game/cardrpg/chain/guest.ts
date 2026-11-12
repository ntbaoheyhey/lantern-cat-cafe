import { createWalletClient, getAddress, http, type Address, type Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { avalancheFuji } from 'viem/chains';
import type { AuthApi } from '../../../wallet/authApi';
import { expiryFromToken, type SessionStore } from '../../../wallet/session';
import { buildSiweMessage } from '../../../wallet/siwe';

export const GUEST_KEY = 'taskbar-hero.fuji-guest.v1';
export const TESTNET_NOTICE = 'Testnet — no real value';
export function requireFuji(chainId: number) {
  if (chainId !== 43113) throw new Error('Switch to Fuji.');
}

/** No fallback to a volatile key: losing storage must never silently lose assets. */
export function guestAccount(storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  let key: string | null;
  try {
    key = storage.getItem(GUEST_KEY);
    if (!key) {
      key = generatePrivateKey();
      storage.setItem(GUEST_KEY, key);
      if (storage.getItem(GUEST_KEY) !== key) throw new Error();
    }
  } catch { throw new Error('Allow browser storage.'); }
  try { return privateKeyToAccount(key as Hex); }
  catch { throw new Error('Guest key needs recovery.'); }
}

export function existingGuestAddress(storage: Pick<Storage, 'getItem'> = localStorage): Address | undefined {
  try { const key = storage.getItem(GUEST_KEY); return key ? privateKeyToAccount(key as Hex).address : undefined; }
  catch { return undefined; }
}

export async function guestSignIn(api: AuthApi, store: SessionStore, storage: Storage = localStorage, chainId = 43113) {
  requireFuji(chainId);
  const account = guestAccount(storage);
  const nonce = await api.getNonce();
  const message = buildSiweMessage({ address: account.address, nonce });
  const signature = await account.signMessage({ message });
  // The only server payload is the standard SIWE message and signature.
  const session = await api.verify({ message, signature });
  if (getAddress(session.wallet) !== account.address) throw new Error('Sign-in address changed.');
  store.set({ ...session, expiresAt: expiryFromToken(session.token) });
  return account.address;
}

export function guestClient(rpcUrl: string, storage: Storage = localStorage) {
  return createWalletClient({ account: guestAccount(storage), chain: avalancheFuji, transport: http(rpcUrl) });
}

/** Called only by an explicit warning/confirmation action; never rendered or logged. */
export async function copyGuestKey(storage: Storage, clipboard: Pick<Clipboard, 'writeText'>) {
  const key = storage.getItem(GUEST_KEY);
  if (!key) throw new Error('No guest key.');
  await clipboard.writeText(key);
}
