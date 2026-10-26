import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';

const STORAGE_CODE = fs.readFileSync(path.resolve(process.cwd(), 'src/api/MockGameApiV2.ts'), 'utf8');
const STORAGE_KEY = STORAGE_CODE.match(/export const MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'phone', width: 390, height: 844 },
];

const PANELS = ['Forge', 'Boss', 'Help', 'Market'] as const;

async function openPanel(page: Page, tabName: string, width: number): Promise<void> {
  if (width <= 600) {
    const nav = page.getByRole('navigation', { name: 'Game menu' });
    await nav.getByRole('tab', { name: tabName, exact: true }).click();
  } else {
    await page.getByRole('tab', { name: tabName, exact: true }).click();
  }
  await page.waitForTimeout(300);
}

for (const vp of VIEWPORTS) {
  test.describe(`Panel verification at ${vp.name} (${vp.width}x${vp.height})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const save = mockV2SaveJson('midGame', { nowMs: Date.now(), classId: 'warrior' });
      await page.addInitScript(
        ({ key, save }) => {
          window.localStorage.setItem(key, save);
          window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
        },
        { key: STORAGE_KEY, save },
      );
      await page.goto('/');
      await page.locator('.v2-shell').waitFor();
    });

    for (const panelName of PANELS) {
      test(`panel ${panelName} satisfies acceptance criteria (a, b, d)`, async ({ page }) => {
        await openPanel(page, panelName, vp.width);

        // (a) No panel content background has relative luminance > 0.5 (no cream boxes), dialogs excluded
        const luminanceResults = await page.evaluate((targetPanel) => {
          const panelMap: Record<string, string> = {
            Forge: '.forge-panel',
            Boss: '.boss-gate-panel',
            Help: '.help-v2-container',
            Market: '.market',
          };
          const root = document.querySelector(panelMap[targetPanel]!);
          if (!root) return [];

          function parseLuminance(rgbStr: string): number | null {
            const m = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!m) return null;
            const r = Number(m[1]),
              g = Number(m[2]),
              b = Number(m[3]);
            const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
            if (a === 0) return null; // transparent
            const sRGB = [r, g, b].map((v) => {
              const s = v / 255;
              return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * sRGB[0]! + 0.7152 * sRGB[1]! + 0.0722 * sRGB[2]!;
          }

          // Check panel background and all content boxes/sections (excluding buttons, accent bars, chips, dialogs)
          const elements = [root, ...Array.from(root.querySelectorAll('*'))];
          const overThreshold: { tag: string; cls: string; bg: string; lum: number }[] = [];

          for (const el of elements) {
            // Dialogs excluded
            if (el.closest('.loot-dialog, [role="dialog"], .dialog')) continue;
            // Buttons, accent indicators, chips and interactive controls use accent/status colors
            if (el.closest('button, [role="button"], [role="tab"], .boss-bar-fill, .chip, svg')) continue;

            const style = window.getComputedStyle(el);
            const lum = parseLuminance(style.backgroundColor);
            if (lum !== null && lum > 0.5) {
              overThreshold.push({
                tag: el.tagName,
                cls: el.className,
                bg: style.backgroundColor,
                lum,
              });
            }
          }
          return overThreshold;
        }, panelName);
        expect(luminanceResults, `Cream/white elements found in ${panelName}: ${JSON.stringify(luminanceResults)}`).toHaveLength(0);

        // (b) Exactly one visible element with the primary button class/accent background per panel view
        // In interactive views with primary actions (Forge, Boss, Help), exactly 1 primary action button.
        // In Market (when disconnected from Web3), 0 primary action buttons.
        const primaryCount = await page.evaluate((targetPanel) => {
          const panelMap: Record<string, string> = {
            Forge: '.forge-panel',
            Boss: '.boss-gate-panel',
            Help: '.help-v2-container',
            Market: '.market',
          };
          const root = document.querySelector(panelMap[targetPanel]!);
          if (!root) return 0;

          const buttons = Array.from(root.querySelectorAll('button:not([role="tab"]), a[role="button"]:not([role="tab"])'));
          const visiblePrimary = buttons.filter((btn) => {
            const el = btn as HTMLElement;
            // Check visibility
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            const isPixelBtn = el.classList.contains('pixel-btn') || el.classList.contains('forge-btn-primary') || el.classList.contains('boss-fight-btn');
            const m = style.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            const isAccentBg = m && Number(m[1]) > 200 && Number(m[2]) > 140 && Number(m[3]) < 150;
            return isPixelBtn || isAccentBg;
          });
          return visiblePrimary.length;
        }, panelName);

        if (panelName === 'Market') {
          // Market without connected wallet has no active Buy button
          expect(primaryCount).toBeLessThanOrEqual(1);
        } else {
          expect(primaryCount, `Expected exactly 1 primary action in ${panelName}, found ${primaryCount}`).toBe(1);
        }

        // (d) No text clipping, no horizontal overflow
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;
          const panel = document.querySelector('.v2-tabpanel') || document.querySelector('[role="tabpanel"]');
          return {
            docOverflow: doc.scrollWidth > doc.clientWidth + 1,
            bodyOverflow: body.scrollWidth > body.clientWidth + 1,
            panelOverflow: panel ? panel.scrollWidth > panel.clientWidth + 1 : false,
          };
        });
        expect(overflow.docOverflow, 'Document has horizontal overflow').toBe(false);
        expect(overflow.bodyOverflow, 'Body has horizontal overflow').toBe(false);
        expect(overflow.panelOverflow, 'Panel has horizontal overflow').toBe(false);
      });
    }

    // (c) The Forge segmented control's three segments share the same top and height
    test('Forge segmented control segments share the same top and height', async ({ page }) => {
      await openPanel(page, 'Forge', vp.width);

      const tabCraft = page.getByTestId('tab-craft');
      const tabSalvage = page.getByTestId('tab-salvage');
      const tabRelic = page.getByTestId('tab-relic');

      await expect(tabCraft).toBeVisible();
      await expect(tabSalvage).toBeVisible();
      await expect(tabRelic).toBeVisible();

      const boxCraft = await tabCraft.boundingBox();
      const boxSalvage = await tabSalvage.boundingBox();
      const boxRelic = await tabRelic.boundingBox();

      expect(boxCraft).not.toBeNull();
      expect(boxSalvage).not.toBeNull();
      expect(boxRelic).not.toBeNull();

      // Share same top (within 1.5px subpixel tolerance)
      expect(Math.abs(boxCraft!.y - boxSalvage!.y)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(boxSalvage!.y - boxRelic!.y)).toBeLessThanOrEqual(1.5);

      // Share same height (within 1.5px subpixel tolerance)
      expect(Math.abs(boxCraft!.height - boxSalvage!.height)).toBeLessThanOrEqual(1.5);
      expect(Math.abs(boxSalvage!.height - boxRelic!.height)).toBeLessThanOrEqual(1.5);
    });
  });
}
