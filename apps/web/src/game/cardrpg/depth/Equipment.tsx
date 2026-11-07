import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_RPG_CONFIG, EQUIPMENT_SLOTS, RARITY_ORDER, STACK_ITEMS, type Stats as CatStats } from '@taskbar-hero/game-rules/cardrpg';
import { CostView, ItemIcon, PageTitle, statName, statValue, rarityStyle } from '../shared';
import { portraitProps } from './assets';
import { CompanionPreview } from './CompanionPreview';
import { CollectibleDesigns } from './CollectibleDesigns';
import { gearComparison } from './meta-presentation';
import type { DepthModel } from './model';

const categories = ['Equipment', 'Materials', 'Consumables', 'Collectibles', 'Currencies'] as const;

export function Inventory({ m }: { m: DepthModel }) {
  const [category, setCategory] = useState<typeof categories[number]>('Equipment');
  const [slot, setSlot] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [setId, setSetId] = useState('all');
  const [sort, setSort] = useState('rarity');
  const [craftId, setCraftId] = useState(R.GEAR[0]!.id);
  const [affix, setAffix] = useState('');
  const [feedback, setFeedback] = useState(0);
  const state = m.state;
  const locked = !!state.run && !state.run.complete;
  const cardId = state.account.cards.some(card => card.cardId === m.cardId) ? m.cardId : state.team[0]!;
  const item = state.gear.find(gear => gear.id === m.itemId) ?? state.gear[0];
  const template = item && R.GEAR_BY_ID[item.templateId]!;
  const preview = item && R.enhancementPreview(item);
  const compatible = item && template ? R.AFFIXES.filter(candidate => candidate.slots.includes(template.slot) && !item.affixes.includes(candidate.id)) : [];
  const chosenAffix = compatible.find(candidate => candidate.id === affix)?.id ?? compatible[0]?.id;
  const effects = R.equipmentEffects(state, cardId);
  const comparison = item ? gearComparison(state, cardId, item.id) : null;
  const fitted = R.equippedItems(state, cardId);
  const act = (result: R.RuleResult<R.DepthAccount>, message: string) => {
    if (m.apply(result, message)) setFeedback(value => value + 1);
  };
  const gear = state.gear.filter(candidate => {
    const spec = R.GEAR_BY_ID[candidate.templateId]!;
    return (slot === 'all' || spec.slot === slot) && (rarity === 'all' || spec.rarity === rarity)
      && (setId === 'all' || spec.setId === setId);
  }).sort((left, right) => {
    const a = R.GEAR_BY_ID[left.templateId]!, b = R.GEAR_BY_ID[right.templateId]!;
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'enhancement') return right.enhancement - left.enhancement || a.name.localeCompare(b.name);
    return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || a.name.localeCompare(b.name);
  });
  return <>
    <PageTitle eyebrow={`${state.gear.length} pieces · ${R.GEAR.length} templates`} title="Give your plan a shape." />
    <div className="cr-tabs" aria-label="Inventory types">{categories.map(value => <button key={value}
      aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
    {category === 'Equipment' && <>
      <div className="cr-filter">
        <label>Equip for<select value={cardId} onChange={event => { m.cardId = event.target.value; m.notify(false); }}>
          {state.account.cards.map(card => <option key={card.cardId} value={card.cardId}>{R.CAT_BY_ID[card.cardId]!.name}</option>)}
        </select></label>
        <label>Slot<select value={slot} onChange={event => setSlot(event.target.value)}>
          <option value="all">All slots</option>{EQUIPMENT_SLOTS.map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label>Rarity<select value={rarity} onChange={event => setRarity(event.target.value)}>
          <option value="all">All rarities</option>{RARITY_ORDER.map(value => <option key={value}>{value}</option>)}
        </select></label>
        <label>Set<select value={setId} onChange={event => setSetId(event.target.value)}>
          <option value="all">All sets</option>{R.SETS.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}
        </select></label>
        <label>Sort<select value={sort} onChange={event => setSort(event.target.value)}>
          <option value="rarity">Rarity</option><option value="enhancement">Enhancement</option><option value="name">Name</option>
        </select></label>
      </div>
      {locked && <p>Finish or abandon the current route to change equipment.</p>}
      <div className="dp-equipment-workbench">
        <section className="cr-panel dp-paper-doll"><div className="dp-cat-heading"><img {...portraitProps(cardId)} alt="" /><h2>{R.CAT_BY_ID[cardId]!.name}</h2></div>
          <CompanionPreview m={m} id={cardId} />
          <div className="dp-doll-slots">{EQUIPMENT_SLOTS.map(gearSlot => {
            const worn = fitted.find(candidate => R.GEAR_BY_ID[candidate.templateId]!.slot === gearSlot);
            const spec = worn && R.GEAR_BY_ID[worn.templateId]!;
            const liveRelic = gearSlot === 'relic' && cardId === state.team[0] && state.selectedRelic && state.relics.includes(state.selectedRelic);
            return <button key={gearSlot} style={spec && rarityStyle(spec.rarity)} aria-label={`${gearSlot} slot`}
              onClick={() => { setSlot(gearSlot); if (worn) { m.itemId = worn.id; m.notify(false); } }}>
              <ItemIcon slot={gearSlot} /><span><small>{gearSlot}</small><b>{liveRelic ? 'Selected Fuji Relic' : spec?.name ?? 'Empty slot'}</b>
                {worn && <small>{spec!.rarity} · +{worn.enhancement}</small>}</span>
            </button>;
          })}</div>
          <h3>Set progress</h3>
          {R.SETS.filter(set => effects.counts[set.id]).map(set => <div className="dp-set-progress" key={set.id}>
            <b>{set.name} · {effects.counts[set.id]}/4</b><progress aria-label={`${set.name} pieces`} value={effects.counts[set.id]} max={4} />
            <p className={effects.counts[set.id]! >= 2 ? 'active' : ''}>2 pieces · {set.two}</p>
            <p className={effects.counts[set.id]! >= 4 ? 'active' : ''}>4 pieces · {set.four}</p>
          </div>)}
          {!fitted.length && <p>Equip two matching pieces to begin a set.</p>}
        </section>
        <div>
          <div className="dp-gear-grid">{gear.map(candidate => {
            const spec = R.GEAR_BY_ID[candidate.templateId]!;
            const owner = Object.entries(state.equipment).find(([, loadout]) => Object.values(loadout).includes(candidate.id))?.[0];
            return <button key={candidate.id} style={rarityStyle(spec.rarity)} aria-pressed={candidate.id === item?.id}
              onClick={() => { m.itemId = candidate.id; setAffix(''); m.notify(false); }}>
              <ItemIcon slot={spec.slot} /><b>{spec.name}</b><small>{spec.slot} · {spec.rarity} · +{candidate.enhancement}</small>
              <small>{owner ? `Worn by ${R.CAT_BY_ID[owner]!.name}` : 'Available'} · Account-bound</small>
            </button>;
          })}</div>
          {!gear.length && <p>No equipment matches these filters.</p>}
          {item && template && preview && <section className="cr-panel dp-gear-detail" style={rarityStyle(template.rarity)} key={`${item.id}-${feedback}`}>
            <h2>{template.name}</h2><p>{template.rarity} · item level {template.level} · Account-bound</p><p>{template.source}</p><p>{template.story}</p>
            <h3>Compare on {R.CAT_BY_ID[cardId]!.name}</h3>
            <div className="dp-compare" title="Current stats with the change from equipping this piece. Green raises a stat, red lowers it.">
              <dl className="cr-stats">{Object.entries(R.depthStats(state, cardId)).map(([key, before]) => {
                const after = comparison?.stats?.[key as keyof CatStats] ?? before;
                return <div key={key}><dt>{statName(key)}</dt><dd className={after > before ? 'up' : after < before ? 'down' : ''}>
                  {statValue(key, before)} → {statValue(key, after)}
                </dd></div>;
              })}</dl>
            </div>
            {comparison?.error && <p>{comparison.error}</p>}
            <p>{template.main} {preview.before}{item.enhancement < 12 ? ` → ${preview.after} at +${item.enhancement + 1}` : ' · maximum +12'}</p>
            <CostView cost={preview.cost} />
            <div className="cr-actions">
              <button className="cr-primary" disabled={locked || !!comparison?.error} onClick={() => {
                const result = R.equipGear(state, cardId, item.id);
                if (result.ok) result.state.tutorial = Math.max(4, result.state.tutorial);
                act(result, `${template.name} fitted to ${R.CAT_BY_ID[cardId]!.name}.`);
              }}>Equip selected</button>
              <button disabled={locked || item.enhancement >= 12} onClick={() => act(R.enhanceGear(state, item.id), `${template.name} enhanced to +${item.enhancement + 1}.`)}>Enhance equipment</button>
              <button disabled={locked || !state.equipment[cardId]?.[template.slot]} onClick={() => act(R.equipGear(state, cardId, null, template.slot), `${template.slot} returned to the shelf.`)}>Unequip slot</button>
              <button disabled={locked || Object.values(state.equipment).some(loadout => Object.values(loadout).includes(item.id))}
                onClick={() => act(R.salvageGear(state, item.id), `${template.name} salvaged for ${CARD_RPG_CONFIG.rarity[template.rarity].salvage} threads.`)}>Salvage</button>
            </div>
            {item.affixes.map(id => <p key={id}>{R.AFFIX_BY_ID[id]!.name} · {R.gearAffixRoll(item, id)} · {R.AFFIX_BY_ID[id]!.description}</p>)}
            {item.affixes.length > 0 && <div className="cr-actions"><label>Replace first affix
              <select value={chosenAffix ?? ''} onChange={event => setAffix(event.target.value)}>
                {compatible.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} · {candidate.tiers[item.tier - 1]!.join('–')}</option>)}
              </select></label><button disabled={locked || !chosenAffix}
                onClick={() => { if (chosenAffix) act(R.reforgeGear(state, item.id, 0, chosenAffix), 'The selected affix has been stitched into this piece.'); }}>Reforge · 90 fish / 15 threads</button></div>}
          </section>}
        </div>
      </div>
      <section className="cr-panel"><h2>Choose a tailoring project</h2><label>Template
        <select value={craftId} onChange={event => setCraftId(event.target.value)}>
          {R.GEAR.map(spec => <option key={spec.id} value={spec.id}>{spec.name} · {spec.rarity} · chapter {spec.chapter}</option>)}
        </select></label><p>{R.GEAR_BY_ID[craftId]!.story}</p>
        <button disabled={locked} onClick={() => act(R.craftGear(state, craftId), 'Chosen piece crafted. Look for it in your equipment.')}>Craft chosen piece</button>
      </section>
    </>}
    {category === 'Materials' && <div className="cr-stack-grid">
      <article><h2>{state.materials} mastery materials</h2><p>Earn from chapter clears and capped cafe rewards. Spend on awakening.</p><small>Account-bound</small></article>
      <article><h2>{state.seals} boss seals</h2><p>Effort earned from bosses. Reserve an eligible Relic design with seals and chapter progress.</p><small>Account-bound</small></article>
      {STACK_ITEMS.filter(stack => stack.kind !== 'consumable' && stack.id !== 'boss-proof').map(stack => <article key={stack.id} style={rarityStyle(stack.rarity)}>
        <h2>{state.account.inventory.stacks[stack.id] ?? 0} {stack.name}</h2><p>{stack.description}</p><small>{stack.rarity} · {stack.source} · Account-bound</small>
      </article>)}
    </div>}
    {category === 'Consumables' && <div className="cr-stack-grid"><article><h2>{state.run?.supplies ?? 0} packed milk tonics</h2>
      <p>Restore up to 100 HP to each companion between encounters. Supplies belong to the current route.</p>
      <button disabled={!state.run || state.run.complete || !!state.run.battle || !state.run.supplies}
        onClick={() => act(R.useTonic(state), 'Each companion recovered up to 100 HP.')}>Use packed tonic</button><small>Account-bound</small>
    </article>{STACK_ITEMS.filter(stack => stack.kind === 'consumable' && (state.account.inventory.stacks[stack.id] ?? 0) > 0).map(stack => <article key={stack.id}>
      <h2>{state.account.inventory.stacks[stack.id]} {stack.name}</h2><p>Stored in the account pantry.</p><small>{stack.rarity} · Account-bound</small>
    </article>)}</div>}
    {category === 'Collectibles' && <CollectibleDesigns m={m} />}
    {category === 'Currencies' && <div className="cr-stack-grid">{Object.entries(state.account.currencies).map(([id, amount]) => <article key={id}>
      <h2>{amount.toLocaleString('en-US')} {id === 'fish' ? 'fish points' : id}</h2>
      <p>{({ fish: 'Level companions, enhance and tailor equipment.', threads: 'Enhance, tailor and reforge equipment.', stamps: 'Invite companions with earned stamps.', essence: 'Ascend and awaken companions.' } as Record<string, string>)[id]}</p>
      <small>Earn from routes, quests and cafe service · Account-bound</small>
    </article>)}</div>}
  </>;
}
