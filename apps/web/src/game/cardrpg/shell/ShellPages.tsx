import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {ECONOMY_V3 as E,v3Season} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {GameIcon} from '../../../ui/GameIcon';
import {LiveCounters,EconomyVitals,SeasonEdition} from './LiveCounters';
import {GuideMascot,PaintedAction,PaintedTabs,RibbonTitle,type KitIcon} from './PaintedKit';
import './screen-skin.css';
import './motion-b2.css';
import {useMenuClose} from './motion-b2';
const pct=(bp:number)=>`${bp/100}%`;
const oddsPages=[['banner','Banner odds','bell'],['featured','Featured & shards','shard'],['enhance','Enhancement & fusion','forge'],['drops','Drops','bag']] as const;

/** Odds, pity and fees are rendered directly from the live rule table. */
export function PublishedOdds(){
 const [page,setPage]=useState('banner');
 return <section className="b2-odds" aria-label="Published odds">
  <nav className="b2-odds-nav" aria-label="Odds tables">{oddsPages.map(([id,label,icon])=><button key={id} aria-label={label} title={label} aria-pressed={page===id} onClick={()=>setPage(id)}><GameIcon name={icon} size={40}/></button>)}</nav>
  {page==='banner'?<><table aria-label="Published gacha odds"><thead><tr><th aria-label="Banner"/><th>Common</th><th>Rare</th><th>Epic</th><th>Legendary</th><th>Soft</th><th>Hard</th></tr></thead><tbody>{(['cat','gear'] as const).map(kind=><tr key={kind}><th aria-label={kind}><GameIcon name={kind==='cat'?'cats':'gear'} size={48}/></th>{Object.values(E[kind].odds).map((bp,i)=><td key={i}>{pct(bp)}</td>)}<td>{E[kind].soft}</td><td>{E[kind].hard}</td></tr>)}</tbody></table><p><GameIcon name="bell" size={24}/>Bells only. Soft pity +{pct(E.cat.stepBp)}.</p></>
   :page==='featured'?<div className="b2-rule-grid"><article><GameIcon name="cats" size={72}/><h3>Featured</h3><strong>{pct(E.cat.featuredBp)}</strong><p>Miss: next guaranteed.</p></article><article><GameIcon name="shard" size={72}/><h3>Shards</h3><p>{Object.values(E.shards).join(' / ')}</p><small>Stars {E.starShards.join(' / ')}</small></article><article><GameIcon name="mint" size={72}/><h3>Selector</h3><strong>{E.selector}</strong><small>marks</small></article><p>Pity carries.</p></div>
   :page==='enhance'?<><table aria-label="Enhancement odds"><tbody>{E.enhancement.successBp.map((bp,i)=><tr key={i}><th>+{i+1}</th><td>{pct(bp)}</td></tr>)}</tbody></table><p>Failure keeps level. Blessing +{pct(E.enhancement.blessingBp)}.</p><p><GameIcon name="fuse" size={32}/>Fusion {pct(E.fusion.successBp)}.</p></>
   :<><table aria-label="Gear drop odds"><thead><tr><th>Source</th><th>Drop</th><th>Common / Rare / Epic / Legendary</th></tr></thead><tbody>{(['battle','elite','boss','firstBoss','tower'] as const).map(kind=><tr key={kind}><th>{kind}</th><td>{pct(E.drops[kind].chanceBp)}</td><td>{Object.values(E.drops[kind].odds).map(pct).join(' / ')}</td></tr>)}</tbody></table><p>Wins 1–6: full. 7–18: half. Later: Fish / Thread.</p></>}
 </section>;
}

