import { afterEach, expect, it, vi } from 'vitest';
import { startWithVisibilityCleanup } from './managedGame';

const events = () => {
  let destroy = () => {};
  return { once: vi.fn((_event: string, callback: () => void) => { destroy = callback; }), destroy: () => destroy() };
};
afterEach(() => { window.onblur = null; window.onfocus = null; vi.restoreAllMocks(); });

it('removes only its own visibility listeners through repeated mount/destroy cycles', () => {
  const originalAdd = document.addEventListener;
  const outside = vi.fn();
  document.addEventListener('visibilitychange', outside);
  const own = vi.fn();
  const priorBlur = vi.fn();
  const priorFocus = vi.fn();
  window.onblur = priorBlur;
  window.onfocus = priorFocus;
  for (let i = 0; i < 4; i++) {
    const emitter = events();
    startWithVisibilityCleanup({ events: emitter } as unknown as Parameters<typeof startWithVisibilityCleanup>[0], () => {
      document.addEventListener('visibilitychange', own, false);
      window.onblur = own;
      window.onfocus = own;
    });
    expect(document.addEventListener).toBe(originalAdd);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(own).toHaveBeenCalledTimes(i + 1);
    emitter.destroy();
    expect(window.onblur).toBe(priorBlur);
    expect(window.onfocus).toBe(priorFocus);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(own).toHaveBeenCalledTimes(i + 1);
  }
  expect(outside).toHaveBeenCalledTimes(8);
  document.removeEventListener('visibilitychange', outside);
});

it('restores registration even if startup throws and preserves a later focus owner', () => {
  const emitter = events();
  const originalAdd = document.addEventListener;
  const owned = vi.fn();
  expect(() => startWithVisibilityCleanup({ events: emitter } as unknown as Parameters<typeof startWithVisibilityCleanup>[0], () => {
    document.addEventListener('visibilitychange', owned);
    window.onfocus = owned;
    throw new Error('boot failed');
  })).toThrow('boot failed');
  expect(document.addEventListener).toBe(originalAdd);
  const later = vi.fn();
  window.onfocus = later;
  emitter.destroy();
  document.dispatchEvent(new Event('visibilitychange'));
  expect(owned).not.toHaveBeenCalled();
  expect(window.onfocus).toBe(later);
});

it('does not restore a destroyed stage handler after an overlapping arena retires', () => {
  const original = vi.fn();
  window.onfocus = original;
  const stage = events();
  const arena = events();
  startWithVisibilityCleanup({ events: stage } as unknown as Parameters<typeof startWithVisibilityCleanup>[0], () => { window.onfocus = vi.fn(); });
  startWithVisibilityCleanup({ events: arena } as unknown as Parameters<typeof startWithVisibilityCleanup>[0], () => { window.onfocus = vi.fn(); });
  stage.destroy();
  arena.destroy();
  expect(window.onfocus).toBe(original);
});
