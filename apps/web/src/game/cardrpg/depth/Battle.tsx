import { useEffect, useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import { SQUAD_ITEMS, type SquadItem } from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EquipmentAppearance } from '../../squad/turn3d/appearance';
import { TurnScene, type SceneView } from '../../squad/turn3d/scene';
import { MODEL_IDS, portrait } from './assets';
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
  view.current = { actors: project(battle), currentId: m.plan?.actorId ?? R.currentActor(battle)?.id ?? null, frame: null,
    models: Object.fromEntries(battle.actors.map(actor => [actor.id, actor.catalogId])), warmModelIds: MODEL_IDS, appearance,
    decorateStage: decorateChapterStage, chapter: battle.chapter, camera: m.camera,
    targetIds: m.plan?.targetIds ?? [], legalIds: [],
    reducedMotion: m.state.settings.reducedMotion, paused: m.paused, suspended: !m.showBattle,
    boss: battle.actors.some(actor => R.ENEMY_BY_ID[actor.catalogId]?.tier === 'boss'), quality: m.state.settings.quality };
  useEffect(() => {
    let animation = 0, last = 0, ready = false;
    const currentAudio = m.audio;
    try {
      scene.current = new TurnScene(host.current!, () => ({ ...view.current!, frame: m.frame }), () => {}, () => {}, message => {
        m.sceneError = message; m.notify(false);
      });
      window.__depthScene = scene.current;
    } catch (error) { m.sceneError = `3D preview unavailable. ${String(error)}`; m.notify(false); }
    const tick = (now: number) => {
      m.tick(last ? Math.min(100, now - last) : 0); last = now;
      if (scene.current?.ready && !ready) { ready = true; m.sceneReady = true; m.notify(false); }
      currentAudio.update(m.frame, m.battle?.round ?? 0, m.battle ? R.currentActor(m.battle)?.id ?? null : null,
        m.paused || !m.showBattle, R.CHAPTERS[(m.battle?.chapter ?? 1) - 1]!.ambience / 174);
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animation); scene.current?.dispose(); m.sceneReady = false; delete window.__depthScene; };
  }, [m]);
  useEffect(() => { scene.current?.invalidate(); });
  useEffect(() => {
    if (!m.canAct) return;
    const timer = setTimeout(() => m.replay ? m.replayStep() : m.step(), 350 / m.state.settings.speed);
    return () => clearTimeout(timer);
  });
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!m.showBattle || (event.target as HTMLElement)?.closest('input,select,textarea,button,a,summary,[contenteditable="true"]')) return;
      if (event.code === 'Space') { event.preventDefault(); m.paused = !m.paused; m.notify(false); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [m]);
  const actor = battle.actors.find(candidate => candidate.id === m.plan?.actorId) ?? R.currentActor(battle);
  const action = [...battle.log].reverse().find(event => event.kind === 'action' || event.kind === 'enemy-action');
  return <section className={`dp-battle ${m.showBattle ? '' : 'dp-hidden'}`} aria-hidden={!m.showBattle} inert={!m.showBattle}>
    <header className="dp-battle-top"><div><small>{m.replay ? 'Recorded replay' : m.tutorialBattle ? 'Practice table' : R.CHAPTERS[battle.chapter - 1]!.name}</small><h1>Round {battle.round}</h1></div>
      <label>Speed<select aria-label="Playback speed" value={m.state.settings.speed} onChange={event => { m.state.settings.speed = Number(event.target.value); m.notify(); }}>{[1, 2, 4].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
      <button onClick={() => { m.paused = !m.paused; m.notify(false); }}>{m.paused ? 'Resume' : 'Pause'}</button>
      <button onClick={() => m.skip()}>Skip to result</button>
      <label>Camera<select aria-label="Camera preset" value={m.camera} onChange={event => { m.camera = event.target.value as typeof m.camera; m.notify(false); }}><option value="close">Close</option><option value="wide">Medium</option><option value="overhead">Overhead</option></select></label>
      <button onClick={() => { void m.audio.toggle().then(() => { setSound(m.audio.enabled); m.state.settings.sound = m.audio.enabled; m.notify(); }); }}>Sound {sound ? 'on' : 'off'}</button>
      <button onClick={() => setLogOpen(!logOpen)}>Battle log</button><button onClick={() => m.leave()}>Leave table</button>
    </header>
    <div className="dp-roundbar">{battle.queue.map(id => { const queued = battle.actors.find(candidate => candidate.id === id)!; return <span className={id === actor?.id ? 'current' : ''} key={id}><img src={portrait(queued.catalogId)} alt="" />{queued.name}</span>; })}</div>
    {m.tutorialBattle && <p className="dp-tutorial" role="status">Your team chooses every action. Watch who needs help, then improve your team and equipment after the fight.</p>}
    <div className={`dp-arena chapter-${battle.chapter}`}><div className="dp-canvas" ref={host} />
      {!m.sceneReady && !m.sceneError && <div className="dp-loading" role="status">Preparing the cafe miniatures…</div>}
      {m.sceneError && <div className="dp-loading" role="status">{m.sceneError}</div>}
      <div className="dp-enemies">{battle.actors.filter(candidate => candidate.side === 'enemy').map(enemy => {
        const intent = battle.intents.find(candidate => candidate.actorId === enemy.id);
        return <div className="dp-enemy" key={enemy.id}><b>{enemy.name}</b><small>{enemy.hp}/{enemy.maxHp} HP</small><progress value={enemy.hp} max={enemy.maxHp} aria-label={`${enemy.name} health`} /><small>{intent?.interrupted ? 'Interrupted' : intent?.label ?? 'Defeated'}</small><Statuses actor={enemy} /></div>;
      })}</div>
      <div className="dp-party">{battle.actors.filter(candidate => candidate.side === 'party').map(cat => <div className={`dp-party-card ${actor?.id === cat.id ? 'current' : ''}`} key={cat.id}>
        <div className="dp-party-status"><img src={portrait(cat.catalogId)} alt="" /><span><b>{cat.name}</b><strong>{cat.hp}/{cat.maxHp} HP</strong><small>Ultimate {cat.charge}/100</small></span></div><Statuses actor={cat} />
      </div>)}</div>
    </div>
    <div className="dp-action-caption" role="status"><b>{m.paused ? 'Paused' : actor?.name}</b><span>{action?.text ?? 'Your companions are ready.'}</span></div>
    {logOpen && <aside className="dp-log" aria-label="Battle log"><button onClick={() => setLogOpen(false)}>Close log</button>{battle.log.slice(-100).reverse().map((event, index) => <p key={index}>R{event.round} · {event.text || `${battle.actors.find(candidate => candidate.id === event.actorId)?.name} → ${battle.actors.find(candidate => candidate.id === event.targetId)?.name} · ${event.kind} ${event.amount || ''}`}</p>)}</aside>}
  </section>;
}
declare global { interface Window { __depthScene?: TurnScene } }
