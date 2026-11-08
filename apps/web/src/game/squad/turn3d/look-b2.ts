/** Presentation comparison only; never changes rules, event data or action time. */
import { isLookV2 } from './look-v2';
declare global { interface Window { __LOOK_B2__?: boolean } }
const event = 'lantern-readable-battle';
export const isReadableBattle = () => isLookV2() && window.__LOOK_B2__ !== false;
export function setReadableBattle(value: boolean) {
  window.__LOOK_B2__ = value;
  document.documentElement.dataset.lookB2 = String(value);
  window.dispatchEvent(new Event(event));
}
export function subscribeReadableBattle(listener: () => void) {
  window.addEventListener(event, listener);
  return () => window.removeEventListener(event, listener);
}
