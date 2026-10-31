import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '../support/test';
import { mockV2SaveJson } from '../../src/api/mockV2Fixtures';
import manifest from '../../tools/screen-manifest.json' with { type: 'json' };
import { smokeShell } from '../../tools/shell-smoke';
import { layoutFindings } from '../../tools/layout-findings.mjs';

const storageKey = readFileSync(new URL('../../src/api/MockGameApiV2.ts', import.meta.url), 'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)![1]!;
const stub = readFileSync(new URL('../fixtures/redesign-shell.html', import.meta.url), 'utf8');
const missingContract = 'AGR0 shell contract is not implemented on this build: data-testid="rail" is absent. Re-run this same test after the shell lands; partial shells fail.';

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}
async function openStub(page: Page) {
  await page.route('**/__cxr0_shell_fixture__/', route => route.fulfill({ contentType: 'text/html', body: stub }));
  await page.goto('/__cxr0_shell_fixture__/');
}

for (const viewport of manifest.viewports) {
  test.describe(`redesign shell ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });
    test('live rail route smoke (auto-gated until AGR0)', async ({ page }) => {
      const errors = collectErrors(page);
      await page.addInitScript(({ key, save }) => {
        localStorage.setItem(key, save);
        localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
      }, { key: storageKey, save: mockV2SaveJson('bossReadyStrong', { nowMs: Date.now(), classId: 'warrior' }) });
      await page.goto('/');
      await expect(page.locator('[data-testid="rail"], .v2-shell').first()).toBeVisible();
      await expect(page.locator('[data-testid="hud"], [aria-label="Cat status"]').first()).toBeVisible();
      expect(errors, 'Startup errors must not be hidden by the selector gate').toEqual([]);
      // The mission explicitly authorizes this one conditional skip, never an unconditional skip.
      test.skip(await page.getByTestId(manifest.shell.railTestId).count() === 0, missingContract);
      await smokeShell(page, errors);
    });

    test('the same route smoke passes an independent local contract stub', async ({ page }) => {
      const errors = collectErrors(page);
      await openStub(page);
      await smokeShell(page, errors);
    });

    test('geometry detects page scroll, overflow and sibling overlap without flagging containers', async ({ page }) => {
      await openStub(page);
      const clean = await page.evaluate(layoutFindings);
      expect(clean.documentScroll).toBe(false);
      expect(clean.horizontalOverflow).toEqual([]);
      expect(clean.elementOverlap).toEqual([]);
      await page.evaluate(() => {
        const first = document.createElement('button'), second = document.createElement('button');
        first.id = 'audit-first'; second.id = 'audit-second';
        for (const button of [first, second]) {
          button.textContent = 'Probe';
          button.style.cssText = 'position: absolute; left: 300px; top: 200px; width: 100px; height: 50px';
          document.body.append(button);
        }
        const wide = document.createElement('div');
        wide.style.cssText = 'position: absolute; left: 0; top: 500px; width: 200vw; height: 120vh';
        document.body.append(wide);
      });
      const broken = await page.evaluate(layoutFindings);
      expect(broken.documentScroll).toBe(true);
      expect(broken.horizontalOverflow.length).toBeGreaterThan(0);
      expect(broken.elementOverlap).toContainEqual({ first: 'audit-first', second: 'audit-second', width: 100, height: 50 });
    });
  });
}
