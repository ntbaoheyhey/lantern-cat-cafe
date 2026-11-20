/** Observe natural HUD meter settlement without changing state, styles, or timers. */
export const settleHudMeters = async ({ timeoutMs = 2500, stableFrames = 3 } = {}) => {
  const start = performance.now(), observations = [];
  let stable = 0;
  while (performance.now() - start < timeoutMs) {
    const meters = [...document.querySelectorAll('.b3-boss .b3-hp,.b3-bottom .b3-hp')]
      .filter(node => node.getBoundingClientRect().width > 0)
      .map(node => {
        const trail = node.querySelector('.b3-trail'), fill = node.querySelector('.b3-fill');
        if (!trail || !fill) throw Error('Missing HUD meter children');
        return { name: node.getAttribute('aria-label'), rect: node.getBoundingClientRect().toJSON(),
          trailInline: parseFloat(trail.style.width), fillInline: parseFloat(fill.style.width),
          trailWidth: trail.getBoundingClientRect().width, fillWidth: fill.getBoundingClientRect().width };
      });
    const finite = document.getAnimations().filter(animation =>
      animation.effect?.target?.closest('.b3-boss,.b3-bottom') &&
      Number.isFinite(animation.effect.getComputedTiming().endTime) &&
      animation.playState !== 'finished');
    const settled = meters.length > 0 && !finite.length && meters.every(meter =>
      Number.isFinite(meter.trailInline) && Number.isFinite(meter.fillInline) &&
      Math.abs(meter.trailInline - meter.fillInline) < 1e-6 &&
      Math.abs(meter.trailWidth - meter.fillWidth) <= 1 / 64);
    observations.push({ wallTime: performance.now(), meters, finiteAnimations: finite.length, settled });
    stable = settled ? stable + 1 : 0;
    if (stable >= stableFrames) return { start, end: performance.now(), timeoutMs, stableFrames, observations };
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  throw Error('HUD meter settlement timeout: ' + JSON.stringify(observations.at(-1)));
};
