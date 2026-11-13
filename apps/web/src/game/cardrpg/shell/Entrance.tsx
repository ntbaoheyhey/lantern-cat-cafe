import {useEffect,useRef,useState,type ReactNode} from 'react';
import {useAccount,useConnect,useSignMessage,useSwitchChain} from 'wagmi';
import {useAuthContext,useSession} from '../../../wallet/WalletProvider';
import {buildSiweMessage} from '../../../wallet/siwe';
import {expiryFromToken} from '../../../wallet/session';
import {guestSignIn,requireFuji} from '../chain/guest';
import {chainFlags} from '../chain/flags';
import {audioEngine} from '../../../audio/engine';
import {GameIcon} from '../../../ui/GameIcon';
import {LiveCounters} from './LiveCounters';
import './shell.css';
const ENTRY='lantern.entered.v3';
const reopen=()=>window.dispatchEvent(new Event('shell:landing'));
export {reopen as reopenLanding};
export function Gate({children,session,guest,connect,wrongNetwork,switchNetwork}:{children:ReactNode;session?:boolean;guest?:()=>Promise<unknown>;connect?:()=>Promise<unknown>;wrongNetwork?:boolean;switchNetwork?:()=>Promise<unknown>}){
 const [entered,setEntered]=useState(()=>{try{return localStorage.getItem(ENTRY)==='1';}catch{return false;}}),[forced,setForced]=useState(false),[modal,setModal]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),panel=useRef<HTMLElement>(null);
 const enter=()=>{try{localStorage.setItem(ENTRY,'1');}catch{/* current session still works */}setEntered(true);setForced(false);setModal(false);audioEngine.music('home');};
 useEffect(()=>{const open=()=>{setForced(true);setModal(false);};window.addEventListener('shell:landing',open);return()=>window.removeEventListener('shell:landing',open);},[]);
 useEffect(()=>{if(session&&!forced)enter();},[session,forced]);
 useEffect(()=>{if(modal)panel.current?.focus();},[modal]);
 const run=async(action:'guest'|'wallet'|'switch')=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');await audioEngine.unlock();audioEngine.music('landing');try{if(action==='switch'){await switchNetwork?.();return;}if(action==='guest'){if(guest)await guest();enter();}else{if(!connect)throw new Error('Wallet unavailable. Play free.');await connect();enter();}}catch(e){const message=e instanceof Error?e.message:'';setError(/reject|denied|4001/i.test(message)?'Signature declined. Try again.':/Fuji/i.test(message)?'Switch to Fuji.':/wallet|connector|provider/i.test(message)?'Install Core or MetaMask, or play free.':'Sign-in offline. Retry or play offline.');setModal(true);}finally{lock.current=false;setBusy(false);}};
 if((entered||session)&&!forced)return <>{children}</>;
 return <main className="b-landing"><img className="b-keyart" src="/art/v3-shell/landing.webp" alt="Cats guarding a lantern-lit café at night"/><div className="b-landing-shade"/>
  <header className="b-landing-top"><span className="b-seal"><GameIcon name="deed"/> GENESIS CAFÉ</span><span>Avalanche Fuji testnet · No real value</span></header>
  <section className="b-hero"><p>THE EVENING IS YOURS</p><h1 className="t-title">Lantern<br/><span>Cat Café</span></h1><div className="b-features"><span>Battle</span><span>Own</span><span>Grow</span></div><div className="b-actions"><button className="b-primary" disabled={busy} onClick={()=>void run('guest')}><GameIcon name="fight"/>Play free</button><button disabled={busy} onClick={()=>setModal(true)}><GameIcon name="wallet"/>Connect wallet</button></div><button className="b-trailer-link" onClick={()=>window.dispatchEvent(new Event('shell:trailer'))}>Watch battle</button></section>
  <footer className="b-landing-bottom"><LiveCounters/><nav><button onClick={()=>window.dispatchEvent(new CustomEvent('shell:page',{detail:'economy'}))}>Economy</button><button onClick={()=>window.dispatchEvent(new CustomEvent('shell:page',{detail:'odds'}))}>Odds</button><a href="https://testnet.snowtrace.io/address/0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D" target="_blank" rel="noreferrer">Contracts</a></nav></footer>
  {modal&&<div className="b-modal-backdrop"><section className="b-modal" role="dialog" aria-modal="true" aria-label="Wallet sign-in" tabIndex={-1} ref={panel} onKeyDown={e=>{if(e.key==='Escape'&&!busy)setModal(false);if(e.key==='Tab'){const nodes=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a')??[]);if(e.shiftKey&&(document.activeElement===nodes[0]||document.activeElement===panel.current)){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}}}><button className="b-close" aria-label="Close sign-in" disabled={busy} onClick={()=>setModal(false)}><GameIcon name="close"/></button><GameIcon name="wallet" size={64}/><h2 className="t-title">Welcome home</h2><p>Signing proves wallet ownership. No purchase.</p>{wrongNetwork?<button className="b-primary" disabled={busy} onClick={()=>void run('switch')}>Switch to Fuji</button>:<button className="b-primary" disabled={busy} onClick={()=>void run('wallet')}>Core / MetaMask</button>}<button disabled={busy} onClick={()=>void run('guest')}>Play free</button>{error&&<><p role="alert">{error}</p><button onClick={enter} disabled={busy}>Play offline</button></>}{busy&&<p role="status">Waiting…</p>}</section></div>}
 </main>;
}
function ConnectedEntrance({children}:{children:ReactNode}){
 const session=useSession(),{api,store}=useAuthContext(),account=useAccount(),{connectAsync,connectors}=useConnect(),{signMessageAsync}=useSignMessage(),{switchChainAsync}=useSwitchChain();
 const connect=async()=>{let address=account.address,chainId=account.chainId;if(!address){const connector=connectors.find(c=>c.type==='injected')??connectors[0];if(!connector)throw new Error('No wallet');const result=await connectAsync({connector,chainId:43113});address=result.accounts[0];chainId=result.chainId;}requireFuji(chainId??0);if(!address)throw new Error('No wallet');const message=buildSiweMessage({address,nonce:await api.getNonce()});const result=await api.verify({message,signature:await signMessageAsync({message,account:address})});if(result.wallet.toLowerCase()!==address.toLowerCase())throw new Error('Wallet changed');store.set({...result,expiresAt:expiryFromToken(result.token)});};
 return <Gate session={!!session} guest={chainFlags().guestWallet?()=>guestSignIn(api,store):undefined} connect={connect} wrongNetwork={!!account.address&&account.chainId!==43113} switchNetwork={()=>switchChainAsync({chainId:43113})}>{children}</Gate>;
}
export function Entrance({children}:{children:ReactNode}){return Object.values(chainFlags()).some(Boolean)?<ConnectedEntrance>{children}</ConnectedEntrance>:<Gate>{children}</Gate>;}
