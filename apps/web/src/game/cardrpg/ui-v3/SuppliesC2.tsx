import {lazy,Suspense,useState} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {HelpC2} from './TextDietC2';
import {GiftArtA6} from './KeepsakeArtA6';

const Inventory=lazy(()=>import('../depth/Equipment').then(m=>({default:m.Inventory})));
export function SuppliesC2({m}:{m:DepthModel}) {
 const [chosen,setChosen]=useState('mastery'),s=m.state;
 const items=[{id:'mastery',name:'Mastery materials',amount:s.materials,description:'Chapter clears and cafe rewards. Spend on awakening.'},{id:'seals',name:'Boss seals',amount:s.seals,description:'Earned from bosses. Reserve eligible Relic designs.'},...R.itemCatalogueV4().map(i=>({id:i.id,name:i.name,description:i.description,amount:s.account.inventory.stacks[i.id]??0})),...Object.entries(s.account.currencies).map(([id,amount])=>({id,name:id,amount,description:'Earn from routes and cafe service. Spend on companion and equipment upgrades.'}))];
 const item=items.find(i=>i.id===chosen)??items[0]!;
 return <section className="c2-supplies"><select aria-label="Supply" value={item.id} onChange={e=>setChosen(e.target.value)}>{items.map(i=><option key={i.id} value={i.id}>{i.name}</option>)}</select><article><GiftArtA6 variant={items.indexOf(item)%7}/><strong aria-label={`${item.name}: ${item.amount}`}>{item.amount.toLocaleString('en-US')}</strong><HelpC2 label={item.name}><p>{item.description}</p></HelpC2></article><HelpC2 symbol="⚒" label="Use & manage supplies"><Suspense fallback={<p>Opening…</p>}><Inventory m={m} initialCategory="Materials"/></Suspense></HelpC2></section>;
}
