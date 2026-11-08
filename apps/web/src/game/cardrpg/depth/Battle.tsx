import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { isReadableBattle, subscribeReadableBattle } from '../../squad/turn3d/look-b2';
import { isLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { TurnScene, type SceneView, type Anchor } from '../../squad/turn3d/scene';
import { CARD_CAMERAS } from '../../squad/turn3d/card-staging';
import { MODEL_IDS, portrait, skillIcon } from './assets';
import type { DepthModel } from './model';
import { animateChapterStage, decorateChapterStage } from './chapter-stage';
import { FeelLab } from './FeelLab';
import { impactLabels } from '../../squad/turn3d/impact-labels';
import { bossCueV4, presentationV4, skillReadinessV4, standingPlanText, type PresentationEventV4 } from '../../squad/turn3d/card-v4-presentation';
import { project, appearance } from './scene-actors';
import '../../squad/turn3d/battle-layout.css';

function Statuses({ actor }: { actor: R.Actor }) {
  return <div className="dp-statuses">{actor.statuses.map(status => <span key={status.id}
    title={`${R.STATUS_BY_ID[status.id].description} Stacks ${status.stacks}/${R.STATUS_BY_ID[status.id].cap}. ${status.remaining} rounds remaining.`}>
    {R.STATUS_BY_ID[status.id].name} {status.stacks} · {status.remaining}r
  </span>)}</div>;
}
export function BattleView({ m }: { m: DepthModel }) {
  const readable = useSyncExternalStore(subscribeReadableBattle, isReadableBattle);
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TurnScene | null>(null);
  const skillBanner = useRef<HTMLDivElement>(null);
  const bossCue = useRef<HTMLDivElement>(null);
  const cueHistory = useRef<{ initial: unknown; plan: DepthModel['plan']; sequence: number; events: PresentationEventV4[] }>({ initial: null, plan: null, sequence: -1, events: [] });
  const loadingText = useRef<HTMLSpanElement>(null);
  const loadingProgress = useRef<HTMLProgressElement>(null);
  const plates = useRef(new Map<string, HTMLDivElement>());
  const lastBattle = useRef(m.battle!);
  const view = useRef<SceneView | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [sound, setSound] = useState(m.audio.enabled);
  const [volume, setVolume] = useState(m.audio.volume);
  useEffect(() => { m.audio.useBrowserPreferences(!m.offline); setVolume(m.audio.volume); }, [m]);
  const battle = m.visualBattle ?? lastBattle.current;
  lastBattle.current = battle;
  const v4 = presentationV4(battle);
  const history = cueHistory.current;
  if (history.initial !== battle.initial) {
    history.initial = battle.initial; history.sequence = v4?.events.at(-1)?.sequence ?? -1;
    history.events = []; history.plan = m.plan;
  } else if (history.plan !== m.plan) {
    history.events = m.plan ? v4?.events.filter(event => event.sequence > history.sequence) ?? [] : [];
    history.sequence = v4?.events.at(-1)?.sequence ?? -1; history.plan = m.plan;
  }
  // Resolve costume metadata when React receives a battle snapshot. The GPU
  // loop otherwise repeats catalog filters and object copies for every cat.
  const actors = project(battle);
  const appearances = new Map(actors.map(actor => [actor.id, appearance(actor)]));
  view.current = { actors, currentId: m.plan?.actorId ?? R.currentActor(battle)?.id ?? null, frame: null,
    models: Object.fromEntries(battle.actors.map(actor => [actor.id, actor.catalogId])), warmModelIds: MODEL_IDS, appearance: actor => appearances.get(actor.id) ?? {},
    decorateStage: decorateChapterStage, animateStage: animateChapterStage,
    autoBattle: true, effectOnly: !!m.galleryBattle && m.galleryEffectOnly,
    cardStatuses: Object.fromEntries(battle.actors.map(actor => [actor.id, actor.statuses.map(status => status.id)])),
    rows: Object.fromEntries(battle.actors.map(actor => [actor.id, actor.row])),
    chapter: battle.chapter, camera: m.camera, playbackSpeed: m.state.settings.speed,
    bossPhases: Object.fromEntries(battle.actors.filter(a => R.ENEMY_BY_ID[a.catalogId]?.tier === 'boss').map(a => [a.id, a.phase])),
    targetIds: m.plan?.targetIds ?? [], legalIds: [],
    reducedMotion: m.state.settings.reducedMotion, paused: m.paused, suspended: !m.showBattle,
    boss: battle.actors.some(actor => R.ENEMY_BY_ID[actor.catalogId]?.tier === 'boss'), quality: m.state.settings.quality };
  useEffect(() => {
    let animation = 0, last = 0, ready = false;
    m.sceneReady = false;
    const currentAudio = m.audio;
    try {
      const anchorPlates = (anchors: Anchor[]) => {
        const visible = new Set(anchors.filter(anchor => anchor.visible).map(anchor => anchor.id));
        for (const [id, plate] of plates.current) {
          if (!readable) plate.hidden = true;
          else if (plate.hidden === visible.has(id)) plate.hidden = !visible.has(id);
        }
        for (const anchor of anchors) {
          const plate = plates.current.get(anchor.id);
          if (!plate) continue;
          const transform = `translate(${Math.round(anchor.labelX - 69)}px, ${Math.round(anchor.labelY)}px)`;
          if (!readable) plate.hidden = !anchor.visible;
          if (!readable || plate.style.transform !== transform) plate.style.transform = transform;
        }
      };
      scene.current = new TurnScene(host.current!, () => ({ ...view.current!, frame: m.frame }), anchorPlates, () => {}, message => {
        m.sceneError = message; m.notify(false);
      });
      window.__depthScene = scene.current;
    } catch (error) { m.sceneError = `3D preview unavailable. ${String(error)}`; m.notify(false); }
    const tick = (now: number) => {
      m.tick(last ? Math.min(100, now - last) : 0); last = now;
      if (skillBanner.current) {
        skillBanner.current.hidden = !m.plan || m.animationAt >= 600 || m.galleryEffectOnly;
      }
      if (bossCue.current) {
        const cue = m.plan && !m.galleryEffectOnly ? bossCueV4(cueHistory.current.events, m.animationAt,
          m.plan.beats[2]!.start, m.plan.duration) : undefined;
        bossCue.current.hidden = !cue;
        if (cue && bossCue.current.textContent !== cue.event.text) bossCue.current.textContent = cue.event.text;
      }
      const loading = scene.current?.loading;
      if (loading && loadingText.current && loadingText.current.textContent !== loading.label) {
        loadingText.current.textContent = loading.label;
      }
      if (loading && loadingProgress.current && loadingProgress.current.value !== loading.completed) {
        loadingProgress.current.max = loading.total;
        loadingProgress.current.value = loading.completed;
      }
      if (scene.current?.ready && !ready) { ready = true; m.sceneReady = true; m.notify(false); }
      currentAudio.update(m.frame, m.battle?.round ?? 0, m.battle ? R.currentActor(m.battle)?.id ?? null : null,
        m.paused || !m.showBattle, R.CHAPTERS[(m.battle?.chapter ?? 1) - 1]!.ambience / 174);
      animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animation); scene.current?.dispose(); m.sceneReady = false; delete window.__depthScene; };
  }, [m, lookV2, readable]);
  useEffect(() => { scene.current?.invalidate(); });
  useEffect(() => {
    if (!m.canAct) return;
    const timer = setTimeout(() => m.replay ? m.replayStep() : m.step(), 80 / m.state.settings.speed);
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
  const action = [...(m.battle?.log ?? battle.log)].reverse().find(event => event.kind === 'action' || event.kind === 'enemy-action');
  const results = useMemo(() => m.plan ? m.plan.targetIds.map(id => ({
    id, name: battle.actors.find(candidate => candidate.id === id)?.name ?? id,
    labels: impactLabels(m.plan!.events, id).filter(event =>
      ['damage', 'heal', 'shield', 'death', 'status_apply'].includes(event.type)
      && (event.amount > 0 || event.type === 'death')),
  })).filter(result => result.labels.length) : [], [m.plan, battle.actors]);
  const lowHealth = battle.actors.some(candidate => candidate.side === 'party' && candidate.hp > 0 && candidate.hp / candidate.maxHp <= .25);
  return <section className={`dp-battle ${readable ? 'dp-readable' : ''} ${v4 ? 'dp-battle-v4' : ''} ${m.showBattle ? '' : 'dp-hidden'}`} aria-hidden={!m.showBattle} inert={!m.showBattle}>
    <header className="dp-battle-top"><div><small>{m.replay ? 'Recorded replay' : m.tutorialBattle ? 'Practice table' : R.CHAPTERS[battle.chapter - 1]!.name}</small><h1>Round {battle.round}</h1></div>
      <label>Speed<select aria-label="Playback speed" value={m.state.settings.speed} onChange={event => { m.state.settings.speed = Number(event.target.value); m.notify(); }}>{[1, 2, 4].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
      <button onClick={() => { m.paused = !m.paused; m.notify(false); }}>{m.paused ? 'Resume' : 'Pause'}</button>
      <button onClick={() => m.skip()}>Skip to result</button>
      <label>Camera<select aria-label="Camera preset" value={m.camera} onChange={event => { m.camera = event.target.value as typeof m.camera; m.notify(false); }}>{Object.entries(CARD_CAMERAS).map(([id, preset]) => <option key={id} value={id}>{preset.name}</option>)}</select></label>
      <button onClick={() => { void m.audio.toggle().then(() => { setSound(m.audio.enabled); m.state.settings.sound = m.audio.enabled; m.notify(); }); }}>Sound {sound ? 'on' : 'off'}</button>
      <label className="dp-sound-volume">Vol<input type="range" aria-label="Sound volume" min="0" max="100" step="5" value={Math.round(volume * 100)} onChange={event => { const next = Number(event.target.value) / 100; m.audio.setVolume(next); setVolume(next); }} /></label>
      <button onClick={() => setLogOpen(!logOpen)}>Battle log</button><button onClick={() => m.leave()}>Leave table</button>
    </header>
    <div className="dp-roundbar">{battle.queue.map(id => { const queued = battle.actors.find(candidate => candidate.id === id)!; return <span className={id === actor?.id ? 'current' : ''} key={id}><img src={portrait(queued.catalogId)} alt="" />{queued.name}</span>; })}</div>
    {v4 && <div className="dp-v4-plan" aria-label="Crew and standing plan"><span>{standingPlanText(v4)}</span>
      {v4.events.filter(event => event.kind === 'crew-active').map(event => <span key={event.sequence} title={event.text}>
        {event.crew === 'door' ? 'Door' : event.crew === 'kettle' ? 'Kettle' : event.crew === 'table' ? 'Table' : 'Lantern'} team · {event.marks} marks
      </span>)}<small>Actions are automatic</small></div>}
    {m.offline && <FeelLab m={m} />}
    <div className={`dp-arena chapter-${battle.chapter} ${lowHealth ? 'dp-low-health' : ''} ${m.galleryBattle && m.galleryEffectOnly ? 'dp-effect-only' : ''}`}><div className="dp-canvas" ref={host} />
      {v4 && <div className="dp-v4-boss-cue" ref={bossCue} role="status" aria-label="Boss event" hidden />}
      {m.plan?.ultimate && actor?.side === 'party' && !m.galleryEffectOnly && <aside className={`dp-ultimate-moment dp-ultimate-${actor.catalogId}`} aria-label={`${actor.name} ultimate`}>
        <img src={portrait(actor.catalogId)} alt="" /><div><strong>{actor.name}</strong><span>{m.plan.name}</span></div>
        <button onClick={() => m.finishMoment()}>Skip moment</button>
      </aside>}
      {!m.sceneReady && !m.sceneError && <div className="dp-loading" role="status"><span ref={loadingText}>Preparing the cafe miniatures…</span><progress ref={loadingProgress} max={5} value={0} aria-label="Battle preparation" /></div>}
      {m.sceneError && <div className="dp-loading" role="status">{m.sceneError}</div>}
      {battle.actors.filter(candidate => candidate.side === 'enemy' && candidate.hp > 0).map(enemy => {
        const intent = battle.intents.find(candidate => candidate.actorId === enemy.id);
        return <div className="dp-world-plate" key={enemy.id} data-actor={enemy.id} data-hp-plate hidden
          ref={element => { if (element) plates.current.set(enemy.id, element); else plates.current.delete(enemy.id); }}>
          <div><b>{enemy.name}</b><small>{enemy.hp}/{enemy.maxHp}</small></div>
          <progress value={enemy.hp} max={enemy.maxHp} aria-label={`${enemy.name} health`} />
          <small className="dp-intent" title={intent?.label}>{intent?.interrupted ? 'Interrupted' : intent?.label}</small>
          {R.ENEMY_BY_ID[enemy.catalogId]?.tier === 'boss' && <small className="dp-boss-phase" title={R.ENEMY_BY_ID[enemy.catalogId]!.phases[enemy.phase - 1]}>Phase {enemy.phase} · {enemy.phase === 1 ? R.ENEMY_BY_ID[enemy.catalogId]!.phases[0] : 'Awakened'}</small>}
          <Statuses actor={enemy} />
        </div>;
      })}
    </div>
    <div className="dp-party">{battle.actors.filter(candidate => candidate.side === 'party').map(cat => <div className={`dp-party-card ${actor?.id === cat.id ? 'current' : ''} ${cat.hp > 0 && cat.hp / cat.maxHp <= .25 ? 'dp-health-critical' : ''}`} key={cat.id} data-hp-plate>
      <img src={portrait(cat.catalogId)} alt="" />
      <div className="dp-party-health"><span><b>{cat.name}</b><strong>{cat.hp}/{cat.maxHp} HP</strong></span><progress value={cat.hp} max={cat.maxHp} aria-label={`${cat.name} health`} /><Statuses actor={cat} /></div>
      {v4 ? <div className="dp-v4-readiness" aria-label={`${cat.name} cooldowns`}><small>{cat.row === 'front' ? 'Front row' : 'Back row'}</small>
        {cat.skills.map(id => { const skill = R.SKILLS[id]; if (!skill) return null; const ready = skillReadinessV4(cat, skill);
          return <span key={id} className={ready === 'Ready' ? 'is-ready' : ''} title={`${skill.name}: ${ready}`}><span className="dp-v4-skill-name">{skill.name}</span><b>{ready}</b></span>; })}
      </div> : <span className="dp-charge" style={{ '--charge': `${cat.charge}%` } as CSSProperties} title={`Ultimate charge ${cat.charge}/100`}><small>{cat.charge}</small></span>}
    </div>)}</div>
    <div className="dp-action-caption" role="status"><b>{m.paused ? 'Paused' : m.impactVisible && !m.galleryBattle && m.momentNote || actor?.name}</b>
      <div className="dp-skill-banner" ref={skillBanner} hidden={!m.plan || m.animationAt >= 600 || m.galleryEffectOnly}>
        {m.plan && <>{skillIcon(m.plan.skillId) && <img src={skillIcon(m.plan.skillId)} alt="" />}<strong>{m.plan.name}</strong></>}
      </div>
      {m.impactVisible && results.length ? <div className="dp-result-chips" aria-label="Action results">
        {results.map(result => <span className="dp-result-chip" key={result.id}><b>{result.name}</b>
          {result.labels.map((event, index) => <span className={`dp-number dp-number-${event.type}`} key={index}>
            {event.type === 'death' ? 'KO' : event.type === 'status_apply' ? event.note : `${event.type === 'heal' ? '+' : event.type === 'shield' ? '◇' : '−'}${event.amount}`}
            {event.hits > 1 && <small title={`${event.hits} hits`} aria-label={`${event.hits} hits`}>{'·'.repeat(Math.min(6, event.hits))}</small>}
          </span>)}
        </span>)}
      </div> : <span>{action?.text ?? 'Your companions choose their actions. Watch, then improve your team.'}</span>}
    </div>
    {logOpen && <aside className="dp-log" aria-label="Battle log"><button onClick={() => setLogOpen(false)}>Close log</button>{battle.log.slice(-100).reverse().map((event, index) => <p key={index}>R{event.round} · {event.text || `${battle.actors.find(candidate => candidate.id === event.actorId)?.name} → ${battle.actors.find(candidate => candidate.id === event.targetId)?.name} · ${event.kind} ${event.amount || ''}`}</p>)}</aside>}
  </section>;
}
declare global { interface Window { __depthScene?: TurnScene } }
