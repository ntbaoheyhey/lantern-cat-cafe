import { test, expect, load, tab, inspect, advance, visibility } from '../support/server-fixture';
import { v2 } from '@taskbar-hero/game-rules';
import { apiURL, serverURL } from '../support/server-ports';
import type { CraftResultV2, ClaimResultV2 } from '../../src/api/GameApiV2';

// One file runs serially; every test has a distinct SQL player and session.
test('choose class and claim through the HTTP transport and migrated SQL', async ({ page, request }) => {
  const session = await load(page, request, 'fresh');
  await expect(page.getByTestId('class-picker')).toBeVisible();
  await page.getByTestId('class-picker-choose-button').click();
  const chosen = page.waitForResponse(r => r.url().endsWith('/v2-choose-class') && r.request().method() === 'POST');
  await page.getByTestId('class-picker-confirm-button').click();
  expect((await chosen).status()).toBe(200);
  await expect(page.getByTestId('class-picker')).toHaveCount(0);
  expect((await inspect(request, session)).raw.classId).toBe('warrior');
  await advance(request, session, 600);
  const claimed = page.waitForResponse(r => r.url().endsWith('/v2-claim') && r.request().method() === 'POST');
  await page.clock.fastForward(30_000);
  const result = await (await claimed).json() as ClaimResultV2;
  expect(result.gains.fish).toBeGreaterThan(0);
  expect(result.gains.xp).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Recent finds', exact: true })).toBeVisible();
  const after = await inspect(request, session);
  expect(after.raw.stacks.fish).toBe(result.state.currencies.fish);
  expect(after.raw.inventory.length).toBe(result.state.inventory.length);
  await expect(page.locator('header [data-sync-status="live"]')).toBeVisible();
});

test('Equip best makes one mutation per changed slot and no extra reads', async ({ page, request }) => {
  const session = await load(page, request, 'equip');
  const before = await inspect(request, session);
  const button = (await tab(page, 'Bag')).getByRole('button', { name: 'Equip best', exact: true });
  await expect(button).toBeEnabled(); await button.click();
  await expect(button).toBeDisabled();
  await expect.poll(async () => (await inspect(request, session)).raw.inventory.filter(i => i.equipped).length).toBe(before.raw.inventory.length);
  const after = await inspect(request, session);
  const mutations = after.requests.slice(before.requests.length).filter(r => r.method === 'POST');
  expect(mutations.filter(r => r.name === 'v2-equip')).toHaveLength(before.raw.inventory.length);
  expect(mutations.filter(r => r.name === 'v2-state')).toHaveLength(0);
  expect(new Set(mutations.map(r => r.body.slot)).size).toBe(before.raw.inventory.length);
  console.log(`Equip best: ${mutations.length} HTTP mutations, 0 state reads, ${before.raw.inventory.length} changed slots`);
});

test('craft and salvage persist the same UUIDs and balances shown in the UI', async ({ page, request }) => {
  const session = await load(page, request);
  const before = await inspect(request, session), forge = await tab(page, 'Forge');
  await forge.getByTestId('craft-btn').click();
  const crafted = page.waitForResponse(r => r.url().endsWith('/v2-craft') && r.request().method() === 'POST');
  await forge.getByTestId('craft-confirm-btn').click();
  const result = await (await crafted).json() as CraftResultV2;
  await expect(forge.getByTestId('craft-confirm-box')).toHaveCount(0);
  expect(result.item.id).toMatch(/^[0-9a-f-]{36}$/);
  expect((await inspect(request, session)).raw.inventory).toHaveLength(before.raw.inventory.length + 1);
  await forge.getByTestId('tab-salvage').click();
  await forge.getByTestId(`salvage-check-${result.item.id}`).check();
  await forge.getByTestId('salvage-btn').click();
  const salvaged = page.waitForResponse(r => r.url().endsWith('/v2-salvage') && r.request().method() === 'POST');
  await forge.getByTestId('salvage-confirm-btn').click(); expect((await salvaged).status()).toBe(200);
  await expect(forge.getByTestId(`salvage-check-${result.item.id}`)).toHaveCount(0);
  const after = await inspect(request, session);
  expect(after.raw.inventory).toHaveLength(before.raw.inventory.length);
  expect(after.raw.inventory.some(i => i.id === result.item.id)).toBe(false);
});

