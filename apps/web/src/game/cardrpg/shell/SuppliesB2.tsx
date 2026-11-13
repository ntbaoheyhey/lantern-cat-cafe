import {playCue} from '../contracts/audio-cues';
import {useState,useSyncExternalStore} from 'react';
import {RECIPES} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {GameIcon} from '../../../ui/GameIcon';
import {CostView} from '../shared';
import {HelpC2} from '../ui-v3/TextDietC2';
import {MenuDialogB2} from './MenuDialogB2';
import {GuideMascot,PaintedTile} from './PaintedKit';

const recipes=RECIPES.filter(r=>r.outputStackId);
const icon=(id:string)=>({mastery:'materials',seals:'boss-seal',fish:'fish',threads:'thread',stamps:'bell',essence:'star-thread','pantry-key':'key','milk-tonic':'potion','shield-biscuit':'shield','quicken-yarn':'spool','cleanse-tea':'supply','ultimate-treat':'supply','cafe-ribbon':'season','boss-proof':'boss-seal'}[id]??'materials');
const itemName=(id:string)=>R.itemCatalogueV4().find(i=>i.id===id)?.name??id;
export type SupplyBatchB2={kind:'craft';recipe:string}|{kind:'use';supply:R.SupplyIdV4;cat:string};
/** Preview and confirm replay the same existing commands. A failed batch commits nothing. */
export function supplyBatchB2(state:R.DepthAccount,action:SupplyBatchB2,count:number){
 let next=state;let completed=0;let error='';
 if(!Number.isSafeInteger(count)||count<1||count>99)return {ok:false,state,completed,error:'Choose 1–99.'};
 if(action.kind==='use'&&action.supply!=='milk-tonic'&&count!==1)return {ok:false,state,completed,error:'Pack one supply.'};
 for(let i=0;i<count;i++){
  const result=action.kind==='craft'?R.metaCommand(next,{type:'forge',recipeId:action.recipe}):R.packSupplyV4(next,action.supply,action.cat);
  if(!result.ok){error=result.error??'Unavailable.';return {ok:false,state,completed,error};}next=result.state;completed++;
 }
 return {ok:true,state:next,completed,error};
}
function maxBatch(state:R.DepthAccount,action:SupplyBatchB2){let next=state,n=0;const limit=action.kind==='use'&&action.supply!=='milk-tonic'?1:99;while(n<limit){const result=supplyBatchB2(next,action,1);if(!result.ok)break;next=result.state;n++;}return n;}
function BatchDialogB2({m,action,onClose}:{m:DepthModel;action:SupplyBatchB2;onClose:()=>void}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [amount,setAmount]=useState(1),s=m.state,max=maxBatch(s,action),count=Math.min(amount,Math.max(1,max)),preview=supplyBatchB2(s,action,count),recipe=action.kind==='craft'?recipes.find(r=>r.id===action.recipe):null,id=recipe?.outputStackId??(action.kind==='use'?action.supply:'pantry-key');
 const change=(n:number)=>setAmount(Math.max(1,Math.min(Math.max(1,max),n)));
 const cost=recipe?Object.fromEntries(Object.entries(recipe.cost).map(([key,n])=>[key,n*count])):{};
 return <MenuDialogB2 title={action.kind==='craft'?'Craft':'Use supply'} onClose={onClose} className="b2-batch-dialog"><div className="b2-batch-hero"><GameIcon name={icon(id)} size={110}/><h3>{itemName(id)}</h3><b>{s.account.inventory.stacks[id]??0}<GameIcon name="arrow"/>{preview.ok?preview.state.account.inventory.stacks[id]??0:s.account.inventory.stacks[id]??0}</b></div>
  {action.kind==='use'&&<p className="b2-batch-benefit">{R.CAT_BY_ID[action.cat]!.name}{id==='milk-tonic'?<><GameIcon name="heart"/>{s.run?.hp[action.cat]??0}<GameIcon name="arrow" size={20}/>{preview.state.run?.hp[action.cat]??0}</>:<><GameIcon name="check"/>Next fight</>}</p>}
  <div className="b2-batch-controls" aria-label="Batch quantity"><button onClick={()=>change(1)} disabled={max<1}>Min</button><button aria-label="Decrease ten" onClick={()=>change(count-10)} disabled={count<=1}>−10</button><button aria-label="Decrease one" onClick={()=>change(count-1)} disabled={count<=1}>−</button><output aria-label="Quantity">{count}</output><button aria-label="Increase one" onClick={()=>change(count+1)} disabled={count>=max}>+</button><button aria-label="Increase ten" onClick={()=>change(count+10)} disabled={count>=max}>+10</button><button onClick={()=>change(max)} disabled={max<1}>Max</button></div>
  {recipe&&<div className="b2-batch-cost"><CostView cost={cost}/>{Object.entries(recipe.materials).map(([key,n])=><span key={key}><GameIcon name={icon(key)} size={26}/>{n*count}</span>)}<b aria-label="Guaranteed output">100%</b></div>}
  {!preview.ok&&<p role="status">{s.run?.battle?'Finish encounter':!s.run&&action.kind==='use'?'Start a patrol':action.kind==='craft'&&s.run&&!s.run.complete?'Finish patrol':'Unavailable'}</p>}
  <footer className="b2-dialog-actions"><button className="cr-primary" disabled={!preview.ok} onClick={()=>{const result=supplyBatchB2(m.state,action,count);if(result.ok){m.state=result.state;m.notify();playCue(action.kind==='craft'?'ui.batch':'ui.use');onClose();}else{playCue('ui.fail');m.error=true;m.notice=result.error;m.notify(false);}}}><GameIcon name={action.kind==='craft'?'forge':'check'}/>{action.kind==='craft'?'Craft':'Use'} ×{count}</button></footer>
 </MenuDialogB2>;
}
export function SuppliesB2({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [chosen,setChosen]=useState('mastery'),[category,setCategory]=useState<'Materials'|'Consumables'|'Craft'>('Materials'),[action,setAction]=useState<SupplyBatchB2|null>(null),[cat,setCat]=useState(m.state.team[0]!);
 const s=m.state,recipient=s.team.includes(cat)?cat:s.team[0]!;
 const items=[{id:'mastery',name:'Mastery',amount:s.materials,description:'Awaken cats with chapter rewards.'},{id:'seals',name:'Boss seals',amount:s.seals,description:'Earn from bosses. Reserve Relic designs.'},...R.itemCatalogueV4().filter(i=>i.id!=='boss-proof').map(i=>({id:i.id,name:i.name,description:i.description,amount:s.account.inventory.stacks[i.id]??0})),...Object.entries(s.account.currencies).map(([id,amount])=>({id,name:({stamps:'Bells',threads:'Thread',fish:'Fish',essence:'Essence'}[id]??id),amount,description:'Earn from patrols. Spend on upgrades.'}))];
 const item=items.find(i=>i.id===chosen)??items[0]!;
 const materialIds=['mastery','seals','pantry-key','cafe-ribbon'];
 const visible=category==='Materials'?items.filter(i=>materialIds.includes(i.id)):items.filter(i=>R.SUPPLY_IDS_V4.includes(i.id as R.SupplyIdV4));
 const tonic=R.useTonic(s);
 return <section className="b2-supplies"><div className="b2-supplies-grid">{items.map(i=><PaintedTile key={i.id} label={`${i.name}: ${i.amount}`} count={i.amount} selected={i.id===item.id} onClick={()=>setChosen(i.id)}><GameIcon name={icon(i.id)} size={62}/></PaintedTile>)}</div><aside className="b2-supply-detail"><GuideMascot pose="explain"/><h2>{item.name}</h2><strong className="b2-number">{item.amount.toLocaleString('en-US')}</strong><HelpC2 label={item.name}><p>{item.description}</p></HelpC2><HelpC2 label="Use & manage supplies" title="Supplies" symbol={<><GameIcon name="supply"/>Manage</>}><div className="b2-supply-manager"><nav className="b2-mode-tabs">{(['Materials','Consumables','Craft'] as const).map((c,i)=><button key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}><GameIcon name={['thread','potion','forge'][i]!}/>{c}</button>)}</nav>
  {category==='Craft'?<div className="b2-supply-recipes">{recipes.map(r=><PaintedTile key={r.id} label={`Craft ${itemName(r.outputStackId!)}`} onClick={()=>setAction({kind:'craft',recipe:r.id})}><GameIcon name={icon(r.outputStackId!)} size={65}/></PaintedTile>)}</div>:<div className="b2-managed-items">{visible.map(i=><PaintedTile key={i.id} label={i.name} count={i.amount} onClick={()=>category==='Consumables'?setAction({kind:'use',supply:i.id as R.SupplyIdV4,cat:recipient}):setChosen(i.id)}><GameIcon name={icon(i.id)} size={70}/></PaintedTile>)}</div>}
  {category==='Materials'&&<p>Chapter finds strengthen your crew.</p>}{category==='Craft'&&<p>Choose an item. Review cost next.</p>}
  {category==='Consumables'&&<><div className="b2-supply-recipient"><GameIcon name="cats"/><select aria-label="Supply recipient" value={recipient} onChange={e=>setCat(e.target.value)}>{s.team.map(id=><option key={id} value={id}>{R.CAT_BY_ID[id]!.name}</option>)}</select><HelpC2 label="Supply guide"><p>Select a treat to preview its benefit. Pack before an encounter; milk restores missing health immediately.</p></HelpC2></div><footer className="b2-dialog-actions"><button disabled={!tonic.ok} onClick={()=>m.apply(R.useTonic(m.state),'Restored.')}><GameIcon name="potion"/>Route tonic {s.run?.supplies??0}</button><button disabled={!s.run?.packedSupply||!R.packSupplyV4(s,null,recipient).ok} onClick={()=>m.apply(R.packSupplyV4(m.state,null,recipient),'Returned.')}><GameIcon name="arrow-left"/>Unpack</button></footer></>}
  </div></HelpC2></aside>{action&&<BatchDialogB2 m={m} action={action} onClose={()=>setAction(null)}/>}</section>;
}
