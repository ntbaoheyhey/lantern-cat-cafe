import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import './live-guide.css';
declare global {
  interface Window {
    __v5LiveGallery?: { source: string; shots: { id: string; name: string; mode: string; image: string; case?: string; seed?: number; round?: number; action?: number }[] };
  }
}
const cats = ['mochi', 'soot', 'clover', 'panko', 'mallow', 'sorrel', 'biscuit', 'inkcap', 'cinnamon', 'brioche', 'velvet', 'marigold'];
export function LiveGuide() {
  const m = window.__depthReview;
  useSyncExternalStore(m?.subscribe ?? (() => () => {}), m?.snapshot ?? (() => 0));
  const [open, setOpen] = useState(false), [reel, setReel] = useState(false), [playing, setPlaying] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null), raf = useRef(0);
  const reelHost = document.querySelector('.dp-battle-top');
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const stop = () => { cancelAnimationFrame(raf.current); setPlaying(false); };
  const play = () => {
    if (!m) return;
    stop(); setOpen(false); setReel(true); setPlaying(true); let index = 0;
    const next = () => {
      if (!m.plan) {
        if (index === cats.length) { setPlaying(false); return; }
        m.inspect(`${cats[index++]}-4`, 0, true); m.gallerySpeed = 1; m.notify(false);
      }
      raf.current = requestAnimationFrame(next);
    };
    m.inspect(`${cats[index++]}-4`, 0, true); m.gallerySpeed = 1; m.notify(false);
    raf.current = requestAnimationFrame(next);
  };
  return <>
    <button onClick={() => setOpen(true)} disabled={!!m?.showBattle && !reel}>Skills V5 guide</button>
    <dialog className="v5-live-guide" ref={dialog} onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <header><div><small>THE LANTERN</small><h2>Read the battle in a glance</h2></div><button onClick={() => setOpen(false)} autoFocus>Close guide</button></header>
      <p>Battles play automatically. Watch the status badges, the order of the hits, and the combo word above its target.</p>
      <p>These stills replay events from real Skills V5 battles. The three-foe Row and triple Crumb Burst examples are labelled fixture previews because they did not occur in the registered battles.</p>
      <section aria-label="Ultimate gallery"><h3>Twelve companion ultimates</h3><p>A continuous gallery reel at natural speed. These are demonstrations of the effects, separate from live battle coverage.</p><button onClick={play}>Play 20 second skill reel</button></section>
      <div className="v5-live-grid">{window.__v5LiveGallery?.shots.map(shot => <figure key={shot.id}>
        <img src={shot.image} alt={`${shot.id}: ${shot.name}`} loading="lazy" />
        <figcaption><b>{shot.id} · {shot.name}</b><span>{shot.mode.startsWith('FIXTURE') ? 'Fixture preview' : 'Live battle replay frame'}</span>{shot.case && <small>{shot.case} · seed {shot.seed} · round {shot.round} · action {shot.action}</small>}</figcaption>
      </figure>)}</div>
      <footer>REFERENCE: reports/cardrpg-look/skills-v5/full/V5FULL-REPORT.md · reports/cardrpg-look/skills-v5/full/LIVE-SEEDS.md · docs/design/cardrpg/LOOK-BIBLE.md<br />Source: {window.__v5LiveGallery?.source ?? 'See build receipt'}</footer>
    </dialog>
    {reel && m?.galleryBattle && reelHost && createPortal(<div className="v5-live-reel" role="region" aria-label="Skill reel controls" data-skill-reel={playing ? 'playing' : 'complete'}>
      <b>Gallery reel · 1×</b><span>{m.galleryId.replace('-4', '')} ultimate</span><button onClick={play} disabled={playing}>Replay reel</button><button onClick={() => { stop(); m.closeGallery(); setReel(false); setOpen(true); }}>Back to guide</button>
    </div>, reelHost)}
  </>;
}
