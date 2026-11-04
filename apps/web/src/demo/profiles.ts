import { MOCK_V2_STORAGE_KEY } from '../api/MockGameApiV2';
import { mockV2Save } from '../api/mockV2Fixtures';
import { closeHelp } from '../onboarding/helpStore';
import { isOfflineDemo } from './mode';

export const DEMO_PROFILES = ['tour', 'boss', 'fresh'] as const;
export type DemoProfile = typeof DEMO_PROFILES[number];
const PREFIX = 'taskbar-hero:offline-candidate:1eefc3e:';
const memory = new Map<string, string>();

/** Never overwrite a normal guest save or reuse a wallet session on this origin. */
export const offlineStorage = {
  getItem(key: string): string | null {
    try { return localStorage.getItem(PREFIX + key) ?? memory.get(key) ?? null; }
    catch { return memory.get(key) ?? null; }
  },
  setItem(key: string, value: string) {
    memory.set(key, value);
    try { localStorage.setItem(PREFIX + key, value); } catch { /* Memory-only guest. */ }
  },
  removeItem(key: string) {
    memory.delete(key);
    try { localStorage.removeItem(PREFIX + key); } catch { /* Memory-only guest. */ }
  },
};

export function currentDemoProfile(): DemoProfile {
  const value = offlineStorage.getItem('profile');
  return DEMO_PROFILES.includes(value as DemoProfile) ? value as DemoProfile : 'tour';
}

export function resetDemoProfile(profile: DemoProfile) {
  offlineStorage.removeItem(MOCK_V2_STORAGE_KEY);
  offlineStorage.setItem('profile', profile);
  if (profile !== 'fresh') {
    const options = { nowMs: Date.now() };
    const save = mockV2Save(profile === 'boss' ? 'bossReadyStrong' : 'midGame', options);
    if (profile === 'tour') {
      // Reuse rule-built fixture items so Bag has inspectable unequipped gear.
      save.state.items.push(...mockV2Save('forgeRich', options).state.items.filter(item => !item.equipped));
      save.state.bossClears['1'] = { wins: 1 };
    }
    offlineStorage.setItem(MOCK_V2_STORAGE_KEY, JSON.stringify(save));
  }
  // These are presentation preferences, not progress or authentication data.
  try {
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    localStorage.setItem('taskbar-hero:v2-last-visit', String(Date.now()));
  } catch { /* Private windows remain playable. */ }
}

export function initializeOfflineDemo() {
  if (!isOfflineDemo()) return;
  document.documentElement.dataset.offlineDemo = 'true';
  closeHelp();
  if (!offlineStorage.getItem('profile')) resetDemoProfile('tour');
  // Proof links stay inspectable, but an offline demo must not navigate to remote services.
  document.addEventListener('click', event => {
    const anchor = (event.target as Element | null)?.closest?.('a[href]');
    if (!anchor) return;
    const target = new URL(anchor.getAttribute('href')!, location.href);
    if (target.origin !== location.origin && target.protocol !== 'data:') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('offline-demo-link'));
    }
  }, true);
}
