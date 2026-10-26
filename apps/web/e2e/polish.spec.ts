import { expect, test, type Locator, type Page } from './support/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('taskbar-hero.howToPlaySeen', '1'));
});

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
];

type Box = { x: number; y: number; width: number; height: number };

// Boxes that only touch (sub-pixel rounding, flush edges) are not an overlap.
const TOLERANCE = 1;

function overlaps(a: Box, b: Box): boolean {
  return (
    a.x + TOLERANCE < b.x + b.width &&
    b.x + TOLERANCE < a.x + a.width &&
    a.y + TOLERANCE < b.y + b.height &&
    b.y + TOLERANCE < a.y + a.height
  );
}

async function box(locator: Locator): Promise<Box> {
  await expect(locator).toBeVisible();
  const b = await locator.boundingBox();
  if (!b) throw new Error('element has no bounding box');
  return b;
}

for (const vp of VIEWPORTS) {
  test(`${vp.width}px: no horizontal scroll and no overlap between the HUD, wallet and Menu`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');

    const scroll = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
      bodyScroll: document.body.scrollWidth,
      bodyClient: document.body.clientWidth,
    }));
    expect(scroll.docScroll).toBeLessThanOrEqual(scroll.docClient);
    expect(scroll.bodyScroll).toBeLessThanOrEqual(scroll.bodyClient);

    const boxes: Record<string, Box> = {
      'gold chip': await box(page.getByTestId('gold-counter')),
      'shard chip': await box(page.getByTestId('shard-counter')),
      'key chip': await box(page.getByTestId('key-counter')),
      'wallet button': await box(page.locator('.wallet .wallet-btn').first()),
      'Menu button': await box(page.getByRole('button', { name: 'Menu' })),
    };
    const names = Object.keys(boxes);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i]!;
        const b = names[j]!;
        expect(overlaps(boxes[a]!, boxes[b]!), `${a} overlaps ${b}`).toBe(false);
      }
    }
  });
}

/** Demo mode with a forge ready: fast-forward for Yarn, boost the cat's gear, win a boss for a Cat Key. */
async function getForgeReady(page: Page): Promise<void> {
  await page.clock.install();
  await page.goto('/');
  await page.clock.fastForward('06:00:00');
  await page.clock.runFor(2000);
  await page.getByRole('button', { name: 'Menu' }).click();

  await page.getByRole('tab', { name: 'Inventory' }).click();
  let power = 0;
  for (let round = 0; round < 30 && power < 140; round++) {
    for (let slot = 0; slot < 4; slot++) {
      const upgrade = page.locator('.inv-slot').nth(slot).locator('.inv-upgrade').first();
      if (await upgrade.isEnabled()) await upgrade.click();
    }
    power = Number((await page.getByTestId('inventory-power').innerText()).replace(/,/g, ''));
  }

  await page.getByRole('tab', { name: 'Boss' }).click();
  for (let i = 0; i < 5; i++) {
    const fight = page.getByRole('button', { name: 'Fight', exact: true });
    if (!(await fight.isEnabled())) break;
    await fight.click();
    await page.getByRole('button', { name: 'Skip' }).click();
    await page.clock.runFor(500);
    if (!/Defeated/.test(await page.getByTestId('boss-outcome').innerText())) break;
  }

  await page.getByRole('tab', { name: 'Forge' }).click();
  await expect(page.getByTestId('forge-keys')).toHaveText('1');
}

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the forge reveal shows the Relic without motion', async ({ page }) => {
    await getForgeReady(page);
    await page.getByRole('button', { name: 'Forge', exact: true }).click();

    // Charge stage: the core and glow do not animate, flash and sparkles are hidden.
    const stage = page.getByTestId('forge-reveal');
    await expect(stage).toBeVisible();
    const style = (selector: string, prop: 'animationName' | 'display') =>
      stage.locator(selector).first().evaluate((el, p) => getComputedStyle(el)[p], prop);
    expect(await style('.fz-core', 'animationName')).toBe('none');
    expect(await style('.fz-glow', 'animationName')).toBe('none');
    expect(await style('.fz-flash', 'display')).toBe('none');

    // The Relic appears with a plain fade, not the rise/shake keyframes.
    await page.clock.runFor(1200);
    const relic = stage.locator('.fz-relic');
    await expect(relic).toBeVisible();
    const relicAnimation = await relic.evaluate((el) => getComputedStyle(el).animationName);
    expect(relicAnimation).toBe('fz-fade');

    // The reveal ends and the result is on screen.
    await page.clock.runFor(1000);
    await expect(page.getByTestId('forge-rarity')).toContainText('You forged');
  });
});

test('tabs switch with the keyboard (Tab and Enter)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('tab', { name: 'Hero' })).toHaveAttribute('aria-selected', 'true');

  const focusedTabId = () => page.evaluate(() => document.activeElement?.id ?? '');
  for (const name of ['Inventory', 'Boss']) {
    await page.getByRole('tab', { name: 'Hero' }).focus();
    let steps = 0;
    while ((await focusedTabId()) !== `tab-${name}` && steps++ < 10) await page.keyboard.press('Tab');
    expect(await focusedTabId()).toBe(`tab-${name}`);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Hero' })).toHaveAttribute('aria-selected', 'false');
  }
});
