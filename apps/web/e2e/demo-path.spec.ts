import { expect, test } from './support/test';
import { LABELS } from '../src/theme/labels';

for (const width of [390, 1280]) {
  test.describe(`Judge demo path at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } });

    test('plays from onboarding through upgrading, a boss fight, Forge and Market', async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      const screenshot = async (step: string) => {
        const overflow = await page.evaluate(() => ({
          document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          body: document.body.scrollWidth - document.body.clientWidth,
        }));
        expect(overflow.document).toBeLessThanOrEqual(0);
        expect(overflow.body).toBeLessThanOrEqual(0);
        const path = testInfo.outputPath(`demo-${width}-${step}.png`);
        if (process.env.SCREENSHOTS === '1') {
          await page.screenshot({ path, fullPage: true, animations: 'disabled' });
          await testInfo.attach(`${width}px: ${step}`, { path, contentType: 'image/png' });
        }
      };

      await page.clock.install();
      await page.goto('/?demo');
      const onboarding = page.getByRole('dialog', { name: 'How to play' });
      await expect(onboarding).toBeVisible();
      await screenshot('onboarding');
      await onboarding.getByRole('button', { name: 'Start playing' }).click();
      await expect(onboarding).toHaveCount(0);
      await expect(page.locator('.strip canvas')).toBeVisible();

      const gold = page.getByTestId('gold-counter');
      const readGold = async () => Number(((await gold.textContent()) ?? '').replace(/[^0-9]/g, ''));
      await expect(gold).toBeVisible();
      const startingGold = await readGold();
      // Earn the first upgrade with the real idle loop and mock API, without a wall-clock sleep.
      await page.clock.fastForward(10_000);
      await expect.poll(readGold).toBeGreaterThan(startingGold);

      await page.getByRole('button', { name: 'Menu' }).click();
      const panel = page.getByRole('region', { name: 'Game panel' });
      await expect(panel).toBeVisible();
      await panel.getByRole('tab', { name: 'Inventory', exact: true }).click();
      await expect(page.getByTestId('demo-note')).toHaveText('Demo mode, sign in to save progress.');
      const power = page.getByTestId('inventory-power');
      await expect(power).toBeVisible();
      const startingPower = Number(await power.textContent());
      const weapon = `${LABELS.rarities.common} ${LABELS.slots.weapon}`;
      const upgrade = panel.getByRole('button', { name: `Upgrade (25 ${LABELS.gold}): ${weapon}, level 1`, exact: true });
      await expect(upgrade).toBeEnabled();
      await upgrade.click();
      await expect(panel.getByRole('status').filter({ hasText: 'power' })).toHaveText(/^\+[\d.]+ power$/);
      await expect(panel.getByText('Lv 2 · Power 9', { exact: true })).toBeVisible();
      await expect.poll(async () => Number(await power.textContent())).toBeGreaterThan(startingPower);
      await screenshot('inventory-upgraded');

      await panel.getByRole('tab', { name: 'Boss', exact: true }).click();
      await expect(page.getByTestId('boss-attempts')).toHaveText('5');
      await panel.getByRole('button', { name: 'Fight', exact: true }).click();
      await expect(panel.getByRole('button', { name: 'Fighting…', exact: true })).toBeDisabled();
      await expect(panel.getByRole('progressbar', { name: `${LABELS.hero} health`, exact: true })).toBeVisible();
      await panel.getByRole('button', { name: 'Skip', exact: true }).click();
      await expect(page.getByTestId('boss-outcome')).toContainText(/Victory!|Defeated\./);
      await expect(page.getByTestId('boss-attempts')).toHaveText('4');
      await expect(panel.getByRole('button', { name: 'Fight', exact: true })).toBeEnabled();
      await page.getByTestId('boss-outcome').scrollIntoViewIfNeeded();
      await screenshot('boss-outcome');

      await panel.getByRole('tab', { name: 'Forge', exact: true }).click();
      const odds = panel.getByRole('list', { name: 'Relic odds' });
      await expect(odds).toBeVisible();
      await expect(odds.getByRole('listitem')).toHaveCount(4);
      for (const rarity of Object.values(LABELS.rarities)) {
        await expect(odds.getByRole('listitem').filter({ hasText: rarity })).toContainText(/\d+(\.\d+)?%/);
      }
      await screenshot('forge-odds');

      await panel.getByRole('tab', { name: 'Market', exact: true }).click();
      await expect(panel.getByText('Connect your wallet to see your Relics and the market.', { exact: true })).toBeVisible();
      await screenshot('market-connect-gate');
      expect(errors).toEqual([]);
    });
  });
}
