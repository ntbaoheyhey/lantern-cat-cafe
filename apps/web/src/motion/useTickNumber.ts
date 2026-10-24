import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './reducedMotion';

/**
 * Counts smoothly from the previous to the new value over `ms` milliseconds
 * using requestAnimationFrame and returns the integer to display.
 * Returns the target value immediately when reduced motion is preferred or ms <= 0.
 */
export function useTickNumber(value: number, ms: number = 400): number {
  const prefersReducedMotion = usePrefersReducedMotion();
  const target = Number.isFinite(value) ? Math.round(value) : 0;

  const [displayValue, setDisplayValue] = useState(target);
  const displayRef = useRef(displayValue);
  displayRef.current = displayValue;

  const prevTargetRef = useRef(target);

  useEffect(() => {
    // When reduced motion is preferred or ms <= 0, immediately sync display value
    if (prefersReducedMotion || ms <= 0) {
      setDisplayValue(target);
      prevTargetRef.current = target;
      return;
    }

    // Do nothing if target hasn't changed
    if (prevTargetRef.current === target) {
      return;
    }

    const startVal = displayRef.current;
    const endVal = target;
    prevTargetRef.current = target;

    if (startVal === endVal) {
      return;
    }

    const getNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const startTime = getNow();
    let rafId: number;

    const tick = (now: number) => {
      const currentTime = typeof now === 'number' && now > 0 ? now : getNow();
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / ms));
      const current = Math.round(startVal + (endVal - startVal) * progress);

      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
      }
    };
  }, [target, ms, prefersReducedMotion]);

  if (prefersReducedMotion || ms <= 0) {
    return target;
  }

  return displayValue;
}
