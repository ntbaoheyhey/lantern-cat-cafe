import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import { AFFIXES, BOSSES, ENCOUNTERS, ENCOUNTER_COPY, ROOMS, SETS, SLOTS, bossReady, cafeQuests, cafeStats, compareKit, completion, masteryLevel, qualityOdds, routeOptions,
  type CafeAction, type CafeItem, type CafeState, type Counter, type SetId, type Slot } from '@taskbar-hero/game-rules/client/cafe';
import { useCafe } from './useCafe';
import { cafeAsset } from './assets';
import './cafe.css';

const C = CONFIG.cafe;
const TABS = ['Patrol', 'Wardrobe', 'Workshop', 'Journal', 'Cafe'] as const;
const SET_NAMES = { ember: 'Ember / burst', moss: 'Moss / sustain', star: 'Star / scavenger' };
const ITEM_ART: Record<Slot, string> = { paw: 'item-acc.paw', scarf: 'item-acc.ribbon', charm: 'item-acc.bell', boots: 'item-arm.cozy.boots' };
const COUNTERS: Counter[] = ['dodge', 'break', 'interrupt'];
const SYMBOLS = { dodge: '◇', break: '▣', interrupt: '✦' };
const AFFIX_EFFECTS = {
  keen: `+${C.gear.keenDamage} base damage, scaled by quality.`,
  cushioned: `+${C.gear.cushionedHp} base HP, scaled by quality.`,
  steady: `+${Math.round(C.gear.steadyGuard * 100)} points of auto-brace.`,
  lucky: `+${C.gear.luckyPatches} patch per find.`,
};
type Send = (action: CafeAction) => void;
const title = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const delta = (n: number) => `${n > 0 ? '↑ +' : n < 0 ? '↓ ' : '↔ '}${n}`;
function Badge({ name }: { name: string }) { return <img className="cafe-badge" src={cafeAsset(`/art/gameplay2/${name}.png`)} alt="" />; }
function ItemArt({ item }: { item: CafeItem }) { return <img className="cafe-item-art" src={cafeAsset(`/art/gameplay/${ITEM_ART[item.slot]}.png`)} alt="" />; }
function Meter({ label, value, max }: { label: string; value: number; max: number }) {
  return <label className="cafe-meter"><span>{label}<b>{Math.ceil(Math.max(0, value))} / {Math.ceil(max)}</b></span><progress aria-label={label} value={Math.max(0, value)} max={max} /></label>;
}
function Sets({ state }: { state: CafeState }) {
  const { sets } = cafeStats(state);
  const descriptions = {
    ember: [`+${C.sets.emberDamage * 100}% damage`, `Pounce ${C.sets.emberCooldown}s sooner`, `+${C.sets.emberExposure * 100}% exposure damage`],
    moss: [`+${C.sets.mossHp * 100}% HP`, `Heal ${C.sets.mossRegen} HP/s`, `+${C.sets.mossGuard * 100}% auto-brace`],
    star: [`+${C.sets.starPatches} patch/find`, `+${C.sets.starLuck * 100}% luck`, 'Finds are at least Fine'],
  };
  return <div className="cafe-sets">{SETS.map(set => <div className={`cafe-set cafe-set--${set}`} key={set}>
    <strong><span><Badge name={`icon-${set}`} />{title(set)}</span> <span>{sets[set]}/{SLOTS.length}</span></strong>
    {descriptions[set].map((text, i) => <small key={text} className={sets[set] >= [C.sets.two, C.sets.three, C.sets.four][i]! ? 'is-earned' : ''}>
      {sets[set] >= [C.sets.two, C.sets.three, C.sets.four][i]! ? '✓' : '○'} {[C.sets.two, C.sets.three, C.sets.four][i]} · {text}</small>)}
  </div>)}</div>;
}
function BossControls({ state, send }: { state: CafeState; send: Send }) {
  const b = state.boss!, move = BOSSES[b.chapter - 1]!.moves[b.move % BOSSES[b.chapter - 1]!.moves.length]!, stats = cafeStats(state);
  return <section className="cafe-counter-panel" aria-label="Boss counterplay">
    <div className="cafe-cue" role="status"><b>{b.stage === 'windup' ? `${SYMBOLS[b.counter]} ${move.name}` : '✧ Recovery — an opening!'}</b>
      <span>{b.stage === 'windup' ? `${title(b.counter)} before the hit · ${b.remaining}s` : `${b.exposure > 0 ? 'Pounce now for extra damage' : 'Pounce, or save it for a matched counter'} · ${b.remaining}s`}</span></div>
    <div className="cafe-actions">{COUNTERS.map((counter, i) => <button key={counter} className={b.chosen === counter ? 'is-selected' : ''}
      aria-keyshortcuts={String(i + 1)} disabled={b.stage !== 'windup' || b.chosen !== null} onClick={() => send({ type: 'counter', counter })}>
      <Badge name={`counter-${counter}`} /> {title(counter)} <kbd>{i + 1}</kbd></button>)}
      <button aria-keyshortcuts="P" disabled={b.elapsed < b.pounceAt} onClick={() => send({ type: 'pounce' })}>Pounce <kbd>P</kbd>{b.elapsed < b.pounceAt ? ` · ${b.pounceAt - b.elapsed}s` : ''}</button></div>
    <p>{b.stage === 'recovery' ? b.exposure > 0 ? 'Your matching response opened a damage window.' : 'No bonus opening this time. Match the next tell for extra damage.' : b.chosen ? `Ready: ${title(b.chosen)}. One response per tell.` : `Hands free? Mochi braces for ${Math.round(stats.guard * 100)}% less damage. A matching response avoids the hit.`}</p>
  </section>;
}
function Patrol({ state, send, navigate }: { state: CafeState; send: Send; navigate: (tab: typeof TABS[number]) => void }) {
  const boss = state.boss, e = state.encounter, stats = cafeStats(state), definition = BOSSES[state.chapter - 1]!, routes = routeOptions(state);
  const previous = useRef(boss), serial = useRef(0);
  const [impact, setImpact] = useState({ id: 0, dealt: 0, taken: 0, counter: false });
  useEffect(() => {
    const before = previous.current;
    if (before && boss) {
      const dealt = Math.max(0, Math.round(before.hp - boss.hp)), taken = Math.max(0, Math.round(before.catHp - boss.catHp));
      if (dealt || taken || boss.correct > before.correct) setImpact({ id: ++serial.current, dealt, taken, counter: boss.correct > before.correct });
    }
    previous.current = boss;
  }, [boss]);
  const bossArt = `mon.${definition.name.toLowerCase().replaceAll(' ', '.')}`;
  const creatureArt = cafeAsset(boss ? `/art/gameplay/${bossArt}-${boss.stage === 'windup' ? 'windup' : 'attack'}.png` : `/art/gameplay2/encounter-${e?.kind ?? 'scout'}.png`);
  return <div className="cafe-columns">
    <div className="cafe-patrol">
      <section className="cafe-arena" aria-label={boss ? `${definition.name} practice fight` : 'Mochi patrols the cafe'} style={{ '--cafe-room': `url('${cafeAsset(`/art/visual/room-${state.chapter}.png`)}')` } as CSSProperties}>
        <div className="cafe-arena-heading"><span>ROOM {state.chapter} / {ROOMS.length}</span><h3>{boss ? definition.name : ROOMS[state.chapter - 1]}</h3>
          <p>{boss ? `Phase ${boss.phase} · ${['Learn the pattern', 'Stronger hits', 'Shorter tells'][boss.phase - 1]} · ${boss.elapsed >= C.boss.enrageSeconds ? 'ENRAGED' : `Enrage in ${C.boss.enrageSeconds - boss.elapsed}s`}` : e ? ENCOUNTER_COPY[e.kind].name : 'Mochi is following a new trail…'}</p></div>
        <div className="cafe-actors"><div><div className="cafe-sprite cafe-mochi" style={{ backgroundImage: `url('${cafeAsset('/art/gameplay/mochi-warrior-idle.png')}')` }} /><span>Mochi</span></div>
          <div className={boss?.stage === 'windup' ? 'cafe-foe is-telling' : 'cafe-foe'}><div className="cafe-sprite" style={{ backgroundImage: `url('${creatureArt}')` }} />
            <span>{boss ? `${SYMBOLS[boss.counter]} ${title(boss.counter)}` : e ? `${ENCOUNTER_COPY[e.kind].symbol} ${title(e.kind)}` : 'Next find soon'}</span></div></div>
        {boss && impact.id > 0 && <div key={impact.id} className={`cafe-impact ${impact.counter ? 'is-counter' : ''}`} aria-hidden="true"><span>{impact.counter ? '✓ Counter!' : impact.taken ? `−${impact.taken} HP` : ''}</span><b>{impact.dealt ? `−${impact.dealt}` : ''}</b></div>}
        {boss && <div className="cafe-arena-bars"><Meter label="Mochi HP" value={boss.catHp} max={boss.maxCatHp} /><Meter label="Boss HP" value={boss.hp} max={boss.maxHp} /></div>}
      </section>
      {boss ? <BossControls state={state} send={send} /> : <section className="cafe-route" aria-label="Encounter choice">
        {e ? <><h3>{ENCOUNTER_COPY[e.kind].symbol} {ENCOUNTER_COPY[e.kind].name}</h3><p>{ENCOUNTER_COPY[e.kind].clue}</p>
          <div className="cafe-route-options">
            <button onClick={() => send({ type: 'route', route: 'gather' })}><b>Gather</b><span>+{routes.gather} patches · safe</span></button>
            <button onClick={() => send({ type: 'route', route: 'study' })}><b>Study</b><span>{routes.study.insight ? `+${routes.study.insight} Insight` : 'Insight full'} · {routes.study.item ? 'guaranteed kit piece' : routes.study.xp ? `+${routes.study.xp} extra mastery` : `+${routes.study.patches} patches`}</span></button>
            <button onClick={() => send({ type: 'route', route: 'risk' })}><b>{e.kind === 'thief' || e.kind === 'swift' ? 'Chase' : 'Explore'}</b><span>{Math.round(routes.risk.chance * 100)}%: {routes.risk.patches} patches; otherwise {routes.risk.consolation}</span></button>
          </div><small>Mochi gathers safely if you leave it to them. No owned items are at risk.</small></> : <><h3>Another corner to explore</h3><p>Next encounter in {Math.max(0, state.nextEncounterAt - state.seconds)}s. Compare your latest find or plan a matching set.</p><button onClick={() => navigate('Wardrobe')}>Compare the kit →</button></>}
      </section>}
      <p key={state.events.at(-1)?.at + ':' + state.events.at(-1)?.text} className="cafe-latest" data-bright={state.events.at(-1)?.text.startsWith('bright ')} role="status">{state.events.at(-1)?.text}</p>
    </div>
    <aside tabIndex={0} className="cafe-sidebar" aria-label="Patrol goals">
      {state.lastBoss && <section className={`cafe-result ${state.lastBoss.won ? 'is-win' : ''}`} data-testid="cafe-boss-result"><div className="cafe-eyebrow">{state.lastBoss.won ? 'A LITTLE VICTORY' : 'EVERY CAT LEARNS'}</div><h3>{state.lastBoss.grade}</h3><p>{state.lastBoss.seconds}s · {state.lastBoss.counters} counters · {state.lastBoss.hp} HP left</p><p>{state.lastBoss.hint}</p>
        {state.clears.includes(state.chapter) && state.chapter < ROOMS.length && <button onClick={() => send({ type: 'nextRoom' })}>Explore {ROOMS[state.chapter]} →</button>}</section>}
      <section><div className="cafe-eyebrow">THE NEXT LITTLE THING</div><h3>{boss ? 'Read, react, pounce' : bossReady(state) ? 'A household legend awaits' : `${Math.max(0, C.bossGate * state.chapter - state.encounters)} finds to the boss`}</h3>
        <p>{boss ? 'Match the named tell. Pounce during recovery for the largest opening.' : 'Your kit changes how you play. A complete set is a choice, not a requirement.'}</p>
        {!boss && <><label className="cafe-label">Challenge tier<select aria-label="Challenge tier" value={state.tier} onChange={e => send({ type: 'tier', tier: Number(e.target.value) })}>{C.tiers.map((t, i) => <option key={t.id} value={i}>{t.name}</option>)}</select></label>
          <small>Boss HP ×{C.tiers[state.tier]!.hp} · damage ×{C.tiers[state.tier]!.damage} · first-clear Bright chance +{Math.round(C.tiers[state.tier]!.quality * 100)} points</small>
          <button className="cafe-primary" disabled={!bossReady(state)} onClick={() => send({ type: 'fight' })}>{state.seconds < state.retryAt ? `Rest ${state.retryAt - state.seconds}s` : 'Challenge boss'} <span>↗</span></button>
          <small>Practice: no Cat Key spent, no Relics awarded.</small></>}
        {boss?.assisted && <p>Assist is on: a gentler boss after two losses.</p>}
      </section>

      <section><div className="cafe-eyebrow">YOUR ADVENTURE KIT</div><div className="cafe-stat-row"><b>{stats.damage}<small>damage/s</small></b><b>{stats.hp}<small>HP</small></b><b>{state.insight}/{C.maxInsight}<small>Insight</small></b></div><Sets state={state} /></section>
    </aside>
  </div>;
}
function Wardrobe({ state, send }: { state: CafeState; send: Send }) {
  const [selected, select] = useState(state.inventory[0]!.id), item = state.inventory.find(i => i.id === selected) ?? state.inventory[0]!, comparison = compareKit(state, item);
  const saved = Object.values(state.loadouts).some(k => k && Object.values(k).includes(item.id));
  return <div className="cafe-columns"><section tabIndex={0} className="cafe-scroll"><div className="cafe-section-heading"><div><h3>A kit with a point of view</h3><p>Match a set to change your rhythm, then compare damage and effective HP.</p></div><span>{state.inventory.length}/{C.maxItems} pieces</span></div>
    <div className="cafe-actions">{SETS.map(set => <button key={set} disabled={!!state.boss} onClick={() => send({ type: 'build', set })}>{SET_NAMES[set]}</button>)}</div>
    <small>Build buttons match owned pieces first, then that build’s main stat. They never create equipment.</small>
    <div className="cafe-item-grid" role="list" aria-label="Adventure kit items">{state.inventory.map(i => <div key={i.id} role="listitem"><button aria-pressed={item.id === i.id} className={`cafe-item cafe-quality--${i.quality}`} onClick={() => select(i.id)}>
      <ItemArt item={i} /><strong>{title(i.set)} {i.slot}</strong><span>{i.quality === 'bright' ? '★' : i.quality === 'fine' ? '◇' : '○'} {title(i.quality)} · {i.affix}</span><small>{state.equipped[i.slot] === i.id ? '✓ Equipped' : `Stitch ${i.level}`}</small></button></div>)}</div>
  </section><aside tabIndex={0} className="cafe-sidebar"><section><ItemArt item={item} /><h3>{title(item.set)} {item.slot}</h3><p>{title(item.quality)} · room {item.chapter} · stitch {item.level}/{C.gear.maxLevel}</p><p>{title(item.affix)}: {AFFIX_EFFECTS[item.affix]}</p>
    <div className="cafe-comparison"><b>{delta(comparison.damage)}<small>damage / second</small></b><b>{delta(comparison.ehp)}<small>effective HP with auto-brace</small></b></div>
    <button className="cafe-primary" disabled={!!state.boss || state.equipped[item.slot] === item.id} onClick={() => send({ type: 'equip', id: item.id })}>{state.equipped[item.slot] === item.id ? 'Equipped' : 'Equip this piece'}</button>
    <button disabled={!!state.boss || state.equipped[item.slot] === item.id || saved} onClick={() => send({ type: 'recycle', id: item.id })}>Recycle for {C.riskConsolation} patch</button><small>Equipped and saved-kit pieces are protected.</small></section>
    <section><h3>Two favorite outfits</h3><div className="cafe-loadouts">{(['A', 'B'] as const).map(name => <div key={name}><button disabled={!!state.boss} onClick={() => send({ type: 'saveKit', name })}>Save kit {name}</button><button disabled={!!state.boss || !state.loadouts[name]} onClick={() => send({ type: 'loadKit', name })}>Wear {name}</button></div>)}</div></section><section><Sets state={state} /></section></aside></div>;
}
function Workshop({ state, send }: { state: CafeState; send: Send }) {
  const [set, chooseSet] = useState<SetId>('moss'), [slot, chooseSlot] = useState<Slot>('paw'), [id, chooseItem] = useState(state.inventory[0]!.id);
  const item = state.inventory.find(i => i.id === id) ?? state.inventory[0]!, capped = item.level >= C.gear.maxLevel, odds = qualityOdds(state);
  return <div className="cafe-columns"><section tabIndex={0} className="cafe-workshop cafe-scroll"><div className="cafe-eyebrow">THE PATCHWORK BENCH</div><h3>Make the missing piece.</h3><p>Choose the set and slot; both are guaranteed. Quality and one affix roll openly.</p>
    <div className="cafe-bench-art" aria-hidden="true"><img src={cafeAsset('/art/visual/forge-hearth.png')} alt="" /></div>
    <div className="cafe-fields"><label>Set<select aria-label="Set" value={set} onChange={e => chooseSet(e.target.value as SetId)}>{SETS.map(s => <option key={s} value={s}>{SET_NAMES[s]}</option>)}</select></label>
      <label>Slot<select aria-label="Slot" value={slot} onChange={e => chooseSlot(e.target.value as Slot)}>{SLOTS.map(s => <option key={s}>{s}</option>)}</select></label></div>
    <button className="cafe-primary" disabled={!!state.boss || state.patches < C.forge.craftCost || state.inventory.length >= C.maxItems} onClick={() => send({ type: 'craft', slot, set })}>Craft {title(set)} {slot} · {C.forge.craftCost} patches</button>
    <small>Bright {Math.round(odds.bright * 100)}% · Fine {Math.round(odds.fine * 100)}% · Plain {Math.round(odds.plain * 100)}%. Each affix ({AFFIXES.join(', ')}) is equally likely.</small>
    <p className="cafe-latest" role="status">{state.events.at(-1)?.text}</p>
  </section><aside tabIndex={0} className="cafe-sidebar"><section><div className="cafe-eyebrow">A SMALL, HONEST GAMBLE</div><h3>Stitch a little stronger</h3><label className="cafe-label">Piece<select aria-label="Piece to stitch" value={item.id} onChange={e => chooseItem(e.target.value)}>{state.inventory.map(i => <option key={i.id} value={i.id}>{title(i.set)} {i.slot} · {i.affix} · +{i.level}</option>)}</select></label>
    <ItemArt item={item} /><Meter label="Stitch level" value={item.level} max={C.gear.maxLevel} />
    <button disabled={!!state.boss || capped || state.patches < C.forge.steadyCost} onClick={() => send({ type: 'stitch', id: item.id, kind: 'steady' })}><b>Steady stitch</b><span>Guaranteed +1 · {C.forge.steadyCost} patches</span></button>
    <button disabled={!!state.boss || capped || state.patches < C.forge.sparkCost} onClick={() => send({ type: 'stitch', id: item.id, kind: 'spark' })}><b>Spark stitch</b><span>{item.misses >= C.forge.pityMisses ? '100% guarantee' : `${Math.round(C.forge.sparkChance * 100)}% chance`} of +{Math.min(C.forge.sparkLevels, C.gear.maxLevel - item.level)} · {C.forge.sparkCost} patches</span></button>
    <Meter label="Misses toward guaranteed Spark" value={item.misses} max={C.forge.pityMisses} /><p>A miss spends patches but keeps the piece. After {C.forge.pityMisses} misses on this piece, its next Spark succeeds.</p></section>
    <section><h3>Small steps, no pressure</h3><p>Gathering keeps bringing patches. Nothing here can be bought or traded.</p></section></aside></div>;
}
function Journal({ state }: { state: CafeState }) {
  const progress = completion(state);
  return <div className="cafe-columns"><section tabIndex={0} className="cafe-scroll"><div className="cafe-section-heading"><div><h3>Every corner has a story.</h3><p>Meet a creature to keep its entry. Your journal stays through every new tour.</p></div><b>{progress.percent}% complete</b></div>
    <section className="cafe-codex-room"><h4><Badge name="icon-journal" />The patchwork collection</h4><div className="cafe-set-collection">{SETS.map(set => <div key={set}><strong><Badge name={`icon-${set}`} />{title(set)}</strong>{SLOTS.map(slot => <span key={slot}>{state.discovered.includes(`gear:${set}:${slot}`) ? '✓' : '○'} {slot}</span>)}</div>)}</div></section>
    {ROOMS.map((room, index) => <section className="cafe-codex-room" key={room}><h4>{index + 1}. {room}</h4><div className="cafe-codex-grid">{[...ENCOUNTERS, 'boss' as const].map(kind => {
      const found = state.discovered.includes(`${index + 1}:${kind}`); return <div key={kind} className={found ? 'cafe-entry is-found' : 'cafe-entry'}><span aria-hidden="true">{found ? <Badge name={kind === 'boss' ? 'icon-achievement' : `encounter-${kind}`} /> : '?'}</span><b>{found ? kind === 'boss' ? BOSSES[index]!.name : ENCOUNTER_COPY[kind].name : 'Unmet neighbor'}</b><small>{found ? '✓ Discovered' : 'Explore this room'}</small></div>;
    })}</div></section>)}
  </section><aside tabIndex={0} className="cafe-sidebar"><section><div className="cafe-eyebrow">TODAY IN THE CAFE</div><h3>A checklist that waits</h3><p>No midnight reset, streak, or lost progress. Each goal pays {C.questXp} mastery and {C.questPatches} local patches once.</p>
    {cafeQuests(state).map(q => <div className="cafe-quest" key={q.id}><span>{q.claimed ? '✓' : '○'} {q.name}</span><Meter label={q.name} value={q.progress} max={q.target} /></div>)}</section></aside></div>;
}
function Cafe({ state, send, undoTour, canUndo }: { state: CafeState; send: Send; undoTour: () => void; canUndo: boolean }) {
  const [confirm, setConfirm] = useState(false), level = masteryLevel(state);
  return <div className="cafe-columns"><section tabIndex={0} className="cafe-scroll cafe-mastery"><div className="cafe-eyebrow">A HOME WORTH RETURNING TO</div><h3>Make this cafe your own.</h3><p>Mastery grows through exploring and helping. Choose a small permanent perk; change it freely between fights.</p>
    <Meter label={`Cafe mastery ${level}/${C.mastery.maxLevel}`} value={Math.min(state.xp, C.mastery.maxLevel * C.mastery.xpPerLevel)} max={C.mastery.maxLevel * C.mastery.xpPerLevel} />
    <div className="cafe-mastery-choices">{([{ id: 'bold', name: 'Brave paws', text: `+${Math.round(level * C.mastery.damagePerLevel * 100)}% damage` }, { id: 'gentle', name: 'Warm hearth', text: `+${Math.round(level * C.mastery.hpPerLevel * 100)}% HP` }, { id: 'curious', name: 'Curious whiskers', text: level ? `+${C.mastery.scoutPatches} patch per find` : 'One extra patch per find at mastery 1' }] as const).map(perk => <button key={perk.id} aria-pressed={state.mastery === perk.id} disabled={!!state.boss} onClick={() => send({ type: 'mastery', mastery: perk.id })}><strong>{perk.name}</strong><span>{perk.text}</span>{state.mastery === perk.id && <small>✓ Chosen</small>}</button>)}</div>
    <section className="cafe-settings"><h3>Play at your pace</h3><label><input type="checkbox" checked={state.assist} disabled={!!state.boss} onChange={e => send({ type: 'assist', enabled: e.target.checked })} />Gentle assist after {C.assist.afterLosses} losses</label><p>When active: boss HP −{C.assist.hpReduction * 100}%, damage −{C.assist.damageReduction * 100}%. The fight labels it; you can turn it off.</p></section>
    <details><summary>What stays local?</summary><p>Adventure patches, kits, mastery, journal entries and tours belong to this Sample save. They do not grant Fish, Yarn, Cat Keys, Moon Pearls or Relics.</p></details>
  </section><aside tabIndex={0} className="cafe-sidebar"><section><div className="cafe-eyebrow">ANOTHER EVENING, A NEW TOUR</div><h3>A familiar new beginning</h3><p>After {C.tour.unlockClears} room clears, restart the route for +{C.tour.damagePerTour * 100}% damage, capped at +{Math.round(C.tour.maxBonusTours * C.tour.damagePerTour * 100)}%.</p>
    <dl className="cafe-keeps"><dt>Keep</dt><dd>Every kit piece, patch, mastery level, journal entry and achievement.</dd><dt>Restart</dt><dd>Room access, patrol count, boss clears and Insight.</dd><dt>Your bonus</dt><dd>+{Math.round(Math.min(state.tours, C.tour.maxBonusTours) * C.tour.damagePerTour * 100)}% → +{Math.round(Math.min(state.tours + 1, C.tour.maxBonusTours) * C.tour.damagePerTour * 100)}% damage</dd></dl>
    {confirm ? <div><p>Ready to return to the Living Room?</p><button onClick={() => { send({ type: 'tour' }); setConfirm(false); }}>Start new tour</button><button onClick={() => setConfirm(false)}>Stay here</button></div> : <button disabled={!!state.boss || state.clears.length < C.tour.unlockClears} onClick={() => setConfirm(true)}>Preview a new tour</button>}
    {canUndo && <button onClick={undoTour}>Undo tour before your next choice</button>}
  </section><section><h3>When you step away</h3><p>Mochi saves one patch per {C.away.secondsPerPatch / 60} minutes, up to {C.away.maxPatches}. Fights wait exactly where you left them.</p><small>No login needed. No streak to lose.</small></section></aside></div>;
}

