import { expect, test } from '@playwright/test';

test('forge tab shows the cost, odds and why forging is blocked in demo mode', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Start playing' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('tab', { name: 'Forge' }).click();

  await expect(page.getByText('60 shards + 1 Boss Key')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Relic odds' })).toContainText('Legendary');
  await expect(page.getByTestId('forge-blocked')).toContainText('Boss Key');
  await expect(page.getByRole('button', { name: 'Forge' })).toBeDisabled();

  expect(errors).toEqual([]);
});
