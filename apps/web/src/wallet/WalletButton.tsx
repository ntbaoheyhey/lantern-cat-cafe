import { FUJI_CHAIN_ID } from '@taskbar-hero/chain';
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from 'wagmi';
import { expiryFromToken } from './session';
import { buildSiweMessage } from './siwe';
import { useAuthContext, useSession } from './WalletProvider';

export const CORE_INSTALL_URL = 'https://core.app';
export const NO_WALLET_HINT =
  'No wallet found. Core, MetaMask or any Avalanche-compatible browser wallet works on desktop Chrome, Brave or Edge. This link opens core.app.';

export function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function errText(e: unknown) {
  return e instanceof Error ? e.message.split('\n')[0] : 'Something went wrong';
}

export function WalletButton() {
  const { api, store } = useAuthContext();
  const session = useSession();
  const { address, chainId, isConnected } = useAccount();
  const { connect, connectors, isPending: connecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState<string>();

  // Drop a session that does not belong to the connected account.
  useEffect(() => {
    if (isConnected && address && session && session.wallet.toLowerCase() !== address.toLowerCase()) {
      store.clear();
    }
  }, [isConnected, address, session, store]);

  const connector = connectors[0];
  const noWallet =
    !connector || (connector.type === 'injected' && typeof window !== 'undefined' && !('ethereum' in window));

  const doDisconnect = () => {
    store.clear();
    setSignError(undefined);
    disconnect();
  };

  const signIn = async () => {
    if (!address) return;
    setSigning(true);
    setSignError(undefined);
    try {
      const nonce = await api.getNonce();
      const message = buildSiweMessage({ address, nonce });
      const signature = await signMessageAsync({ message });
      const res = await api.verify({ message, signature });
      store.set({
        token: res.token,
        playerId: res.playerId,
        wallet: res.wallet,
        expiresAt: expiryFromToken(res.token),
      });
    } catch (e) {
      setSignError(errText(e));
    } finally {
      setSigning(false);
    }
  };

  let body;
  if (!isConnected || !address) {
    body = noWallet ? (
      <a className="wallet-btn" href={CORE_INSTALL_URL} target="_blank" rel="noreferrer" title={NO_WALLET_HINT}>
        Get a browser wallet
      </a>
    ) : (
      <button className="wallet-btn" disabled={connecting} onClick={() => connect({ connector })}>
        {connecting ? 'Connecting…' : 'Connect wallet'}
      </button>
    );
  } else if (chainId !== FUJI_CHAIN_ID) {
    body = (
      <>
        <span className="wallet-msg" role="alert">Wrong network. Switch to Avalanche Fuji.</span>
        <button className="wallet-btn" disabled={switching} onClick={() => switchChain({ chainId: FUJI_CHAIN_ID })}>
          Switch to Fuji
        </button>
      </>
    );
  } else if (session) {
    body = (
      <>
        <span className="wallet-badge" title={address}>Signed in · {shortAddress(address)}</span>
        <button className="wallet-btn" onClick={doDisconnect}>Disconnect</button>
      </>
    );
  } else {
    body = (
      <>
        <span className="wallet-addr" title={address}>{shortAddress(address)}</span>
        <button className="wallet-btn" disabled={signing} onClick={signIn}>
          {signing ? 'Signing…' : 'Sign in'}
        </button>
        <button className="wallet-btn wallet-sub" onClick={doDisconnect}>Disconnect</button>
      </>
    );
  }

  const error = signError ?? (connectError ? errText(connectError) : undefined);
  return (
    <div className="wallet" aria-label="Wallet">
      {body}
      {error && <span className="wallet-msg" role="status">{error}</span>}
    </div>
  );
}
