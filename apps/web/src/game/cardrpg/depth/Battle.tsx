import { useEffect, useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import { SQUAD_ITEMS, type SquadItem } from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EquipmentAppearance } from '../../squad/turn3d/appearance';
import { TurnScene, type SceneView } from '../../squad/turn3d/scene';
import { MODEL_IDS, portrait, skillIcon } from './assets';
import type { DepthModel } from './model';
import { decorateChapterStage } from './chapter-stage';

function project(battle: R.Battle): TurnActor[] {
  const slots = { party: 0, enemy: 0 };
  return battle.actors.map(actor => ({
    ...actor, slot: slots[actor.side]++, role: (CARD_BY_ID[actor.catalogId]?.role ?? R.ENEMY_BY_ID[actor.catalogId]?.role ?? 'guard') as TurnActor['role'],
    equipment: {}, setBonuses: [], statuses: [], shieldRounds: 1, shieldAppliedRound: battle.round,
    crit: 0, auto: false, cooldownApplied: {}, turnsTaken: actor.turns, controlCount: 0, passiveReady: 0, quickenedRound: 0,
    cardRpg: { cardId: actor.catalogId, name: actor.name, stats: {} as never, properties: [], sets: [], itemIds: actor.equipment },
  }));
}
function appearance(actor: TurnActor): EquipmentAppearance {
  const result: EquipmentAppearance = {};
  for (const id of actor.cardRpg?.itemIds ?? []) {
    const template = R.GEAR_BY_ID[id];
    if (!template) continue;
    const options = SQUAD_ITEMS.filter(item => item.slot === template.slot && item.fit.includes(actor.role as 'guardian'));
    const setIndex = R.SETS.findIndex(s => s.id === template.setId);
    const item = options[(Math.max(0, setIndex) + (template.unique ? 3 : 0)) % options.length];
    if (item) result[template.slot] = { ...item, name: template.name,
      visual: template.unique ? 3 : setIndex % 4, rarity: (template.rarity[0]!.toUpperCase() + template.rarity.slice(1)) as SquadItem['rarity'] };
  }
  return result;
}
function Statuses({ actor }: { actor: R.Actor }) {
  return <div className="dp-statuses">{actor.statuses.map(status => <details key={status.id}>
    <summary>{R.STATUS_BY_ID[status.id].name} {status.stacks} · {status.remaining}r</summary>
    <p className="dp-keyword-tip">{R.STATUS_BY_ID[status.id].description} Stacks {status.stacks}/{R.STATUS_BY_ID[status.id].cap}. {status.remaining} rounds remaining.</p>
  </details>)}</div>;
}
export function BattleView({ m }: { m: DepthModel }) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TurnScene | null>(null);
  const lastBattle = useRef(m.battle!);
  const view = useRef<SceneView | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [sound, setSound] = useState(m.audio.enabled);
  const battle = m.battle ?? lastBattle.current;
  lastBattle.current = battle;
  const actors = project(battle);
  view.current = { actors, currentId: R.currentActor(battle)?.id ?? null, frame: null,
    models: Object.fromEntries(battle.actors.map(a => [a.id, a.catalogId])), warmModelIds: MODEL_IDS, appearance,
    decorateStage: decorateChapterStage, chapter: battle.chapter,
    targetIds: m.selectedTarget ? [m.selectedTarget] : [], legalIds: R.legalChoices(battle).filter(c => c.skillId === m.selectedSkill).map(c => c.targetId),
    reducedMotion: m.state.settings.reducedMotion, paused: m.paused, suspended: !m.battle,
    boss: battle.actors.some(a => R.ENEMY_BY_ID[a.catalogId]?.tier === 'boss'), quality: m.state.settings.quality };
  useEffect(() => {
    let animation = 0, last = 0, ready = false;
    const currentAudio = m.audio;
    try {
      scene.current = new TurnScene(host.current!, () => ({ ...view.current!, frame: m.frame }), () => {}, id => {
        if (R.legalChoices(m.battle!).some(c => c.skillId === m.selectedSkill && c.targetId === id)) { m.selectedTarget = id; m.notify(false); }
      }, message => { m.sceneError = message; m.notify(false); });
      window.__depthScene = scene.current;
    } catch (error) { m.sceneError = `3D preview unavailable. ${String(error)}`; m.notify(false); }
    const tick = (now: number) => {
      m.tick(last ? Math.min(100, now - last) : 0); last = now;
      if (scene.current?.ready && !ready) { ready = true; m.sceneReady = true; m.notify(false); }
      currentAudio.update(m.frame, m.battle?.round ?? 0, m.battle ? R.currentActor(m.battle)?.id ?? null : null, m.paused || !m.battle, R.CHAPTERS[(m.battle?.chapter ?? 1) - 1]!.ambience / 174);
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animation); scene.current?.dispose(); m.sceneReady = false; delete window.__depthScene; };
  }, [m]);
  useEffect(() => {
    if (!m.canAct || !m.battle) return;
    if (m.replay || m.auto || R.currentActor(m.battle)?.side === 'enemy') {
      const timer = setTimeout(() => m.replay ? m.replayStep() : m.step(), 350 / m.state.settings.speed);
      return () => clearTimeout(timer);
    }
  });
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!m.battle || (event.target as HTMLElement)?.closest('input,select,textarea,button,a,summary,[contenteditable="true"]')) return;
      if (event.code === 'Space') { event.preventDefault(); m.paused = !m.paused; m.notify(false); }
      const actor = R.currentActor(m.battle);
      if (/^[1-3]$/.test(event.key) && actor?.side === 'party') m.choose(actor.skills[Number(event.key) - 1]!);
      if (event.key === 'Enter' && m.selectedSkill) m.act();
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [m]);
  const actor = R.currentActor(battle);
  const legal = R.legalChoices(battle);
  const skills = actor?.side === 'party' ? [...actor.skills, 'defend', 'wait'] : [];
  const tutorialStep = Math.min(2, battle.choices.length);
  return <section className={`dp-battle ${m.battle ? '' : 'dp-hidden'}`} aria-hidden={!m.battle} inert={!m.battle}>
    <header className="dp-battle-top"><div><small>{m.replay ? 'Recorded replay' : m.tutorialBattle ? 'Practice table' : R.CHAPTERS[battle.chapter - 1]!.name}</small><h1>Round {battle.round} <em>◆ {battle.energy} / {battle.maxEnergy} energy</em></h1></div>
      <label><input type="checkbox" checked={m.auto} onChange={e => { m.auto = e.target.checked; m.notify(false); }} /> Auto</label>
      <label>Playback<select aria-label="Playback speed" value={m.state.settings.speed} onChange={e => { m.state.settings.speed = Number(e.target.value); m.notify(); }}>{[1, 2, 4].map(n => <option key={n} value={n}>{n}×</option>)}</select></label>
      <button onClick={() => { m.paused = !m.paused; m.notify(false); }}>{m.paused ? 'Resume' : 'Pause'}</button>
      <button onClick={() => { void m.audio.toggle().then(() => { setSound(m.audio.enabled); m.state.settings.sound = m.audio.enabled; m.notify(); }); }}>Sound {sound ? 'on' : 'off'}</button>
      <button onClick={() => setLogOpen(!logOpen)}>Battle log</button>
      <button onClick={() => { m.paused = false; m.plan = null; if (m.replay) m.replay = null; else if (m.tutorialBattle) { m.tutorialBattle = null; m.state.tutorial = 3; } else m.apply(R.abandonRun(m.state), 'Partial run rewards retained.'); m.go('hub'); m.notify(); }}>Leave table</button>
    </header>
    <div className="dp-roundbar">{battle.queue.map(id => { const a = battle.actors.find(a => a.id === id)!; return <span className={id === actor?.id ? 'current' : battle.acted.includes(id) ? 'acted' : ''} key={id}><img src={portrait(a.catalogId)} alt="" />{a.name}{battle.acted.includes(id) ? ' ✓' : ''}</span>; })}</div>
    {m.tutorialBattle && <p className="dp-tutorial" role="status">{['Read the cushion’s intent. Its next signature can be interrupted.', 'Hearth beats Garden. Use Door knock to add extra break pressure.', 'Choose a skill, choose its target, then play the card.'][tutorialStep]}</p>}
    <div className={`dp-arena chapter-${battle.chapter}`}><div className="dp-canvas" ref={host} />
      {!m.sceneReady && !m.sceneError && <div className="dp-loading" role="status">Preparing the cafe miniatures…</div>}
      {m.sceneError && <div className="dp-loading" role="status">{m.sceneError}</div>}
      <div className="dp-enemies">{battle.actors.filter(a => a.side === 'enemy').map(a => {
        const intent = battle.intents.find(i => i.actorId === a.id), spec = R.ENEMY_BY_ID[a.catalogId]!;
        return <div className="dp-enemy" key={a.id}>
          <button disabled={!legal.some(c => c.skillId === m.selectedSkill && c.targetId === a.id)} aria-pressed={m.selectedTarget === a.id} onClick={() => { m.selectedTarget = a.id; m.notify(false); }}>
            <b>{a.name} <small>{a.flavour} · {a.row} · phase {a.phase}</small></b><span>{a.hp}/{a.maxHp} HP · ◇ {a.shield}</span>
            <progress value={a.break} max={a.breakCap} aria-label={`${a.name} break`} /><small>Break {a.break}/{a.breakCap}</small>
          </button>
          <details><summary title={`${spec.intent} ${spec.counter}`}>{intent?.interrupted ? '✦ Intent interrupted' : intent?.label ?? 'Defeated'} <span>ⓘ</span></summary><p>{spec.intent} {spec.counter}</p></details><Statuses actor={a} />
        </div>;
      })}</div>
      <div className="dp-party">{battle.actors.filter(a => a.side === 'party').map(a => <div className={`dp-party-card ${actor?.id === a.id ? 'current' : ''}`} key={a.id}>
        <button disabled={!legal.some(c => c.skillId === m.selectedSkill && c.targetId === a.id)} aria-pressed={m.selectedTarget === a.id} onClick={() => { m.selectedTarget = a.id; m.notify(false); }}>
          <img src={portrait(a.catalogId)} alt="" /><span><b>{a.name}</b><small>{a.row} · {a.flavour}</small><strong>{a.hp}/{a.maxHp} HP · ◇ {a.shield}</strong><small>Charge {a.charge}/100</small></span>
        </button><Statuses actor={a} />
      </div>)}</div>
    </div>
    <div className="dp-decision">
      {battle.result ? <div className="dp-finish"><h2>{battle.result === 'party' ? 'A little courage carries you through.' : 'Bring the lessons home.'}</h2><button className="cr-primary" onClick={() => m.finish()}>{m.tutorialBattle ? 'Complete lesson' : m.replay ? 'Close replay' : 'Collect encounter rewards'}</button></div>
      : <><div className="dp-turn-label"><b>{actor?.name}’s turn</b><span>{m.paused ? 'Paused' : m.busy ? m.plan?.name : actor?.side === 'enemy' ? 'Enemy action' : 'Choose a card and its target'}</span></div>
        <div className="dp-skills">{skills.map((id, index) => { const skill = R.skillById(id)!; const available = legal.some(c => c.skillId === id); return <button key={id} className={`dp-skill ${skill.type}`} disabled={!available || !m.canAct || !!m.replay} aria-pressed={m.selectedSkill === id} title={`${skill.description} Target ${skill.target}. Break +${skill.breakPower}. Cooldown ${skill.cooldown} rounds. Charge ${skill.charge}.`} onClick={() => m.choose(id)}>
          {skillIcon(id) ? <img src={skillIcon(id)} alt="" /> : <span className="dp-glyph">{id === 'defend' ? '◇' : '♧'}</span>}<span><small>{index < 3 ? `${index + 1} · ` : ''}{skill.type} · ◆ {skill.cost}</small><b>{skill.name}</b><small>{skill.target} · CD {actor?.cooldowns[id] ?? 0}/{skill.cooldown} · ⚡{skill.charge}</small></span>
        </button>; })}</div>
        <div className="dp-play"><span>{m.selectedSkill ? R.skillById(m.selectedSkill)!.description : R.FLAVOUR_RULE}</span><button className="cr-primary" disabled={!m.canAct || !m.selectedTarget || !!m.replay} onClick={() => m.act()}>Play card →</button></div></>}
    </div>
    {logOpen && <aside className="dp-log" aria-label="Battle log"><button onClick={() => setLogOpen(false)}>Close log</button>{battle.log.slice(-80).reverse().map((event, index) => <p key={index}>R{event.round} · {battle.actors.find(a => a.id === event.actorId)?.name} → {battle.actors.find(a => a.id === event.targetId)?.name} · {event.kind} {event.amount || ''} {event.text}</p>)}</aside>}
  </section>;
}
declare global { interface Window { __depthScene?: TurnScene } }
