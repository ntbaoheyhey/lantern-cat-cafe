import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './reducedMotion';

export type MotionCue = 'loot' | 'level' | 'relic';
export const UI_CUE_MS = 180;

/** Presentation-only feedback for a changed authoritative value, never on initial mount. */
export function useMotionCue<T extends HTMLElement>(value: string | number | null, kind: MotionCue) {
  const element = useRef<T>(null);
  const previous = useRef(value);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const before = previous.current; previous.current = value;
    if (reduced || document.hidden || before === value || value === null || (kind === 'level' && Number(value) <= Number(before))) return;
    const node = element.current;
    if (!node?.animate) return;
    const frames = kind === 'loot'
      ? [{ transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }]
      : [{ outlineColor: 'var(--accent)', outlineOffset: '3px' }, { outlineColor: 'transparent', outlineOffset: kind === 'level' ? '8px' : '3px' }];
    const animation = node.animate(frames, { duration: UI_CUE_MS, easing: 'ease-out' });
    const hide = () => { if (document.hidden) animation.cancel(); };
    document.addEventListener('visibilitychange', hide);
    return () => { animation.cancel(); document.removeEventListener('visibilitychange', hide); };
  }, [value, kind, reduced]);
  return element;
}
