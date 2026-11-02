import { test, expect, load, tab, inspect, advance } from '../support/server-fixture';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve(process.env.SCREENSHOT_DIR ?? path.resolve(process.cwd(), '../../reports/n1-error-screens'));

function ensureDir() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
}

async function setThemeAndScreenshot(
  page: import('@playwright/test').Page,
  name: string,
  width: number,
  height: number,
  theme: 'dark' | 'light'
) {
  await page.setViewportSize({ width, height });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.emulateMedia({ colorScheme: theme });
  if (process.env.SCREENSHOTS === '1') {
    ensureDir();
    const filename = `${name}-${width}x${height}-${theme}.png`;
    await page.screenshot({ path: path.join(outDir, filename) });
  }
}

test('T1-T5: 429 on v2-claim shows countdown notice, disables action button, and re-enables at 0', async ({
  page,
  request,
  context,
}) => {
  await page.route('**/functions/v1/v2-claim', async (route) => {
    await route.fulfill({
      status: 429,
      headers: {
        'Retry-After': '3',
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'Retry-After',
      },
      body: JSON.stringify({ error: 'rate_limited', retryAfter: 3 }),
    });
  });

  const session = await load(page, request, 'stocked');
  await advance(request, session, 600);
  const forge = await tab(page, 'Forge');
  const craftBtn = forge.getByTestId('craft-btn');
  await expect(craftBtn).toBeEnabled();

  // Advance 30 s to trigger claim in visible loop
  const claimed = page.waitForResponse(
    (r) => r.url().endsWith('/v2-claim') && r.request().method() === 'POST'
  );
  await page.clock.fastForward(30_000);
  await claimed;

  const notice = forge.getByTestId('action-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText(/Easy, hero! Try again in \d+ s\./);
  await expect(craftBtn).toBeDisabled();

  // Evidence screenshots for 429
  await setThemeAndScreenshot(page, '429', 1280, 720, 'dark');
  await setThemeAndScreenshot(page, '429', 390, 844, 'light');

  // Reset viewport to desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

  // Advance clock past 3 s retry duration
  await page.clock.fastForward(3500);

  // Notice clears automatically and action button is re-enabled with no auto-retry
  await expect(notice).toHaveCount(0);
  await expect(craftBtn).toBeEnabled();
});

test('T6: 503 shows cafe kitchen busy and preserves authoritative store state', async ({
  page,
  request,
}) => {
  await page.route('**/functions/v1/v2-claim', async (route) => {
    await route.fulfill({
      status: 503,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ error: 'server_busy' }),
    });
  });

  const session = await load(page, request, 'stocked');
  const before = await inspect(request, session);
  await advance(request, session, 600);
  const bossPanel = await tab(page, 'Boss');

  // Trigger claim
  const claimed = page.waitForResponse(
    (r) => r.url().endsWith('/v2-claim') && r.request().method() === 'POST'
  );
  await page.clock.fastForward(30_000);
  await claimed;

  const notice = bossPanel.getByTestId('action-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveText(
    'The cafe kitchen is busy. Nothing was spent. Try again in a minute.'
  );

  // Evidence screenshots for 503
  await setThemeAndScreenshot(page, '503', 1280, 720, 'dark');
  await setThemeAndScreenshot(page, '503', 390, 844, 'light');

  // Store state unchanged
  const after = await inspect(request, session);
  expect(after.raw.stacks).toEqual(before.raw.stacks);
  expect(after.raw.progressRev).toBe(before.raw.progressRev);
});

test('T7: context.setOffline shows offline notice and online event clears it', async ({
  page,
  request,
  context,
}) => {
  const session = await load(page, request, 'stocked');
  const bossPanel = await tab(page, 'Boss');

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));

  const notice = bossPanel.getByTestId('action-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveText(
    'You are offline. Your cat keeps working; we will sync when you are back.'
  );

  // Evidence screenshots for offline
  await setThemeAndScreenshot(page, 'offline', 1280, 720, 'dark');
  await setThemeAndScreenshot(page, 'offline', 390, 844, 'light');

  // Reset to desktop and back online
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await expect(notice).toHaveCount(0);
});