for (const kind of ['strong', 'weak']) test(`boss ${kind === 'strong' ? 'win' : 'loss'} is concealed until Skip ends replay`, async ({ page, request }) => {
  const session = await load(page, request, kind), before = await inspect(request, session);
  await (await tab(page, 'Boss')).getByRole('button', { name: 'Fight', exact: true }).click();
  const arena = page.getByRole('region', { name: 'Boss arena' });
  await expect(arena).toBeVisible();
  await expect(arena.getByRole('status')).toHaveText('Boss fight in progress');
  await expect(page.getByText('Victory!', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Defeat. Your key was kept.', { exact: true })).toHaveCount(0);
  await arena.getByRole('button', { name: 'Skip fight', exact: true }).click();
  if (kind === 'strong') {
    await expect(page.getByText('Victory!', { exact: true })).toBeVisible();
    const chest = page.getByRole('dialog', { name: 'First clear chest!', exact: true });
    await expect(chest).toBeVisible();
    await chest.getByRole('button', { name: 'Skip', exact: true }).click();
    await chest.getByRole('button', { name: 'Collect', exact: true }).click();
    await expect(page.getByRole('group', { name: /^Chapter 2 / })).toBeVisible();
  } else {
    await expect(page.getByText('Defeat. Your key was kept.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back to exploring' }).click();
    await expect((await tab(page, 'Boss')).getByRole('button', { name: 'Fight', exact: true })).toBeDisabled();
  }
  const after = await inspect(request, session);
  expect(after.raw.fights).toBe(before.raw.fights + 1);
  expect(after.raw.chapter).toBe(kind === 'strong' ? 2 : 1);
  expect(after.raw.stacks.catKey).toBe(kind === 'strong' ? 0 : before.raw.stacks.catKey);
  expect(after.actions.filter(a => a.route === 'v2-boss-fight')).toHaveLength(1);
});

test('Relic forge without a wallet refuses before spending or HTTP mutation', async ({ page, request }) => {
  const session = await load(page, request);
  expect(await page.evaluate(() => 'ethereum' in window)).toBe(false);
  const before = await inspect(request, session), forge = await tab(page, 'Forge');
  await forge.getByTestId('tab-relic').click();
  await forge.getByTestId('relic-forge-btn').click(); await forge.getByTestId('relic-confirm-btn').click();
  await expect(page.getByRole('status').filter({ hasText: 'Connect your wallet before forging a Relic.' })).toBeVisible();
  await expect(forge.getByTestId('forge-pending')).toHaveCount(0);
  const after = await inspect(request, session);
  expect(after.raw.stacks).toEqual(before.raw.stacks);
  expect(after.requests.filter(r => r.name === 'v2-relic-forge')).toHaveLength(0);
});

test('hide/return makes one claim and keeps SyncStatus in the header', async ({ page, request }) => {
  const session = await load(page, request), before = await inspect(request, session);
  await visibility(page, 'hidden');
  await expect(page.locator('header [data-sync-status="hidden"]')).toBeVisible();
  await advance(request, session, 600); await page.clock.fastForward(90_000);
  expect((await inspect(request, session)).requests.filter(r => r.name === 'v2-claim')).toHaveLength(0);
  const claimed = page.waitForResponse(r => r.url().endsWith('/v2-claim') && r.request().method() === 'POST');
  await visibility(page, 'visible'); expect((await claimed).status()).toBe(200);
  await expect(page.locator('header [data-sync-status="live"]')).toBeVisible();
  const after = await inspect(request, session);
  expect(after.requests.filter(r => r.name === 'v2-claim' && r.method === 'POST')).toHaveLength(1);
  expect(after.raw.progressRev).toBe(before.raw.progressRev + 1);
  expect(after.raw.stacks.fish).toBeGreaterThan(before.raw.stacks.fish!);
});

test('two tabs claim the same interval at once with no double reward', async ({ page, context, request }) => {
  const session = await load(page, request), second = await context.newPage();
  await second.clock.install(); await second.clock.pauseAt(await second.evaluate(() => Date.now()));
  await second.goto('/'); await expect(second.locator('header [data-sync-status="live"]')).toBeVisible();
  await visibility(page, 'hidden'); await visibility(second, 'hidden'); await advance(request, session, 600);
  const before = await inspect(request, session);
  let waiting = 0, release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await context.route('**/functions/v1/v2-claim', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    if (++waiting === 2) release(); await gate; await route.continue();
  });
  const responseA = page.waitForResponse(r => r.url().endsWith('/v2-claim') && r.request().method() === 'POST');
  const responseB = second.waitForResponse(r => r.url().endsWith('/v2-claim') && r.request().method() === 'POST');
  await Promise.all([visibility(page, 'visible'), visibility(second, 'visible')]);
  const results = await Promise.all([responseA, responseB].map(async response => (await (await response).json()) as ClaimResultV2));
  expect(waiting).toBe(2); expect(results.filter(r => r.gains.fish > 0)).toHaveLength(1);
  expect(results.filter(r => r.gains.xp > 0)).toHaveLength(1);
  const after = await inspect(request, session);
  expect(after.raw.progressRev).toBe(before.raw.progressRev + 1);
  expect(after.raw.stacks.fish! - before.raw.stacks.fish!).toBe(results.reduce((sum, r) => sum + r.gains.fish, 0));
  expect(after.raw.inventory.length - before.raw.inventory.length).toBe(results.reduce((sum, r) => sum + r.gains.items.length, 0));
});

test('lost craft response retries the same request id and shows one result', async ({ page, request }) => {
  const session = await load(page, request), before = await inspect(request, session);
  const attempts: { id: string; item: string }[] = [];
  await page.route('**/functions/v1/v2-craft', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    // Commit to SQL first, then lose the response: the hardest retry boundary.
    const response = await route.fetch(); expect(response.status()).toBe(200);
    const result = await response.json() as CraftResultV2;
    attempts.push({ id: route.request().postDataJSON().requestId as string, item: result.item.id });
    if (attempts.length === 1) await route.abort('connectionreset'); else await route.fulfill({ response });
  });
  const forge = await tab(page, 'Forge');
  await forge.getByTestId('craft-btn').click(); await forge.getByTestId('craft-confirm-btn').click();
  await expect(forge.getByTestId('craft-confirm-box')).toHaveCount(0);
  await expect.poll(() => attempts.length).toBe(2); expect(attempts[1]).toEqual(attempts[0]);
  await forge.getByTestId('tab-salvage').click();
  await expect(forge.getByTestId(`salvage-check-${attempts[0]!.item}`)).toHaveCount(1);
  const after = await inspect(request, session);
  expect(after.raw.inventory).toHaveLength(before.raw.inventory.length + 1);
  expect(after.actions.filter(a => a.route === 'v2-craft')).toHaveLength(1);
  const recipe = v2.RECIPES.find(recipe => recipe.id === 'rcp.common')!;
  for (const [id, amount] of Object.entries({ ...recipe.materials, fish: recipe.fish })) {
    expect(after.raw.stacks[id]).toBe(before.raw.stacks[id]! - amount);
  }
  expect(after.requests.filter(r => r.name === 'v2-craft' && r.method === 'POST')).toHaveLength(2);
  await expect(page.locator('header [data-sync-status="live"]')).toBeVisible();
});

