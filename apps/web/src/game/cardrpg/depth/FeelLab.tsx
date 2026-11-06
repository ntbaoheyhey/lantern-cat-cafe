import { useEffect, useRef, useState } from 'react';
import type { DepthModel } from './model';

export function FeelLab({ m }: { m: DepthModel }) {
  const [open, setOpen] = useState(false);
  const progress = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return;
    let handle = 0;
    const update = () => {
      if (progress.current && document.activeElement !== progress.current) {
        progress.current.value = String(m.plan ? m.animationAt / m.plan.duration : 0);
      }
      handle = requestAnimationFrame(update);
    };
    handle = requestAnimationFrame(update);
    return () => cancelAnimationFrame(handle);
  }, [m, open]);
  return <div className="dp-feel-lab">
    <button aria-expanded={open} aria-controls="feel-lab-controls" onClick={() => setOpen(!open)}>Feel lab</button>
    {open && <section id="feel-lab-controls" aria-label="Effect and motion preview">
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
      <button onClick={() => { if (m.galleryBattle) m.closeGallery(); setOpen(false); }}>Return to battle</button>
    </section>}
  </div>;
}
