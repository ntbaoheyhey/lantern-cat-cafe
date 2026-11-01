import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { statSync, writeFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const { chromium, expect } = createRequire(resolve(root, 'apps/web/package.json'))('@playwright/test');
const browser = await chromium.launch({ headless: true });
const observations = [];
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(pathToFileURL(resolve(root, 'docs/proposals/rune-skill-system/demo/index.html')).href);
    await page.locator(`[data-w="${viewport.width}"]`).click();
    await expect(page.locator('#pause')).toBeChecked();
    const screens = await page.locator('nav [data-act="go"]').evaluateAll(buttons => buttons.map(button => button.dataset.k));
    for (const screen of screens) {
      await page.locator(`nav [data-k="${screen}"]`).click();
      await expect(page.locator(`nav [data-k="${screen}"]`)).toHaveAttribute('aria-current', 'page');
      assert((await page.locator('main').innerText()).length > 0);
    }
    await page.locator('nav [data-k="pets"]').click();
    await expect(page.getByRole('heading', { name: 'Companions', exact: true })).toBeVisible();
    await expect(page.locator('.node.on')).toHaveCount(2);
    const lockedBefore = await page.locator('[data-act="adopt"]:disabled').count();
    assert(lockedBefore > 0);
    const screenshots = [];
    async function capture(state) {
      const path = resolve(root, `reports/scorecard/cxp1/demo-${viewport.width}x${viewport.height}-${state}.png`);
      await page.screenshot({ path });
      const bytes = statSync(path).size;
      assert(bytes < 200_000, `Screenshot too large: ${bytes}`);
      screenshots.push({ path: path.slice(root.length + 1), bytes });
    }
    if (process.env.SCREENSHOTS === '1') await capture('initial');
    const treat = page.locator('[data-act="feed"]').first();
    const treatCard = treat.locator('xpath=ancestor::div[contains(@class,"node")]');
    const levelBefore = await treatCard.locator('.pill').innerText();
    await treat.focus();
    await page.keyboard.press('Enter');
    const levelAfter = await treatCard.locator('.pill').innerText();
    assert.notEqual(levelAfter, levelBefore);
    const toggle = page.locator('[data-act="peq"]').first();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.node.on')).toHaveCount(1);
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.node.on')).toHaveCount(2);
    const goalsBefore = await page.locator('.node .num').allTextContents();
    await page.locator('[data-act="hunt"]').click();
    const goalsAfter = await page.locator('.node .num').allTextContents();
    assert.notDeepEqual(goalsAfter, goalsBefore);
    // The first hunt demonstrates progress, but may not cross a locked goal.
    // Continue using the demo's visible simulator until a pet can be adopted.
    let hunts = 1;
    while (await page.locator('[data-act="adopt"]:enabled').count() === 0 && hunts < 20) {
      await page.locator('[data-act="hunt"]').click();
      hunts++;
    }
    const adopt = page.locator('[data-act="adopt"]:enabled').first();
    await expect(adopt).toBeVisible();
    const adoptedId = await adopt.getAttribute('data-id');
    await adopt.click();
    const third = page.locator(`[data-act="peq"][data-id="${adoptedId}"]`);
    await expect(third).toHaveText('Equip');
    await third.click();
    await expect(third).toHaveText('Unequip');
    await expect(page.locator('.node.on')).toHaveCount(2);
    if (process.env.SCREENSHOTS === '1') await capture('after');
    assert.deepEqual(errors, []);
    observations.push({ viewport, screens, lockedBefore, goalsBefore, goalsAfter, levelBefore, levelAfter,
      hunts, keyboardTreatAndToggle: true, demoThirdEquipReplacesOldest: true, reducedMotionPaused: true, errors, screenshots });
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync(resolve(root, 'reports/scorecard/cxp1/demo-review.json'), JSON.stringify(observations, null, 2) + '\n');
console.log(JSON.stringify(observations, null, 2));
