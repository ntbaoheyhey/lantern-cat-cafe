import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
import TurnApp from '../../apps/web/src/game/squad/turn3d/TurnApp';
import {MiniPreview,RARITY_COLOR} from '../../apps/web/src/game/squad/turn3d/RunScreens';
import {SQUAD_ITEMS,describeItem} from '../../packages/game-rules/src/squad/gear/catalog';
import {createTurnBattle} from '../../packages/game-rules/src/squad/turn/engine';
import {applyEquipment} from '../../packages/game-rules/src/squad/gear/equipment';
function Catalog(){const [id,setId]=useState(SQUAD_ITEMS[0]!.id),item=SQUAD_ITEMS.find(i=>i.id===id)!;const actor=createTurnBattle({gearMode:'off'}).actors.find(a=>a.role===item.fit[0])!;actor.equipment[item.slot]=id;applyEquipment(actor,'hearthkeepers');return <div className="catalog-preview"><div><label htmlFor="catalog-select">Explore {SQUAD_ITEMS.length} original items</label><select id="catalog-select" value={id} onChange={e=>setId(e.target.value)}>{SQUAD_ITEMS.map(i=><option key={i.id} value={i.id}>{i.name} · {i.rarity}</option>)}</select><p style={{color:RARITY_COLOR[item.rarity]}}>{item.rarity} / {item.slot} / {item.fit.join(', ')}</p><h3>{item.name}</h3><p>{describeItem(item)}</p><i>{item.flavor}</i></div><MiniPreview actor={actor}/></div>}
createRoot(document.getElementById('turn3d-game')!).render(<TurnApp offline/>);
createRoot(document.getElementById('turn3d-catalog')!).render(<Catalog/>);
