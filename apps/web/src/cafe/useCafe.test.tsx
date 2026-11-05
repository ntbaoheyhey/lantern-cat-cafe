import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CONFIG } from '@taskbar-hero/game-rules';
import { actCafe, advanceCafe, createCafe } from '@taskbar-hero/game-rules/client/cafe';
import { CAFE_SAVE_KEY } from './save';
import { useCafe } from './useCafe';
let hidden = false;
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.setSystemTime(1_800_000_000_000); hidden = false; Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden }); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); delete (document as any).hidden; });
const visibility = (value: boolean) => act(() => { hidden = value; document.dispatchEvent(new Event('visibilitychange')); });
it('pauses hidden battle simulation, grants capped patches once on return, and persists it', () => {
  const s = actCafe(advanceCafe(createCafe(), 140), { type: 'fight' });
  localStorage.setItem(CAFE_SAVE_KEY, JSON.stringify({ state: s, lastSeen: Date.now() }));
  const { result } = renderHook(() => useCafe(true));
  visibility(true); act(() => vi.advanceTimersByTime(86_400_000));
  expect(result.current.state.boss).toEqual(s.boss); expect(result.current.state.seconds).toBe(s.seconds);
  visibility(false); expect(result.current.away).toEqual({ credited: CONFIG.cafe.away.capSeconds, patches: CONFIG.cafe.away.maxPatches });
  const patches = result.current.state.patches; visibility(false); expect(result.current.state.patches).toBe(patches);
  expect(JSON.parse(localStorage.getItem(CAFE_SAVE_KEY)!).state.patches).toBe(patches);
  act(() => vi.advanceTimersByTime(1000)); expect(result.current.state.boss!.elapsed).toBe(s.boss!.elapsed + 1);
});
it('survives reload without granting the same absence twice and does not tick when inactive', () => {
  const s = createCafe(); localStorage.setItem(CAFE_SAVE_KEY, JSON.stringify({ state: s, lastSeen: Date.now() - 600_000 }));
  const first = renderHook(() => useCafe(true)); expect(first.result.current.away?.patches).toBe(5); first.unmount();
  const second = renderHook(({ active }) => useCafe(active), { initialProps: { active: true } });
  expect(second.result.current.away).toBeNull(); expect(second.result.current.state.patches).toBe(s.patches + 5);
  second.rerender({ active: false }); const seconds = second.result.current.state.seconds;
  act(() => vi.advanceTimersByTime(10_000)); expect(second.result.current.state.seconds).toBe(seconds);
});
it('falls back to memory when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota'); });
  const { result } = renderHook(() => useCafe(true)); expect(result.current.saveError).toContain('unavailable');
  act(() => vi.advanceTimersByTime(8000)); expect(result.current.state.encounters).toBe(1);
});
it('can undo a tour immediately and retains the pre-tour kit, collections and progress', () => {
  const s = createCafe(); s.clears = [1, 2, 3]; s.chapter = 3;
  localStorage.setItem(CAFE_SAVE_KEY, JSON.stringify({ state: s, lastSeen: Date.now() }));
  const { result } = renderHook(() => useCafe(true)); act(() => result.current.dispatch({ type: 'tour' }));
  expect(result.current.state.tours).toBe(1); expect(result.current.canUndo).toBe(true);
  act(() => result.current.undoTour()); expect(result.current.state).toEqual(s); expect(result.current.canUndo).toBe(false);
});

it('preserves the beginning of an absence across repeated hide and pagehide events', () => {
  const { result } = renderHook(() => useCafe(true));
  const start = Date.now(); visibility(true);
  act(() => vi.advanceTimersByTime(300_000)); visibility(true);
  act(() => window.dispatchEvent(new Event('pagehide')));
  expect(JSON.parse(localStorage.getItem(CAFE_SAVE_KEY)!).lastSeen).toBe(start);
  act(() => vi.advanceTimersByTime(300_000)); visibility(false);
  expect(result.current.away).toEqual({ credited: 600, patches: 5 });
});
