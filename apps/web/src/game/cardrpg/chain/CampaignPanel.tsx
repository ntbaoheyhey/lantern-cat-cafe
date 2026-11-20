import {GameIcon} from '../../../ui/GameIcon';
import {useEffect,useMemo,useRef,useState} from 'react';
import type {CampaignCommand,CampaignView,CampaignResponse} from '@taskbar-hero/chain';
import {TRADE_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import {chainPost} from './api';
import {campaignClient} from './campaign-client';
import {friendlyError} from './errors';
import {chainFlags} from './flags';
export function CampaignPanel({wallet,token,onSeal}:{wallet:string;token:string;onSeal:()=>void}){
  const client=useMemo(()=>campaignClient(wallet,body=>chainPost<CampaignResponse>('chain-campaign',token,body)),[wallet,token]);
  const [view,setView]=useState<CampaignView>(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [section,setSection]=useState('Route'),[index,setIndex]=useState(0),[confirm,setConfirm]=useState(false),[exported,setExported]=useState(false);
  const lock=useRef(false);
  const v3=chainFlags().economyV3;
  useEffect(()=>{let current=true;setView(undefined);setExported(false);setBusy(true);
    void client.load().then(r=>{if(current)setView(r.view);}).catch(e=>{if(current)setError(friendlyError(e));}).finally(()=>{if(current)setBusy(false);});
    return()=>{current=false;};
  },[client]);
  const run=async(command?:CampaignCommand)=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{const result=command&&view?await client.command(view.revision,command):await client.load();
      setView(result.view);if(result.receipt?.inventory)setExported(true);setConfirm(false);
    }catch(e){setError(friendlyError(e));}finally{lock.current=false;setBusy(false);}
  };
  const transfer=async(instance:string)=>{
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    const key=`lantern.v3.import:${wallet}:${instance}`;
    try{let id=localStorage.getItem(key);if(!id){id=crypto.randomUUID();localStorage.setItem(key,id);}
      await chainPost('chain-economy-v3',token,{id,command:{action:'import',instance}});
      localStorage.removeItem(key);setExported(true);setConfirm(false);setView((await client.load()).view);
    }catch(e){setError(friendlyError(e));}finally{lock.current=false;setBusy(false);}
  };
  const home=view&&['home','won','lost'].includes(view.phase);
  const eligible=view?.gear.filter(g=>g.eligible)??[],gear=eligible[Math.min(index,Math.max(0,eligible.length-1))];
  return <section className="chain-campaign" aria-label="Campaign" aria-busy={busy}>
    <div className="chain-campaign-tabs">{['Route','Crew','Export'].map(s=><button key={s} aria-pressed={section===s} onClick={()=>{setSection(s);setConfirm(false);}}>{s}</button>)}<button aria-label="Refresh campaign" disabled={busy} onClick={()=>void run()}><GameIcon name="refresh" size={18}/></button></div>
    {view&&<output data-testid="campaign-progress" aria-label="Campaign progress" data-revision={view.revision} data-phase={view.phase}><GameIcon name="clock" size={18}/> {view.remaining}/6 · {view.steps}/7</output>}
    {view&&section==='Route'&&<>
      <div className="chain-campaign-path" aria-hidden="true">{Array.from({length:7},(_,i)=><span key={i} data-done={i<view.steps}><GameIcon name={i<view.steps?'relic':'bag'} size={18}/></span>)}</div>
      {view.phase==='won'&&<p><GameIcon name="check" size={18}/> Victory</p>}{view.phase==='lost'&&<p><GameIcon name="arrow-left" size={18}/> Defeat</p>}
      <div className="chain-campaign-actions">{view.choices.map((c,i)=><button key={i} data-testid="campaign-choice" data-command={c.command.type} disabled={busy} onClick={()=>void run(c.command)}>{c.label}</button>)}</div>
      {view.choices.some(c=>c.hint)&&<details><summary>?</summary>{view.choices.filter(c=>c.hint).map((c,i)=><p key={i}><b>{c.label}</b>: {c.hint}</p>)}</details>}
      {!home&&<button disabled={busy} onClick={()=>void run({type:'abandon'})}><GameIcon name="arrow-left" size={18}/> Abandon</button>}
      {home&&<button disabled={busy} onClick={()=>void run({type:'idle'})}><GameIcon name="home" size={18}/> Collect</button>}
    </>}
    {view&&section==='Crew'&&<div className="chain-campaign-crew">{view.crew.map(c=><article key={c.id}><strong>{c.id}</strong><output>{c.level}</output><button aria-label={`Train ${c.id}`} disabled={busy||!home} onClick={()=>void run({type:'level',cat:c.id})}><GameIcon name="upgrade" size={18}/></button></article>)}</div>}
    {view&&section==='Export'&&<>
      {gear?<article className="chain-campaign-item" data-testid="campaign-export" data-item={gear.item}>
        <img src="/chain/sealed-gear.svg" alt=""/><strong>{TRADE_BY_ID[gear.item]?.name??gear.item}</strong>
        {!confirm?<button disabled={busy} onClick={()=>setConfirm(true)}><GameIcon name="upgrade" size={18}/> Export</button>:<><p>{v3?'Move to café. Keep quality.':'Remove forever. Reset rolls.'}</p><button disabled={busy} onClick={()=>void (v3?transfer(gear.instance):run({type:'export',instance:gear.instance,normalization:'depth-min-roll-v1'}))}><GameIcon name="check" size={18}/> Confirm</button><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></>}
      </article>:<p>—</p>}
      {eligible.length>1&&<div><button aria-label="Previous export" disabled={index===0} onClick={()=>{setIndex(i=>i-1);setConfirm(false);}}><GameIcon name="arrow-left" size={18}/></button><output>{Math.min(index+1,eligible.length)}/{eligible.length}</output><button aria-label="Next export" disabled={index+1>=eligible.length} onClick={()=>{setIndex(i=>i+1);setConfirm(false);}}><GameIcon name="arrow" size={18}/></button></div>}
      {exported&&<button onClick={onSeal}><GameIcon name="season" size={18}/> Seal</button>}
      <details><summary>?</summary><p>Only server-earned, unequipped Epic+ items can move. Finish your route first.</p><p>{v3?'Export moves the item into your café. Sealing snaps to its quality bucket and clears enhancement.':'Export removes the campaign copy permanently. Sealing uses minimum rolls and clears enhancements.'}</p></details>
    </>}
    {error&&<p role="alert">{error}</p>}
  </section>;
}
