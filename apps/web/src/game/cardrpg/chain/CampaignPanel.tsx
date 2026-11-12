import {useEffect,useMemo,useRef,useState} from 'react';
import type {CampaignCommand,CampaignView,CampaignResponse} from '@taskbar-hero/chain';
import {TRADE_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import {chainPost} from './api';
import {campaignClient} from './campaign-client';
import {friendlyError} from './errors';
export function CampaignPanel({wallet,token,onSeal}:{wallet:string;token:string;onSeal:()=>void}){
  const client=useMemo(()=>campaignClient(wallet,body=>chainPost<CampaignResponse>('chain-campaign',token,body)),[wallet,token]);
  const [view,setView]=useState<CampaignView>(),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [section,setSection]=useState('Route'),[index,setIndex]=useState(0),[confirm,setConfirm]=useState(false),[exported,setExported]=useState(false);
  const lock=useRef(false);
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
  const home=view&&['home','won','lost'].includes(view.phase);
  const eligible=view?.gear.filter(g=>g.eligible)??[],gear=eligible[Math.min(index,Math.max(0,eligible.length-1))];
  return <section className="chain-campaign" aria-label="Campaign" aria-busy={busy}>
    <div className="chain-campaign-tabs">{['Route','Crew','Export'].map(s=><button key={s} aria-pressed={section===s} onClick={()=>{setSection(s);setConfirm(false);}}>{s}</button>)}<button aria-label="Refresh campaign" disabled={busy} onClick={()=>void run()}>↻</button></div>
    {view&&<output data-testid="campaign-progress" aria-label="Campaign progress" data-revision={view.revision} data-phase={view.phase}>◷ {view.remaining}/6 · {view.steps}/7</output>}
    {view&&section==='Route'&&<>
      <div className="chain-campaign-path" aria-hidden="true">{Array.from({length:7},(_,i)=><span key={i} data-done={i<view.steps}>{i<view.steps?'◆':'◇'}</span>)}</div>
      {view.phase==='won'&&<p>✓ Victory</p>}{view.phase==='lost'&&<p>↩ Defeat</p>}
      <div className="chain-campaign-actions">{view.choices.map((c,i)=><button key={i} data-testid="campaign-choice" data-command={c.command.type} disabled={busy} onClick={()=>void run(c.command)}>{c.label}</button>)}</div>
      {view.choices.some(c=>c.hint)&&<details><summary>?</summary>{view.choices.filter(c=>c.hint).map((c,i)=><p key={i}><b>{c.label}</b>: {c.hint}</p>)}</details>}
      {!home&&<button disabled={busy} onClick={()=>void run({type:'abandon'})}>↩ Abandon</button>}
      {home&&<button disabled={busy} onClick={()=>void run({type:'idle'})}>☕ Collect</button>}
    </>}
    {view&&section==='Crew'&&<div className="chain-campaign-crew">{view.crew.map(c=><article key={c.id}><strong>{c.id}</strong><output>{c.level}</output><button aria-label={`Train ${c.id}`} disabled={busy||!home} onClick={()=>void run({type:'level',cat:c.id})}>↑</button></article>)}</div>}
    {view&&section==='Export'&&<>
      {gear?<article className="chain-campaign-item" data-testid="campaign-export" data-item={gear.item}>
        <img src="/chain/sealed-gear.svg" alt=""/><strong>{TRADE_BY_ID[gear.item]?.name??gear.item}</strong>
        {!confirm?<button disabled={busy} onClick={()=>setConfirm(true)}>↑ Export</button>:<><p>Remove forever. Reset rolls.</p><button disabled={busy} onClick={()=>void run({type:'export',instance:gear.instance,normalization:'depth-min-roll-v1'})}>✓ Confirm</button><button disabled={busy} onClick={()=>setConfirm(false)}>Cancel</button></>}
      </article>:<p>—</p>}
      {eligible.length>1&&<div><button aria-label="Previous export" disabled={index===0} onClick={()=>{setIndex(i=>i-1);setConfirm(false);}}>←</button><output>{Math.min(index+1,eligible.length)}/{eligible.length}</output><button aria-label="Next export" disabled={index+1>=eligible.length} onClick={()=>{setIndex(i=>i+1);setConfirm(false);}}>→</button></div>}
      {exported&&<button onClick={onSeal}>✦ Seal</button>}
      <details><summary>?</summary><p>Only server-earned, unequipped Epic+ items can move. Export removes the campaign copy permanently. Sealing uses minimum rolls and clears enhancements. Finish your route first.</p></details>
    </>}
    {error&&<p role="alert">{error}</p>}
  </section>;
}
