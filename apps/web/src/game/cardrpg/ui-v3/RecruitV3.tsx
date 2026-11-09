import {useEffect,useState,type CSSProperties} from 'react';
import {BANNERS,CARD_RPG_CONFIG,emptyPity,getBannerOdds,getDrawPool,type GachaResult} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {firstInvitation} from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import type {DepthModel} from '../depth/model';
import {portraitProps} from '../depth/assets';
import {SelectorV4} from '../depth/SelectorV4';
import {ItemIcon} from '../shared';

type Beat='letter'|'seal'|'burst'|'reveal'|'summary';
const rank={common:0,rare:1,epic:2,legendary:3};
const colors={common:'var(--look-mint)',rare:'var(--look-sky)',epic:'var(--look-iris)',legendary:'var(--look-honey)'};
const name=(r:GachaResult)=>r.cardId?R.CAT_BY_ID[r.cardId]!.name:R.GEAR_BY_ID[r.itemId!]!.name;
function Reward({r}:{r:GachaResult}){return <><div className="uv-recruit-portrait">{r.cardId?<img {...portraitProps(r.cardId)} alt=""/>:<ItemIcon slot={R.GEAR_BY_ID[r.itemId!]!.slot}/>}</div><small>{r.rarity}</small><h2>{name(r)}</h2><p>{!r.duplicate?'New!':r.cardId?`${r.shards} matching shards`:'Added to your bag'}</p></>}
/** The ceremony only reads committed draws. Commands, seeds and odds match Invitations. */
export default function RecruitV3({m}:{m:DepthModel}){
 const [bannerId,setBannerId]=useState('standard'),[results,setResults]=useState<GachaResult[]>([]),[index,setIndex]=useState(0),[beat,setBeat]=useState<Beat>('summary'),[previousPulls,setPreviousPulls]=useState(0),[systemReduced,setSystemReduced]=useState(false);
 const banner=m.state.gameplayV4?R.invitationBannerV4(bannerId):BANNERS.find(b=>b.id===bannerId)!;
 const pity=m.state.account.pity[banner.pityGroup]??emptyPity();
 const odds=m.state.gameplayV4?R.invitationOddsV4(bannerId,pity):getBannerOdds(banner,pity);
 const active=results[index],revealing=results.length>0&&beat!=='summary',reduced=m.state.settings.reducedMotion||systemReduced;
 const cost=banner.cost.stamps!,stamps=m.state.account.currencies.stamps,available=CARD_RPG_CONFIG.maxDrawsPerDay-m.state.account.daily.draws;
 const inRun=!!m.state.run&&!m.state.run.complete,shelfRoom=m.state.gameplayV4&&banner.kind==='equipment'?Math.max(0,R.GEAR_CAP_V4-m.state.gear.length):Infinity;
 useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setSystemReduced(q.matches);update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update)},[]);
 useEffect(()=>{
  if(!revealing)return;if(reduced){setBeat('summary');return;}
  const delay=beat==='letter'?550:beat==='seal'?(active?.rarity==='legendary'?950:650):beat==='burst'?300:1200;
  const timer=setTimeout(()=>{if(beat==='letter')setBeat('seal');else if(beat==='seal')setBeat('burst');else if(beat==='burst')setBeat('reveal');else if(index+1<results.length){setIndex(index+1);setBeat('letter')}else setBeat('summary')},delay);
  return()=>clearTimeout(timer);
 },[revealing,reduced,beat,active?.rarity,index,results.length]);
 function invite(count:number,welcome=false){
  if(revealing)return;
  const seed=m.state.account.seed+pity.totalPulls*101+39,previous=m.state.account.history.length;
  const result=welcome?firstInvitation(m.state,4):R.metaCommand(m.state,{type:'pull',bannerId,count,seed});
  if(!m.apply(result,'Your invitations are here. Find them in your history.'))return;
  setPreviousPulls(previous);setResults(m.state.account.history.slice(-count));setIndex(0);setBeat(reduced?'summary':'letter');
 }
 return <div className="uv-recruit">
  <nav className="uv-tabs" aria-label="Invitation banners">{BANNERS.map(b=><button key={b.id} aria-pressed={b.id===bannerId} disabled={revealing} onClick={()=>{setBannerId(b.id);setResults([])}}>{b.name}</button>)}</nav>
  <div className="uv-recruit-layout"><aside className="uv-recruit-counter"><small>THE LANTERN · INVITATIONS</small><h2>A knock tonight</h2><p>A new face. A new favorite.</p><strong>{stamps.toLocaleString('en-US')} stamps</strong><p className="uv-pity">Legendary within {Math.max(1,banner.hardPity-pity.sinceLegendary)}<br/><small>{pity.sinceLegendary}/{banner.hardPity} pulls</small></p>
   <div className="uv-recruit-buttons">{bannerId==='standard'&&!m.state.freeInvite&&<button className="uv-fight" disabled={revealing||inRun||available<1} onClick={()=>invite(1,true)}>Welcome a friend</button>}<button disabled={revealing||inRun||stamps<cost||available<1||shelfRoom<1} onClick={()=>invite(1)}>Recruit ×1 · {cost}</button><button disabled={revealing||inRun||stamps<cost*10||available<10||shelfRoom<10} onClick={()=>invite(10)}>Recruit ×10 · {cost*10}</button></div>
   <small>{available} invitations left today · Earned stamps only</small>{inRun&&<p>Finish your route to recruit.</p>}{shelfRoom<10&&<p>{shelfRoom} gear spaces free.</p>}
   <details className="uv-odds"><summary>Odds</summary><p>{banner.description}</p><p>Each draw is saved before its reveal. Skipping keeps the same reward. New discoveries are preferred within the rolled rarity and featured group.</p><p>Soft pity starts at {banner.softPity}, adding {banner.softStepBp/100} percentage points per draw. Legendary by {banner.hardPity}; each Legendary resets this banner’s counter. Up to 30 daily invitations.</p>{banner.featuredCardId&&<p>{pity.featuredGuaranteed?'Your next legendary is Marigold.':'Legendary results have a 50% Marigold chance. After a miss, the next legendary is Marigold.'}</p>}
    <table><caption>Published rarity odds</caption><thead><tr><th>Rarity</th><th>Base</th><th>Next pull</th></tr></thead><tbody>{Object.entries(odds).map(([rarity,value])=><tr key={rarity}><th scope="row">{rarity}</th><td>{banner.oddsBp[rarity as keyof typeof odds]/100}%</td><td>{(value/100).toFixed(2)}%</td></tr>)}</tbody></table>
    <details><summary>Exact next-pull probabilities</summary>{(m.state.gameplayV4?R.getDrawPoolV4(m.state,bannerId):getDrawPool(m.state.account,bannerId)).map(item=><p key={item.id}>{R.CAT_BY_ID[item.id]?.name??R.GEAR_BY_ID[item.id]?.name??item.id} · {(item.probability*100).toFixed(4)}%</p>)}</details>
   </details>
  </aside><section className="uv-recruit-stage" aria-label="Invitation reveal" data-beat={beat} data-rarity={active?.rarity} style={{'--reveal-color':colors[active?.rarity??'common']} as CSSProperties}>
   {revealing&&active?<><div className="uv-reveal-toolbar"><span>Invitation {index+1}/{results.length}</span>{results.length>1?<button onClick={()=>setBeat('summary')}>Skip all</button>:(previousPulls>0||index>0)&&<button onClick={()=>setBeat('summary')}>Skip reveal</button>}</div><div className={`uv-ceremony uv-beat-${beat}`} key={`${index}-${beat}`}>
    {beat==='reveal'?<Reward r={active}/>:<><div className="uv-envelope" aria-label={beat==='letter'?'Invitation letter':`${active.rarity} seal`}><span>✉</span><i>☕</i></div>{beat==='burst'&&<div className="uv-recruit-burst" aria-hidden="true">✦　✧　✦<br/>✧　✦　✧</div>}<p>{beat==='letter'?'Someone is at the door…':`${active.rarity} invitation`}</p></>}
   </div></>:results.length?<><h2>Welcome home</h2><div className="uv-recruit-summary" aria-label="Invitation results">{[...results].sort((a,b)=>rank[b.rarity]-rank[a.rarity]).map((r,i)=><article key={`${r.index}-${i}`} style={{'--reveal-color':colors[r.rarity]} as CSSProperties}><Reward r={r}/></article>)}</div><button onClick={()=>m.go(banner.kind==='cat'?'collection':'inventory')}>{banner.kind==='cat'?'Meet your cats':'Open your bag'}</button></>:<div className="uv-recruit-welcome"><img {...portraitProps(banner.featuredCardId??'clover')} alt=""/><h2>Save a seat</h2><p>Your next companion is one invitation away.</p></div>}
  </section></div>
  <details className="uv-recruit-extras"><summary>Recent invitations ({m.state.account.history.length})</summary><div className="uv-history">{[...m.state.account.history].reverse().map((r,i)=><p key={i}>{name(r)} · {r.rarity} · {r.duplicate?`${r.shards??0} shards`:'New'} · {r.bannerId} #{r.index}</p>)}</div></details>
  {m.state.gameplayV4&&<details className="uv-recruit-extras"><summary>Choose with marks</summary><p>{R.SELECTOR_COST_V4} marks choose one reward. Welcome invitations add no marks.</p><SelectorV4 m={m}/></details>}
 </div>
}
