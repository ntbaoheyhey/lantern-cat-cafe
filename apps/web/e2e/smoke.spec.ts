import { expect, test } from './support/test';

test('strip renders a canvas and the panel opens and closes', async ({ page }) => {
  const initialViewport = page.viewportSize();
  expect(initialViewport).not.toBeNull();
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Start playing' }).click();
  await expect(page.getByRole('heading', { name: 'Lantern Cat Café' })).toBeVisible();

  const canvas = page.locator('.strip canvas');
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(94);
  expect(box?.height).toBeLessThanOrEqual(96);
  expect(box?.width).toBe(initialViewport!.width);

  const gold = page.getByTestId('gold-counter');
  const readGold = async () => Number(((await gold.textContent()) ?? '').replace(/[^0-9]/g, ''));
  const before = await readGold();
  await page.waitForTimeout(3000);
  expect(await readGold()).toBeGreaterThan(before);

  await page.setViewportSize({ width: 800, height: 400 });
  await expect.poll(async () => (await canvas.boundingBox())?.width).toBe(800);

  const panel = page.getByRole('region', { name: 'Game panel' });
  await expect(panel).toHaveCount(0);
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(panel).toBeVisible();
  for (const name of ['Hero', 'Inventory', 'Boss', 'Forge', 'Market']) {
    await expect(page.getByRole('tab', { name })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(panel).toHaveCount(0);

  expect(errors).toEqual([]);
});
