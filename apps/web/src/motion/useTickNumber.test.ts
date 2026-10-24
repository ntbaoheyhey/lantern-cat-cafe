import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as reducedMotionModule from './reducedMotion';
import { useTickNumber } from './useTickNumber';

describe('useTickNumber', () => {
  let currentTime = 1000;
  let rafIdCounter = 1;
  let rafCallbacks = new Map<number, FrameRequestCallback>();

  beforeEach(() => {
    currentTime = 1000;
    rafIdCounter = 1;
    rafCallbacks.clear();

    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      const id = rafIdCounter++;
      rafCallbacks.set(id, cb);
      return id;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      rafCallbacks.delete(id);
    });

    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function stepRAF(msAdvance: number) {
    currentTime += msAdvance;
    const callbacksToRun = Array.from(rafCallbacks.entries());
    rafCallbacks.clear();
    act(() => {
      for (const [_, cb] of callbacksToRun) {
        cb(currentTime);
      }
    });
  }

  it('returns initial rounded integer value immediately on mount', () => {
    const { result } = renderHook(() => useTickNumber(42.7));
    expect(result.current).toBe(43);
  });

  it('handles negative or zero values correctly', () => {
    const { result: rZero } = renderHook(() => useTickNumber(0));
    expect(rZero.current).toBe(0);

    const { result: rNeg } = renderHook(() => useTickNumber(-15.4));
    expect(rNeg.current).toBe(-15);
  });

  it('ticks from previous to new value with requestAnimationFrame', () => {
    const { result, rerender } = renderHook(({ val }) => useTickNumber(val, 400), {
      initialProps: { val: 100 },
    });

    expect(result.current).toBe(100);

    // Update value to 200
    rerender({ val: 200 });

    // Mid-animation at 200ms (50% progress)
    stepRAF(200);
    expect(result.current).toBe(150);

    // Finish animation at 400ms (100% progress)
    stepRAF(200);
    expect(result.current).toBe(200);

    // No further RAF scheduled once finished
    expect(rafCallbacks.size).toBe(0);
  });

  it('counts downwards when value decreases', () => {
    const { result, rerender } = renderHook(({ val }) => useTickNumber(val, 400), {
      initialProps: { val: 200 },
    });

    rerender({ val: 100 });

    // Mid-animation at 200ms
    stepRAF(200);
    expect(result.current).toBe(150);

    // End of animation
    stepRAF(200);
    expect(result.current).toBe(100);
  });

  it('returns value immediately when reduced motion is preferred', () => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);

    const { result, rerender } = renderHook(({ val }) => useTickNumber(val, 400), {
      initialProps: { val: 100 },
    });

    expect(result.current).toBe(100);

    rerender({ val: 500 });

    // Returns immediately without needing RAF ticks
    expect(result.current).toBe(500);
    expect(rafCallbacks.size).toBe(0);
  });

  it('returns value immediately when ms <= 0', () => {
    const { result, rerender } = renderHook(({ val, ms }) => useTickNumber(val, ms), {
      initialProps: { val: 100, ms: 0 },
    });

    rerender({ val: 350, ms: 0 });
    expect(result.current).toBe(350);
    expect(rafCallbacks.size).toBe(0);
  });

  it('cancels in-flight animation on unmount', () => {
    const { rerender, unmount } = renderHook(({ val }) => useTickNumber(val, 400), {
      initialProps: { val: 100 },
    });

    rerender({ val: 200 });
    expect(rafCallbacks.size).toBe(1);

    unmount();
    expect(rafCallbacks.size).toBe(0);
  });

  it('interpolates smoothly when value updates rapidly mid-animation', () => {
    const { result, rerender } = renderHook(({ val }) => useTickNumber(val, 400), {
      initialProps: { val: 0 },
    });

    // Start towards 100
    rerender({ val: 100 });
    stepRAF(200); // 50% through: value is 50
    expect(result.current).toBe(50);

    // New target 300 before finishing
    rerender({ val: 300 });

    // Next 200ms ticks from 50 towards 300: 50 + (300-50)*0.5 = 175
    stepRAF(200);
    expect(result.current).toBe(175);

    stepRAF(200);
    expect(result.current).toBe(300);
  });
});
