import { useEffect, useRef } from 'react';
import type { DepthModel } from './model';
import { CARD_CAMERAS } from '../../squad/turn3d/card-staging';
import { BriefChecklist, ComparisonEvidence } from './LabEvidence';
import { MotionEvidence } from './MotionEvidence';
import { EffectEvidence } from './EffectEvidence';
import './feel-lab.css';

const panels = [
  ['gallery', 'Skill gallery'], ['compare', 'Before / after'], ['motion', 'Motion'],
  ['performance', 'Performance'], ['checklist', 'Brief checklist'],
] as const;

export function FeelLab({ m, home = false }: { m: DepthModel; home?: boolean }) {
  const progress = useRef<HTMLInputElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const visible = home ? !m.showBattle : m.showBattle;
  const open = m.labOpen && visible;
  const close = () => {
    m.labOpen = false;
    if (m.galleryBattle) m.closeGallery();
    else m.notify(false);
  };
  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        m.labOpen = false;
        if (m.galleryBattle) m.closeGallery();
        else m.notify(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [m, open]);
  useEffect(() => {
    if (!open || m.labPanel !== 'gallery') return;
    let handle = 0;
    const update = () => {
      if (progress.current && document.activeElement !== progress.current) {
        progress.current.value = String(m.plan ? m.animationAt / m.plan.duration : 0);
      }
      handle = requestAnimationFrame(update);
    };
    handle = requestAnimationFrame(update);
    return () => cancelAnimationFrame(handle);
  }, [m, open, m.labPanel]);
  if (!visible) return null;
  return <div className={`dp-feel-lab ${home ? 'dp-feel-home' : ''}`}>
    <button aria-expanded={open} aria-controls="feel-lab-controls" onClick={() => { m.labOpen = !open; m.notify(false); }}>Feel lab</button>
    {open && <section id="feel-lab-controls" className={`dp-lab-drawer ${m.galleryBattle && m.labPanel === 'gallery' ? 'dp-lab-gallery' : ''}`} aria-label="Feel lab">
      <header className="dp-lab-header"><h2>Feel lab</h2><button ref={closeButton} onClick={close}>{m.watching ? 'Return to battle' : 'Return to cafe'}</button></header>
      <nav className="dp-lab-tabs" aria-label="Feel lab panels">{panels.map(([id, name]) =>
        <button key={id} aria-pressed={m.labPanel === id} onClick={() => { m.labPanel = id; m.notify(false); }}>{name}</button>)}</nav>
      <div className="dp-lab-body">
        {m.labPanel === 'gallery' && <>
          <label>Preview action<select value={m.galleryId} onChange={event => m.inspect(event.target.value)}>
            {m.galleryActions.map(action => <option key={action.id} value={action.id}>{action.name}</option>)}
          </select></label>
          <div className="cr-actions">
            <button onClick={() => m.inspect(m.galleryId, 0, true)}>Play preview</button>
            <label>Preview speed<select value={m.gallerySpeed} onChange={event => { m.gallerySpeed = Number(event.target.value); m.notify(false); }}>
              <option value={.25}>0.25×</option><option value={1}>1×</option>
            </select></label>
            <label><input type="checkbox" checked={m.galleryEffectOnly} onChange={event => { m.galleryEffectOnly = event.target.checked; if (!m.galleryBattle) m.inspect(m.galleryId); else m.notify(false); }} /> Effect only</label>
          </div>
          <label>Action progress<input ref={progress} type="range" min={0} max={.999} step={.001} defaultValue={0}
            onChange={event => m.inspect(m.galleryId, Number(event.target.value))} /></label>
          <label>Preview camera<select value={m.camera} onChange={event => { m.camera = event.target.value as typeof m.camera; m.notify(false); }}>
            {Object.entries(CARD_CAMERAS).map(([id, preset]) => <option key={id} value={id}>{preset.name}</option>)}
          </select></label>
          <p>Previews use a separate battle fixture. Return restores the previous battle and its playback position.</p>
        </>}
        {m.labPanel === 'compare' && <ComparisonEvidence />}
        {m.labPanel === 'motion' && <><MotionEvidence /><EffectEvidence /></>}
        {m.labPanel === 'checklist' && <BriefChecklist m={m} />}
        {m.labPanel === 'performance' && <>
          <label><input type="checkbox" checked={m.labPerformance} onChange={event => { m.labPerformance = event.target.checked; m.notify(false); }} /> Show live frame overlay</label>
          <p>The offline demo samples from its first page animation frame. Max and hitch counts include loading and navigation. The graph shows the latest 240 visible-page frames.</p>
          <label>Quality tier<select value={m.state.settings.quality} onChange={event => { m.state.settings.quality = event.target.value as typeof m.state.settings.quality; m.notify(false); }}>
            {['low', 'medium', 'high'].map(quality => <option key={quality}>{quality}</option>)}
          </select></label>
          <p>Open the raw performance reports for controlled fresh-profile, DPR and CPU-throttled measurements.</p>
          <p className="dp-reference">REFERENCE — reports/cardrpg-big/flow/PERFORMANCE.md · tools/cardrpg-big/skill-measure.mjs</p>
        </>}
      </div>
    </section>}
  </div>;
}
