import {RewardOddsC2} from '../ui-v3/OddsC2';
import {useId,useMemo,useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {RECIPES,STACK_ITEMS,type CurrencyId} from '@taskbar-hero/game-rules/cardrpg';
import {CostView} from '../shared';
import type {DepthModel} from './model';

const recipes=RECIPES.filter(r=>r.outputStackId);
const itemName=(id:string)=>STACK_ITEMS.find(item=>item.id===id)?.name??id;
const keyCost=recipes.find(r=>r.id==='mend-pantry-key')!.cost.threads!;

/** Eligibility and resulting inventory come from the same command used on click. */
export function PantryRecipeV4({m}:{m:DepthModel}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [recipe,setRecipe]=useState('mend-pantry-key'),description=useId(),state=m.state;
 const chosen=recipes.find(r=>r.id===recipe)!,id=chosen.outputStackId!,name=itemName(id);
 const preview=useMemo(()=>R.metaCommand(state,{type:'forge',recipeId:recipe}),[state,recipe]);
 const owned=state.account.inventory.stacks[id]??0,cap=R.stackCapV4(id),full=owned>=cap;
 const locked=!!state.run&&!state.run.complete;
 const needs=[...Object.entries(chosen.cost).flatMap(([key,amount])=>{
  const missing=amount-state.account.currencies[key as CurrencyId];
  return missing>0?[`${missing} more ${key==='threads'&&missing===1?'thread':key}`]:[];
 }),...Object.entries(chosen.materials).flatMap(([key,amount])=>{
  const missing=amount-(state.account.inventory.stacks[key]??0);
  return missing>0?[`${missing} more ${itemName(key)}`]:[];
 })];
 const reason=preview.ok?null:locked?'Finish this patrol before crafting.':state.account.pendingRun?preview.error
  :full?id==='cafe-ribbon'?'Already in your collection.':`Full: ${owned}/${cap}. Use one before crafting more.`
  :state.account.chapter<chosen.requiredChapter?`Reach chapter ${chosen.requiredChapter} to unlock this recipe.`
  :needs.length?null:preview.error;
 const missingKey=(chosen.materials['pantry-key']??0)>(state.account.inventory.stacks['pantry-key']??0);
 return <div className="dp-v4-pantry-craft"><h3>Make a pantry item</h3>{state.formationC2&&<RewardOddsC2 source="Forge" reward={{[id]:1}}/>}
  <label>Pantry recipe<select aria-label="Pantry recipe" value={recipe} onChange={e=>setRecipe(e.target.value)}>
   {recipes.map(r=><option key={r.id} value={r.id}>{r.id.startsWith('pantry-')?`Make ${itemName(r.outputStackId!)}`:r.name}</option>)}
  </select></label>
  <section id={description} className="dp-v4-recipe-preview" aria-label="Recipe preview" aria-live="polite">
   <p><b>{name}</b> · {preview.ok?`${owned} to ${preview.state.account.inventory.stacks[id]}/${cap}`:`${owned}/${cap} owned`}</p>
   <div className="dp-v4-recipe-cost"><span>Cost:</span><CostView cost={chosen.cost}/>
    {Object.entries(chosen.materials).map(([key,amount])=><span key={key}>{amount} {itemName(key)}</span>)}
   </div>
   {reason&&<p>{reason}</p>}
   {!locked&&!full&&needs.length>0&&<p className="dp-v4-recipe-missing">Need {needs.join(' · ')}.</p>}
   {!locked&&!full&&missingKey&&<small>Mend a Pantry Key with {keyCost} threads.</small>}
   {preview.ok&&<small>{id==='cafe-ribbon'?'Collection badge; no battle stats.':id==='pantry-key'?'One key makes one pantry supply.':id==='milk-tonic'?R.SUPPLY_TEXT_V4['milk-tonic']:'Makes 1 supply. Pack it during a patrol, before opening Prepare.'}</small>}
  </section>
  <button disabled={!preview.ok} aria-describedby={description} onClick={()=>m.apply(R.metaCommand(m.state,{type:'forge',recipeId:recipe}),`${name} crafted.`)}>Craft pantry item</button>
 </div>;
}
