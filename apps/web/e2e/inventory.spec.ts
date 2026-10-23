import { expect, test } from '@playwright/test';

test('inventory tab equips a demo item and the power goes up', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/?demo');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('tab', { name: 'Inventory' }).click();
  await expect(page.getByTestId('demo-note')).toHaveText('Demo mode, sign in to save progress.');

  const power = page.getByTestId('inventory-power');
  await expect(power).toBeVisible();
  const before = Number(await power.textContent());

  await page.getByRole('button', { name: 'Equip epic helm, level 2' }).click();
  await expect.poll(async () => Number(await power.textContent())).toBeGreaterThan(before);
  await expect(page.getByRole('button', { name: 'Equip epic helm, level 2' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Hero' }).click();
  await expect.poll(async () => Number(await page.getByTestId('hero-power').textContent())).toBeGreaterThan(before);

  expect(errors).toEqual([]);
});
