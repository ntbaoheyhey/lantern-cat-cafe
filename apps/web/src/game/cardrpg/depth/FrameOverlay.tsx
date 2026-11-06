import { useEffect, useRef } from 'react';
import type { DepthModel } from './model';

interface FrameMeter {
  frames: number;
  maxMs: number;
  above25: number;
  above50: number;
  within20: number;
  samples: Float64Array;
  cursor: number;
}
declare global { interface Window { __cardFrameMeter?: FrameMeter } }

export function FrameOverlay({ m }: { m: DepthModel }) {
  const graph = useRef<HTMLCanvasElement>(null);
  const summary = useRef<HTMLOutputElement>(null);
  useEffect(() => {
    const canvas = graph.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const draw = () => {
      const meter = window.__cardFrameMeter;
      if (!meter) {
        if (summary.current) summary.current.value = 'Page-open sampling is available in the built offline demo.';
        return;
      }
      const scene = m.showBattle ? window.__depthScene : window.__depthPreviewScene;
      const stats = scene?.stats;
      if (summary.current) summary.current.value = `Max ${meter.maxMs.toFixed(1)} ms · >25 ms ${meter.above25} · >50 ms ${meter.above50}\n${meter.frames} frames · ≤20 ms ${(100 * meter.within20 / Math.max(1, meter.frames)).toFixed(1)}%\n${stats?.quality ?? m.state.settings.quality} · ${stats?.calls ?? 0} draws · ${stats?.triangles ?? 0} triangles`;
      context.clearRect(0, 0, canvas.width, canvas.height);
      const ceiling = Math.max(100, meter.maxMs);
      context.strokeStyle = '#a98975';
      context.beginPath();
      context.moveTo(0, canvas.height * (1 - 50 / ceiling));
      context.lineTo(canvas.width, canvas.height * (1 - 50 / ceiling));
      context.stroke();
      context.strokeStyle = '#bde7c6';
      context.beginPath();
      const count = Math.min(meter.frames, meter.samples.length);
      for (let index = 0; index < count; index++) {
        const sample = meter.samples[(meter.cursor - count + index + meter.samples.length) % meter.samples.length]!;
        const x = index * canvas.width / meter.samples.length;
        const y = canvas.height * (1 - sample / ceiling);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    };
    draw();
    const timer = setInterval(draw, 250);
    return () => clearInterval(timer);
  }, [m]);
  return <aside className="dp-frame-overlay" aria-label="Live frame performance">
    <button onClick={() => { m.labPerformance = false; m.notify(false); }} aria-label="Hide frame overlay">×</button>
    <output ref={summary} />
    <canvas ref={graph} width={240} height={54} aria-label="Recent frame times with a 50 millisecond line" />
  </aside>;
}
