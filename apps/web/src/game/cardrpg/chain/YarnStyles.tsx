import {GameIcon} from '../../../ui/GameIcon';
import {useState} from 'react';
import {YARN_STYLES,type YarnStyle,type CosmeticState} from '@taskbar-hero/chain';
export function YarnStyles({state,busy,balance,buy,equip}:{state?:CosmeticState;busy:boolean;balance:bigint;
  buy(sku:YarnStyle):void;equip(sku:YarnStyle|'none'):void}){
  const [preview,setPreview]=useState<YarnStyle>('fern');
  const entry=YARN_STYLES.find(s=>s.id===preview)!;
  const order=state?.orders.find(o=>o.sku===preview),owned=!!order?.paid_at;
  return <div className="chain-styles">
    <div className="chain-style-preview" data-style={preview} aria-label={`${entry.name} preview`}>
      <span aria-hidden="true"><GameIcon name="season" size={18}/></span><img src="/relics/1.svg" alt="Paw Charm"/><span aria-hidden="true"><GameIcon name="season" size={18}/></span>
    </div>
    <div className="chain-style-choices">{YARN_STYLES.map(s=><button key={s.id} aria-pressed={preview===s.id}
      onClick={()=>setPreview(s.id)}><GameIcon name="season" size={26}/>{s.name}</button>)}</div>
    <div className="chain-style-actions">
      {owned?<button disabled={busy||state?.active===preview} onClick={()=>equip(preview)}><GameIcon name="check" size={24}/>{state?.active===preview?'Equipped':'Equip'}</button>:
      <button disabled={busy||!state||(!order&&balance<BigInt(entry.cost))} onClick={()=>buy(preview)}><GameIcon name="burn" size={24}/>{order?'Recover':'Burn 4'}</button>}
      {state?.active&&<button disabled={busy} onClick={()=>equip('none')}><GameIcon name="arrow-left" size={18}/> Reset</button>}
    </div>
  </div>;
}
