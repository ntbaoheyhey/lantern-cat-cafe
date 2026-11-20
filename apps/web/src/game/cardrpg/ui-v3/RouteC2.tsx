import {GameIcon} from '../../../ui/GameIcon';
import {DropOddsC2} from './OddsC2';
import {useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {HelpC2} from './TextDietC2';
import {artPropsA6} from './art-a6';
import {GearArtA6} from './KeepsakeArtA6';
import {ScoutingV4} from '../depth/ScoutingV4';
import type {ReactNode} from 'react';

/** Compact route decisions use the same transaction previews as the full guide. */
export function RouteC2({m,map}:{m:DepthModel;map:ReactNode}) {
 const s=m.state,r=s.run!;
 const [skillChoice,setSkill]=useState('');
 const node=r.nodes.find(n=>n.id===r.current),skills=s.team.flatMap(id=>R.defaultSkills(s,id));
 const skill=skills.includes(skillChoice)?skillChoice:skills.find(id=>(r.upgrades[id]??0)<3)??skills[0]??'';
 const tonic=R.useTonic(s),heal=R.resolveNode(s,'heal'),upgrade=R.resolveNode(s,'upgrade',skill);
 const cats=R.battleCats(s);
 const hp=(result:R.RuleResult<R.DepthAccount>)=><ul className="c2-route-health">{cats.map(c=><li key={c.id}><img {...artPropsA6(c.id,'face')} alt={R.CAT_BY_ID[c.id]!.name}/><span><GameIcon name="heart" size={18}/> {r.hp[c.id]??c.stats.hp} <GameIcon name="arrow" size={18}/> {result.state.run?.hp[c.id]??r.hp[c.id]??c.stats.hp}</span></li>)}</ul>;
 const take=(id:string)=>m.apply(R.resolveNode(m.state,id),'Ready.');
 const boon=(id:string,buy=false)=>{
  const spec=R.boonForMode(id,!!r.gameplayV4),preview=buy?R.resolveNode(s,id):R.chooseReward(s,id);
  return <article key={id}><h3>{spec.name}</h3><b><GameIcon name="season" size={18}/> {r.boons[id]??0} <GameIcon name="arrow" size={18}/> {preview.state.run?.boons[id]??r.boons[id]??0}/{spec.cap}</b><HelpC2 label={spec.name}><p>{spec.description}</p>{!preview.ok&&<p>{preview.error}</p>}</HelpC2><button disabled={!preview.ok} aria-label={`${buy?'Buy':'Choose'} ${spec.name}`} onClick={()=>buy?take(id):m.apply(R.chooseReward(m.state,id),'Ready.')}>{buy?'45':'Choose'}</button></article>;
 };
 let activity:ReactNode=null;
 if(r.complete)activity=<><h2>{r.won?'Route clear':'Route ended'}</h2><div className="c2-route-finds">{[...new Set(r.earnedItems)].filter(id=>R.GEAR_BY_ID[id]).map(id=>{const g=R.GEAR_BY_ID[id]!;return <button key={id} aria-label={`View ${g.name} in Bag`} onClick={()=>{m.itemId=s.gear.filter(g=>g.templateId===id).at(-1)?.id??'';m.go('inventory');}}><GearArtA6 slot={g.slot} setId={g.setId}/></button>;})}</div><div className="cr-actions"><button onClick={()=>m.go('inventory')}><GameIcon name="bag" size={18}/> Bag</button><button onClick={()=>m.go('hub')}><GameIcon name="home" size={18}/> Cafe</button>{r.mode==='tower'&&r.won&&<button disabled={!R.nextTowerFloor(s).ok} onClick={()=>m.apply(R.nextTowerFloor(m.state),'Ready.')}><GameIcon name="upgrade" size={18}/> {r.floor+1}</button>}<HelpC2 label="Route rewards"><p>Earned supplies, stars and equipment are saved.</p>{r.earnedItems.map((id,i)=><p key={i}>{R.GEAR_BY_ID[id]?.name??id}</p>)}</HelpC2></div></>;
 else if(r.rewardChoices.length)activity=<><h2>Choose one</h2><div className="c2-route-cards">{r.rewardChoices.map(id=>{
  if(!id.startsWith('skill:'))return boon(id);
  const sk=R.skillById(id.slice(6),!!r.skillsV5)!,rank=r.upgrades[sk.id]??0,preview=R.chooseReward(s,id);
  return <article key={id}><h3>{sk.name}</h3><b><GameIcon name="upgrade" size={18}/> {rank} <GameIcon name="arrow" size={18}/> {preview.state.run?.upgrades[sk.id]??rank}/3</b><HelpC2 label={sk.name}><p>Effect power +{R.routeSkillPowerBonusPercent(rank)}% <GameIcon name="arrow" size={18}/> +{R.routeSkillPowerBonusPercent(rank+1)}%. Status timing stays the same.</p>{!preview.ok&&<p>{preview.error}</p>}</HelpC2><button disabled={!preview.ok} aria-label={`Choose ${sk.name}`} onClick={()=>m.apply(R.chooseReward(m.state,id),'Ready.')}><GameIcon name="check" size={18}/> Choose</button></article>;
 })}</div></>;
 else if(node&&!node.enemies.length){
  if(node.kind==='shop')activity=<><h2>Tea cart</h2><div className="c2-route-cards">{R.shopStock(r).map(id=>boon(id,true))}</div><div className="cr-actions"><button disabled={!R.resolveNode(s,'tonic').ok} aria-label="Buy route tonic" onClick={()=>take('tonic')}><GameIcon name="potion" size={18}/> 45</button><button disabled={!R.resolveNode(s,'leave').ok} onClick={()=>take('leave')}><GameIcon name="arrow" size={18}/> Leave</button></div></>;
  if(node.kind==='campfire')activity=<><h2>Rest stop</h2><div className="c2-route-cards"><article>{hp(heal)}<button disabled={!heal.ok} aria-label="Heal the crew" onClick={()=>take('heal')}><GameIcon name="heart" size={18}/> Recover</button><HelpC2 label="Recovery"><p>Restore 35% max HP, including fallen cats. This ends the stop.</p><p>{heal.error}</p></HelpC2></article><article><select aria-label="Campfire skill" value={skill} onChange={e=>setSkill(e.target.value)}>{skills.map(id=><option key={id} value={id}>{R.SKILLS[id]!.name}</option>)}</select><b><GameIcon name="upgrade" size={18}/> {r.upgrades[skill]??0} <GameIcon name="arrow" size={18}/> {(r.upgrades[skill]??0)+1}/3</b><button disabled={!upgrade.ok} onClick={()=>m.apply(R.resolveNode(m.state,'upgrade',skill),'Ready.')}><GameIcon name="upgrade" size={18}/> Strengthen</button><HelpC2 label="Skill upgrade"><p>Raises this skill’s effect power for the current route. This ends the stop.</p><p>{upgrade.error}</p></HelpC2></article></div></>;
  if(node.kind==='event'||node.kind==='treasure'){
   const event=R.EVENTS.find(e=>e.id===node.eventId),gift=R.shopStock(r)[0];
   const choices=node.kind==='event'?event?.choices??[]:[{id:'points',label:'Points',description:'Take 70 run points.',cost:0},{id:'charm',label:'Charm',description:gift?R.boonForMode(gift,!!r.gameplayV4).description:'All charms are fully stacked.',cost:0}];
   activity=<><h2>{node.kind==='treasure'?'Choose one':'Crossroads'}</h2><div className="c2-route-cards">{choices.map((c,i)=>{const result=R.resolveNode(s,c.id);return <article key={c.id}><b><GameIcon name="bag" size={18}/> {r.points} <GameIcon name="arrow" size={18}/> {result.state.run?.points??r.points}</b>{hp(result)}<HelpC2 label={c.label}><p>{event?.story}</p><p>{c.description}</p>{'boon' in c&&c.boon&&<p>{R.boonForMode(c.boon,!!r.gameplayV4).description}</p>}<p>{result.error}</p></HelpC2><button disabled={!result.ok} aria-label={c.label} onClick={()=>take(c.id)}>{node.kind==='treasure'?c.label:`Choose ${i+1}`}</button></article>;})}</div></>;
  }
 }
 return <section className="c2-route"><header className="c2-route-toolbar"><DropOddsC2 state={s}/><b aria-label={`${r.points} run points`}><GameIcon name="bag" size={18}/> {r.points}</b><b aria-label={`${r.visited.length} stops visited`}><GameIcon name="thread" size={18}/> {r.visited.length}</b><HelpC2 label="Route tonic" symbol={<GameIcon name="potion" size={18}/>}><p>{r.supplies}/5. Restore up to 100 HP to each companion.</p>{hp(tonic)}<p>{tonic.error}</p><button disabled={!tonic.ok} onClick={()=>m.apply(R.useTonic(m.state),'Ready.')}>Use tonic</button></HelpC2><HelpC2 label="Route guide"><ScoutingV4 run={r}/><p>Charms last for this route.</p>{Object.entries(r.boons).map(([id,n])=><p key={id}>{R.BOON_BY_ID[id]!.name} <GameIcon name="close" size={20}/>{n}: {R.boonForMode(id,!!r.gameplayV4).description}</p>)}</HelpC2></header>{activity?<div className="c2-route-activity">{activity}</div>:map}</section>;
}