const economyTabs:[string,string,KitIcon][]=[['flow','Flow','economy'],['allocation','Allocation','yarn'],['fees','Fees','withdraw'],['odds','Odds','bell']];
export function ShellPages(){
 const [page,setPage]=useState(''),[tab,setTab]=useState('flow'),[guide,setGuide]=useState(false);
 const root=useRef<HTMLElement>(null),prior=useRef<HTMLElement|null>(null);
 const close=useMenuClose(root,()=>{setPage('');prior.current?.focus();});
 useEffect(()=>{const open=(e:Event)=>{prior.current=document.activeElement as HTMLElement;setPage(String((e as CustomEvent).detail));setTab('flow');setGuide(false);};const trailer=()=>open(new CustomEvent('shell:page',{detail:'trailer'}));window.addEventListener('shell:page',open);window.addEventListener('shell:trailer',trailer);return()=>{window.removeEventListener('shell:page',open);window.removeEventListener('shell:trailer',trailer);};},[]);
 useEffect(()=>{if(page)root.current?.focus();},[page]);
 if(!page)return null;
 let position=0;const colours=['#dc8c4d','#947bc7','#6caeaa','#b6ba77','#cb7498','#6e96bf'];
 const allocation=Object.entries(E.allocation),gradient=allocation.map(([,v],i)=>{const from=position;position+=v;return `${colours[i%colours.length]} ${from}% ${position}%`;}).join(',');
 return <div className="b-modal-backdrop"><section className="b-page b2-page" role="dialog" aria-label={page} aria-modal="true" ref={root} tabIndex={-1} data-family={page==='season'?'garden':'shop'} onKeyDown={e=>{
  if(e.key==='Escape')close();
  if(e.key==='Tab'){const nodes=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a,summary,video,[tabindex="0"]')??[]).filter(n=>n.checkVisibility());const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
 }}>
  <button className="b-close" onClick={close} aria-label="Close page"><GameIcon name="close"/></button>
  <RibbonTitle>{page==='trailer'?'Night patrol':page==='odds'?'Odds':page==='season'?'Lantern season':'Economy'}</RibbonTitle>
  {page==='trailer'?<video src="/art/v3-shell/battle-preview.webm" muted autoPlay loop controls playsInline/>:page==='odds'?<PublishedOdds/>:page==='season'?<>
   <div className="b2-season-scene"><GuideMascot pose="celebrate"/><div className="b2-season-medal"><GameIcon name="season" size={120}/><h3>Season {v3Season().number}</h3><strong className="t-number">{v3Season().days}</strong><span>days left</span></div><div className="b2-edition"><GameIcon name="relic" size={100}/><h3>Edition</h3><SeasonEdition/></div></div>
   <nav className="b2-season-track" aria-label="Season activities">{(['Play','Collect','Grow'] as const).map((label,i)=><button key={label} onClick={()=>{close();window.dispatchEvent(new CustomEvent('shell:season-action',{detail:label}));}}><GameIcon name={['quest','bell','cats'][i]!} size={48}/>{label}</button>)}</nav>
   <button className="b2-page-help" aria-label="Season guide" aria-expanded={guide} onClick={()=>setGuide(!guide)}><GameIcon name="guide" size={28}/><span>Season guide</span></button>
   {guide&&<p className="b2-season-note">Free rewards stay bound. Premium pass: roadmap.</p>}
  </>:<>
   <PaintedTabs className="b-page-nav" label="Economy pages">{economyTabs.map(([id,label,icon])=><PaintedAction key={id} icon={icon} aria-label={id} active={tab===id} onClick={()=>{setTab(id);setGuide(false);}}>{label}</PaintedAction>)}</PaintedTabs>
   {tab==='flow'?<><div className="b2-economy-flow"><GuideMascot pose="explain"/><div className="b2-flow-steps">{([['spool','Spool','Bound'],['withdraw','Withdraw','Deed required'],['fuse','Seal · Fuse','YARN burned']] as const).map(([icon,title,note])=><article key={icon}><GameIcon name={icon} size={96}/><h3>{title}</h3><small>{note}</small></article>)}</div></div><LiveCounters/><EconomyVitals/></>
    :tab==='allocation'?<div className="b2-allocation"><div className="b2-allocation-pie" role="img" aria-label={allocation.map(([n,v])=>`${n} ${v}%`).join(', ')} style={{'--allocation':`conic-gradient(${gradient})`} as CSSProperties}><GameIcon name="yarn" size={100}/></div><dl>{allocation.map(([name,value],i)=><div key={name}><dt><i style={{background:colours[i%colours.length]}}/>{name}</dt><dd className="t-number">{value}%</dd></div>)}</dl></div>
    :tab==='odds'?<PublishedOdds/>:<><div className="b2-rule-grid"><article><GameIcon name="withdraw" size={88}/><h3>Withdraw</h3><strong>{pct(E.spool.feeBp)}</strong><small>retained</small></article><article><GameIcon name="market" size={88}/><h3>Market</h3><strong>{pct(E.market.feeBp)}</strong><small>{pct(E.market.burnBp)} burn · {pct(E.market.treasuryBp)} treasury</small></article><article><GameIcon name="season" size={88}/><h3>Seasons</h3><strong>4 / 13</strong><small>content / contract weeks</small></article></div><button className="b2-page-help" aria-label="Limits and risks" aria-expanded={guide} onClick={()=>setGuide(!guide)}><GameIcon name="guide" size={28}/></button>{guide&&<p>Testnet: no real value. Vietnam Decree 147/2024 restricts real-money item trading.</p>}</>}
  </>}
 </section></div>;
}
