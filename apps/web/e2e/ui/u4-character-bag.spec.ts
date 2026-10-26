import { expect, test, type Page } from '../support/test';
import fs from 'node:fs';
import path from 'node:path';
import { sampleStateV2 } from '../../src/layout/sampleState';
import { mockV2Save } from '../../src/api/mockV2Fixtures';


const STORAGE_KEY = fs
  .readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8')
  .match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

const writeScreenshots = process.env.SCREENSHOTS === '1';
const screenshotPrefix = process.env.SCREENSHOT_PREFIX ?? 'after';
const reportsDir = path.resolve(process.cwd(), '../../reports/u4-character-bag');

test.beforeEach(async ({ page }) => {
  const sample = sampleStateV2();
  const save = mockV2Save('midGame', { nowMs: Date.now(), classId: 'warrior' });
  Object.assign(save.state, {
    classId: sample.cat.classId,
    level: sample.cat.level,
    xp: sample.cat.xp,
    ...sample.progress,
    stacks: {
      ...sample.materials,
      fish: sample.currencies.fish,
      yarn: sample.currencies.yarn,
      catKey: sample.currencies.keys,
    },
    items: sample.inventory.map((i) => ({
      ...i,
      itemId: i.itemKey,
      bonusLines: i.bonus,
      source: 'drop' as const,
    })),
  });
  await page.addInitScript(
    ({ key, save }) => {
      window.localStorage.setItem(key, save);
      window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    },
    { key: STORAGE_KEY, save: JSON.stringify(save) },
  );
});

async function noHorizontalScroll(page: Page): Promise<void> {
  const o = await page.evaluate(() => ({
    doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    body: [document.body.scrollWidth, document.body.clientWidth],
  }));
  expect(o.doc[0]).toBeLessThanOrEqual(o.doc[1]! + 1);
  expect(o.body[0]).toBeLessThanOrEqual(o.body[1]! + 1);
}

async function openInventory(page: Page, width: number): Promise<void> {
  if (width <= 600) {
    const tab = page.getByRole('navigation', { name: 'Game menu' }).getByRole('tab', { name: 'Inventory', exact: true });
    if (await tab.isVisible()) {
      await tab.click();
    }
  }
  await expect(page.getByRole('tabpanel', { name: 'Inventory', exact: true })).toBeVisible();
}

const CHECK_VIEWPORTS = [
  { name: '1280x720', width: 1280, height: 720 },
  { name: '390x844', width: 390, height: 844 },
];

