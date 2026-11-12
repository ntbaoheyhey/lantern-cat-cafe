import { useCallback, useEffect, useState } from 'react';
import { formatEther, type Address } from 'viem';
import { useSession } from '../../../wallet/WalletProvider';
import { chainPost } from './api';
import { loadChainConfig, publicChain } from './runtime';

export const FAUCET_URL = 'https://build.avax.network/console/primary-network/faucet';
export function GasBalance() {
  const session = useSession();
  const [balance,setBalance] = useState<string>(), [status,setStatus] = useState('Getting test gas…');
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!session) return;
    setStatus('Getting test gas…');
    try {
      const result = await chainPost<{status:string}>('guest-drip',session.token);
      const config = await loadChainConfig(), client = publicChain(config);
      if (await client.getChainId() !== 43113) throw new Error();
      const wei = await client.getBalance({address:session.wallet as Address});
      if(signal?.aborted)return;
      setBalance(Number(formatEther(wei)).toFixed(4));
      setStatus(result.status === 'confirmed' || wei > 0n ? '' : 'Gas pending. Retry.');
    } catch {if (!signal?.aborted) setStatus('Gas unavailable.');}
  },[session]);
  useEffect(() => { const abort = new AbortController(); void refresh(abort.signal); return () => abort.abort(); },[refresh]);
  return <div className="chain-gas"><output data-testid="chain-gas">{balance ? `▲ ${balance}` : ''}</output><p role="status">{status}</p>
    {status && status !== 'Getting test gas…' && <><button onClick={() => void refresh()}>↻ Retry</button><a href={FAUCET_URL} target="_blank" rel="noreferrer">↗ Faucet</a><button onClick={() => void navigator.clipboard.writeText(session?.wallet ?? '')}>▣ Copy address</button></>}
  </div>;
}
