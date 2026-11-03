// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import * as preference from './reducedMotion';
import { MotionNumber } from './MotionNumber';
import { useMotionCue } from './useMotionCue';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('renders the full target immediately under reduced motion, including large values', () => {
  vi.spyOn(preference, 'usePrefersReducedMotion').mockReturnValue(true);
  const { rerender } = render(<MotionNumber value={1} />);
  rerender(<MotionNumber value={Number.MAX_SAFE_INTEGER} />);
  expect(screen.getByText('9,007,199,254,740,991')).toBeTruthy();
});
function Cue({ value, kind = 'level' }: { value: number; kind?: 'level' | 'loot' }) {
  const ref = useMotionCue<HTMLSpanElement>(value, kind);
  return <span ref={ref}>Value {value}</span>;
}
it('does not replay on mount or same value, cancels on replacement and preference change', () => {
  const reduced = vi.spyOn(preference, 'usePrefersReducedMotion').mockReturnValue(false);
  const cancel = vi.fn(); const animate = vi.fn((_frames: unknown, _options: unknown) => ({ cancel }));
  vi.stubGlobal('Animation', class {});
  const old = HTMLElement.prototype.animate;
  HTMLElement.prototype.animate = animate as unknown as typeof old;
  try {
    const { rerender, unmount } = render(<Cue value={1} />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<Cue value={2} />); expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0]?.[1]).toEqual({ duration: 180, easing: 'ease-out' });
    rerender(<Cue value={2} />); expect(animate).toHaveBeenCalledTimes(1);
    reduced.mockReturnValue(true); act(() => rerender(<Cue value={3} />));
    expect(cancel).toHaveBeenCalledTimes(1); expect(animate).toHaveBeenCalledTimes(1);
    unmount();
  } finally { HTMLElement.prototype.animate = old; vi.unstubAllGlobals(); }
});
