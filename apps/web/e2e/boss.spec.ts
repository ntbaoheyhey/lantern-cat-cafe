import { expect, test } from './support/test';

test('boss tab fights, replays the log and shows the outcome', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Start playing' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('tab', { name: 'Boss' }).click();
  await expect(page.getByTestId('boss-attempts')).toHaveText('5');

  await page.getByRole('button', { name: 'Fight', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Fighting…' })).toBeDisabled();
  await expect(page.getByRole('progressbar', { name: 'Mochi health' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();

  await expect(page.getByTestId('boss-outcome')).toBeVisible();
  await expect(page.getByTestId('boss-attempts')).toHaveText('4');
  await expect(page.getByRole('button', { name: 'Fight', exact: true })).toBeEnabled();

  expect(errors).toEqual([]);
});
