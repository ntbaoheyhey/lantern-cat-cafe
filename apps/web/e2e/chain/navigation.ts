import {expect, type Locator, type Page} from '@playwright/test';

export const chainRoute = '/?demo=1&squad=1&cardrpg2=1&a6=1';

export async function openWallet(page: Page) {
  await page.getByRole('button', {name: 'Open menu', exact: true}).click();
  await page.getByRole('button', {name: 'Open Fuji wallet', exact: true}).click();
  return page.getByRole('dialog', {name: 'Fuji panel', exact: true});
}

export async function enterGuest(page: Page) {
  await page.goto(chainRoute);
  await page.getByRole('button', {name: 'Play free', exact: true}).click();
  await openWallet(page);
  await page.getByRole('dialog', {name: 'Tutorial', exact: true}).getByRole('button', {name: 'Skip', exact: true}).click();
  await expect(page.getByTestId('chain-address')).toBeVisible();
  await expect(page.getByTestId('chain-gas')).toHaveText('0.0500');
}

export async function openMarket(page: Page, walletAlreadyOpen = false) {
  const wallet = walletAlreadyOpen
    ? page.getByRole('dialog', {name: 'Fuji panel', exact: true})
    : await openWallet(page);
  await wallet.getByRole('button', {name: 'Market', exact: true}).click();
  await expect(wallet).toHaveCount(0);
  const room = page.getByRole('dialog', {name: 'Fuji market', exact: true});
  await expect(room).toBeVisible();
  return room;
}

export async function chainTab(room: Locator, name: string) {
  const rail = room.getByRole('navigation', {name: 'Chain screens'});
  if (['Market', 'Bag', 'History', 'Style', 'Café'].includes(name)) {
    await rail.getByRole('button', {name, exact: true}).click();
  } else {
    await rail.getByRole('button', {name: 'More', exact: true}).click();
    await room.page().getByRole('dialog', {name: 'More', exact: true}).getByRole('button', {name, exact: true}).click();
  }
}
