import {GameIcon} from '../../../ui/GameIcon';
import { useEffect, useState } from 'react';
import { formatEther, type Address } from 'viem';
import { useSession } from '../../../wallet/WalletProvider';
import { chainPost } from './api';
import { loadChainConfig, publicChain } from './runtime';
import { requireFuji } from './guest';

export const FAUCET_URL = 'https://build.avax.network/console/primary-network/faucet';
export function GasBalance() {
  const session = useSession();
  const [balance,setBalance] = useState<string>(), [status,setStatus] = useState('Getting test gas…'), [attempt,setAttempt] = useState(0);
  useEffect(() => {
    setBalance(undefined); setStatus('Getting test gas…');
    if (!session) return;
    let active = true, request = 0;
    let drip: 'requesting' | 'pending' | 'confirmed' | 'unavailable' = 'requesting';
    const refresh = async () => {
      const id = ++request;
      try {
        const config = await loadChainConfig(), client = publicChain(config);
        requireFuji(await client.getChainId());
        const wei = await client.getBalance({address:session.wallet as Address});
        if (!active || id !== request) return;
        setBalance(Number(formatEther(wei)).toFixed(4));
        setStatus(wei > 0n ? '' : drip === 'requesting' ? 'Getting test gas…' : drip === 'pending' ? 'Gas pending. Retry.' : 'No gas. Open faucet.');
      } catch { if (active && id === request) {setBalance(undefined); setStatus('Gas unavailable.');} }
    };
    // Balance remains useful when the sponsor is empty or the drip endpoint is
    // unavailable. Polling reads RPC only; it never repeatedly requests grants.
    void refresh();
    void chainPost<{status:string}>('guest-drip',session.token).then(result => {
      drip = result.status === 'confirmed' ? 'confirmed' : result.status === 'pending' ? 'pending' : 'unavailable';
    }, () => {drip = 'unavailable';}).then(() => {if(active) void refresh();});
    const changed = () => {void refresh();};
    window.addEventListener('chain:changed', changed);
    const timer = setInterval(changed, 5000);
    return () => {active = false; request++; clearInterval(timer); window.removeEventListener('chain:changed', changed);};
  },[session,attempt]);
  return <div className="chain-gas"><output data-testid="chain-gas">{balance ? `${balance}` : ''}</output><p role="status">{status}</p>
    {status && status !== 'Getting test gas…' && <><button onClick={() => setAttempt(a => a + 1)}><GameIcon name="refresh" size={18}/> Retry</button><a href={FAUCET_URL} target="_blank" rel="noreferrer"><GameIcon name="external" size={18}/> Faucet</a><button onClick={() => void navigator.clipboard.writeText(session?.wallet ?? '').catch(() => setStatus('Copy unavailable.'))}><GameIcon name="bag" size={18}/> Copy address</button></>}
  </div>;
}
