import {GameIcon} from '../../../ui/GameIcon';
import {GuideMascot,PaintedIcon} from '../shell/PaintedKit';
import {useId,useState} from 'react';
import {FORGE_COST,FORGE_DESIGNS,isForgeInput,type SealPricePolicy} from '@taskbar-hero/chain';
import {TRADE_BY_TOKEN} from '@taskbar-hero/game-rules/cardrpg';
import {formatEther} from 'viem';
import {displayedForgeBudget,type SealInventory} from './seal-quote';
export function ForgeMark({design}:{design:number}){
  const d=FORGE_DESIGNS[design]!;
  const id=useId().replaceAll(':','');
  return <svg viewBox="0 0 120 120" role="img" aria-label={`${d.name} ornament`} className="chain-forge-mark">
    <defs><radialGradient id={id}><stop stopColor={d.color}/><stop offset=".3" stopColor="#61526e"/><stop offset="1" stopColor="#161b32"/></radialGradient></defs>
    <circle cx="60" cy="60" r="55" fill="#392939" stroke="#e8be72" strokeWidth="3"/>
    <circle cx="60" cy="60" r="49" fill={`url(#${id})`} stroke={d.color} strokeWidth="2"/>
    {[0,45,90,135,180,225,270,315].map(r=><path key={r} d="m60 5 2 5-2 5-2-5Z" fill="#ffdfa5" transform={`rotate(${r} 60 60)`}/>)}
    {design===0?<g fill="none" stroke={d.color} strokeWidth="3"><ellipse cx="60" cy="60" rx="40" ry="18" transform="rotate(-35 60 60)"/><ellipse cx="60" cy="60" rx="40" ry="18" transform="rotate(35 60 60)"/><circle cx="60" cy="60" r="12" fill={d.color}/></g>:
      design===1?<g fill="none" stroke={d.color} strokeWidth="3">{[0,60,120].map(r=><ellipse key={r} cx="60" cy="60" rx="14" ry="35" transform={`rotate(${r} 60 60)`}/>)}<circle cx="60" cy="60" r="6" fill={d.color}/></g>:
      <g fill="none" stroke={d.color} strokeWidth="3"><path d="M60 20 69 49 100 60 69 71 60 100 51 71 20 60 51 49Z"/><path d="M37 37 83 83M83 37 37 83"/><circle cx="60" cy="60" r="9" fill={d.color}/></g>}
  </svg>;
}
export function RelicForgePanel({holdings,owned,busy,balance,sealPolicy='standard-v1',inventory=[],craft}:{holdings:{id:bigint;amount:bigint}[];
  owned:boolean[];busy:boolean;balance:bigint;sealPolicy?:SealPricePolicy;inventory?:SealInventory[];craft(design:number,first:bigint,second:bigint):void}){
  const [design,setDesign]=useState(0),[first,setFirst]=useState(''),[second,setSecond]=useState(''),[confirm,setConfirm]=useState(false);
  const inputs=holdings.filter(h=>isForgeInput(h.id));
  const budget=displayedForgeBudget(inputs.reduce((sum,h)=>sum+h.amount,0n),inventory,sealPolicy);
  const valid=!!first&&!!second&&(inputs.find(h=>String(h.id)===first)?.amount??0n)>=(first===second?2n:1n)
    &&(inputs.find(h=>String(h.id)===second)?.amount??0n)>=1n;
  const select=(label:string,value:string,change:(v:string)=>void)=><label className="b2-forge-slot"><PaintedIcon name="gear" size={50}/><select aria-label={label} value={value}
    disabled={busy} onChange={e=>{change(e.target.value);setConfirm(false);}}><option value="">{label}</option>
    {inputs.map(h=><option key={String(h.id)} value={String(h.id)}>{TRADE_BY_TOKEN[Number(h.id)]?.name??String(h.id)} ×{String(h.amount)}</option>)}</select></label>;
  return <div className="chain-forge">
    <div className="chain-forge-preview"><GuideMascot pose="shop"/><div className="b2-ornament-output"><ForgeMark design={design}/></div></div>
    <div className="chain-style-choices">{FORGE_DESIGNS.map(d=><button key={d.id} disabled={busy} aria-pressed={design===d.id}
      onClick={()=>{setDesign(d.id);setConfirm(false);}}><ForgeMark design={d.id}/>{d.name}</button>)}</div>
    {owned[design]?<output data-testid="forge-unlocked"><GameIcon name="check" size={18}/> Unlocked</output>:<>
      <output data-testid="forge-budget" title="Additional YARN for self-sealing missing Epic inputs, then forging. Requires earned source items; market prices are separate.">Self-seal <GameIcon name="yarn" size={18}/> {formatEther(budget.preparation)} + {formatEther(budget.fee)} = {formatEther(budget.total)}</output>
      {balance<budget.total&&<output data-testid="forge-shortfall">Short <GameIcon name="yarn" size={18}/> {formatEther(budget.total-balance)}</output>}
      <div className="chain-forge-inputs">{select('Epic 1',first,setFirst)}{select('Epic 2',second,setSecond)}</div>
      <output>2 Epic + <GameIcon name="yarn" size={18}/> 3</output>
      {confirm?<div role="group" aria-label="Confirm permanent forge"><p>Consume both forever.</p>
        <button disabled={busy||!valid||balance<FORGE_COST} onClick={()=>{setConfirm(false);craft(design,BigInt(first),BigInt(second));}}><GameIcon name="burn" size={18}/> Confirm</button>
        <button disabled={busy} onClick={()=>setConfirm(false)}><GameIcon name="arrow-left" size={18}/> Back</button></div>:
        <button disabled={busy||!valid||balance<FORGE_COST} onClick={()=>setConfirm(true)}><GameIcon name="season" size={18}/> Forge</button>}
    </>}
  </div>;
}
