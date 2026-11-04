/** Whether the How to play dialog is open. Opens by itself until the player dismisses it once. */
const KEY = 'taskbar-hero.howToPlaySeen';
const listeners = new Set<() => void>();

function seen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let open = !seen();
let automatic = true;
export const isAutomaticHelp = () => automatic;

export const getHelpOpen = (): boolean => open;

export function subscribeHelp(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set(next: boolean): void {
  if (next === open) return;
  open = next;
  listeners.forEach((fn) => fn());
}

export function openHelp(): void {
  automatic = false;
  set(true);
  listeners.forEach((fn) => fn());
}

export function closeHelp(): void {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    /* shows again next visit; still closes now */
  }
  set(false);
}

/** Tests: re-read localStorage as if the page had just loaded. */
export function resetHelpForTests(): void {
  open = !seen();
  automatic = true;
  listeners.forEach((fn) => fn());
}
