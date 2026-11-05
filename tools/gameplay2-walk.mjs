// Normal-clock, separate browser profiles; real MockGameApiV2 seeds, no grants.
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root, pinExistingFonts } from './visual-support.mjs';
const phase = process.argv[2] ?? 'before-corrected', base = process.argv[3] ?? 'http://127.0.0.1:5490';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw Error('Loopback only');
const out = resolve(root, 'reports/gameplay2'); mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [seed, style] of [[11, 'idle'], [29, 'active'], [47, 'minmax']]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(5000); page.setDefaultNavigationTimeout(30_000);
    const errors = [], actions = [], samples = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => ['127.0.0.1', 'localhost'].includes(new URL(r.request().url()).hostname) ? r.continue() : r.abort());
    await pinExistingFonts(page);
    await page.addInitScript(seed => { let s = seed; Math.random = () => ((s = Math.imul(s, 1664525) + 1013904223 >>> 0) / 4294967296); }, seed);
    await page.goto(base + '/?demo&coach=off#home');
    await page.waitForFunction(() => window.__g1Loop);
    await page.evaluate(async seed => {
      const { MockGameApiV2 } = await import('/src/api/MockGameApiV2.ts');
      window.__g1Loop.switchApi(new MockGameApiV2({ seed, storage: null }));
      window.__walkEvents = []; window.__g1Loop.onEvent(e => window.__walkEvents.push(e));
    }, seed);
    await page.getByTestId('class-picker-choose-button').click();
    await page.getByTestId('home-dashboard').waitFor();
    const start = Date.now(); let lastSlot = -1, attempts = 0;
    const action = async (name, fn) => {
      try { await fn(); actions.push({ t: (Date.now() - start) / 1000, name, ok: true }); }
      catch (e) { actions.push({ t: (Date.now() - start) / 1000, name, ok: false, error: String(e).slice(0, 160) }); }
    };
    const nav = id => page.getByTestId('nav-' + id).click();
    console.log(JSON.stringify({ phase, style, seed, start: new Date(start).toISOString() }));
    while (Date.now() - start < 600_000) {
      const back = page.getByRole('button', { name: 'Back to exploring', exact: true });
      if (await back.isVisible()) await action('Leave the boss result', () => back.click());
      const t = (Date.now() - start) / 1000, slot = Math.floor(t / 20);
      if (slot !== lastSlot) {
        lastSlot = slot;
        if (style !== 'idle' && slot > 0) {
          if (slot % 3 === 1) await action('Compare and equip available gear', async () => {
            await nav('bag'); const b = page.getByRole('button', { name: 'Equip best', exact: true });
            if (await b.isEnabled()) await b.click(); else throw Error('No better gear');
          });
          if (slot % 3 === 2) await action('Choose and craft affordable gear', async () => {
            await nav('forge'); await page.getByTestId('slot-helmet').click(); await page.getByTestId('rarity-common').click();
            const b = page.getByTestId('craft-btn');
            if (await b.isEnabled()) { await b.click(); await page.getByTestId('craft-confirm-btn').click(); }
            else throw Error('Recipe not affordable');
          });
          if (slot % 3 === 0) await action('Read home goals', () => nav('home'));
        }
        if (slot % 3 === 0) await page.screenshot({ path: resolve(out, `${phase}-${style}-${seed}-minute-${Math.floor(t / 60)}.png`) });
      }
      const s = await page.evaluate(() => ({ state: window.__g1Loop.getSnapshot().state, events: window.__walkEvents, text: document.body.innerText }));
      samples.push({ t: (Date.now() - start) / 1000, cat: s.state.cat, progress: s.state.progress, currencies: s.state.currencies,
        items: s.state.inventory.map(i => ({ id: i.id, rarity: i.rarity, equipped: i.equipped })),
        goals: s.text.match(/Next Goal[\s\S]{0,240}/)?.[0] ?? null });
      if (s.state.progress.round === 10 && s.state.progress.kills >= s.state.progress.killsPerRound && s.state.currencies.keys > 0 && (attempts === 0 || style === 'minmax' && slot % 3 === 0 && t > 420)) {
        await action('Attempt chapter boss', async () => { await nav('map'); const b = page.getByRole('button', { name: 'Fight', exact: true });
          if (await b.isEnabled()) { await b.click(); attempts++; } else throw Error('Boss unavailable'); });
      }
      writeFileSync(resolve(out, `${phase}-${style}-${seed}.json`), JSON.stringify({ phase, base, seed, style, clock: 'normal wall clock',
        source: phase.startsWith('before') ? '7eb1ee7ef052ec90ee2cbc9e2299b185c8ab11b5' : 'working candidate', start, duration: (Date.now() - start) / 1000, actions, samples, events: s.events, errors }));
      await page.waitForTimeout(500);
    }
    console.log(JSON.stringify({ phase, style, seed, duration: (Date.now() - start) / 1000, actions: actions.length, errors }));
    await page.close();
  }
} finally { await browser.close(); }
