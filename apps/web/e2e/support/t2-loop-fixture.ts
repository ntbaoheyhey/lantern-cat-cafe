import fs from 'node:fs';
import path from 'node:path';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import type { Page } from './test';

export const T2_NOW = Date.UTC(2026, 9, 27, 0);
const KEY = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

/** Stocked demo profile, unchosen class, L1/ch1/r1. No progress is injected after load.
 * Catalog gear/materials use the existing fixture builder, counter=0 and demo seed=1.
 * This covers the player actions without depending on random idle gear drops or balance sign-off.
 */
export async function installT2LoopFixture(page: Page) {
  const save = mockV2Save('forgeRich', { nowMs: T2_NOW, classId: 'warrior' });
  const gear = mockV2Save('bossReadyStrong', { nowMs: T2_NOW, classId: 'warrior' });
  save.state.classId = null;
  save.state.items = [
    ...gear.state.items.map(item => ({ ...item, equipped: false })),
    ...save.state.items.filter(item => item.source !== 'starter'),
  ];
  save.state.stacks.catKey = 0;
  save.state.stacks.moonPearl = 1;
  save.state.lastDailyKeyDay = '2026-10-27';
  await page.clock.install({ time: T2_NOW });
  await page.clock.pauseAt(T2_NOW);
  await page.addInitScript(({ key, save }) => {
    // Seed once: reload must read the player's saved mutations.
    if (localStorage.getItem(key) === null) localStorage.setItem(key, save);
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, { key: KEY, save: JSON.stringify(save) });
}
