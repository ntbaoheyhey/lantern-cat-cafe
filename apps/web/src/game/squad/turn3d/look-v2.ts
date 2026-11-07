/** Cosmetic-only opt-in. This helper deliberately imports no renderer or assets. */
declare global { interface Window { __LOOK_V2__?: boolean } }
const eventName = 'lantern-look-v2';

export function isLookV2(): boolean {
  return typeof window !== 'undefined' && window.__LOOK_V2__ === true;
}

export function setLookV2(enabled: boolean): void {
  if (typeof window === 'undefined' || isLookV2() === enabled) return;
  window.__LOOK_V2__ = enabled;
  document.documentElement.dataset.lookV2 = String(enabled);
  window.dispatchEvent(new CustomEvent(eventName, { detail: enabled }));
}

export function subscribeLookV2(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
