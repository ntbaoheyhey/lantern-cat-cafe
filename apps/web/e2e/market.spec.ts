import { expect, test } from './support/test';

test('market tab asks for a wallet when none is connected', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Start playing' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('tab', { name: 'Market' }).click();

  await expect(page.getByText('Connect your wallet to see your Relics and the market.')).toBeVisible();

  expect(errors).toEqual([]);
});
