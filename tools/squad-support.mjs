import { root, web, requireWeb, chromium, pinExistingFonts } from './visual-support.mjs';
export { root, web, requireWeb, chromium };
export async function openSquad(browser, { base = process.env.SQUAD_DEV_URL ?? 'http://127.0.0.1:5394', width = 1280, height = 720, calm = false, debug = true } = {}) {
  if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw Error('Squad review requires loopback');
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: calm ? 'reduce' : 'no-preference' });
  const errors = [], writes = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (!['GET', 'HEAD'].includes(r.method())) writes.push(r.method() + ' ' + r.url()); });
  await pinExistingFonts(page);
  await page.goto(base + '/?demo&squad=1' + (debug ? '&squadDebug=1' : ''));
  await page.waitForSelector('canvas'); await page.evaluate(() => document.fonts.ready);
  if (debug) {
    await page.waitForFunction(() => window.__squadReview?.scene.loaded);
    await page.evaluate(async root => {
      const [engine, config] = await Promise.all([import('/@fs' + root + '/packages/game-rules/src/squad/engine.ts'), import('/@fs' + root + '/packages/game-rules/src/squad/config.ts')]);
      window.__squadHarness = { ...engine, ...config };
    }, root);
  }
  return { page, errors, writes };
}
export async function freezeAt(page, time) {
  await page.evaluate(time => {
    const r = window.__squadReview;
    r.controller.running = true; r.controller.tick(time - r.controller.battle.time, false); r.controller.running = false;
    r.scene.invalidate(); r.scene.update(); r.game.step(performance.now(), 0); r.game.loop.sleep(); r.controller.notify();
  }, time);
}
