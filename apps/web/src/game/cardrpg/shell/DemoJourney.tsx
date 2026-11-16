import {useEffect,useMemo,useRef,useState} from 'react';
import {useWalletClient} from 'wagmi';
import type {Address,Hash} from 'viem';
import {CAT_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {useSession} from '../../../wallet/WalletProvider';
import type {DepthModel} from '../depth/model';
import {chainRuntime,loadChainConfig,txLink,type ChainConfig} from '../chain/runtime';
import {existingGuestAddress,guestClient} from '../chain/guest';
import {journeyClient} from '../chain/journey-client';
import {DemoWorkshop} from './DemoWorkshop';
import {openChainRoom} from '../chain/ChainRoom';
import {friendlyError} from '../chain/errors';
import {CombatClassBadge} from '../ui-v3/CombatClassBadge';
import {artPropsA6} from '../ui-v3/art-a6';
import {PaintedButton} from './PaintedKit';
import './demo-journey.css';

type Phase='intro'|'intro-battle'|'reward'|'cafe'|'finale-battle'|'proof';
const crew=['mochi','panko','soot','clover'];
export default function DemoJourney({m}:{m:DepthModel}) {
  const session=useSession();
  return session?<Journey key={session.wallet.toLowerCase()} m={m} token={session.token} address={session.wallet as Address}/>:<p role="status">Sign in to start the trial.</p>;
}
function Journey({m,token,address}:{m:DepthModel;token:string;address:Address}) {
  const key=`lantern.ship.journey:${address.toLowerCase()}`;
  const [phase,setPhase]=useState<Phase>(()=>{
    try{const saved=localStorage.getItem(key);return ['reward','cafe','proof'].includes(saved??'')?saved as Phase:'intro';}catch{return 'intro';}
  });
  const [config,setConfig]=useState<ChainConfig>(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[hash,setHash]=useState<Hash>();
  const {data:externalWallet}=useWalletClient(),lock=useRef(false),mounted=useRef(true);
  const runtime=useMemo(()=>{
    if(!config)return;
    const wallet=existingGuestAddress()?.toLowerCase()===address.toLowerCase()?guestClient(config.rpcUrl):externalWallet;
    if(wallet?.account?.address.toLowerCase()!==address.toLowerCase())return;
    return chainRuntime(config,wallet,address);
  },[config,address,externalWallet]);
  const client=useMemo(()=>config&&runtime?journeyClient(config,runtime,token,address):undefined,[config,runtime,token,address]);
  const advance=(next:Phase)=>{
    setPhase(next);try{localStorage.setItem(key,next);}catch{/* Chain state remains authoritative. */}
  };
  const run=async(action:()=>Promise<void>)=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await action();}catch(e){if(mounted.current)setError(friendlyError(e));}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
  };
  const connect=async()=>{const c=await loadChainConfig();if(mounted.current)setConfig(c);};
  useEffect(()=>{mounted.current=true;void run(connect);return()=>{mounted.current=false;};},[]);
  useEffect(()=>()=>runtime?.silenceSounds(),[runtime]);
  useEffect(()=>{
    if(!phase.endsWith('-battle')||m.showBattle)return;
    if(m.replay?.result==='party'){
      const next=phase==='intro-battle'?'reward':'proof';m.finish();advance(next);
    }else if(!m.replay){advance(phase==='intro-battle'?'intro':'cafe');}
  },[phase,m.showBattle,m.replay?.result]);
  const battle=async(finale:boolean)=>{
    if(!client)throw Error('Wallet unavailable.');
    const trial=await client.trial(finale?'finale':'intro');
    if(!mounted.current)return;
    if(!trial.battle.won||!m.replayEncounter(trial.battle.replay.setup,trial.battle.replay.choices))throw Error('Trial unavailable. Retry.');
    advance(finale?'finale-battle':'intro-battle');
  };
  const battleActive=phase.endsWith('-battle');
  return <main className="ship-journey" aria-label="Café trial" aria-hidden={battleActive} inert={battleActive} data-journey-phase={phase}>
    <header><strong>Lantern Cat Café</strong><span>Fuji testnet · Demo rewards · No real value</span><button onClick={()=>window.dispatchEvent(new Event('chain:wallet'))}>Wallet</button></header>
    <nav aria-label="Trial progress">{['Battle','Reward','Café','Boss','Proof'].map((label,i)=><span key={label} aria-current={i===(phase==='intro'?0:phase==='reward'?1:phase==='cafe'?2:phase==='proof'?4:3)?'step':undefined}>{label}</span>)}</nav>
    {(phase==='intro'||phase==='reward')&&<section className="ship-trial-card">
      <h1>{phase==='intro'?'Guard the café':'Your first relic'}</h1>
      <p>{phase==='intro'?'Four cats. One giant. Win a testnet relic.':'Mint your trial reward on Avalanche. The café supplies test gas.'}</p>
      <div className="ship-crew">{crew.map(id=><figure key={id}><img {...artPropsA6(id)} alt=""/><figcaption>{CAT_BY_ID[id]!.name}<CombatClassBadge combatClass={CAT_BY_ID[id]!.combatClass}/></figcaption></figure>)}</div>
      <PaintedButton icon={phase==='intro'?'quest':'mint'} disabled={busy||!client} onClick={()=>void run(async()=>{
        if(phase==='intro')await battle(false);
        else{const receipt=await client!.mintFirstReward();if(mounted.current){setHash(receipt);advance('cafe');window.dispatchEvent(new Event('chain:changed'));}}
      })}>{phase==='intro'?'Start trial':'Mint trial reward'}</PaintedButton>
    </section>}
    {phase==='cafe'&&config&&runtime&&<DemoWorkshop address={address} token={token} config={config} runtime={runtime} onBoss={()=>battle(true)}/>}
    {phase==='proof'&&<section className="ship-trial-card"><h1>My café on Avalanche</h1><p>Your trial rematch is complete. Explore your wallet’s assets and transactions.</p><PaintedButton icon="history" onClick={()=>openChainRoom('History')}>Open wallet history</PaintedButton><button onClick={()=>advance('cafe')}>Back to café</button></section>}
    {hash&&<a className="ship-receipt" href={txLink(hash)} target="_blank" rel="noreferrer">Reward transaction · Snowtrace</a>}
    {busy&&<p role="status">{config?'Preparing…':'Connecting…'}</p>}
    {error&&<div role="alert"><p>{error}</p>{!config&&<button disabled={busy} onClick={()=>void run(connect)}>Retry connection</button>}</div>}
  </main>;
}
