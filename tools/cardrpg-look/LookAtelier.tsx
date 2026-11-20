// Staged for tools/cardrpg-look after L5 audit. Original preview UI; account stays isolated.
// REFERENCE: turn3d/scene.ts; depth/scene-actors.ts; reports/cardrpg-look.
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { DepthModel } from '../../apps/web/src/game/cardrpg/depth/model';
import { TurnScene, type SceneView } from '../../apps/web/src/game/squad/turn3d/scene';
import { project, appearance } from '../../apps/web/src/game/cardrpg/depth/scene-actors';
import { animateChapterStage, decorateChapterStage } from '../../apps/web/src/game/cardrpg/depth/chapter-stage';
import { isLookV2, subscribeLookV2 } from '../../apps/web/src/game/squad/turn3d/look-v2';
import './look-atelier.css';

type Pair = { name: string; before: string; after: string; source: string; note: string };
type Round = { name: string; image: string; source: string; note: string };
type Measure = { name: string; value: string; note: string };
declare global {
  interface Window {
    __lookShowcase?: { pairs: Pair[]; rounds: Round[]; measures: Measure[] };
    __lookAtelierScene?: TurnScene;
  }
}
const title = (id: string) => id.split('-').map(word => word[0]!.toUpperCase() + word.slice(1)).join(' ');
const heroes = new Set(['mochi', 'soot', 'clover']);

function Miniatures({ stage = false }: { stage?: boolean }) {
  const look = useSyncExternalStore(subscribeLookV2, isLookV2);
  const [owner, setOwner] = useState('mochi');
  const [chapter, setChapter] = useState(1);
  const [camera, setCamera] = useState<'close' | 'wide' | 'far'>('wide');
  const [angle, setAngle] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [status, setStatus] = useState('Preparing the miniatures…');
  const host = useRef<HTMLDivElement>(null);
  const model = useMemo(() => {
    const m = new DepthModel(true);
    const action = m.galleryActions.find(item => item.owner === owner)!;
    m.inspect(action.id, -1);
    return m;
  }, [owner]);
  const owners = [...new Set(model.galleryActions.map(action => action.owner))];
  const actors = useMemo(() => project(model.battle!), [model]);
  const actor = actors.find(item => item.cardRpg?.cardId === owner)!;
  const view = useRef<SceneView>(null!);
  const rotation = useRef(0);
  const playing = useRef(false);
  playing.current = rotating;
  view.current = {
    actors: stage ? actors : [actor], models: Object.fromEntries(actors.map(item => [item.id, item.cardRpg!.cardId])),
    warmModelIds: stage ? actors.map(item => item.cardRpg!.cardId) : [owner], appearance,
    decorateStage: decorateChapterStage, animateStage: animateChapterStage,
    autoBattle: true, chapter, camera, rows: Object.fromEntries(model.battle!.actors.map(item => [item.id, item.row])),
    currentId: null, frame: null, targetIds: [], legalIds: [], boss: false,
    paused: true, reducedMotion: true, quality, autoQuality: false, fixedTime: 3.2,
    ...(!stage ? { model: { role: actor.role, clip: 'idle', angle: rotation.current }, modelProgress: .3 } : {}),
  };
  useEffect(() => {
    rotation.current = angle * Math.PI / 180;
    if (view.current.model) view.current.model.angle = rotation.current;
  }, [angle]);
  useEffect(() => { window.__lookAtelierScene?.invalidate(); }, [chapter, camera, angle, quality]);
  useEffect(() => () => model.audio.dispose(), [model]);
  useEffect(() => {
    let frame = 0, last = 0, labelAt = 0, failed = false;
    setStatus('Preparing the miniatures…');
    let scene: TurnScene;
    try {
      scene = new TurnScene(host.current!, () => view.current, () => {}, () => {}, message => {
        failed = true; setStatus(message);
      });
    } catch (error) {
      setStatus(`The 3D preview could not open. ${String(error).slice(0, 160)}`);
      return;
    }
    window.__lookAtelierScene = scene;
    const tick = (now: number) => {
      if (playing.current && scene.ready && last) {
        rotation.current = (rotation.current + Math.min(now - last, 50) * .00035) % (Math.PI * 2);
        scene.invalidate();
      }
      if (view.current.model) view.current.model.angle = rotation.current;
      if (!failed && now - labelAt > 250) {
        setStatus(scene.ready ? 'Ready' : scene.loading.label); labelAt = now;
      }
      last = now; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); scene.dispose();
      if (window.__lookAtelierScene === scene) delete window.__lookAtelierScene;
    };
  }, [model, look, stage]);
  return <div className="look-viewer">
    <div className="look-toolbar">
      {stage ? <>
        <label>Chapter<select aria-label="Atelier chapter" value={chapter} onChange={event => setChapter(Number(event.target.value))}>
          <option value={1}>1 · Lantern cafe</option><option value={2}>2 · Rainlit shelves</option><option value={3}>3 · Midnight pantry</option>
        </select></label>
        <label>Camera<select aria-label="Atelier camera" value={camera} onChange={event => setCamera(event.target.value as typeof camera)}>
          <option value="close">A · Portrait</option><option value="wide">B · Balanced</option><option value="far">C · Stage</option>
        </select></label>
      </> : <>
        <label>Miniature<select aria-label="Atelier unit" value={owner} onChange={event => { setOwner(event.target.value); setAngle(0); rotation.current = 0; }}>
          {owners.map(id => <option key={id} value={id}>{title(id)}</option>)}
        </select></label>
        <label className="look-angle">Turn by hand<input aria-label="Atelier angle" type="range" min="0" max="360" value={angle} onChange={event => { setRotating(false); setAngle(Number(event.target.value)); }} /></label>
        <button aria-pressed={rotating} onClick={() => {
          if (rotating) setAngle(Math.round(rotation.current * 180 / Math.PI) % 360);
          setRotating(value => !value);
        }}>{rotating ? 'Pause rotation' : 'Rotate miniature'}</button>
      </>}
      <label>Detail<select aria-label="Atelier quality" value={quality} onChange={event => setQuality(event.target.value as typeof quality)}>
        <option value="high">High</option><option value="medium">Balanced</option><option value="low">Low</option>
      </select></label>
    </div>
    <div className="look-viewport" ref={host} aria-label={stage ? 'Chapter diorama' : `${title(owner)} turntable`}>
      {status !== 'Ready' && <div className="look-loading" role="status">{status}</div>}
    </div>
    <div className="look-caption"><div><strong>{stage ? 'A table with a little world around it' : title(owner)}</strong>
      <p>{stage ? 'Three chapter palettes, three camera distances. The preview team is separate from your collection.' : 'Turn the actual game miniature to inspect its face, costume and silhouette.'}</p></div>
      <span className="look-pill">{stage ? '3 chapters · 9 views' : `${heroes.has(owner) ? 'Hero slice' : 'Improved'} · ${owners.length} miniatures`}</span>
    </div>
  </div>;
}

