# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/baseline-hud.spec.ts >> guidance remains readable with fallback fonts and offline at 1280x720
- Location: e2e/ui/baseline-hud.spec.ts:157:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'Cat status' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('region', { name: 'Cat status' }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Cat status' })

```

# Test source

```ts
  1  | import { expect, test, type Page } from './test';
  2  | import type { APIRequestContext, BrowserContext } from '@playwright/test';
  3  | import { apiURL } from './server-ports';
  4  | import type { Session } from '../../src/wallet/session';
  5  | export { test, expect };
  6  | export interface Inspection {
  7  |   raw: { classId: string | null; progressRev: number; lastClaimMicros: number; level: number; chapter: number; fights: number;
  8  |     cooldownUntil: number | null; stacks: Record<string, number>; inventory: { id: string; slot: string; equipped: boolean; locked: boolean }[] };
  9  |   actions: { route: string; request_id: string; result: unknown }[];
  10 |   requests: { name: string; status: number; method: string; body: Record<string, unknown> }[];
  11 | }
  12 | export async function control<T>(request: APIRequestContext, path: string, data: object): Promise<T> {
  13 |   const response = await request.post(`${apiURL}/__test/${path}`, { data });
  14 |   expect(response.ok(), `local control ${path}: ${await response.text()}`).toBe(true);
  15 |   return response.json() as Promise<T>;
  16 | }
  17 | export const inspect = (request: APIRequestContext, session: Session) => control<Inspection>(request, 'inspect', { playerId: session.playerId });
  18 | export const advance = (request: APIRequestContext, session: Session, seconds: number) => control(request, 'advance', { playerId: session.playerId, seconds });
  19 | export async function install(context: BrowserContext, session: Session) {
  20 |   await context.route('**/*', route => {
  21 |     const url = new URL(route.request().url());
  22 |     return ['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort('blockedbyclient');
  23 |   });
  24 |   await context.addInitScript(session => {
  25 |     sessionStorage.setItem('taskbar-hero.session', JSON.stringify(session));
  26 |     localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  27 |   }, session);
  28 | }
  29 | export async function load(page: Page, request: APIRequestContext, kind = 'stocked') {
  30 |   const session = await control<Session>(request, 'session', { kind });
  31 |   await install(page.context(), session);
  32 |   // Freeze only the browser scheduler. Server time advances through a per-player local control.
  33 |   // Install before navigation with an epoch origin, then pause at wall time.
  34 |   // Reading the advancing browser clock and pausing at that reading races the
  35 |   // next protocol command: transport latency can make the target already past.
  36 |   await page.clock.install({ time: new Date(0) });
  37 |   await page.clock.pauseAt(new Date());
  38 |   await page.goto('/');
  39 |   // In AGR1 redesign, HUD/rail is hidden on onboarding class-picker (fresh session) until class is chosen.
  40 |   if (kind === 'fresh') {
  41 |     await expect(page.getByTestId('class-picker')).toBeVisible();
  42 |   } else {
> 43 |     await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
     |                                                                    ^ Error: expect(locator).toBeVisible() failed
  44 |     await expect(page.locator('header [data-sync-status="live"]')).toBeVisible();
  45 |   }
  46 |   const state = await inspect(request, session);
  47 |   expect(state.requests.some(r => r.name === 'v2-state' && r.status === 200)).toBe(true);
  48 |   expect(await page.evaluate(() => localStorage.getItem('taskbar-hero:v2-demo:1'))).toBeNull();
  49 |   return session;
  50 | }
  51 | export async function tab(page: Page, name: string) {
  52 |   const aliases: Record<string, string> = {
  53 |     Boss: 'Map',
  54 |     Character: 'Hero',
  55 |     Inventory: 'Bag',
  56 |   };
  57 |   const target = aliases[name] ?? name;
  58 |   let button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name: target, exact: true });
  59 |   if ((await button.count()) === 0) {
  60 |     button = page.getByRole('tablist', { name: 'Game panel tabs' }).getByRole('tab', { name, exact: true });
  61 |   }
  62 |   if ((await button.getAttribute('aria-selected')) !== 'true') await button.click();
  63 |   let panel = page.getByRole('tabpanel', { name: target, exact: true });
  64 |   if ((await panel.count()) === 0) {
  65 |     panel = page.getByRole('tabpanel', { name, exact: true });
  66 |   }
  67 |   await expect(panel).toBeVisible();
  68 |   return panel;
  69 | }
  70 | export async function visibility(page: Page, value: 'visible' | 'hidden') {
  71 |   // Headless bringToFront does not reliably hide tabs. Exercise real visibility listeners.
  72 |   await page.evaluate(value => {
  73 |     Object.defineProperty(document, 'visibilityState', { configurable: true, value });
  74 |     document.dispatchEvent(new Event('visibilitychange'));
  75 |   }, value);
  76 | }
  77 | 
```