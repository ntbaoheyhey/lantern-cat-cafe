import './scene.css';
/** Ten hand-drawn, palette-locked expressions. CSS pauses without React timers. */
export function MochiPortrait({ size = 96 }: { size?: number }) {
  const scale = Math.max(1, Math.round(size / 48));
  return <span className="mochi-portrait" role="img" aria-label="Mochi, a tabby cat with a blue scarf" style={{ width: 48 * scale, height: 48 * scale }}><span className="mochi-portrait__pixels" style={{ transform: `scale(${scale})` }} /></span>;
}
