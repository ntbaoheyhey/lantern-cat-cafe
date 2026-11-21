import { test, expect } from '@playwright/test';

const url = '/?demo&squad=1';
test('explicit legacy routes keep the squad prototype and its render chunks unloaded', async ({ page }) => {
  const loaded: string[] = []; page.on('request', r => loaded.push(r.url()));
  const scripts: Promise<string>[] = [];
  page.on('response', r => { if (r.status() === 200 && /\/assets\/.*\.js(?:\?|$)/.test(r.url())) scripts.push(r.text()); });
  await page.goto('/?demo&legacy=1');
  await expect(page.getByRole('heading', { name: 'Lantern Cat Café', level: 1, includeHidden: true })).toBeVisible();
  await expect(page.getByTestId('squad-prototype')).toHaveCount(0);
  expect(loaded.some(u => /SquadApp|SquadScene|art\/squad/.test(u))).toBe(false);
  // Entry chunks can be renamed by the bundler; inspect actually requested code,
  // not only filenames. The squad UI marker must be absent from the off graph.
  expect((await Promise.all(scripts)).some(s => s.includes('squad-prototype'))).toBe(false);
  await page.goto('/?squad=1&legacy=1');
  await expect(page.getByRole('heading', { name: 'Lantern Cat Café', level: 1, includeHidden: true })).toBeVisible();
  await expect(page.getByTestId('squad-prototype')).toHaveCount(0);
  expect((await Promise.all(scripts)).some(s => s.includes('squad-prototype'))).toBe(false);
});

test('a local fight never writes storage or contacts a game API', async ({ page }) => {
  await page.addInitScript(() => {
    Object.assign(window, { squadStorageWrites: [] as string[] });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) { (window as unknown as { squadStorageWrites: string[] }).squadStorageWrites.push(key); return original.call(this, key, value); };
  });
  const requests: string[] = []; page.on('request', r => { if (r.method() !== 'GET' || /\/functions\/|\/api\/|supabase|wallet/i.test(r.url())) requests.push(r.url()); });
  // An exception in a controller listener stops the fight's frame loop, so fail on it directly.
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(url); await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  // The run clock follows rendered frames; a loaded CI runner can render far
  // fewer than 60 fps, so assert that the local fight advanced, not its speed.
  await expect(page.locator('.sq-hud')).toContainText(/Run time [1-9]\.[0-9]s/, { timeout: 30000 });
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { squadStorageWrites: string[] }).squadStorageWrites)).toEqual([]);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator('.sq-prototype')).toHaveText('Prototype - Squad Combat. Candidate build, not live.');
});

for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  test(`eight foes, arena and all ultimate buttons fit ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size); await page.goto(url);
    await page.getByRole('button', { name: 'Training', exact: true }).click();
    await expect(page.locator('.sq-targets button')).toHaveCount(8);
    await expect(page.locator('canvas')).toHaveCount(1);
    for (const button of await page.locator('.sq-ultimate').all()) {
      const box = await button.boundingBox(); expect(box).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height); expect(box!.x).toBeGreaterThanOrEqual(0);
    }
    const canvas = await page.locator('canvas').boundingBox();
    expect(canvas!.y + canvas!.height).toBeLessThan(size.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
  });
}

test('target buttons and inspect dialog are keyboard reachable; logs start closed', async ({ page }) => {
  await page.goto(url);
  const target = page.locator('.sq-targets button').last(); await target.focus(); await page.keyboard.press('Enter');
  await expect(target).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.sq-footer details')).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Mochi' }).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Mochi' })).toBeFocused();
});

test('reduced motion starts calm while retaining zones and controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto(url);
  await expect(page.getByRole('checkbox', { name: /Calm effects/ })).toBeChecked();
  await page.getByRole('button', { name: 'Start encounter', exact: true }).click();
  await expect(page.locator('.sq-danger')).toContainText(/Spool Charge|Mochi holds/, { timeout: 10000 });
  await expect(page.locator('canvas')).toBeVisible();
});

test('production excludes the opt-in development controls and review hook', async ({ page }) => {
  await page.goto(url + '&squadDebug=1');
  await expect(page.locator('.sq-debug')).toHaveCount(0);
  expect(await page.evaluate(() => '__squadReview' in window)).toBe(false);
});
