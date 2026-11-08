import { useState } from 'react';
import { gearComparison } from './meta-presentation';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { RECIPES, STACK_ITEMS } from '@taskbar-hero/game-rules/cardrpg';
import { CostView } from '../shared';
import type { DepthModel } from './model';

export function ShiftLoadouts({m}:{m:DepthModel}){
 const [slot,setSlot]=useState(0),[name,setName]=useState('Evening shift');
 const state=m.state,locked=!!state.run&&!state.run.complete,preset=state.v4?.loadouts?.[slot];
 const preview=preset?R.previewLoadoutV4(state,slot):null;
 return <section className="cr-panel dp-v4-loadouts"><h2>Shift loadouts</h2><p>Keep three favourite crews ready. Their gear, rows and plans come along.</p>
  <div className="cr-filter"><label>Saved shift<select aria-label="Saved shift" value={slot} onChange={e=>setSlot(Number(e.target.value))}>{[0,1,2].map(i=><option value={i} key={i}>{i+1} · {state.v4?.loadouts?.[i]?.name??'Empty'}</option>)}</select></label>
  <label>Shift name<input value={name} maxLength={40} onChange={e=>setName(e.target.value)} /></label></div>
  <button disabled={locked||!name.trim()} onClick={()=>m.apply(R.saveLoadoutV4(state,slot,name),'Shift saved with this crew and its equipment.')}>Save current shift</button>
  {preset&&<><p>{preset.team.map(id=>R.CAT_BY_ID[id]!.name).join(' · ')} · {preset.plan.focus}/{preset.plan.care}</p>
  {preview?.ok?<><p>Approximate crew score: {preview.before.toFixed(1)} → {preview.after?.toFixed(1)}</p><p>{preview.transfers.length?preview.transfers.join('; '):'No equipment transfers.'}</p><p>{preview.changes.length?preview.changes.map(c=>c).join('; '):'Set and unique effects stay the same.'}</p></>:<p role="status">{preview?.error}</p>}
  <button disabled={locked||!preview?.ok} onClick={()=>m.apply(R.applyLoadoutV4(state,slot),'Shift applied together; every piece has one owner.')}>Apply saved shift</button></>}
 </section>;
}
export function UtilityComparison({state,cardId,instanceId}:{state:R.DepthAccount;cardId:string;instanceId:string}){
 const result=R.comparisonV4(state,cardId,instanceId);if(!result)return null;
 const delta=gearComparison(state,cardId,instanceId).delta;
 const changes=delta?([['hp','HP'],['attack','attack'],['defense','defense']] as const)
   .filter(([key])=>delta[key]!==0).map(([key,label])=>`${delta[key]>0?'+':''}${delta[key]} ${label}`):[];
 return <div className="dp-v4-utility"><h3>What this changes</h3>
 {changes.length>0&&<p>{R.CAT_BY_ID[cardId]!.name}: {changes.join(' · ')}.</p>}
 <p>Build estimate: {result.before.total.toFixed(1)} → {result.after.total.toFixed(1)}.</p>
 {result.transfer&&<p>Transfers from {R.CAT_BY_ID[result.transfer]!.name}; that companion loses this piece.</p>}
 {result.gained.map(effect => {
   const set=R.SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect);
   return <p key={effect}>{set&&<b>Set bonus: activates {set.fourEffect===effect?'4':'2'}-piece {set.name}. </b>}{R.effectTextV4(effect)}</p>;
 })}
 {!result.gained.length&&<p>No new set bonus.</p>}
 {!!result.lost.length&&<p>Loses: {result.lost.map(R.effectTextV4).join(' ')}</p>}
 <details><summary>How the estimate works</summary><p>Crew score: {result.teamBefore.toFixed(1)} → {result.teamAfter.toFixed(1)}. Piece share: {(result.share*100).toFixed(1)}%.</p><p>Core {result.after.core.toFixed(1)} + utility {result.after.utility.toFixed(1)}.</p><p>HP ÷ 5 + 2 × attack + 1.5 × defense, plus shield, healing and conditional effects in a three-round reference. Shield and healing use 0.2 per point; conditional damage 0.36; counter damage 0.3; extended status 2; rear reach 5. This is an approximate build estimate, not a win probability. Matchup calibration is still pending.</p></details></div>;
}
const supplyName=(id:string)=>STACK_ITEMS.find(item=>item.id===id)?.name??id;
export function PantryV4({m}:{m:DepthModel}){
 const [catId,setCatId]=useState(m.state.team[0]!),[supply,setSupply]=useState<R.SupplyIdV4>('shield-biscuit'),[recipe,setRecipe]=useState('mend-pantry-key');
 const state=m.state,run=state.run,cat=state.team.includes(catId)?catId:state.team[0]!;
 const recipes=RECIPES.filter(r=>r.outputStackId),chosen=recipes.find(r=>r.id===recipe)!;
 return <section className="cr-panel dp-v4-pantry"><h2>Pantry preparation</h2><p>Pack one treat before your next fight. Change your mind and the unused treat returns.</p>
 {run?.packedSupply&&<p role="status">Packed: {supplyName(run.packedSupply.id)} for {R.CAT_BY_ID[run.packedSupply.catId]!.name}. Used when the fight begins.</p>}
 <div className="cr-filter"><label>Supply recipient<select aria-label="Supply recipient" value={cat} onChange={e=>setCatId(e.target.value)}>{state.team.map(id=><option value={id} key={id}>{R.CAT_BY_ID[id]!.name}</option>)}</select></label>
 <label>Pantry supply<select aria-label="Pantry supply" value={supply} onChange={e=>setSupply(e.target.value as R.SupplyIdV4)}>{R.SUPPLY_IDS_V4.map(id=><option value={id} key={id}>{supplyName(id)} · {state.account.inventory.stacks[id]??0}/20</option>)}</select></label></div>
 <p>{R.SUPPLY_TEXT_V4[supply]}</p><button disabled={!run||run.complete||!!run.battle} onClick={()=>m.apply(R.packSupplyV4(state,supply,cat),supply==='milk-tonic'?'Milk restored missing HP.':'Supply reserved for the next encounter.')}>{supply==='milk-tonic'?'Use milk tonic':'Confirm packed supply'}</button>
 <button disabled={!run?.packedSupply||!!run.battle} onClick={()=>m.apply(R.packSupplyV4(state,null,cat),'Unspent supply returned to the pantry.')}>Return packed supply</button>
 <h3>Make a pantry item</h3><label>Pantry recipe<select aria-label="Pantry recipe" value={recipe} onChange={e=>setRecipe(e.target.value)}>{recipes.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
 <CostView cost={chosen.cost}/><p>{Object.entries(chosen.materials).map(([id,n])=>`${n} ${id}`).join(' · ')||'No extra materials.'} · chapter {chosen.requiredChapter} · stack cap {R.stackCapV4(chosen.outputStackId!)}</p>
 <button disabled={!!run&&!run.complete} onClick={()=>m.apply(R.metaCommand(state,{type:'forge',recipeId:recipe}),'Pantry item crafted.')}>Craft pantry item</button>
 </section>;
}
