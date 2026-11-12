import { expect, test } from '@playwright/test';
const route = '/?demo=1&squad=1&cardrpg2=1&a6=1';
test('guest login twice keeps the same address and does not send the private key', async ({page}) => {
  const payloads: string[] = [];
  page.on('request', request => { if (request.postData()) payloads.push(request.postData()!); });
  await page.goto(route);
  await page.getByRole('button', {name:'▶ Play as guest'}).click();
  const account = page.getByTestId('chain-address');
  await expect(account).toBeVisible();
  const address = await account.getAttribute('title');
  expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  await page.getByRole('button', {name:'↪ Sign out'}).click();
  await page.reload();
  await page.getByRole('button', {name:'▶ Play as guest'}).click();
  await expect(account).toHaveAttribute('title', address!);
  // Evaluate the containment check in-browser; never return key bytes to the runner.
  expect(await page.evaluate(requestBodies => {
    const key = localStorage.getItem('taskbar-hero.fuji-guest.v1');
    return !!key && requestBodies.every(body => !body.includes(key));
  }, payloads)).toBe(true);
  await expect(page.locator('.uv-shell')).toBeVisible();
  await page.screenshot({path:'../../reports/chain/shots/H1-guest.png'});
});
