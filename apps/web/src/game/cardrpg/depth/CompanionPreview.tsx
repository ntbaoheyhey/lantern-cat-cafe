import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { isLookV2, subscribeLookV2 } from '../../squad/turn3d/look-v2';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { type TurnScene, type SceneView } from '../../squad/turn3d/scene';
import { galleryFixture } from './feel-lab';
import { project, appearance } from './scene-actors';
import { animateChapterStage, decorateChapterStage } from './chapter-stage';
import { portraitProps } from './assets';
import { PreviewRuntime } from './preview-runtime';
import type { DepthModel } from './model';

const PreviewContext = createContext<PreviewRuntime | null>(null);

/** The scene belongs to the app, not to a keyed screen or a reveal phase. */
export function CompanionPreviewProvider({ m, children }: { m: DepthModel; children: ReactNode }) {
  const [runtime] = useState(() => new PreviewRuntime(m));
  useEffect(() => () => runtime.dispose(), [runtime]);
  return <PreviewContext.Provider value={runtime}>{children}</PreviewContext.Provider>;
}

export function CompanionPreview({ m, id, skillId, entranceKey, earnedReveal, home = false, visible = true }: {
  m: DepthModel; id?: string; skillId?: string; entranceKey?: string; earnedReveal?: R.GameplayEventV4; home?: boolean; visible?: boolean;
}) {
  const lookV2 = useSyncExternalStore(subscribeLookV2, isLookV2, () => false);
  const host = useRef<HTMLDivElement>(null);
  const shared = useContext(PreviewContext);
  const [runtime] = useState(() => shared ?? new PreviewRuntime(m));
  useEffect(() => shared ? undefined : () => runtime.dispose(), [runtime, shared]);
  const [status, setStatus] = useState('Preparing miniatures…');
  const [rotating, setRotating] = useState(true);
  const [angle, setAngle] = useState(0);
  const state = m.state;
  const fixture = useMemo(() => {
    if (skillId) return galleryFixture(skillId);
    if (id && !state.account.cards.some(card => card.cardId === id)) return galleryFixture(`${id}-1`);
    return { battle: R.createBattle({ seed: 11, chapter: 1,
      gameplayV4: R.gameplayV4(state), skillsV5: R.skillsV5(state), gameplayA6: R.gameplayA6(state),
      cats: R.battleCats({ ...state, team: id ? [id] : state.team }), enemies: [] }), plan: null };
  }, [state, id, skillId]);
  const view = useMemo<SceneView & { earnedReveal?: R.GameplayEventV4 }>(() => {
    const actors = project(fixture.battle).filter(actor => home || skillId || actor.cardRpg?.cardId === id);
    const equipment = Object.fromEntries(actors.map(actor => [actor.id, appearance(actor)]));
    return {
      actors, currentId: null, frame: null,
      ...(R.gameplayV4(state) && entranceKey && earnedReveal ? { earnedReveal } : {}),
      models: Object.fromEntries(actors.map(actor => [actor.id, actor.cardRpg!.cardId])),
      warmModelIds: actors.map(actor => actor.cardRpg!.cardId),
      appearance: actor => equipment[actor.id]!, autoBattle: true, tableau: home,
      targetIds: [], legalIds: [], rows: Object.fromEntries(fixture.battle.actors.map(actor => [actor.id, actor.row])),
      reducedMotion: state.settings.reducedMotion, paused: false, suspended: false,
      boss: false, chapter: 1, quality: state.settings.quality,
      model: home || skillId ? undefined : { role: actors[0]!.role, clip: 'idle', angle: 0 },
      decorateStage: decorateChapterStage, animateStage: animateChapterStage,
    };
  }, [fixture, home, id, skillId, entranceKey, earnedReveal, state, state.settings.reducedMotion, state.settings.quality]);
  const options = useRef({ view, fixture, rotating, angle, skillId, visible, id, entranceKey });
  options.current = { view, fixture, rotating, angle, skillId, visible, id, entranceKey };

  useEffect(() => {
    if (!host.current) return;
    return runtime.attach(host.current, () => options.current, setStatus);
  }, [runtime]);
  useEffect(() => { runtime.setLook(lookV2); }, [runtime, lookV2]);
  useEffect(() => { runtime.invalidate(); }, [runtime, view, rotating, angle, visible]);

  return <div className={`dp-miniature ${home ? 'dp-miniature-home' : ''}`}>
    <div className="dp-miniature-canvas" ref={host} aria-label={home ? 'Your team at the cafe' : `${R.CAT_BY_ID[id!]!.name} miniature`} />
    {status && <div className="dp-miniature-loading" role="status"><img {...portraitProps(id ?? state.team[0]!)} alt="" /><span>{status}</span></div>}
    {!home && !skillId && !entranceKey && <div className="dp-miniature-controls">
      <button aria-pressed={rotating} onClick={() => setRotating(!rotating)}>{rotating ? 'Pause rotation' : 'Rotate miniature'}</button>
      <label>Angle<input type="range" min={-180} max={180} value={angle * 180 / Math.PI}
        onChange={event => { setRotating(false); setAngle(Number(event.target.value) * Math.PI / 180); }} /></label>
    </div>}
  </div>;
}

declare global { interface Window { __depthPreviewScene?: TurnScene } }