test('T8: wrong wallet displays mint-wrong-wallet and prevents contract call', async ({
  page,
  request,
  context,
}) => {
  const otherOwner = '0x2222222222222222222222222222222222222222';

  // Inject mock window.ethereum matching session.wallet
  await context.addInitScript(() => {
    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    let currentAccount: string | null = null;
    (window as unknown as { __mockWallet: unknown }).__mockWallet = {
      setAccount: (addr: string | null) => {
        currentAccount = addr;
        const cbs = listeners['accountsChanged'] ?? [];
        for (const cb of cbs) {
          cb(addr ? [addr] : []);
        }
      },
    };
    (window as unknown as { ethereum: unknown }).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') return currentAccount ? [currentAccount] : [];
        if (method === 'eth_requestAccounts') return currentAccount ? [currentAccount] : [];
        if (method === 'eth_chainId') return '0xa869'; // 43113 Fuji
        if (method === 'net_version') return '43113';
        if (method === 'eth_sendTransaction') {
          throw new Error('Contract call blocked for wrong wallet');
        }
        return null;
      },
      on: (ev: string, cb: (...args: unknown[]) => void) => {
        listeners[ev] = listeners[ev] ?? [];
        listeners[ev].push(cb);
      },
      removeListener: (ev: string, cb: (...args: unknown[]) => void) => {
        listeners[ev] = (listeners[ev] ?? []).filter((l) => l !== cb);
      },
    };
  });

  // Intercept v2-relic-forge so the returned voucher belongs to otherOwner
  await page.route('**/functions/v1/v2-relic-forge', async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as {
      voucher?: { player: string };
      state?: { forge?: { pending?: { player: string } } };
    };
    if (json.voucher) {
      json.voucher.player = otherOwner;
    }
    if (json.state?.forge?.pending) {
      json.state.forge.pending.player = otherOwner;
    }
    await route.fulfill({ response, json });
  });

  const session = await load(page, request, 'stocked');

  // Connect wallet to session.wallet
  await page.evaluate((addr) => {
    (window as unknown as { __mockWallet: { setAccount: (a: string) => void } }).__mockWallet.setAccount(addr);
  }, session.wallet);

  const connectBtn = page.getByRole('button', { name: 'Connect wallet' });
  await expect(connectBtn).toBeVisible();
  await connectBtn.click();
  await expect(page.locator('.wallet-badge')).toBeVisible();

  // Go to Forge -> Relic tab and forge a Relic
  const forge = await tab(page, 'Forge');
  await forge.getByTestId('tab-relic').click();

  const relicBtn = forge.getByTestId('relic-forge-btn');
  await expect(relicBtn).toBeEnabled();
  await relicBtn.click();

  const confirmBtn = forge.getByTestId('relic-confirm-btn');
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // Voucher belongs to otherOwner while connected wallet is session.wallet:
  // mint-wrong-wallet warning is shown and Mint button is suppressed
  const wrongWallet = page.getByTestId('mint-wrong-wallet');
  await expect(wrongWallet).toBeVisible();
  const shortExpected = `${otherOwner.slice(0, 6)}...${otherOwner.slice(-4)}`;
  await expect(wrongWallet).toHaveText(
    `This Relic belongs to ${shortExpected}. Switch to that wallet to mint it.`
  );
  await expect(page.getByRole('button', { name: 'Mint to wallet' })).toHaveCount(0);

  // Evidence screenshots for wrong wallet
  await setThemeAndScreenshot(page, 'wrong-wallet', 1280, 720, 'dark');
  await setThemeAndScreenshot(page, 'wrong-wallet', 390, 844, 'light');
});

test('T9: same address different case displays normal Mint button', async ({
  page,
  request,
  context,
}) => {
  // Inject mock window.ethereum matching session.wallet
  await context.addInitScript(() => {
    const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    let currentAccount: string | null = null;
    (window as unknown as { __mockWallet: unknown }).__mockWallet = {
      setAccount: (addr: string | null) => {
        currentAccount = addr;
        const cbs = listeners['accountsChanged'] ?? [];
        for (const cb of cbs) {
          cb(addr ? [addr] : []);
        }
      },
    };
    (window as unknown as { ethereum: unknown }).ethereum = {
      isMetaMask: true,
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_accounts') return currentAccount ? [currentAccount] : [];
        if (method === 'eth_requestAccounts') return currentAccount ? [currentAccount] : [];
        if (method === 'eth_chainId') return '0xa869'; // 43113 Fuji
        if (method === 'net_version') return '43113';
        return null;
      },
      on: (ev: string, cb: (...args: unknown[]) => void) => {
        listeners[ev] = listeners[ev] ?? [];
        listeners[ev].push(cb);
      },
      removeListener: (ev: string, cb: (...args: unknown[]) => void) => {
        listeners[ev] = (listeners[ev] ?? []).filter((l) => l !== cb);
      },
    };
  });

  const session = await load(page, request, 'stocked');
  const sessionWalletUpper = `0x${session.wallet.slice(2).toUpperCase()}`;

  // Intercept v2-relic-forge so voucher player has UPPERCASE hex
  await page.route('**/functions/v1/v2-relic-forge', async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as {
      voucher?: { player: string };
      state?: { forge?: { pending?: { player: string } } };
    };
    if (json.voucher) {
      json.voucher.player = sessionWalletUpper;
    }
    if (json.state?.forge?.pending) {
      json.state.forge.pending.player = sessionWalletUpper;
    }
    await route.fulfill({ response, json });
  });

  // Connect wallet to session.wallet (lowercase)
  await page.evaluate((addr) => {
    (window as unknown as { __mockWallet: { setAccount: (a: string) => void } }).__mockWallet.setAccount(addr);
  }, session.wallet);

  const connectBtn = page.getByRole('button', { name: 'Connect wallet' });
  await expect(connectBtn).toBeVisible();
  await connectBtn.click();
  await expect(page.locator('.wallet-badge')).toBeVisible();

  // Go to Forge -> Relic tab and forge a Relic
  const forge = await tab(page, 'Forge');
  await forge.getByTestId('tab-relic').click();

  const relicBtn = forge.getByTestId('relic-forge-btn');
  await expect(relicBtn).toBeEnabled();
  await relicBtn.click();

  const confirmBtn = forge.getByTestId('relic-confirm-btn');
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // Address (lowercase) and voucher.player (uppercase) match case-insensitively:
  // Normal "Mint to wallet" button is visible and wrong-wallet warning is absent
  const mintBtn = page.getByRole('button', { name: 'Mint to wallet' });
  await expect(mintBtn).toBeVisible();
  await expect(page.getByTestId('mint-wrong-wallet')).toHaveCount(0);
});
