import {GameIcon} from '../../../ui/GameIcon';
import {RecruitOddsC2} from './OddsC2';
import {HelpC2,useTextDiet} from './TextDietC2';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import {BANNERS,CARD_RPG_CONFIG,emptyPity,getBannerOdds,getDrawPool,type GachaResult} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {firstInvitation} from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import type {DepthModel} from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import {SelectorV4} from '../depth/SelectorV4';
import {ItemIcon} from '../shared';
import {CountUpA6} from './CountUpA6';
import {RecruitActionsA6} from './RecruitActionsA6';
import {GearArtA6} from './KeepsakeArtA6';
import './recruit-a6.css';

type Beat='letter'|'seal'|'burst'|'reveal'|'summary';
const rank={common:0,rare:1,epic:2,legendary:3};
const colors={common:'var(--look-mint)',rare:'var(--look-sky)',epic:'var(--look-iris)',legendary:'var(--look-honey)'};
const name=(r:GachaResult)=>r.cardId?R.CAT_BY_ID[r.cardId]!.name:R.GEAR_BY_ID[r.itemId!]!.name;
function Reward({r,a6=false,reduced=false}:{r:GachaResult;a6?:boolean;reduced?:boolean}){const compact=useTextDiet();if(compact)return <div className="b2-gacha-reward" aria-label={`${name(r)}, ${r.rarity}, ${r.duplicate?`${r.shards??0} shards`:'New'}`}><div className="uv-recruit-portrait">{r.cardId?<img {...portraitProps(r.cardId)} alt=""/>:<GearArtA6 slot={R.GEAR_BY_ID[r.itemId!]!.slot} setId={R.GEAR_BY_ID[r.itemId!]!.setId}/>}</div><h2>{r.cardId?name(r):R.GEAR_BY_ID[r.itemId!]!.setId}</h2>{r.duplicate?<span className="b2-gacha-shards"><GameIcon name="shard" size={24}/>+{r.shards??0}</span>:<img className="b2-gacha-new" src="/art/v3-shell/b2/tag-new.webp" alt="New"/>}</div>;return <><div className="uv-recruit-portrait">{r.cardId?<img {...portraitProps(r.cardId)} alt=""/>:a6?<GearArtA6 slot={R.GEAR_BY_ID[r.itemId!]!.slot} setId={R.GEAR_BY_ID[r.itemId!]!.setId}/>:<ItemIcon slot={R.GEAR_BY_ID[r.itemId!]!.slot}/>}</div><small className="a6-reward-rarity">{r.rarity}</small><h2>{name(r)}</h2>{a6&&r.cardId&&!r.duplicate&&<span className="a6-reward-stars" aria-label="1 star"><GameIcon name="season" size={18}/></span>}<p className={!r.duplicate?'a6-new-stamp':'a6-shard-reward'}>{!r.duplicate?'New!':r.cardId?<>{a6&&<span aria-hidden="true"><GameIcon name="season" size={18}/> +</span>}{a6?<CountUpA6 value={r.shards??0} from={0} reducedMotion={reduced}/>:r.shards} matching shards</>:'Added to your bag'}</p></>}
function RevealParticles(){return <div className="a6-reveal-particles" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--spark-angle':`${i*20}deg`,'--spark-radius':`${170+i%4*38}px`,'--spark-delay':`${i%5*90}ms`} as CSSProperties}><GameIcon name="season" size={18}/></i>)}</div>}
/** The ceremony only reads committed draws. Commands, seeds and odds match Invitations. */
export default function RecruitV3({m}:{m:DepthModel}){
 const counter=useRef<HTMLDivElement>(null),summaryTitle=useRef<HTMLHeadingElement>(null);
 const [bannerId,setBannerId]=useState('standard'),[results,setResults]=useState<GachaResult[]>([]),[index,setIndex]=useState(0),[beat,setBeat]=useState<Beat>('summary'),[previousPulls,setPreviousPulls]=useState(0),[systemReduced,setSystemReduced]=useState(false);
 const a6=R.gameplayA6(m.state);
 const banner=m.state.gameplayV4?R.invitationBannerV4(bannerId,m.state):BANNERS.find(b=>b.id===bannerId)!;
 const pity=m.state.account.pity[banner.pityGroup]??emptyPity();
 const odds=m.state.gameplayV4?R.invitationOddsV4(bannerId,pity,m.state):getBannerOdds(banner,pity);
 const ordered=[...results].sort((a,b)=>rank[a.rarity]-rank[b.rarity]);
 const highlight=[...ordered].reverse().find(r=>!r.duplicate&&rank[r.rarity]>=2)??ordered.at(-1);
 const active=a6?highlight:results[index],revealing=results.length>0&&beat!=='summary',reduced=m.state.settings.reducedMotion||systemReduced;
 const splash=a6&&beat==='reveal'&&!!active&&rank[active.rarity]>=2;
 const cost=banner.cost.stamps!,stamps=m.state.account.currencies.stamps,available=CARD_RPG_CONFIG.maxDrawsPerDay-m.state.account.daily.draws;
 const inRun=!!m.state.run&&!m.state.run.complete,shelfRoom=m.state.gameplayV4&&banner.kind==='equipment'?Math.max(0,R.GEAR_CAP_V4-m.state.gear.length):Infinity;
 useEffect(()=>{
  if(!a6||beat!=='summary'||!results.length)return;
  // A portal reveal or an earlier visit can leave this scrollable sheet halfway down.
  // Return to the complete reward grid and restore keyboard focus after the reveal.
  counter.current?.closest<HTMLElement>('.uv-sheet-content')?.scrollTo?.({top:0,behavior:'instant'});
  summaryTitle.current?.focus({preventScroll:true});
 },[a6,beat,results]);
 useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setSystemReduced(q.matches);update();q.addEventListener('change',update);return()=>q.removeEventListener('change',update)},[]);
 useEffect(()=>{
  if(!revealing)return;if(reduced){setBeat('summary');return;}
  if(a6){
   const delays={letter:600,seal:900,burst:1400,reveal:2500,summary:0};
   const timer=setTimeout(()=>setBeat(beat==='letter'?'seal':beat==='seal'?'burst':beat==='burst'?'reveal':'summary'),delays[beat]);
   return()=>clearTimeout(timer);
  }
  const delay=beat==='letter'?550:beat==='seal'?(active?.rarity==='legendary'?950:650):beat==='burst'?300:1200;
  const timer=setTimeout(()=>{if(beat==='letter')setBeat('seal');else if(beat==='seal')setBeat('burst');else if(beat==='burst')setBeat('reveal');else if(index+1<results.length){setIndex(index+1);setBeat('letter')}else setBeat('summary')},delay);
  return()=>clearTimeout(timer);
 },[a6,revealing,reduced,beat,active?.rarity,index,results.length]);
 function invite(count:number,welcome=false){
  if(revealing)return;
  const currentPity=m.state.account.pity[banner.pityGroup]??emptyPity();
  const seed=m.state.account.seed+currentPity.totalPulls*101+39,previous=m.state.account.history.length;
  const result=welcome?firstInvitation(m.state,4):R.metaCommand(m.state,{type:'pull',bannerId,count,seed});
  if(!m.apply(result,a6&&welcome?'Your free friend is here. Next, level up a cat in Cats.':'Your invitations are here. Find them in your history.'))return;
  setPreviousPulls(previous);setResults(m.state.account.history.slice(-count));setIndex(0);setBeat(reduced?'summary':'letter');
 }
 const revealStage=<section className="uv-recruit-stage" aria-label="Invitation reveal" role={splash?"dialog":undefined} aria-modal={splash||undefined} onKeyDown={event=>{if(!splash)return;if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setBeat('summary');}if(event.key==='Tab'){event.preventDefault();event.stopPropagation();}}} data-beat={beat} data-splash={splash||undefined} data-rarity={active?.rarity} style={{'--reveal-color':a6?`var(--a6-${active?.rarity??'common'})`:colors[active?.rarity??'common']} as CSSProperties}>
   {revealing&&active?<><div className="uv-reveal-toolbar"><span>{a6?`${results.length} invitation${results.length>1?'s':''}`:`Invitation ${index+1}/${results.length}`}</span>{a6?<button autoFocus={splash} disabled={beat==='letter'} onClick={()=>setBeat('summary')}><GameIcon name="arrow" size={20}/>{results.length>1?'Skip all':'Skip reveal'}</button>:results.length>1?<button onClick={()=>setBeat('summary')}>Skip all</button>:(previousPulls>0||index>0)&&<button onClick={()=>setBeat('summary')}>Skip reveal</button>}</div>{a6?<div className={`uv-ceremony a6-recruit-batch a6-recruit-${beat}`} key={beat}>
    {beat==='reveal'?<div className="a6-recruit-highlight"><small>{!active.cardId?'A KEEPSAKE FOR THE JOURNEY':!active.duplicate&&rank[active.rarity]>=2?'A NEW FRIEND TO REMEMBER':'A WARM WELCOME'}</small><RevealParticles/><Reward r={active} a6 reduced={reduced}/><span className="a6-reveal-flavour">{active.cardId?R.CAT_BY_ID[active.cardId]!.role:'A keepsake for your next adventure'}</span></div>:<><p>{beat==='letter'?'A seat for every story.':beat==='seal'?'The lanterns are lighting up…':banner.kind==='equipment'?'Your keepsakes are ready.':'Your guests have arrived.'}</p><div className="a6-recruit-cards" data-count={results.length}>{ordered.map((r,i)=><article key={r.index} style={{'--reveal-color':beat==='letter'?'#c2a369':`var(--a6-${r.rarity})`,'--card-delay':`${i*(beat==='letter'?25:80)}ms`} as CSSProperties} data-rarity={beat==='letter'?undefined:r.rarity}>
      {beat==='burst'?<Reward r={r} a6={a6} reduced={reduced}/>:<div className="a6-recruit-back" aria-label={beat==='letter'?'Sealed invitation':`${r.rarity} invitation`}><span aria-hidden="true"><GameIcon name="season" size={18}/></span><b>{m.state.formationC2?<GameIcon name={beat==='letter'?'invitations':'season'} size={32}/>:beat==='letter'?'The Lantern':r.rarity}</b></div>}
    </article>)}</div></>}
   </div>:<div className={`uv-ceremony uv-beat-${beat}`} key={`${index}-${beat}`}>
    {beat==='reveal'?<Reward r={active}/>:<><div className="uv-envelope" aria-label={beat==='letter'?'Invitation letter':`${active.rarity} seal`}><span><GameIcon name="invitations" size={18}/></span><i><GameIcon name="home" size={18}/></i></div>{beat==='burst'&&<div className="uv-recruit-burst" aria-hidden="true"><GameIcon name="season" size={18}/>　<GameIcon name="season" size={18}/>　<GameIcon name="season" size={18}/><br/><GameIcon name="season" size={18}/>　<GameIcon name="season" size={18}/>　<GameIcon name="season" size={18}/></div>}<p>{beat==='letter'?'Someone is at the door…':`${active.rarity} invitation`}</p></>}
   </div>}</>:results.length?<><h2 ref={summaryTitle} tabIndex={-1}>Welcome home</h2><div className="uv-recruit-summary" aria-label="Invitation results">{[...results].sort((a,b)=>rank[b.rarity]-rank[a.rarity]).map((r,i)=><article key={`${r.index}-${i}`} data-kind={r.cardId?'cat':'gear'} data-rarity={r.rarity} style={{'--reveal-color':a6?`var(--a6-${r.rarity})`:colors[r.rarity]} as CSSProperties}><Reward r={r} a6={a6} reduced={reduced}/></article>)}</div><button className={a6?"cr-primary":undefined} onClick={()=>m.go(banner.kind==='cat'?'collection':'inventory')}>{m.state.formationC2?<><GameIcon name={banner.kind==='cat'?'cats':'bag'}/>{banner.kind==='cat'?'Cats':'Bag'}</>:banner.kind==='cat'?'Meet your cats':'Open your bag'}</button></>:<div className="uv-recruit-welcome">{a6&&banner.kind==='equipment'?<GearArtA6 slot="weapon" setId="hearthloom"/>:<img {...portraitProps(banner.featuredCardId??'clover')} alt=""/>}<h2>{a6&&banner.kind==='equipment'?'Pack a keepsake':'Save a seat'}</h2><p>{a6&&banner.kind==='equipment'?'One new gear piece per invitation, added unequipped.':'Your next companion is one invitation away.'}</p></div>}
  </section>;
 return <div ref={counter} className="uv-recruit" data-a6={a6} data-reduced={reduced} inert={splash||undefined} aria-hidden={splash||undefined}>
  <nav className="uv-tabs" aria-label="Invitation banners">{BANNERS.map(b=><button key={b.id} aria-pressed={b.id===bannerId} disabled={revealing} onClick={()=>{setBannerId(b.id);setResults([])}} aria-label={b.name}>{m.state.formationC2?<GameIcon name={({standard:'home',featured:'season',equipment:'forge'} as Record<string,string>)[b.id]??'invitations'} size={34}/>:b.name}</button>)}</nav>
  <div className="uv-recruit-layout"><aside className="uv-recruit-counter"><small>THE LANTERN · INVITATIONS</small><h2>{m.state.formationC2?'Invitations':a6&&banner.kind==='equipment'?'Made for the journey':'A knock tonight'}</h2><p>{a6&&banner.kind==='equipment'?'A keepsake for your crew.':'A new face. A new favorite.'}</p><strong aria-label={`${stamps} ${m.state.economyV3?'Bells':'stamps'}`}><GameIcon name={m.state.economyV3?"bell":"invitations"} size={18}/> {stamps.toLocaleString('en-US')}{!m.state.formationC2&&' stamps'}</strong><p className="uv-pity"><span>{m.state.formationC2?'≤':'Legendary within'}</span> {Math.max(1,banner.hardPity-pity.sinceLegendary)}<br/><small>{pity.sinceLegendary}/{banner.hardPity}{!m.state.formationC2&&' pulls'}</small></p>
   {a6?<RecruitActionsA6 m={m} bannerId={bannerId} revealing={revealing} onInvite={invite}/>:<><div className="uv-recruit-buttons">{bannerId==='standard'&&!m.state.freeInvite&&<button className="uv-fight" disabled={revealing||inRun||available<1} onClick={()=>invite(1,true)}>Welcome a friend</button>}<button disabled={revealing||inRun||stamps<cost||available<1||shelfRoom<1} onClick={()=>invite(1)}>Recruit ×1 · {cost}</button><button className={a6?"cr-primary":undefined} disabled={revealing||inRun||stamps<cost*10||available<10||shelfRoom<10} onClick={()=>invite(10)}>Recruit ×10 · {cost*10}</button></div>
   <small>{available} invitations left today · Earned stamps only</small>{inRun&&<p>Finish your route to recruit.</p>}{shelfRoom<10&&<p>{shelfRoom} gear spaces free.</p>}</>}
   {m.state.formationC2?null:<details className="uv-odds" open={a6&&!m.state.formationC2||undefined}><summary>Odds</summary>{a6?<p>Soft pity from draw {banner.softPity}. Legendary by {banner.hardPity}.<br/>{banner.featuredCardId?(pity.featuredGuaranteed?'Next Legendary: Marigold.':'Legendary: 50% Marigold; guaranteed after a miss.'):banner.kind==='equipment'?'Missing gear templates are preferred within each rarity.':'New cats are preferred within each rarity.'}</p>:<><p>{banner.description}</p><p>Each draw is saved before its reveal. Skipping keeps the same reward. New discoveries are preferred within the rolled rarity and featured group.</p><p>Soft pity starts at {banner.softPity}, adding {banner.softStepBp/100} percentage points per draw. Legendary by {banner.hardPity}; each Legendary resets this banner’s counter. Up to 30 daily invitations.</p>{banner.featuredCardId&&<p>{pity.featuredGuaranteed?'Your next legendary is Marigold.':'Legendary results have a 50% Marigold chance. After a miss, the next legendary is Marigold.'}</p>}</>}
    <table><caption>Published rarity odds</caption><thead><tr><th>Rarity</th><th>Base</th><th>Next pull</th></tr></thead><tbody>{Object.entries(odds).map(([rarity,value])=><tr key={rarity}><th scope="row">{rarity}</th><td>{banner.oddsBp[rarity as keyof typeof odds]/100}%</td><td>{(value/100).toFixed(2)}%</td></tr>)}</tbody></table>
    <details><summary>Exact next-pull probabilities</summary>{(m.state.gameplayV4?R.getDrawPoolV4(m.state,bannerId):getDrawPool(m.state.account,bannerId)).map(item=><p key={item.id}>{R.CAT_BY_ID[item.id]?.name??R.GEAR_BY_ID[item.id]?.name??item.id} · {(item.probability*100).toFixed(4)}%</p>)}</details>
   </details>}
  </aside>{splash?createPortal(<div className="uv-recruit" data-a6={a6} data-reduced={reduced}>{revealStage}</div>,document.querySelector('.uv-app')??document.body):revealStage}</div>
  <details className="uv-recruit-extras"><summary aria-label="Recent invitations">{m.state.formationC2?<GameIcon name="history" size={24}/>: 'Recent invitations'} ({m.state.account.history.length})</summary><div className="uv-history">{[...m.state.account.history].reverse().map((r,i)=><p key={i}>{name(r)} · {r.rarity} · {r.duplicate?(r.cardId?`${r.shards??0} matching shards`:'Added to your bag'):'New'} · {a6?(BANNERS.find(b=>b.id===r.bannerId)?.name??'Invitation'):r.bannerId} #{r.index}</p>)}</div></details>
  {m.state.gameplayV4&&<details className="uv-recruit-extras"><summary aria-label="Choose with marks">{m.state.formationC2?<GameIcon name="cats" size={24}/>: 'Choose with marks'}</summary><p>{m.state.formationC2?<span aria-label="Ordinary selector and Legendary gear selector marks"><GameIcon name="season" size={18}/> {R.SELECTOR_COST_V4} / {R.ECONOMY_C2.legendary.selectorMarks}</span>:<>{R.SELECTOR_COST_V4} marks choose one reward. Welcome invitations add no marks.</>}</p><SelectorV4 m={m}/></details>}
 </div>
}
