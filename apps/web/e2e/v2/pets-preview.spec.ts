import { expect, test, type Page } from '../support/test';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { mockV2SaveJson, type MockV2Save } from '../../src/api/mockV2Fixtures';
import { v2 } from '@taskbar-hero/game-rules';
import type { PetsState } from '../../src/pets/state';
import { PET_DEFS, PET_KILL_TARGET } from '../../../../packages/game-rules/src/v2/meta/pets/index';

const now = Date.parse('2026-11-01T00:00:00Z');
const empty = { version: 1, killCounts: {}, equipped: [] };
// Read the key without importing browser-only chain/JSON modules in Node.
const MOCK_V2_STORAGE_KEY = readFileSync(resolve('src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const previewSource = readFileSync(resolve('src/pets/state.ts'), 'utf8');
const PETS_STORAGE_KEY = previewSource.match(/export const PETS_STORAGE_KEY = '([^']+)'/)![1]!;
const PETS_LEGACY_STORAGE_KEY = previewSource.match(/export const PETS_LEGACY_STORAGE_KEY = '([^']+)'/)![1]!;

async function readPreview(page: Page): Promise<PetsState | null> {
  return page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }, PETS_STORAGE_KEY);
}

async function start(page: Page, preview: string | null = null, legacy = false) {
  await page.clock.install({ time: now });
  await page.addInitScript(({ gameKey, save, previewKey, preview }) => {
    if (!sessionStorage.getItem('cxp1-seeded')) {
      localStorage.setItem(gameKey, save);
      if (preview !== null) localStorage.setItem(previewKey, preview);
      sessionStorage.setItem('cxp1-seeded', '1');
    }
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    localStorage.setItem('taskbar-hero:v2-last-visit', String(Date.now()));
  }, {
    gameKey: MOCK_V2_STORAGE_KEY, save: mockV2SaveJson('midGame', { nowMs: now, classId: 'witch' }),
    previewKey: legacy ? PETS_LEGACY_STORAGE_KEY : PETS_STORAGE_KEY, preview,
  });
  await page.goto('/');
  await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
}

for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test.describe(`local pet preview ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    const diagnostics = new WeakMap<Page, string[]>();
    test.beforeEach(({ page }) => {
      const errors: string[] = [];
      diagnostics.set(page, errors);
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    });
    test.afterEach(({ page }) => { expect(diagnostics.get(page)).toEqual([]); });

    test('counts acknowledged idle claims and persists through reload', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await start(page);
      await expect.poll(() => readPreview(page)).toEqual(empty);
      await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
      const before: MockV2Save = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), MOCK_V2_STORAGE_KEY);
      // Advance the existing 30-second claim timer; no test-only gameplay API.
      await page.clock.fastForward(10 * 60_000);
      await expect.poll(async () => (await readPreview(page))?.killCounts[PET_KILL_TARGET] ?? 0).toBeGreaterThan(0);
      const credited = await readPreview(page);
      const after: MockV2Save = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), MOCK_V2_STORAGE_KEY);
      const chapter = v2.CHAPTERS.find(entry => entry.index === before.state.chapter)!;
      expect(after.state.chapter).toBe(before.state.chapter);
      expect(credited?.killCounts[PET_KILL_TARGET]).toBe(
        (after.state.round - before.state.round) * chapter.killsPerRound + after.state.kills - before.state.kills,
      );
      await page.reload();
      await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
      await expect.poll(() => readPreview(page)).toEqual(credited);
      expect(errors).toEqual([]);
      if (process.env.SCREENSHOTS === '1') {
        await expect(page.getByRole('region', { name: 'Game stage' }).locator('canvas')).toBeVisible();
        await page.screenshot({ path: resolve(process.env.SCREENSHOT_DIR ?? '../../reports/cxp1', `home-${viewport.width}x${viewport.height}.png`) });
      }
    });

    test('corrupt local preview falls back to empty without breaking Home', async ({ page }) => {
      await start(page, '{');
      await expect.poll(() => readPreview(page)).toEqual(empty);
      await page.reload();
      await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
      await expect.poll(() => readPreview(page)).toEqual(empty);
    });

    test('migrates v0 progress and two equipped previews into the versioned key', async ({ page }) => {
      // DEMO_PREVIEW fixture values derive from the preview registry, not game balance.
      const kills = PET_DEFS[1]!.unlock.count;
      const equipped = PET_DEFS.slice(0, 2).map(pet => pet.id);
      const legacy = JSON.stringify({ version: 0, kills, equipped });
      await start(page, legacy, true);
      await expect.poll(() => readPreview(page)).toEqual({ version: 1, killCounts: { [PET_KILL_TARGET]: kills }, equipped });
      expect(await page.evaluate(key => localStorage.getItem(key), PETS_LEGACY_STORAGE_KEY)).toBe(legacy);
      await page.reload();
      await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
      await expect.poll(() => readPreview(page)).toEqual({ version: 1, killCounts: { [PET_KILL_TARGET]: kills }, equipped });
      expect(await page.evaluate(key => localStorage.getItem(key), PETS_LEGACY_STORAGE_KEY)).toBe(legacy);
    });

    test('recovers corrupt current data without resurrecting the legacy selection', async ({ page }) => {
      const legacy = JSON.stringify({ version: 0, kills: PET_DEFS[1]!.unlock.count, equipped: PET_DEFS.slice(0, 2).map(pet => pet.id) });
      await page.addInitScript(({ key, legacy }) => localStorage.setItem(key, legacy), { key: PETS_LEGACY_STORAGE_KEY, legacy });
      await start(page, '{');
      await expect.poll(() => readPreview(page)).toEqual(empty);
      await page.reload();
      await expect(page.getByRole('tabpanel', { name: 'Home', exact: true })).toBeVisible();
      await expect.poll(() => readPreview(page)).toEqual(empty);
      expect(await page.evaluate(key => localStorage.getItem(key), PETS_LEGACY_STORAGE_KEY)).toBe(legacy);
    });
  });
}
