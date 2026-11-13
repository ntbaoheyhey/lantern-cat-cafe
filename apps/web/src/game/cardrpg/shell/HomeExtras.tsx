import {formatEther,type Address} from 'viem';
import type {EconomyResponse} from '@taskbar-hero/chain/src/economy-v3';
import {V3_DEED_IDS} from '@taskbar-hero/game-rules/src/cardrpg/trade';
import {chainPost} from '../chain/api';
import {loadChainConfig,publicChain,readHoldings} from '../chain/runtime';
import {openChainRoom} from '../chain/ChainRoom';
import {useEffect,useState} from 'react';
import {useSession} from '../../../wallet/WalletProvider';
import {GameIcon} from '../../../ui/GameIcon';
import {chainFlags} from '../chain/flags';
import {YarnBalance} from '../chain/YarnBalance';
import {audioEngine} from '../../../audio/engine';
export const openPage=(page:string)=>window.dispatchEvent(new CustomEvent('shell:page',{detail:page}));
export {v3Season as seasonClock} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {v3Season as seasonClock} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
function ConnectedChip(){
 const session=useSession(),[balance,setBalance]=useState<string>(),[owned,setOwned]=useState(false);
 useEffect(()=>{let live=true;setBalance(undefined);setOwned(false);if(!session||!chainFlags().economyV3)return;
 const accept=async(r:EconomyResponse)=>{if(!live)return;setBalance(Number(formatEther(BigInt(r.state.spool))).toLocaleString('en-US',{maximumFractionDigits:2}));document.documentElement.dataset.cafeSkin=r.state.styles.includes('lantern-skin')?'lantern':'';
 try{const c=await loadChainConfig(),held=await readHoldings(publicChain(c),c.RelicNFT,session.wallet as Address,V3_DEED_IDS);if(live)setOwned(held.length>0);}catch{if(live)setOwned(false);}};
 void chainPost<EconomyResponse>('chain-economy-v3',session.token,{id:crypto.randomUUID(),command:{action:'state'}}).then(accept).catch(()=>{});
 const update=(e:Event)=>{const d=(e as CustomEvent).detail;if(d.wallet.toLowerCase()===session.wallet.toLowerCase())void accept(d);};
 const holdings=(e:Event)=>{const d=(e as CustomEvent<{wallet:string;items:{id:bigint;amount:bigint}[]}>).detail;if(d.wallet.toLowerCase()===session.wallet.toLowerCase())setOwned(d.items.some(i=>i.id>=30001n&&i.id<=33000n&&i.amount>0n));};
 window.addEventListener('economy:v3',update);window.addEventListener('chain:holdings',holdings);return()=>{live=false;window.removeEventListener('economy:v3',update);window.removeEventListener('chain:holdings',holdings);delete document.documentElement.dataset.cafeSkin;};
 },[session?.wallet,session?.token]);
 return <>{chainFlags().economyV3&&<span className="uv-currency" aria-label="Spool balance"><GameIcon name="spool" size={26}/>{balance??'Offline'}<button aria-label="Use Spool" onClick={()=>openChainRoom('Café')}>+</button></span>}<button className="b-wallet-chip" title={owned?'Café Deed held':'Fuji wallet'} onClick={()=>window.dispatchEvent(new Event('chain:wallet'))}><i/>{session?`${session.wallet.slice(0,6)}…${session.wallet.slice(-4)}`:'Wallet'}<GameIcon name={owned?'deed':'wallet'} size={20}/></button><span className="uv-currency b-yarn"><GameIcon name="yarn" size={24}/><YarnBalance/><button aria-label="Get YARN" onClick={()=>openPage('economy')}>+</button></span></>;
}
export function WalletChip(){return Object.values(chainFlags()).some(Boolean)?<ConnectedChip/>:<button className="b-wallet-chip" onClick={()=>openPage('economy')}><i/>Offline</button>;}
export function HomeExtras({onForge,onInvite,onTasks,onEvents=onTasks}:{onForge:()=>void;onInvite:()=>void;onTasks:()=>void;onEvents?:()=>void}){const [now,setNow]=useState(Date.now());useEffect(()=>{void audioEngine.preload('home');audioEngine.music('home');audioEngine.play('ambience.cafe');const id=setInterval(()=>setNow(Date.now()),60000);return()=>{clearInterval(id);audioEngine.stop('ambience.cafe');};},[]);return <><aside className="b-left-events"><button onClick={onInvite}><GameIcon name="invitations" size={48}/><span>Invitations</span></button><button onClick={onForge}><GameIcon name="forge" size={48}/><span>Forge</span></button></aside><aside className="b-right-events"><button className="b-season-banner" onClick={()=>openPage('season')}><GameIcon name="season" size={40}/><span>Season {seasonClock(now).number}<small>{seasonClock(now).days} days</small></span></button><button onClick={onTasks}><GameIcon name="events" size={32}/>Daily quests</button><button onClick={onEvents}><GameIcon name="chest" size={32}/>Events</button></aside></>;}
