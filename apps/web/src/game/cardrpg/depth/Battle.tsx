import {battleStep} from '../battle-v3/controls';
import {artPropsA6} from '../ui-v3/art-a6';
import { applyV5Presentation, v5SourceForPlan, REACTION_WORDS } from '../../squad/turn3d/card-v5-events';
import { numberLaneWidth } from '../../squad/turn3d/card-number-lane';
import { StatusLegend } from '../../squad/turn3d/StatusLegend';
import { StatusBadges } from '../../squad/turn3d/StatusBadges';
import { statusPresentation, statusImpactLabels } from '../../squad/turn3d/card-status-beats';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { readablePortrait, readableSkillIcon } from '../../squad/turn3d/look-readable-assets';
import { isReadableBattle, subscribeReadableBattle } from '../../squad/turn3d/look-b2';
import { isLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { TurnScene, type SceneView, type Anchor } from '../../squad/turn3d/scene';
import { SpineScene } from '../spine/scene';
import { lookSpineEnabled } from '../spine/config';
import { CARD_CAMERAS } from '../../squad/turn3d/card-staging';
import { MODEL_IDS, portrait, skillIcon } from './assets';
import type { DepthModel } from './model';
import { displayedBossPhase } from './battle-presentation';
import { animateChapterStage, decorateChapterStage } from './chapter-stage';
import { FeelLab } from './FeelLab';
import { impactLabels, visibleImpactLabel } from '../../squad/turn3d/impact-labels';
import { bossCueV4, presentationV4, skillReadinessV4, standingPlanText, type PresentationEventV4 } from '../../squad/turn3d/card-v4-presentation';
import { project, appearance } from './scene-actors';
import '../../squad/turn3d/battle-layout.css';

function Statuses({ actor, look }: { actor: R.Actor; look: boolean }) {
  if (look) return <StatusBadges statuses={actor.statuses} name={actor.name} />;
  return <div className="dp-statuses">{actor.statuses.map(status => <span key={status.id}
    title={`${R.STATUS_BY_ID[status.id].description} Stacks ${status.stacks}/${R.STATUS_BY_ID[status.id].cap}. ${status.remaining} rounds remaining.`}>
    {R.STATUS_BY_ID[status.id].name} {status.stacks} · {status.remaining}r
  </span>)}</div>;
}
export function BattleView({ m }: { m: DepthModel }) {
  const readable = useSyncExternalStore(subscribeReadableBattle, isReadableBattle);
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TurnScene | SpineScene | null>(null);
  const skillBanner = useRef<HTMLDivElement>(null);
  const bossCue = useRef<HTMLDivElement>(null);
  const cueHistory = useRef<{ initial: unknown; plan: DepthModel['plan']; sequence: number; events: PresentationEventV4[] }>({ initial: null, plan: null, sequence: -1, events: [] });
  const loadingText = useRef<HTMLSpanElement>(null);
  const loadingProgress = useRef<HTMLProgressElement>(null);
  const plates = useRef(new Map<string, HTMLDivElement>());
  const numbers = useRef(new Map<string, HTMLDivElement>());
  const callouts = useRef(new Map<string, HTMLDivElement>());
  const statusView = useMemo(() => lookV2 && m.plan ? applyV5Presentation(m.plan,statusPresentation(m.plan,m.battle?.log ?? []),v5SourceForPlan(m.plan,m.battle,m.visualBattle ?? undefined)) : undefined,[lookV2,m.plan,m.battle?.log.length]);
  const statusViewRef = useRef(statusView); statusViewRef.current = statusView;
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
  const results = useMemo(() => m.plan ? m.plan.targetIds.map(id => ({
    id, name: battle.actors.find(candidate => candidate.id === id)?.name ?? id,
    labels: (statusView ? statusImpactLabels(m.plan!,id,statusView) : impactLabels(m.plan!.events, id)).filter(visibleImpactLabel),
  })).filter(result => result.labels.length).map(result=>({...result,width:numberLaneWidth(result.labels)})) : [], [m.plan, battle.actors, statusView]);
  // Resolve costume metadata when React receives a battle snapshot. The GPU
  // loop otherwise repeats catalog filters and object copies for every cat.
  const actors = project(battle);
  const appearances = new Map(actors.map(actor => [actor.id, appearance(actor)]));
  view.current = { actors, formationC2: battle.initial.formationC2, battleKey:battle.initial, currentId: m.plan?.actorId ?? R.currentActor(battle)?.id ?? null, frame: null,
    models: Object.fromEntries(battle.actors.map(actor => [actor.id, actor.catalogId])), warmModelIds: MODEL_IDS, appearance: actor => appearances.get(actor.id) ?? {},
    decorateStage: decorateChapterStage, animateStage: animateChapterStage,
    autoBattle: true, galleryPreview: !!m.galleryBattle, effectOnly: !!m.galleryBattle && m.galleryEffectOnly,
    cardStatuses: Object.fromEntries(battle.actors.map(actor => [actor.id, lookV2 ? actor.statuses : actor.statuses.map(status => status.id)])),
    cardPresentation: statusView,
    cardBossCue: lookV2 && !m.galleryEffectOnly && history.events.some(event => event.kind === 'boss-phase' || event.kind === 'boss-finish'),
    cardNumberRows: lookV2 ? Object.fromEntries(results.map(r=>[r.id,r.labels.length])) : undefined,
    cardNumberWidths: lookV2 ? Object.fromEntries(results.map(r=>[r.id,r.width])) : undefined,
    cardMoment: !!m.plan?.ultimate && battle.actors.find(a=>a.id===m.plan?.actorId)?.side==='party' && !m.galleryEffectOnly,
    rows: Object.fromEntries(battle.actors.map(actor => [actor.id, actor.row])),
    chapter: battle.chapter, camera: m.camera, playbackSpeed: m.state.settings.speed,
    bossPhases: Object.fromEntries(battle.actors.filter(a => R.ENEMY_BY_ID[a.catalogId]?.tier === 'boss').map(a => [a.id, displayedBossPhase(battle, a)])),
    targetIds: m.plan?.targetIds ?? [], legalIds: [],
    reducedMotion: m.state.settings.reducedMotion, paused: m.paused, suspended: !m.showBattle,
    boss: battle.actors.some(actor => R.ENEMY_BY_ID[actor.catalogId]?.tier === 'boss'), quality: m.state.settings.quality };
  useEffect(() => {
    let animation = 0, last = 0;
    m.sceneReady = false;
    const currentAudio = m.audio;
    try {
      const anchorPlates = (anchors: Anchor[]) => {
        const visible = new Set(anchors.filter(anchor => anchor.visible).map(anchor => anchor.id));
        for (const [id, plate] of plates.current) {
          if (!readable) plate.hidden = true;
          else if (plate.hidden === visible.has(id)) plate.hidden = !visible.has(id);
        }
        for (const anchor of lookV2 ? [...anchors].sort((a,b)=>a.y-b.y) : anchors) {
          const number = numbers.current.get(anchor.id);
          const callout = callouts.current.get(anchor.id);
          if(lookV2 && (callout||number)) {
            // Hidden labels still reserve space for the whole cue window, so
            // staggered hits never shuffle their neighbours while appearing.
            const wordWidth=callout ? (callout.dataset.compact==='true'?38:innerWidth<=1100?138:150) : 0;
            const numberWidth=number?Number(number.dataset.laneWidth):0;
            const placed=anchor.textLane;
            for(const element of [callout,number])if(element)element.dataset.placed=String(!!placed);
            if(placed){
              if(callout)callout.style.transform=`translate(${Math.round(placed.x+(placed.width-wordWidth)/2)}px, ${Math.round(placed.y)}px)`;
              if(number)number.style.transform=`translate(${Math.round(placed.x+(placed.width-numberWidth)/2)}px, ${Math.round(placed.y+(wordWidth?34:0))}px)`;
            }
          } else if(number) number.style.transform=`translate(${Math.max(0,anchor.x-70)}px, ${Math.max(30,anchor.y-28)}px)`;
          const plate = plates.current.get(anchor.id);
          if (!plate) continue;
          const transform = `translate(${Math.round(anchor.labelX - 69)}px, ${Math.round(anchor.labelY)}px)`;
          if (!readable) plate.hidden = !anchor.visible;
          if (!readable || plate.style.transform !== transform) plate.style.transform = transform;
        }
      };
      const Renderer = m.battle?.initial.formationC2 || lookSpineEnabled(location.search,lookV2) ? SpineScene : TurnScene;
      scene.current = new Renderer(host.current!, () => ({ ...view.current!, frame: m.frame }), anchorPlates, () => {}, message => {
        m.sceneError = message; m.notify(false);
      });
      window.__depthScene = scene.current;
    } catch (error) { m.sceneError = `Battle preview unavailable. ${String(error)}`; m.notify(false); }
    const tick = (now: number) => {
      const ready = scene.current?.ready ?? false;
      if (m.sceneReady !== ready) { m.sceneReady = ready; m.notify(false); }
      // Both deltas must use the RAF timestamp. Mixing it with performance.now()
      // accumulated positive callback jitter and made action beats run early.
      m.tick(last ? Math.min(100, now - last) : 0, now); last = now;
      if (skillBanner.current) {
        skillBanner.current.hidden = !m.plan || m.animationAt >= 600 || m.galleryEffectOnly;
      }
      if (bossCue.current) {
        const cue = m.plan && !m.galleryEffectOnly ? bossCueV4(cueHistory.current.events, m.animationAt,
          m.plan.beats[2]!.start, m.plan.duration) : undefined;
        bossCue.current.hidden = !cue;
        if (cue && bossCue.current.textContent !== cue.event.text) bossCue.current.textContent = cue.event.text;
      }
      if (lookV2 && m.plan && statusViewRef.current) {
        const presentation = statusViewRef.current, impact = m.plan.beats[2]!.start;
        for (const [id,number] of numbers.current) {
          const hidden = m.animationAt < impact + (presentation.offsets.get(id) ?? 0) || number.dataset.placed==='false';
          if(number.hidden !== hidden)number.hidden = hidden;
        }
        for (const [id,callout] of callouts.current) {
          const reaction=presentation.reactions?.find(r=>r.targetId===id);
          const at = m.animationAt-(reaction?.at??impact+(presentation.offsets.get(id) ?? 0));
          const hidden = at < 0 || at >= (reaction?.duration??500) || callout.dataset.placed === 'false';
          if(callout.hidden !== hidden)callout.hidden = hidden;
        }
      }
      const loading = scene.current?.loading;
      const loadingLabel=m.battle?.initial.formationC2?'':m.a6Battle?'Lighting the lanterns…':loading?.label;
      if (loading && loadingText.current && loadingText.current.textContent !== loadingLabel) {
        loadingText.current.textContent = loadingLabel??'';
      }
      if (loading && loadingProgress.current && loadingProgress.current.value !== loading.completed) {
        loadingProgress.current.max = loading.total;
        loadingProgress.current.value = loading.completed;
      }
      // C2's renderer owns beat/voice timing; keep the legacy adapter on other renderers.
      if(!m.battle?.initial.formationC2)currentAudio.update(m.frame, m.battle?.round ?? 0, m.battle ? R.currentActor(m.battle)?.id ?? null : null,
        m.paused || !m.showBattle, R.CHAPTERS[(m.battle?.chapter ?? 1) - 1]!.ambience / 174);
      if(!(scene.current instanceof SpineScene))animation = requestAnimationFrame(tick);
    };
    // One RAF owns the C2 model and pixels. Independent loops could paint the
    // previous action for an extra frame after the model had finished it.
    if(scene.current instanceof SpineScene)scene.current.beforeFrame=tick;
    else animation = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animation); scene.current?.dispose(); m.sceneReady = false; delete window.__depthScene; };
  }, [m, lookV2, readable]);
  useEffect(() => {
    if (scene.current instanceof SpineScene) scene.current.prepare();
    else scene.current?.invalidate();
  });
  useEffect(() => {
    if (!m.canAct) return;
    const timer = setTimeout(() => m.replay ? m.replayStep() : battleStep(m), 80 / m.state.settings.speed);
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
  const lowHealth = battle.actors.some(candidate => candidate.side === 'party' && candidate.hp > 0 && candidate.hp / candidate.maxHp <= .25);
  return <section className={`dp-battle ${lookV2 ? 'dp-v5look' : ''} ${m.state.settings.reducedMotion ? 'dp-calm' : ''} ${readable ? 'dp-readable' : ''} ${v4 ? 'dp-battle-v4' : ''} ${m.showBattle ? '' : 'dp-hidden'}`} aria-hidden={!m.showBattle} inert={!m.showBattle}>
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
    {v4 && <div className="dp-v4-plan" aria-label="Crew and standing plan">
      {readable ? <span className="dp-plan-chip" tabIndex={0} role="img" aria-label={standingPlanText(v4)} data-tip={standingPlanText(v4)}>◎ <span aria-hidden="true">{v4.plan.focus === 'support' ? 'Support' : v4.plan.focus === 'leader' ? 'Leader' : 'Finish'} · ◇</span></span> : <span>{standingPlanText(v4)}</span>}
      {v4.events.filter(event => event.kind === 'crew-active').map(event => <span className={readable ? 'dp-plan-chip' : ''} key={event.sequence} tabIndex={readable ? 0 : undefined} role={readable ? 'img' : undefined} aria-label={event.text} data-tip={readable ? event.text : undefined} title={event.text}>
        {readable ? `${event.crew === 'door' ? '⌂' : event.crew === 'kettle' ? '♨' : event.crew === 'table' ? '▱' : '✦'} ${event.marks}` : `${event.crew === 'door' ? 'Door' : event.crew === 'kettle' ? 'Kettle' : event.crew === 'table' ? 'Table' : 'Lantern'} team · ${event.marks} marks`}
      </span>)}<small>Actions are automatic</small></div>}
    {m.offline && new URLSearchParams(window.location.search).get('dev') === '1' && <FeelLab m={m} />}
    <div className={`dp-arena chapter-${battle.chapter} ${lowHealth ? 'dp-low-health' : ''} ${m.galleryBattle && m.galleryEffectOnly ? 'dp-effect-only' : ''}`}><div className="dp-canvas" ref={host} />
      {readable && m.impactVisible && results.map((result,resultIndex) => <div style={lookV2?{width:result.width}:undefined} data-lane-width={result.width} data-secondary={lookV2 && resultIndex>0} data-number-target={result.id} className="dp-float-number" key={`${m.plan?.skillId}-${result.id}`} ref={element => { if (element) numbers.current.set(result.id, element); else numbers.current.delete(result.id); }} aria-label={`${result.name} ${result.labels.map(label => label.type === 'fizzle' ? label.note : `${label.type} ${label.amount}`).join(', ')}`}>
        {result.labels.map((event, index) => <span className={`dp-number dp-number-${event.type} ${lookV2 && 'dot' in event && event.dot ? 'dp-number-dot' : ''} ${lookV2 && 'statusId' in event && event.statusId==='snag' ? 'dp-number-bleed' : ''} ${lookV2 && 'bitter' in event && event.bitter ? 'dp-number-bitter' : ''}`} key={index}>{event.type === 'death' ? 'KO' : event.type === 'status_apply' || event.type === 'fizzle' ? event.note : `${event.type === 'heal' ? '+' : event.type === 'shield' ? '◇' : '−'}${event.amount}`}{lookV2 && 'bitter' in event && event.bitter===true && <small> −50%</small>}</span>)}
      </div>)}
      {lookV2 && statusView?.bursts.map((id,index) => {
        const reactionId=statusView.reactions?.find(r=>r.targetId===id)?.id??'crumb-burst';
        const group=statusView.bursts.filter(target=>(statusView.reactions?.find(r=>r.targetId===target)?.id??'crumb-burst')===reactionId);
        const compact=group.length>1&&group[0]!==id;
        return <div key={`${m.plan?.id}-${id}`} className="dp-combo-callout" data-combo-target={id} data-compact={compact} data-order={index} role="status" aria-label={`${REACTION_WORDS[reactionId]} target ${index+1}`} hidden
          ref={element => { if(element)callouts.current.set(id,element);else callouts.current.delete(id); }}>{compact?`×${group.length}`:REACTION_WORDS[reactionId]}</div>;
      })}
      {v4 && <div className="dp-v4-boss-cue" ref={bossCue} role="status" aria-label="Boss event" hidden />}
      {m.plan?.ultimate && actor?.side === 'party' && !m.galleryEffectOnly && <aside className={`dp-ultimate-moment dp-ultimate-${actor.catalogId}`} aria-label={`${actor.name} ultimate`}>
        <img src={readable ? readablePortrait(actor.catalogId) ?? portrait(actor.catalogId) : portrait(actor.catalogId)} alt="" /><div><strong>{actor.name}</strong><span>{m.plan.name}</span></div>
        <button onClick={() => m.finishMoment()}>Skip moment</button>
      </aside>}
      {!m.sceneReady && !m.sceneError && <div className="dp-loading" data-a6={m.a6Battle} role="status">{m.a6Battle&&<img {...artPropsA6('mochi')} alt=""/>}<span ref={loadingText}>{battle.initial.formationC2?'':m.a6Battle?'Lighting the lanterns…':'Preparing the cafe miniatures…'}</span><progress ref={loadingProgress} max={5} value={0} aria-label="Battle preparation" /></div>}
      {m.sceneError && <div className="dp-loading" role="status">{m.sceneError}</div>}
      {battle.actors.filter(candidate => (candidate.side === 'enemy'||m.state.formationC2) && candidate.hp > 0).map(enemy => {
        const intent = battle.intents.find(candidate => candidate.actorId === enemy.id);
        const phase = displayedBossPhase(battle, enemy);
        const phaseName = battle.initial.gameplayA6 && phase === 2 ? 'Woolguard shield' : enemy.phase === 1 ? R.ENEMY_BY_ID[enemy.catalogId]?.phases[0] : 'Awakened';
        return <div className="dp-world-plate" data-c2={m.state.formationC2||undefined} key={enemy.id} data-actor={enemy.id} data-hp-plate tabIndex={readable ? 0 : undefined} hidden
          ref={element => { if (element) plates.current.set(enemy.id, element); else plates.current.delete(enemy.id); }}>
          <div><b>{enemy.name}</b><small>{enemy.hp}/{enemy.maxHp}</small></div>
          <progress value={enemy.hp} max={enemy.maxHp} aria-label={`${enemy.name} health`} />
          <small className="dp-intent" title={intent?.label}>{m.state.formationC2?(intent?intent.interrupted?'×':'⚔':null):intent?.interrupted ? 'Interrupted' : intent?.label}</small>
          {!m.state.formationC2&&R.ENEMY_BY_ID[enemy.catalogId]?.tier === 'boss' && <small className="dp-boss-phase" title={battle.initial.gameplayA6 ? phaseName : R.ENEMY_BY_ID[enemy.catalogId]!.phases[enemy.phase - 1]}>Phase {phase} · {phaseName}</small>}
          {m.state.formationC2&&<progress className="c2-world-rage" value={enemy.charge} max={100} aria-label={`${enemy.name} rage ${enemy.charge}/100`}/>}<Statuses actor={enemy} look={lookV2} />
        </div>;
      })}
    </div>
    <div className="dp-party">{lookV2 && <StatusLegend enabled={new URLSearchParams(window.location.search).get('dev')!=='1' && (m.state.settings as {hints?:boolean}).hints!==false} ids={battle.actors.flatMap(a=>a.statuses.map(s=>s.id)).join(',')} />}{battle.actors.filter(candidate => candidate.side === 'party').map(cat => <div className={`dp-party-card ${actor?.id === cat.id ? 'current' : ''} ${cat.hp > 0 && cat.hp / cat.maxHp <= .25 ? 'dp-health-critical' : ''}`} key={cat.id} data-hp-plate>
      <img src={readable ? readablePortrait(cat.catalogId) ?? portrait(cat.catalogId) : portrait(cat.catalogId)} alt="" />
      <div className="dp-party-health"><span><b>{cat.name}</b><strong>{cat.hp}/{cat.maxHp} HP</strong></span><progress value={cat.hp} max={cat.maxHp} aria-label={`${cat.name} health`} /><Statuses actor={cat} look={lookV2} /></div>
      {readable ? <div className="dp-skills-readonly" aria-label={`${cat.name} skills`}>
        {(R.CAT_BY_ID[cat.catalogId]?.skills.map(skill => skill.id) ?? cat.skills).map(id => { const skill = R.SKILLS[id]; if (!skill) return null;
          const equipped = cat.skills.includes(id);
          const state = !equipped ? 'Not equipped' : v4 ? skillReadinessV4(cat, skill) : skill.type === 'ultimate' ? cat.charge >= 100 ? 'Ready' : `${cat.charge}/100 charge` : (cat.cooldowns[id] ?? 0) > 0 ? `${cat.cooldowns[id]} turns` : 'Ready';
          const remaining = v4 || skill.type !== 'ultimate' ? Number.parseInt(state) || 0 : Math.max(0,100-cat.charge);
          const fraction = !equipped || state === 'Used this battle' ? 0 : state === 'Ready' ? 1 : 1-Math.min(1,remaining / (v4 || skill.type !== 'ultimate' ? Math.max(2,skill.cooldown) : 100));
          return <span key={id} tabIndex={0} role="img" className={`dp-skill-state ${state === 'Ready' ? 'is-ready' : ''}`} style={{'--cooldown': `${fraction*100}%`} as CSSProperties} aria-label={`${skill.name}: ${state}`} data-tip={`${skill.name} · ${state}`}><img src={readableSkillIcon(id) ?? skillIcon(id)} alt="" />{state !== 'Ready' && <b>{!equipped ? '–' : state === 'Used this battle' ? '×' : v4 || skill.type !== 'ultimate' ? remaining : cat.charge}</b>}</span>;
        })}
        <span className="dp-row-icon" tabIndex={0} role="img" aria-label={cat.row === 'front' ? 'Front row' : 'Back row'} data-tip={cat.row === 'front' ? 'Front row' : 'Back row'}>{cat.row === 'front' ? '▸' : '▹'}</span>
      </div> : v4 ? <div className="dp-v4-readiness" aria-label={`${cat.name} cooldowns`}><small>{cat.row === 'front' ? 'Front row' : 'Back row'}</small>
        {cat.skills.map(id => { const skill = R.SKILLS[id]; if (!skill) return null; const ready = skillReadinessV4(cat, skill);
          return <span key={id} className={ready === 'Ready' ? 'is-ready' : ''} title={`${skill.name}: ${ready}`}><span className="dp-v4-skill-name">{skill.name}</span><b>{ready}</b></span>; })}
      </div> : <span className="dp-charge" style={{ '--charge': `${cat.charge}%` } as CSSProperties} title={`Ultimate charge ${cat.charge}/100`}><small>{cat.charge}</small></span>}
    </div>)}</div>
    {readable ? <div className="dp-action-caption" role="status"><b>{m.paused ? 'Paused' : `${m.state.settings.speed}×`}</b><span>Round {battle.round}</span>{lookV2 && v4 && <span className="dp-v5-combo-ticker" role="status">{v4.events.filter(event=>event.kind==='reaction').at(-1)?.text}</span>}</div> : <>
    <div className="dp-action-caption" role="status"><b>{m.paused ? 'Paused' : m.impactVisible && !m.galleryBattle && m.momentNote || actor?.name}</b>
      <div className="dp-skill-banner" ref={skillBanner} hidden={!m.plan || m.animationAt >= 600 || m.galleryEffectOnly}>
        {m.plan && <>{skillIcon(m.plan.skillId) && <img src={skillIcon(m.plan.skillId)} alt="" />}<strong>{m.plan.name}</strong></>}
      </div>
      {m.impactVisible && results.length ? <div className="dp-result-chips" aria-label="Action results">
        {results.map(result => <span className="dp-result-chip" key={result.id}><b>{result.name}</b>
          {result.labels.map((event, index) => <span className={`dp-number dp-number-${event.type} ${lookV2 && 'dot' in event && event.dot ? 'dp-number-dot' : ''} ${lookV2 && 'statusId' in event && event.statusId==='snag' ? 'dp-number-bleed' : ''} ${lookV2 && 'bitter' in event && event.bitter ? 'dp-number-bitter' : ''}`} key={index}>
            {event.type === 'death' ? 'KO' : event.type === 'status_apply' || event.type === 'fizzle' ? event.note : `${event.type === 'heal' ? '+' : event.type === 'shield' ? '◇' : '−'}${event.amount}`}
            {event.type !== 'fizzle' && event.hits > 1 && <small title={`${event.hits} hits`} aria-label={`${event.hits} hits`}>{'·'.repeat(Math.min(6, event.hits))}</small>}
          </span>)}
        </span>)}
      </div> : <span>{action?.text ?? 'Your companions choose their actions. Watch, then improve your team.'}</span>}
    </div>
    </>}
    {logOpen && <aside className="dp-log" aria-label="Battle log"><button onClick={() => setLogOpen(false)}>Close log</button>{battle.log.slice(-100).reverse().map((event, index) => <p key={index}>R{event.round} · {event.text || `${battle.actors.find(candidate => candidate.id === event.actorId)?.name} → ${battle.actors.find(candidate => candidate.id === event.targetId)?.name} · ${event.kind} ${event.amount || ''}`}</p>)}</aside>}
  </section>;
}
declare global { interface Window { __depthScene?: TurnScene | SpineScene } }
