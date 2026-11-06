import { useEffect, useMemo, useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { TurnScene, type SceneView } from '../../squad/turn3d/scene';
import { sampleActionPlan } from '../../squad/turn3d/effects';
import { galleryFixture } from './feel-lab';
import { project, appearance } from './scene-actors';
import { animateChapterStage, decorateChapterStage } from './chapter-stage';
import { portrait } from './assets';
import type { DepthModel } from './model';

export function CompanionPreview({ m, id, skillId, entranceKey, home = false, visible = true }: {
  m: DepthModel; id?: string; skillId?: string; entranceKey?: string; home?: boolean; visible?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<TurnScene | null>(null);
  const [status, setStatus] = useState('Preparing miniatures…');
  const [rotating, setRotating] = useState(true);
  const [angle, setAngle] = useState(0);
  const state = m.state;
  const fixture = useMemo(() => {
    if (skillId) return galleryFixture(skillId);
    if (id && !state.account.cards.some(card => card.cardId === id)) return galleryFixture(`${id}-1`);
    return { battle: R.createBattle({ seed: 11, chapter: 1,
      cats: R.battleCats({ ...state, team: id ? [id] : state.team }), enemies: [] }), plan: null };
  }, [state, id, skillId]);
  const view = useMemo<SceneView>(() => {
    const actors = project(fixture.battle).filter(actor => home || skillId || actor.cardRpg?.cardId === id);
    const equipment = Object.fromEntries(actors.map(actor => [actor.id, appearance(actor)]));
    return {
      actors, currentId: null, frame: null,
      models: Object.fromEntries(actors.map(actor => [actor.id, actor.cardRpg!.cardId])),
      warmModelIds: actors.map(actor => actor.cardRpg!.cardId),
      appearance: actor => equipment[actor.id]!, autoBattle: true, tableau: home,
      targetIds: [], legalIds: [], rows: Object.fromEntries(fixture.battle.actors.map(actor => [actor.id, actor.row])),
      reducedMotion: state.settings.reducedMotion, paused: false, suspended: false,
      boss: false, chapter: 1, quality: state.settings.quality,
      model: home || skillId ? undefined : { role: actors[0]!.role, clip: 'idle', angle: 0 },
      decorateStage: decorateChapterStage, animateStage: animateChapterStage,
    };
  }, [fixture, home, id, skillId, state.settings.reducedMotion, state.settings.quality]);
  const options = useRef({ view, fixture, rotating, angle, skillId, visible, id, entranceKey });
  options.current = { view, fixture, rotating, angle, skillId, visible, id, entranceKey };

  useEffect(() => {
    if (!host.current) return;
    let stopped = false;
    let timer = 0;
    let prepared = false;
    let elapsed = 0;
    let last = 0;
    let playedEntrance: string | undefined;
    let entrancePending = false;
    let nextEntranceAttempt = 0;
    let currentFixture = options.current.fixture;
    const getView = () => {
      const current = options.current;
      if (currentFixture !== current.fixture) { currentFixture = current.fixture; elapsed = 0; }
      const plan = current.skillId ? current.fixture.plan : null;
      const actionAt = plan ? elapsed % (plan.duration + 900) : 0;
      current.view.frame = plan && actionAt < plan.duration ? sampleActionPlan(plan, actionAt, current.view.reducedMotion) : null;
      current.view.suspended = m.showBattle || !current.visible;
      if (current.view.model) current.view.model.angle = current.angle + (current.rotating && !current.entranceKey && !current.view.reducedMotion ? elapsed * .00016 : 0);
      return current.view;
    };
    const start = window.setTimeout(() => {
      if (stopped) return;
      try {
        scene.current = new TurnScene(host.current!, getView, () => {}, () => {}, setStatus);
        if (m.offline || import.meta.env.DEV) window.__depthPreviewScene = scene.current;
        const tick = (now: number) => {
          if (stopped) return;
          if (scene.current?.ready && !m.showBattle && options.current.visible) {
            elapsed += last ? Math.min(100, now - last) : 0;
            if (!prepared) { prepared = true; setStatus(''); }
            const current = options.current;
            if (current.entranceKey && current.id && current.entranceKey !== playedEntrance
              && !entrancePending && now >= nextEntranceAttempt) {
              const key = current.entranceKey;
              entrancePending = true;
              nextEntranceAttempt = now + 100;
              void scene.current.playEntrance(current.id).then(played => {
                if (!stopped && played && options.current.entranceKey === key) playedEntrance = key;
              }).catch(() => {
                if (!stopped) setStatus('The companion portrait is ready. The miniature is unavailable.');
                playedEntrance = key;
              }).finally(() => { entrancePending = false; });
            }
          }
          last = now;
          timer = requestAnimationFrame(tick);
        };
        timer = requestAnimationFrame(tick);
      } catch (error) { setStatus(`Preview unavailable. ${String(error).slice(0, 100)}`); }
    }, 180);
    return () => {
      stopped = true;
      clearTimeout(start);
      cancelAnimationFrame(timer);
      if (window.__depthPreviewScene === scene.current) delete window.__depthPreviewScene;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [m]);
  useEffect(() => { scene.current?.invalidate(); }, [view, rotating, angle, visible]);

  return <div className={`dp-miniature ${home ? 'dp-miniature-home' : ''}`}>
    <div className="dp-miniature-canvas" ref={host} aria-label={home ? 'Your team at the cafe' : `${R.CAT_BY_ID[id!]!.name} miniature`} />
    {status && <div className="dp-miniature-loading" role="status"><img src={portrait(id ?? state.team[0]!)} alt="" /><span>{status}</span></div>}
    {!home && !skillId && !entranceKey && <div className="dp-miniature-controls">
      <button aria-pressed={rotating} onClick={() => setRotating(!rotating)}>{rotating ? 'Pause rotation' : 'Rotate miniature'}</button>
      <label>Angle<input type="range" min={-180} max={180} value={angle * 180 / Math.PI}
        onChange={event => { setRotating(false); setAngle(Number(event.target.value) * Math.PI / 180); }} /></label>
    </div>}
  </div>;
}

declare global { interface Window { __depthPreviewScene?: TurnScene } }
