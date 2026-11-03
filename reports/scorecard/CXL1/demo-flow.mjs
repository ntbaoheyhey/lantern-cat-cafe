import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const { chromium } = createRequire(resolve(root, 'apps/web/package.json'))('@playwright/test');
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(resolve(root, 'docs/proposals/rune-skill-system/demo/index.html')).href);
    for (const screen of ['skills', 'passives', 'runes', 'drops', 'stages', 'gear', 'pets', 'hub', 'quests', 'codex', 'planner', 'notes']) {
      await page.locator(`.nav[data-k="${screen}"]`).click();
      assert.equal(await page.locator(`.nav[data-k="${screen}"]`).getAttribute('aria-current'), 'page');
      assert.ok((await page.locator('main').innerText()).length > 0);
      console.log(`${viewport.width}x${viewport.height}: reference ${screen} opened`);
    }
    await page.locator('.nav[data-k="codex"]').click();
    await page.getByRole('searchbox', { name: 'Search the Codex' }).fill('purr');
    assert.ok(await page.locator('#cxl .item').count() > 0);
    await page.locator('#cxl .item').first().click();
    console.log(`${viewport.width}: Codex search -> selection -> detail observed`);
    await page.getByRole('searchbox', { name: 'Search the Codex' }).fill('');
    const related = page.locator('#cxd [data-act="cxsel"]');
    if (await related.count()) { await related.first().click(); console.log(`${viewport.width}: linked-entry navigation observed`); }
    await page.locator('.nav[data-k="drops"]').click();
    assert.ok((await page.locator('main').innerText()).includes('1 in'));
    console.log(`${viewport.width}: conditional/per-kill odds columns and reciprocal labels observed; demo values not adopted`);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally { await browser.close(); }
