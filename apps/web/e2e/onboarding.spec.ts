import { expect, test } from './support/test';

test('first visit shows How to play; closing it reveals the game and it stays closed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'How to play' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: 'Start playing' }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByTestId('next-hint')).toContainText('Try the boss (5 fights left today)');
  await page.getByRole('button', { name: /Try the boss/ }).click();
  await expect(page.getByRole('tab', { name: 'Boss' })).toHaveAttribute('aria-selected', 'true');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Taskbar Hero' })).toBeVisible();
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);

  expect(errors).toEqual([]);
});
