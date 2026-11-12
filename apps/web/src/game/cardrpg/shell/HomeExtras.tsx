import {useEffect,useState} from 'react';
import {useSession} from '../../../wallet/WalletProvider';
import {GameIcon} from '../../../ui/GameIcon';
import {chainFlags} from '../chain/flags';
import {YarnBalance} from '../chain/YarnBalance';
import {audioEngine} from '../../../audio/engine';
export const openPage=(page:string)=>window.dispatchEvent(new CustomEvent('shell:page',{detail:page}));
export {v3Season as seasonClock} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {v3Season as seasonClock} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
function ConnectedChip(){const session=useSession();return <><button className="b-wallet-chip" onClick={()=>window.dispatchEvent(new Event('chain:wallet'))}><i/>{session?`${session.wallet.slice(0,6)}…${session.wallet.slice(-4)}`:'Wallet'}<GameIcon name="wallet" size={20}/></button><span className="uv-currency b-yarn"><GameIcon name="yarn" size={24}/><YarnBalance/><button aria-label="Get YARN" onClick={()=>openPage('economy')}>+</button></span></>;}
export function WalletChip(){return Object.values(chainFlags()).some(Boolean)?<ConnectedChip/>:<button className="b-wallet-chip" onClick={()=>openPage('economy')}><i/>Offline</button>;}
export function HomeExtras({onForge,onInvite,onTasks}:{onForge:()=>void;onInvite:()=>void;onTasks:()=>void}){const [now,setNow]=useState(Date.now());useEffect(()=>{void audioEngine.preload('home');audioEngine.music('home');audioEngine.play('ambience.cafe');const id=setInterval(()=>setNow(Date.now()),60000);return()=>{clearInterval(id);audioEngine.stop('ambience.cafe');};},[]);return <><aside className="b-left-events"><button onClick={onInvite}><GameIcon name="invitations" size={48}/><span>Invitations</span></button><button onClick={onForge}><GameIcon name="forge" size={48}/><span>Forge</span></button></aside><aside className="b-right-events"><button className="b-season-banner" onClick={()=>openPage('season')}><GameIcon name="season" size={40}/><span>Season {seasonClock(now).number}<small>{seasonClock(now).days} days</small></span></button><button onClick={onTasks}><GameIcon name="events" size={32}/>Daily quests</button><button onClick={onTasks}><GameIcon name="chest" size={32}/>Events</button></aside></>;}