function Comparisons() {
  const data = window.__lookShowcase;
  const [index, setIndex] = useState(0), [wipe, setWipe] = useState(50);
  const row = data?.pairs[index];
  return <div className="look-reading"><h2>Small details, a warmer world.</h2><p>Slide across matched captures to see the change in shape, light and colour.</p>
    {row ? <><label>Comparison<select aria-label="Atelier comparison" value={index} onChange={event => setIndex(Number(event.target.value))}>{data!.pairs.map((pair, i) => <option key={pair.name} value={i}>{pair.name}</option>)}</select></label>
      <figure className="look-wipe" style={{ '--wipe': `${wipe}%` } as CSSProperties}>
        <img src={row.before} alt={`${row.name}, earlier capture`} /><img className="look-after" src={row.after} alt={`${row.name}, atelier capture`} />
        <span className="look-divider" /><figcaption><span>Earlier</span><span>Atelier</span></figcaption>
      </figure><label className="look-wipe-range">Reveal the change<input aria-label="Atelier comparison wipe" type="range" min="0" max="100" value={wipe} onChange={event => setWipe(Number(event.target.value))} /></label>
      <p>{row.note}</p><details><summary>Capture reference</summary><p>{row.source}</p></details></> : <p>Comparison captures are not packaged in this build.</p>}
    {!!data?.rounds.length && <><h2>From the workbench</h2><div className="look-rounds">{data.rounds.map(round => <figure key={round.name}><img src={round.image} alt={round.name} loading="lazy" /><figcaption><strong>{round.name}</strong><p>{round.note}</p><details><summary>Source</summary>{round.source}</details></figcaption></figure>)}</div></>}
  </div>;
}

function Notes({ openSkills }: { openSkills: () => void }) {
  return <div className="look-reading"><h2>Take a minute at the cafe.</h2><div className="look-checklist">
    <article><span>01</span><h3>Meet the cast</h3><p>Twelve cats, ten opponents and three bosses, with original sculpted models and costumes.</p></article>
    <article><span>02</span><h3>Watch the light</h3><p>Warm lamps, cool shadows, stitched textiles, glazed pottery and chapter colour grades.</p></article>
    <article><span>03</span><h3>Follow each skill</h3><p>Every skill and ultimate has an isolated preview with effect-only mode and quarter speed.</p><button onClick={openSkills}>Open skill gallery</button></article>
  </div><h2>Measured, with limits.</h2><p>These readings belong to the checkpoints named below. They support the visual review; they are not beauty scores.</p>
    <table><thead><tr><th>Measure</th><th>Reading</th><th>Scope</th></tr></thead><tbody>{window.__lookShowcase?.measures.map(row => <tr key={row.name}><th scope="row">{row.name}</th><td>{row.value}</td><td>{row.note}</td></tr>)}</tbody></table>
    <p>Small eye rims, rigid accessories, simple back surfaces and some pale effects remain visible. High detail is optional; Balanced and Low reduce the post effects.</p>
    <p><a href="art.html">Open the portrait and skill-art gallery →</a> · <a href="slice.html">Open the first hero checkpoint →</a></p>
  </div>;
}

export function LookAtelier({ close, openSkills }: { close: () => void; openSkills: () => void }) {
  const [tab, setTab] = useState<'models' | 'stages' | 'compare' | 'notes'>('models');
  return <section className="look-atelier" aria-label="Look atelier">
    <header><div><small>THE LANTERN · THE WORKBENCH</small><h1>A closer look.</h1></div><button onClick={close}>Return to cafe</button></header>
    <nav aria-label="Atelier views">{([['models', 'Miniatures'], ['stages', 'Dioramas'], ['compare', 'Before / after'], ['notes', 'Notes & measurements']] as const).map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === 'models' ? <Miniatures key="models" /> : tab === 'stages' ? <Miniatures key="stages" stage /> : tab === 'compare' ? <Comparisons /> : <Notes openSkills={openSkills} />}
  </section>;
}
