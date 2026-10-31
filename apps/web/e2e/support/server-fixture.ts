import { expect, test, type Page } from './test';
import type { APIRequestContext, BrowserContext } from '@playwright/test';
import { apiURL } from './server-ports';
import type { Session } from '../../src/wallet/session';
export { test, expect };
export interface Inspection {
  raw: { classId: string | null; progressRev: number; lastClaimMicros: number; level: number; chapter: number; fights: number;
    cooldownUntil: number | null; stacks: Record<string, number>; inventory: { id: string; slot: string; equipped: boolean; locked: boolean }[] };
  actions: { route: string; request_id: string; result: unknown }[];
  requests: { name: string; status: number; method: string; body: Record<string, unknown> }[];
}
export async function control<T>(request: APIRequestContext, path: string, data: object): Promise<T> {
  const response = await request.post(`${apiURL}/__test/${path}`, { data });
  expect(response.ok(), `local control ${path}: ${await response.text()}`).toBe(true);
  return response.json() as Promise<T>;
}
export const inspect = (request: APIRequestContext, session: Session) => control<Inspection>(request, 'inspect', { playerId: session.playerId });
export const advance = (request: APIRequestContext, session: Session, seconds: number) => control(request, 'advance', { playerId: session.playerId, seconds });
export async function install(context: BrowserContext, session: Session) {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return ['localhost', '127.0.0.1'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol) ? route.continue() : route.abort('blockedbyclient');
  });
  await context.addInitScript(session => {
    sessionStorage.setItem('taskbar-hero.session', JSON.stringify(session));
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  }, session);
}
export async function load(page: Page, request: APIRequestContext, kind = 'stocked') {
  const session = await control<Session>(request, 'session', { kind });
  await install(page.context(), session);
  // Freeze only the browser scheduler. Server time advances through a per-player local control.
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now()));
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Cat status' })).toBeVisible();
  await expect(page.locator('header [data-sync-status="live"]')).toBeVisible();
  const state = await inspect(request, session);
  expect(state.requests.some(r => r.name === 'v2-state' && r.status === 200)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('taskbar-hero:v2-demo:1'))).toBeNull();
  return session;
}
export async function tab(page: Page, name: string) {
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
export async function visibility(page: Page, value: 'visible' | 'hidden') {
  // Headless bringToFront does not reliably hide tabs. Exercise real visibility listeners.
  await page.evaluate(value => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value });
    document.dispatchEvent(new Event('visibilitychange'));
  }, value);
}
