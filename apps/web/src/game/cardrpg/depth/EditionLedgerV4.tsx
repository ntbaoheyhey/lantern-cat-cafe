import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
export function EditionLedgerV4({m}:{m:DepthModel}) {
 const [now,setNow]=useState(()=>Date.now()),[selected,setSelected]=useState<string[]>([]);
 let ledger:R.IssuanceLedger;
 try{ledger=R.editionLedgerV4(m.state,now);}catch(error){return <section className="cr-panel dp-v4-editions"><h2>Local edition ledger</h2><p>Design only - not minted</p><p>{error instanceof Error?error.message:'Legacy supply needs review before new issuance.'}</p></section>;}
 const accountId=R.localEditionAccount(m.state),context=R.editionContextV4(m.state,ledger,now),season=new Date(now).toISOString().slice(0,7);
 const base={accountId,expectedRevision:ledger.revision,commandId:`local:${ledger.revision}`};
 const submit=(command:R.IssuanceCommand)=>{m.apply(R.issueEditionV4(m.state,command,Date.now()),'Local edition receipt saved. No NFT was minted; battle power is unchanged.');setSelected([]);setNow(Date.now());};
 const mine=ledger.reservations.filter(r=>r.accountId===accountId),home=!m.state.run||m.state.run.complete;
 return <section className="cr-panel dp-v4-editions" aria-label="Local edition ledger">
  <h2>An edition of your cafe story</h2><p><strong>Design only - not minted</strong> · Local authority preview</p>
  <p>Season {ledger.currentSeason} · Revision {ledger.revision} · {m.state.seals} unspent boss seals · 0 battle stats, skills or odds.</p>
  <p>These are supply counters inside this save. Copied saves do not share a global authority. Reservations and fusion badges are account-bound in this preview.</p>
  <button onClick={()=>setNow(Date.now())}>Refresh local supply</button>
  {season>ledger.currentSeason&&<button disabled={!home} onClick={()=>submit({...base,kind:'advance-season'})}>Advance to season {season}</button>}
  <div className="dp-design-grid">{(Object.keys(R.EDITIONS) as R.EditionId[]).map(edition=>{
   const spec=R.EDITIONS[edition],command:R.IssuanceCommand={...base,kind:'reserve',edition},preview=R.applyIssuance(ledger,command,context);
   return <article key={edition} aria-label={spec.name}><h3>{spec.name}</h3>
    <p>Lifetime issued {ledger.lifetimeIssued[edition]} / {spec.lifetime}<br/>Season issued {ledger.seasonIssued[ledger.currentSeason]![edition]} / {spec.season}</p>
    <p>Consumes {spec.seals} distinct boss-day seals; {edition==='moon-collar'?'chapter one clear':'all three masteries or Tower floor five'} required.</p>
    <p>One per edition per season; one reservation per UTC day. Burns do not reopen supply or spent effort.</p>
    <p>{!home?'Finish your route first.':preview.ok?'Your effort qualifies.':preview.error}</p>
    <button disabled={!home||!preview.ok} onClick={()=>submit(command)}>Reserve {spec.name} · {spec.seals} seals</button>
   </article>;
  })}</div>
  <h3>My local records</h3>{mine.length===0?<p>No local reservations yet.</p>:mine.map(r=><div key={r.id} className="dp-edition-record">
   <p>{R.EDITIONS[r.edition].name} · {r.season} · {r.id} · <strong>{r.status}</strong>{r.legacy?' · legacy local record':''}</p>
   {r.status==='live'&&<><button disabled={!home} onClick={()=>submit({...base,kind:'burn',reservationId:r.id})}>Burn local record {r.id}</button>
    {r.edition==='moon-collar'&&<label><input type="checkbox" checked={selected.includes(r.id)} onChange={e=>setSelected(e.target.checked?[...selected,r.id]:selected.filter(id=>id!==r.id))}/> Use {r.id} for fusion</label>}</>}
  </div>)}
  <p>Two live Moon Collars from different seasons become one commemorative badge. Both records become fused; no new edition or combat power is created.</p>
  <button disabled={!home||selected.length!==2||ledger.badges.includes(accountId)} onClick={()=>submit({...base,kind:'fuse',reservationIds:selected as [string,string]})}>Fuse two seasons into a badge</button>
  {ledger.badges.includes(accountId)&&<p>Commemorative cafe badge collected · 0 battle power</p>}
  <details><summary>Read issuance receipts ({ledger.events.length})</summary>{ledger.events.map(e=><p key={e.sequence}>#{e.sequence} · {e.command.kind} · {new Date(e.context.now).toISOString()} · {e.reservationId??e.command.commandId} · {e.proofIds.length} seals consumed{e.context.effort.some(p=>p.source==='legacy-local')?' · legacy local effort':''}</p>)}</details>
 </section>;
}