test('local HTTP boundary rejects missing and forged session tokens', async ({ request }) => {
  for (const token of ['', 'not-a-jwt']) {
    const response = await request.post(`${apiURL}/functions/v1/v2-state`, { data: {}, headers: { authorization: `Bearer ${token}` } });
    expect(response.status()).toBe(401); expect(await response.json()).toEqual({ error: 'unauthenticated' });
  }
});

test('local controls reject browser origins and game routes retain CORS and JSON validation', async ({ request }) => {
  const blocked = await request.post(`${apiURL}/__test/session`, { data: {}, headers: { Origin: serverURL } });
  expect(blocked.status()).toBe(403);
  const foreign = await request.post(`${apiURL}/__test/session`, { data: {}, headers: { Origin: 'https://foreign.test' } });
  expect(foreign.status()).toBe(403);
  const preflight = await request.fetch(`${apiURL}/functions/v1/v2-state`, { method: 'OPTIONS', headers: { Origin: serverURL } });
  expect(preflight.status()).toBe(204);
  expect(preflight.headers()['access-control-allow-origin']).toBe(serverURL);
  const session = await request.post(`${apiURL}/__test/session`, { data: { kind: 'fresh' } });
  const { token } = await session.json() as { token: string };
  const malformed = await request.post(`${apiURL}/functions/v1/v2-state`, { data: '{', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
  expect(malformed.status()).toBe(400);
  expect(await malformed.json()).toEqual({ error: 'invalid_request' });
});