for (const vp of CHECK_VIEWPORTS) {
  test(`u4 acceptance checks at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    const character = page.getByRole('region', { name: 'Character' });
    await expect(character).toBeVisible();

    // Open bag
    await openInventory(page, vp.width);
    const bag = page.getByRole('tabpanel', { name: 'Inventory', exact: true });
    await expect(bag).toBeVisible();

    // (a) every gear slot and bag tile is >= 44x44 on the phone
    if (vp.width <= 600) {
      const slotButtons = character.getByRole('button');
      const slotCount = await slotButtons.count();
      expect(slotCount).toBe(9);
      for (let i = 0; i < slotCount; i++) {
        const box = await slotButtons.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }

      const bagTiles = bag.locator('.bag-tile');
      const bagTileCount = await bagTiles.count();
      expect(bagTileCount).toBeGreaterThan(0);
      for (let i = 0; i < bagTileCount; i++) {
        const box = await bagTiles.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
    }

    // (b) each equipped slot's border color equals the computed --rarity-* of its item's rarity
    const equippedSlots = character.locator('.slot-btn.equipped');
    const equippedCount = await equippedSlots.count();
    expect(equippedCount).toBeGreaterThan(0);
    for (let i = 0; i < equippedCount; i++) {
      const slot = equippedSlots.nth(i);
      const rarity = await slot.getAttribute('data-rarity');
      expect(rarity).toBeTruthy();
      const { borderColor, expectedRarityColor } = await slot.evaluate((el, r) => {
        const style = getComputedStyle(el);
        const temp = document.createElement('div');
        temp.style.color = `var(--rarity-${r})`;
        document.body.appendChild(temp);
        const expected = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        return { borderColor: style.borderTopColor, expectedRarityColor: expected };
      }, rarity);
      expect(borderColor).toBe(expectedRarityColor);
    }

    // (c) "Equip best" button background equals --accent and its text contrast >= 4.5
    const equipBestBtn = bag.getByRole('button', { name: 'Equip best', exact: true });
    await expect(equipBestBtn).toBeVisible();
    const { bg, expectedAccent, contrast } = await equipBestBtn.evaluate((el) => {
      const style = getComputedStyle(el);
      const temp = document.createElement('div');
      temp.style.color = 'var(--accent)';
      document.body.appendChild(temp);
      const expectedAccent = getComputedStyle(temp).color;
      document.body.removeChild(temp);

      function parseRgb(str: string): [number, number, number] {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
      }

      function luminance([r, g, b]: [number, number, number]): number {
        const a = [r, g, b].map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0]! + 0.7152 * a[1]! + 0.0722 * a[2]!;
      }

      const bgRgb = parseRgb(style.backgroundColor);
      const textRgb = parseRgb(style.color);
      const l1 = Math.max(luminance(bgRgb), luminance(textRgb));
      const l2 = Math.min(luminance(bgRgb), luminance(textRgb));
      const contrastRatio = (l1 + 0.05) / (l2 + 0.05);

      return {
        bg: style.backgroundColor,
        expectedAccent,
        contrast: contrastRatio,
      };
    });
    expect(bg).toBe(expectedAccent);
    expect(contrast).toBeGreaterThanOrEqual(4.5);

    // (d) no element in the card or bag clips text (scrollWidth <= clientWidth + 1)
    const clippedElements = await page.evaluate(() => {
      const bad: { tag: string; cls: string; scrollW: number; clientW: number; text: string }[] = [];
      const elements = document.querySelectorAll('.v2-character *, .bag *');
      for (const el of elements) {
        if (el instanceof SVGElement) continue;
        if (el.scrollWidth > el.clientWidth + 1) {
          const style = window.getComputedStyle(el);
          // If the element has overflow: hidden or auto and text is overflowing, it's clipped
          if (style.overflowX === 'hidden' || style.textOverflow === 'ellipsis') {
            bad.push({
              tag: el.tagName,
              cls: el.className,
              scrollW: el.scrollWidth,
              clientW: el.clientWidth,
              text: el.textContent?.slice(0, 30) ?? '',
            });
          }
        }
      }
      return bad;
    });
    expect(clippedElements).toEqual([]);

    // (e) no horizontal overflow
    await noHorizontalScroll(page);
  });
}

test('capture screenshots', async ({ page }) => {
  if (writeScreenshots) fs.mkdirSync(reportsDir, { recursive: true });

  const viewports = [
    { w: 1600, h: 900, dark: false },
    { w: 1280, h: 720, dark: false },
    { w: 390, h: 844, dark: false },
    { w: 320, h: 568, dark: false },
    { w: 1280, h: 720, dark: true },
    { w: 390, h: 844, dark: true },
  ];

  for (const vp of viewports) {
    await page.emulateMedia({ colorScheme: vp.dark ? 'dark' : 'light' });
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto('/');
    await expect(page.getByRole('region', { name: 'Character' })).toBeVisible();
    if (vp.w > 600) {
      await expect(page.getByRole('tabpanel', { name: 'Inventory', exact: true })).toBeVisible();
    }
    const name = `${screenshotPrefix}-${vp.w}x${vp.h}${vp.dark ? '-dark' : ''}.png`;
    if (writeScreenshots) await page.screenshot({ path: path.join(reportsDir, name) });
  }

  // Bag sheet open on phone (390x844)
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openInventory(page, 390);
  if (writeScreenshots) await page.screenshot({ path: path.join(reportsDir, `${screenshotPrefix}-390x844-sheet.png`) });
});