export default function CafeAdventure({ active, onExit }: { active: boolean; onExit: () => void }) {
  const { state, dispatch, saveError, away, dismissAway, undoTour, canUndo } = useCafe(active);
  const [tab, navigate] = useState<typeof TABS[number]>('Patrol'), [hidden, setHidden] = useState(document.hidden);
  useEffect(() => { const visibility = () => setHidden(document.hidden); document.addEventListener('visibilitychange', visibility); return () => document.removeEventListener('visibilitychange', visibility); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!active || tab !== 'Patrol' || !state.boss || e.repeat || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest('input,select,textarea,[contenteditable]')) return;
      if (['1', '2', '3'].includes(e.key)) { e.preventDefault(); dispatch({ type: 'counter', counter: COUNTERS[Number(e.key) - 1]! }); }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); dispatch({ type: 'pounce' }); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [active, tab, state.boss]);
  const progress = completion(state), debug = import.meta.env.DEV && new URLSearchParams(location.search).get('adventureDebug') === '1';
  return <div className="cafe-shell" data-testid="cafe-adventure" data-paused={!active || hidden} style={{ '--cafe-impact-ms': `${CONFIG.gameplay.juice.labelMs}ms`, '--cafe-stop-ms': `${CONFIG.gameplay.juice.critStopMs}ms`, '--cafe-shake-px': `${CONFIG.gameplay.juice.maxShakePx}px`, '--cafe-settle-ms': `${CONFIG.gameplay.juice.settleMs}ms` } as CSSProperties}>
    <header className="cafe-header"><div><div className="cafe-eyebrow">LANTERN CAT CAFÉ <span>Sample adventure</span></div><h2>The evening patrol</h2><p>A local adventure kit, a few brave choices, and a home to come back to.</p></div>
      <div className="cafe-header-stats"><b>✦ {state.patches}<small>local patches</small></b><b>{masteryLevel(state)}<small>cafe mastery</small></b><b>{progress.percent}%<small>journal complete</small></b><button onClick={onExit}>Main game ↗</button></div></header>
    {saveError && <p role="alert">{saveError}</p>}
    {away && <section className="cafe-away" aria-label="While you were away"><div><strong>While you were away · +{away.patches} local patches</strong><p>{Math.floor(away.credited / 60)} capped minutes counted. Bosses and your kit waited; no streak was lost.</p></div><button onClick={dismissAway}>Welcome home</button></section>}
    <nav className="cafe-tabs" aria-label="Adventure pages">{TABS.map(name => <button key={name} aria-current={tab === name ? 'page' : undefined} onClick={() => navigate(name)}>{name}</button>)}<span>Now: {state.boss ? 'Read the next tell' : state.encounter ? 'Choose a route' : 'Compare a find'} · Next: {state.clears.includes(state.chapter) ? state.chapter < ROOMS.length ? `explore room ${state.chapter + 1}` : 'try a new tour' : `clear room ${state.chapter}`} · Later: {progress.found}/{progress.target} journal</span></nav>
    {state.boss && tab !== 'Patrol' && <button className="cafe-return-fight" onClick={() => navigate('Patrol')}>Boss in progress · return to the tells →</button>}
    <div className="cafe-content" role="region" aria-label={`${tab} page`} tabIndex={0}>
      {tab === 'Patrol' && <Patrol state={state} send={dispatch} navigate={navigate} />}
      {tab === 'Wardrobe' && <Wardrobe state={state} send={dispatch} />}
      {tab === 'Workshop' && <Workshop state={state} send={dispatch} />}
      {tab === 'Journal' && <Journal state={state} />}
      {tab === 'Cafe' && <Cafe state={state} send={dispatch} undoTour={undoTour} canUndo={canUndo} />}
    </div>
    <footer className="cafe-footer">Candidate build, not live. Sample kit and patches stay here; no Relic or market rewards.
      {debug && <details><summary>Developer jumps</summary><div><button onClick={() => (window as any).__cafeDebug.advance(C.debug.seconds)}>+{C.debug.seconds}s</button><button onClick={() => (window as any).__cafeDebug.supplies()}>Grant local patches</button><button onClick={() => (window as any).__cafeDebug.kit()}>Grant sample kit</button>{ROOMS.map((_, i) => <button key={i} onClick={() => (window as any).__cafeDebug.chapter(i + 1)}>Room {i + 1}</button>)}</div></details>}
    </footer>
  </div>;
}
