import { test, expect, load, tab, inspect } from '../support/server-fixture';

for (const size of [{ width: 1280, height: 720 }, { width: 1600, height: 900 }]) {
  test(`CXU4 unreachable class API preserves state and shows durable failure at ${size.width}`, async ({ page, request }) => {
    await page.setViewportSize(size);
    const session = await load(page, request, 'stocked');
    const before = await inspect(request, session);
    const hero = await tab(page, 'Hero');
    await page.route('**/functions/v1/v2-choose-class', route => route.abort('connectionrefused'));
    await hero.getByRole('button', { name: 'Change class', exact: true }).click();
    await page.getByLabel('Cat class').selectOption('archer');
    await page.getByRole('button', { name: 'Confirm class', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Change class' });
    await expect(dialog.getByRole('alert')).toHaveText('Class change did not go through. Try again.');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(hero.getByTestId('action-notice')).toHaveAttribute('data-tone', 'offline');
    await expect(hero.getByTestId('action-notice')).toHaveText('You are offline. Your cat keeps working; we will sync when you are back.');
    await page.clock.fastForward(60_000);
    await expect(page.getByRole('alert')).toHaveText('FailedClass change did not go through. Try again.×');
    const after = await inspect(request, session);
    expect(after.raw.classId).toBe(before.raw.classId);
    expect(after.actions.filter(action => action.route === 'v2-choose-class')).toEqual(before.actions.filter(action => action.route === 'v2-choose-class'));
    await page.getByRole('button', { name: 'Dismiss Class change did not go through. Try again.' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}
