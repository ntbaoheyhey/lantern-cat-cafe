import { expect, test, type Page } from '../support/test';
import { installT2LoopFixture } from '../support/t2-loop-fixture';

async function tab(page: Page, name: string) {
  const aliases: Record<string, string> = {
    Boss: 'Map',
    Character: 'Hero',
    Inventory: 'Bag',
  };
  const target = aliases[name] ?? name;
  let button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: target, exact: true });
  if ((await button.count()) === 0) {
    button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name, exact: true });
  }
  if ((await button.getAttribute('aria-selected')) !== 'true') await button.click();
  let panel = page.getByRole('tabpanel', { name: target, exact: true });
  if ((await panel.count()) === 0) {
    panel = page.getByRole('tabpanel', { name, exact: true });
  }
  await expect(panel).toBeVisible();
  return panel;
}

for (const reduced of [false, true]) test(`continuous stocked demo loop${reduced ? ' with reduced motion' : ''}`, async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await installT2LoopFixture(page);
  await page.goto('/');
  await expect(page.getByTestId('class-picker')).toBeVisible();
  await page.getByTestId('class-picker-choose-button').click();
  await page.getByTestId('class-picker-confirm-button').click();
  await expect(page.getByTestId('class-picker')).toHaveCount(0);
  await tab(page, 'Character');
  const character = page.getByRole('region', { name: 'Character', exact: true });
  await expect(character.getByRole('button', { name: 'Weapon: Nine Lives Edge, Legendary' })).toBeVisible();
  await tab(page, 'Home');
  const progress = page.getByRole('group', { name: /^Chapter 1 / });
  await expect(progress).toContainText('Round 1');

  // The real UI claims automatically every 30 seconds; there is no manual Claim button.
  await page.clock.fastForward(10 * 60_000);
  await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible();
  await expect(progress).not.toContainText('Round 1 ·');
  const inventory = await tab(page, 'Bag');
  await inventory.getByRole('button', { name: 'Equip best', exact: true }).click();
  await tab(page, 'Character');
  await expect(character.getByRole('button', { name: /^Helmet: .*Legendary$/ })).toBeVisible();
  const equipped = await character.getByRole('button', { name: /^Weapon:/ }).getAttribute('aria-label');

  // Reload between equip and craft, retaining the selected class, equipment and materials.
  await page.reload();
  await expect(page.getByTestId('class-picker')).toHaveCount(0);
  await tab(page, 'Character');
  await expect(character.getByRole('button', { name: equipped!, exact: true })).toBeVisible();
  let forge = await tab(page, 'Forge');
  await forge.getByTestId('tab-salvage').click();
  const rows = forge.getByRole('list', { name: 'Owned items' }).getByRole('listitem');
  const ownedBeforeCraft = await rows.count();
  await forge.getByTestId('tab-craft').click();
  await forge.getByTestId('craft-btn').click();
  await expect(forge.getByTestId('craft-confirm-box')).toContainText('Craft');
  await forge.getByTestId('craft-confirm-btn').click();
  await expect(forge.getByTestId('craft-confirm-box')).toHaveCount(0);
  await forge.getByTestId('tab-salvage').click();
  // The newly appended visible row must appear after crafting and disappear on salvage.
  await expect(rows).toHaveCount(ownedBeforeCraft + 1);
  const crafted = rows.last();
  await expect(crafted).toContainText('Common');
  await expect(crafted).toContainText('Weapon');
  await crafted.getByRole('checkbox').check();
  await expect(forge.getByTestId('salvage-yield-summary')).toContainText('+');
  await forge.getByTestId('salvage-btn').click();
  await expect(forge.getByTestId('salvage-confirm-box')).toContainText('1');
  await forge.getByTestId('salvage-confirm-btn').click();
  await expect(rows).toHaveCount(ownedBeforeCraft);

  await page.clock.fastForward(2 * 60_000);
  await expect(progress).toContainText('Round 10 · 6/6');
  let boss = await tab(page, 'Boss');
  await expect(boss.getByRole('button', { name: 'Fight', exact: true })).toBeDisabled();
  await expect(boss).toContainText('You need a Cat Key.');
  await expect(page.getByTestId('boss-key-hint-count')).toHaveText('Cat Keys: 0 / 5');
  await expect(page.getByTestId('boss-key-hint-sources')).toContainText('Daily: 1 Cat Key with your first claim each day.');
  await expect(page.getByTestId('boss-key-hint-sources')).toContainText('Rare drop: about 1 in 150 monsters in cleared chapters.');
  await expect(page.getByTestId('boss-key-hint-sources')).not.toContainText('First clear:');
  await expect(page.getByRole('listitem', { name: 'Cat Keys 0 of 5', exact: true })).toBeVisible();

  // Reload at the wall, then earn the key from the next day's actual claim.
  await page.reload();
  boss = await tab(page, 'Boss');
  await expect(page.getByTestId('boss-key-hint-count')).toHaveText('Cat Keys: 0 / 5');
  await page.clock.fastForward(24 * 60 * 60_000);
  await expect(page.getByRole('listitem', { name: 'Cat Keys 1 of 5', exact: true })).toBeVisible();
  await expect(boss.getByRole('button', { name: 'Fight', exact: true })).toBeEnabled();
  await expect(page.getByTestId('boss-key-hint')).toHaveCount(0);
  await page.clock.resume();
  await boss.getByRole('button', { name: 'Fight', exact: true }).click();
  // Reduced motion resolves immediately, so the chest makes its painted arena background inert.
  const arena = page.getByRole('region', { name: 'Boss arena', includeHidden: reduced });
  await expect(arena).toBeVisible();
  if (!reduced) {
    await expect(arena.locator('canvas')).toBeVisible();
    await expect(arena.getByRole('status')).toHaveText('Boss fight in progress');
    await arena.getByRole('button', { name: 'Skip fight', exact: true }).click();
  }
  await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
  const chest = page.getByRole('dialog', { name: 'First clear chest!', exact: true });
  await expect(chest).toBeVisible();
  await expect(chest.getByRole('heading', { name: 'Rewards', exact: true })).toBeVisible();
  if (!reduced) await chest.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(chest.getByRole('button', { name: 'Collect', exact: true })).toBeVisible();
  await chest.getByRole('button', { name: 'Collect', exact: true }).click();
  await expect(chest).toHaveCount(0);
  await expect(page.getByRole('group', { name: /^Chapter 2 / })).toContainText('Round 1');
  await expect(page.getByRole('listitem', { name: 'Cat Keys 0 of 5', exact: true })).toBeVisible();

  forge = await tab(page, 'Forge');
  await forge.getByTestId('tab-relic').click();
  await expect(forge.getByTestId('relic-panel')).toBeVisible();
  await expect(forge.getByTestId('relic-cost-yarn')).toContainText('30');
  await expect(forge.getByTestId('relic-cost-pearl')).toContainText('1');
  const cost = await forge.getByTestId('relic-cost-pearl').innerText();
  await forge.getByTestId('relic-forge-btn').click();
  await forge.getByTestId('relic-confirm-btn').click();
  await expect(page.getByRole('status').filter({ hasText: 'Connect your wallet before forging a Relic.' })).toBeVisible();
  await expect(forge.getByTestId('relic-cost-pearl')).toHaveText(cost, { useInnerText: true });
  await expect(forge.getByTestId('forge-pending')).toHaveCount(0);
  expect(errors).toEqual([]);
});
