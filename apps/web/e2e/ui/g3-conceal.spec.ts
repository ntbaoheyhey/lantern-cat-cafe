import { test, expect, type Page } from '../support/test';
import { mockV2Save } from '../../src/api/mockV2Fixtures';
import { readFileSync } from 'node:fs';

const KEY = readFileSync('src/api/MockGameApiV2.ts', 'utf8').match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

async function display(page: Page) {
  return page.evaluate(() => {
    const text = (selector: string) => document.querySelector(selector)?.textContent;
    return {
      hud: text('.hud-bar'), stage: text('.stage-progress'), hint: text('[data-testid="next-hint"]'),
      character: text('#panel-Character'), bag: text('#panel-Bag'), forge: text('#panel-Forge'),
      tabs: text('.v2-tabs'), sync: text('[data-slot="sync-status"]'),
      map: Array.from(document.querySelectorAll('.v2-chapter-map [data-chapter]'), node => ({
        chapter: node.getAttribute('data-chapter'), state: node.getAttribute('data-state'), label: node.textContent,
      })),
    };
  });
}

for (const finish of ['natural', 'skip', 'hidden return', 'reduced motion', 'reduce during replay'] as const) {
  test(`G3 boss outcome is concealed app-wide; ${finish} releases once`, async ({ page }) => {
    const now = Date.now();
    await page.clock.install({ time: now });
    await page.emulateMedia({ reducedMotion: finish === 'reduced motion' ? 'reduce' : 'no-preference' });
    const save = mockV2Save('bossReadyStrong', { nowMs: now });
    await page.addInitScript(({ key, save }) => {
      localStorage.setItem(key, save);
      localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    }, { key: KEY, save: JSON.stringify(save) });
    await page.goto('/');
    await expect(page.locator('.v2-stage-canvas canvas')).toBeVisible();
    await page.getByRole('tab', { name: 'Map', exact: true }).or(page.getByRole('tab', { name: 'Boss', exact: true })).click();
    await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 50);
    const before = await display(page);
    await expect(page.getByLabel('Cat Keys 1 of 5', { exact: true })).toBeVisible();
    await expect(page.locator('.v2-chapter-map [data-chapter="2"]')).toHaveAttribute('data-state', 'locked');
    // Record each chapter release and the same DOM batch's key/map/banner state.
    await page.evaluate(() => {
      const records: { chapter: string | null; keys: string | null; map: string | null; banner: boolean }[] = [];
      let previous = document.querySelector('.hud-progress-chip')?.getAttribute('aria-label');
      const observer = new MutationObserver(() => {
        const chapter = document.querySelector('.hud-progress-chip')?.getAttribute('aria-label') ?? null;
        if (chapter === previous) return;
        previous = chapter;
        records.push({ chapter, keys: document.querySelector('[aria-label^="Cat Keys "]')?.getAttribute('aria-label') ?? null,
          map: document.querySelector('.v2-chapter-map [data-chapter="2"]')?.getAttribute('data-state') ?? null,
          banner: document.querySelector('.v2-fight-result > p')?.textContent === 'Victory!' });
      });
      observer.observe(document.querySelector('.v2-shell')!, { subtree: true, childList: true, attributes: true, characterData: true });
      (window as unknown as { __concealProbe: { records: typeof records; observer: MutationObserver } }).__concealProbe = { records, observer };
    });
    await page.getByRole('button', { name: 'Fight', exact: true }).click();
    // The server/store has already committed a win; the display must still be pre-fight.
    await expect.poll(() => page.evaluate(() => window.__g1Loop.getSnapshot().state!.progress.chapter)).toBe(2);
    if (finish !== 'reduced motion') {
      await expect(page.getByText('Boss fight in progress', { exact: true })).toBeVisible();
      expect(await display(page)).toEqual(before);
      await expect(page.getByText('Victory!', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      // Step only enough to boot the lazy arena, well before its known 740 ms ending.
      for (let frame = 0; frame < 8; frame++) await page.clock.runFor(16);
      expect(await display(page)).toEqual(before);
      if (finish === 'skip') {
        await page.getByRole('button', { name: 'Skip fight', exact: true }).evaluate(button => {
          (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click();
        });
      } else if (finish === 'hidden return') {
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.clock.runFor(2000);
        expect(await display(page)).toEqual(before);
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: false });
          Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
          document.dispatchEvent(new Event('visibilitychange'));
          document.dispatchEvent(new Event('visibilitychange'));
        });
      } else if (finish === 'reduce during replay') {
        await page.emulateMedia({ reducedMotion: 'reduce' });
      } else await page.clock.runFor(1000);
    }
    await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Cat Keys 0 of 5', { exact: true })).toBeVisible();
    await expect(page.locator('.hud-progress-chip')).toHaveAttribute('aria-label', /^Chapter 2 /);
    await expect(page.locator('.stage-progress')).toContainText('Chapter 2 · Round 1 / 10');
    await expect(page.locator('.v2-chapter-map [data-chapter="2"]')).toHaveAttribute('data-state', 'current');
    expect((await display(page)).bag).not.toBe(before.bag);
    await page.clock.runFor(1500);
    const releases = await page.evaluate(() => {
      const probe = (window as unknown as { __concealProbe: { records: unknown[]; observer: MutationObserver } }).__concealProbe;
      probe.observer.disconnect(); return probe.records;
    });
    expect(releases).toEqual([{ chapter: expect.stringMatching(/^Chapter 2 /), keys: 'Cat Keys 0 of 5', map: 'current', banner: true }]);
  });
}
