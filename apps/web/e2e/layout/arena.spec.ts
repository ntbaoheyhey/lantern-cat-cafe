import { expect, test } from '@playwright/test';
for (const width of [390, 1280]) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`boss arena ${width}px ${reducedMotion}`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
    await page.emulateMedia({ reducedMotion });
    await page.goto('/?dev=arena&fixture=ch1-loss');
    await expect(page.getByRole('heading', { name: 'Boss arena preview' })).toBeVisible();
    await expect(page.locator('.boss-arena canvas')).toBeVisible();
    await expect(page.getByLabel('Fight health')).toContainText('Cat HP');
    await page.getByRole('button', { name: 'Skip fight' }).click();
    await expect(page.getByRole('status')).toContainText('Defeat');
    await expect(page.getByLabel('Fight health')).toContainText('Cat HP 0');
    await page.getByLabel('Fight fixture').selectOption('ch1-win');
    await expect(page.getByRole('status')).toContainText('Victory');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath(`arena-${width}-${reducedMotion}.png`) });
  });
}
