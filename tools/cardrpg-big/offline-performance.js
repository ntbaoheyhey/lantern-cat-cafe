// Bounded diagnostics begin before the embedded assets and app are decoded.
(() => {
  const meter = window.__cardFrameMeter = {
    frames: 0, maxMs: 0, above25: 0, above50: 0, within20: 0,
    samples: new Float64Array(240), cursor: 0,
  };
  let last = 0;
  document.addEventListener('visibilitychange', () => { last = 0; });
  requestAnimationFrame(function sample(now) {
    if (last && !document.hidden) {
      const elapsed = now - last;
      meter.frames++;
      meter.maxMs = Math.max(meter.maxMs, elapsed);
      meter.above25 += Number(elapsed > 25);
      meter.above50 += Number(elapsed > 50);
      meter.within20 += Number(elapsed <= 20);
      meter.samples[meter.cursor] = elapsed;
      meter.cursor = (meter.cursor + 1) % meter.samples.length;
    }
    last = now;
    requestAnimationFrame(sample);
  });
})();
