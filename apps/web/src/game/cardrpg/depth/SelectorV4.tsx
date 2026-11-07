import { useState } from 'react';
import { CARDS, CARD_RPG_CONFIG } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';
export function SelectorV4({m}:{m:DepthModel}) {
 const [kind,setKind]=useState<'cat'|'gear'>('cat'),[chosen,setChosen]=useState('');
 const options=kind==='cat'?CARDS:R.GEAR,selected=options.find(o=>o.id===chosen),marks=R.selectorMarksV4(m.state);
 const reason=selected?R.selectorEligibilityV4(m.state,kind,selected.id):'Choose your reward.';
 const owned=kind==='cat'&&m.state.account.cards.some(c=>c.cardId===chosen);
 return <section className="cr-panel dp-v4-selector" aria-label="Guaranteed choice">
  <h2>A place saved for your choice</h2><p><strong>{marks} selector marks</strong> · {R.SELECTOR_COST_V4} marks for one chosen reward.</p>
  <p>Each paid invitation made with earned stamps adds one mark. The free welcome adds none. Marks never expire; choosing a reward leaves every banner’s pity unchanged.</p>
  <label>Reward type <select aria-label="Reward type" value={kind} onChange={e=>{setKind(e.target.value as 'cat'|'gear');setChosen('');}}><option value="cat">Companion</option><option value="gear">Equipment</option></select></label>
  <label>Chosen reward <select aria-label="Chosen reward" value={chosen} onChange={e=>setChosen(e.target.value)}><option value="">Choose a reward</option>{options.map(o=><option key={o.id} value={o.id}>{o.name} · {o.rarity}</option>)}</select></label>
  {selected&&<p>{owned?`Already collected: ${CARD_RPG_CONFIG.rarity[selected.rarity].shards} matching shards. Duplicates can be chosen only after collecting every companion.`:kind==='gear'?`One account-bound piece. Legendary choices require mastery of their source chapter.`:'A new companion joins at level one.'}</p>}
  <p role="status">{reason??'Ready to spend 60 marks on this reward.'}</p>
  <button disabled={!!reason} onClick={()=>m.apply(R.chooseSelectorV4(m.state,kind,chosen),'Your chosen reward is ready. 60 marks spent; pity unchanged.')}>Choose reward · 60 marks</button>
 </section>;
}
