import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAccount, useConnect, useSignMessage, useWalletClient } from 'wagmi';
import { WalletProvider, useAuthContext, useSession } from '../../../wallet/WalletProvider';
import { buildSiweMessage } from '../../../wallet/siwe';
import { expiryFromToken } from '../../../wallet/session';
import { copyGuestKey, existingGuestAddress, guestClient, guestSignIn, requireFuji, TESTNET_NOTICE } from './guest';
import { chainRuntime, loadChainConfig, txLink } from './runtime';
import { moveGuestAssets } from './move';
import './chain.css';
import { chainFlags } from './flags';
import { CHAIN_ITEM_IDS } from '@taskbar-hero/game-rules/cardrpg';
import { GasBalance } from './GasBalance';
import { YarnBalance } from './YarnBalance';
import { friendlyError } from './errors';
import type { Tab } from './ChainRoom';
const ChainRoom = lazy(()=>import('./ChainRoom').then(m=>({default:m.ChainRoom})));


export function ChainDock({embedded=false}:{embedded?:boolean}) {
  const {api, store} = useAuthContext(), session = useSession();
  const flags = chainFlags(), actionLock = useRef(false);
  const external = useAccount(), {data: externalWallet} = useWalletClient();
  const {connectAsync, connectors} = useConnect(), {signMessageAsync} = useSignMessage();
  const [open, setOpen] = useState(!embedded), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [warning, setWarning] = useState(false), [copied, setCopied] = useState(false), [moving, setMoving] = useState(false);
  const [lastHash, setLastHash] = useState('');
  const [room,setRoom]=useState<Tab>();
  const panel=useRef<HTMLElement>(null),walletTrigger=useRef<HTMLElement|null>(null);
  const closeWallet=()=>{setOpen(false);if(embedded&&walletTrigger.current?.isConnected)walletTrigger.current.focus();};
  useEffect(()=>{
    if(!embedded)return;
    const openWallet=()=>{walletTrigger.current=document.activeElement as HTMLElement;setOpen(true);};
    window.addEventListener('chain:wallet',openWallet);
    return()=>window.removeEventListener('chain:wallet',openWallet);
  },[embedded]);
  useEffect(()=>{if(embedded&&open)panel.current?.focus();},[embedded,open]);
  useEffect(()=>{
    if (!flags.chainLoop) return;
    const open=(event:Event)=>{const tab=(event as CustomEvent<unknown>).detail;setRoom(['Judge','Market','Bag','Seal','History'].includes(String(tab))?tab as Tab:'Judge');};
    window.addEventListener('chain:open',open);return()=>window.removeEventListener('chain:open',open);
  },[flags.chainLoop]);
  const guest = !!session && existingGuestAddress()?.toLowerCase() === session.wallet.toLowerCase();
  const run = async (action: () => Promise<unknown>) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusy(true); setMessage('');
    try { await action(); } catch (e) { setMessage(friendlyError(e)); } finally {actionLock.current = false; setBusy(false);}
  };
  const connect = async () => {
    if (!external.isConnected) {
      if (!connectors[0]) throw new Error();
      await connectAsync({connector: connectors[0], chainId: 43113});
    }
  };
  const walletLogin = async () => {
    if (!external.address) { await connect(); return; }
    requireFuji(external.chainId ?? 0);
    const message = buildSiweMessage({address: external.address, nonce: await api.getNonce()});
    const result = await api.verify({message, signature: await signMessageAsync({message})});
    store.set({...result, expiresAt: expiryFromToken(result.token)});
  };
  return <><aside className="chain-dock" aria-label="Fuji wallet">
    {!embedded&&<button className="chain-launch" onClick={() => setOpen(!open)}>◈ Fuji</button>}
    {open && <section ref={panel} tabIndex={-1} className="chain-panel" aria-label="Fuji panel" onKeyDown={event=>{if(embedded&&event.key==='Escape'){event.stopPropagation();closeWallet();}}}>
      <header><strong>◈ Fuji</strong><button aria-label="Close Fuji" onClick={closeWallet}>×</button></header>
      <small>{TESTNET_NOTICE}</small>
      {session ? <>
        <output data-testid="chain-address" title={session.wallet}>{session.wallet.slice(0, 8)}…{session.wallet.slice(-4)}</output>
        {guest && flags.chainLoop && <GasBalance />}
        {flags.yarnToken&&<YarnBalance/>}
        {flags.chainLoop&&<button disabled={busy} onClick={()=>setRoom('Judge')}>◈ Market</button>}
        <button disabled={busy} onClick={() => store.clear()}>↪ Sign out</button>
        {guest && <><button disabled={busy} onClick={() => {setWarning(!warning);setCopied(false);}}>⇧ Export key</button>
          {warning && <div role="alert"><p>Anyone with this key controls your guest assets. Keep it private.</p><button disabled={copied || busy} onClick={() => void run(async () => {await copyGuestKey(localStorage, navigator.clipboard);setCopied(true);})}>{copied ? '✓ Copied' : 'Copy once'}</button></div>}
          <button disabled={busy} onClick={() => void run(async () => {await connect();setMoving(true);})}>⇢ Move wallet</button>
          {moving && external.address && <div><p title={external.address}>{external.address.slice(0,8)}…{external.address.slice(-4)}</p><button disabled={busy || !externalWallet} onClick={() => void run(async () => {
            requireFuji(external.chainId ?? 0);
            const config = await loadChainConfig();
            const runtime = chainRuntime(config, guestClient(config.rpcUrl), session.wallet as `0x${string}`);
            await moveGuestAssets(await runtime.moveAdapter(CHAIN_ITEM_IDS), external.address!, setLastHash); setMoving(false); window.dispatchEvent(new Event('chain:changed'));
          })}>Confirm move</button></div>}
        </>}
      </> : <>{flags.guestWallet&&<button disabled={busy} onClick={() => void run(() => guestSignIn(api, store))}>▶ Play as guest</button>}<button disabled={busy} onClick={() => void run(walletLogin)}>◉ {external.address ? 'Sign in' : 'Connect'}</button></>}
      {busy && <p role="status">Pending…</p>}{message && <p role="alert">{message}</p>}
      {lastHash && <a href={txLink(lastHash)} target="_blank" rel="noreferrer">↗ Snowtrace</a>}
      <details><summary>?</summary><p>Guest keys stay in this browser. Export before clearing storage. Connect MetaMask or Core to move assets. Offline play stays available.</p></details>
    </section>}
  </aside>{room&&flags.chainLoop&&<div className="chain-overlay" role="dialog" aria-label="Fuji market" aria-modal="true"><Suspense fallback={<p>Opening…</p>}><ChainRoom key={room} initialTab={room} onClose={()=>setRoom(undefined)}/></Suspense></div>}</>;
}
export default function ChainRoot({children,embedded=false}: {children: ReactNode;embedded?:boolean}) {
  return <WalletProvider>{children}<ChainDock embedded={embedded}/></WalletProvider>;
}
