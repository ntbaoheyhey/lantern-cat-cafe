// REFERENCE: reports/cardrpg-big/look-ui/PLAN.md. PREPARATION ONLY.
// Render a labelled CSS candidate over the unchanged baseline using real navigation.
// This does not adopt unpublished B code or validate the future lookV2 live toggle.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';

const [width, height] = (process.env.LOOK_META_SIZE || '1280,720').split(',').map(Number);
const output = process.env.LOOK_META_OUT || `reports/cardrpg-big/look-ui/candidate/${width}`;
const baseline = resolve('docs/cardrpg3/baseline-v1.html');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const artifactSha256 = hash(await readFile(baseline));
assert.equal(artifactSha256, '9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
const tokenRaw = execFileSync('git', ['show', '663277c6:apps/web/src/game/cardrpg/look-tokens.json']);
const tokens = JSON.parse(tokenRaw);
const tokenCss = execFileSync('git', ['show', '663277c6:apps/web/src/game/cardrpg/look-tokens.css'], { encoding: 'utf8' });
const stylesheet = await readFile('apps/web/src/game/cardrpg/depth/look-meta.css', 'utf8');
let candidateCss = tokenCss + '\n' + stylesheet;
const textures = {};
for (const name of ['paper', 'felt', 'grain']) {
  const path = `assets/art/cardrpg-look-meta/${name}.png`, bytes = await readFile(path);
  textures[path] = hash(bytes);
  candidateCss = candidateCss.replace(`../../../../../../${path}`, `data:image/png;base64,${bytes.toString('base64')}`);
}
const vars = Object.fromEntries(Object.entries(tokens.rarities).flatMap(([rarity, values]) =>
  Object.entries(values).map(([name, value]) => [`--look-${rarity}-${name}`, String(value)])));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const errors = [], requests = [], rows = [];
let style;
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(String(error)));
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  page.setDefaultTimeout(30000);
  const nav = name => page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name, exact: true }).click();
  const previewReady = () => page.waitForFunction(() => {
    const scene = window.__depthPreviewScene;
    return scene?.ready && scene.stats.calls > 0 && scene.stats.triangles > 0;
  }, null, { timeout: 60000 });
  await page.goto('file://' + baseline);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  const capture = async (screen, mode) => {
    await page.locator('.cr-content').evaluate(e => e.scrollTo(0, 0));
    await page.locator('.cr-content img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const measured = await page.evaluate(() => {
      const app = document.querySelector('.dp-app');
      const bounds = element => {
        const r = element.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
      };
      const cards = [...document.querySelectorAll('.dp-formation-card .dp-cat')].map(bounds);
      const visible = [...document.querySelectorAll('.dp-cafe button,.dp-cafe select,.dp-cafe h1')]
        .filter(e => e.getClientRects().length && e.getBoundingClientRect().width > 0);
      const selectors = ['.cr-page-title h1', '.cr-sidebar nav button[aria-current]', '.cr-wallet small', '.cr-status',
        '.dp-team-heading strong', '.dp-cat .cr-card-caption small', '.dp-cat .dp-card-rarity',
        '.cr-filter label', '.dp-invitation-fairness', '.dp-fairness-pity span'];
      const text = selectors.flatMap(selector => [...app.querySelectorAll(selector)].slice(0, 4).map(e => {
        const style = getComputedStyle(e);
        const backgrounds = [];
        for (let p = e; p && p !== document.body; p = p.parentElement) {
          const ps = getComputedStyle(p);
          if (ps.backgroundColor !== 'rgba(0, 0, 0, 0)' || ps.backgroundImage !== 'none') backgrounds.push({
            tag: p.tagName, className: p.className, colour: ps.backgroundColor,
            image: ps.backgroundImage.replace(/data:[^)]+/g, 'data:original-texture') });
        }
        return { selector, text: e.textContent.trim().slice(0, 90), colour: style.color,
          fontSize: style.fontSize, fontWeight: style.fontWeight, bounds: bounds(e), backgrounds };
      }));
      const foil = app.querySelector('.dp-card-legendary .cr-portrait');
      return { horizontalOverflow: document.documentElement.scrollWidth - innerWidth,
        rightOverflow: visible.filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.textContent.trim().slice(0, 80)),
        cards, text, foil: foil ? { opacity: getComputedStyle(foil, '::before').opacity,
          zIndex: getComputedStyle(foil, '::before').zIndex, animation: getComputedStyle(foil, '::before').animationName,
          artZIndex: getComputedStyle(foil.querySelector('img')).zIndex } : null };
    });
    const path = `${output}/${screen}-${mode}.png`;
    await page.screenshot({ path });
    rows.push({ screen, mode, screenshot: path, sha256: hash(await readFile(path)), ...measured });
    await writeFile(`${output}/checks.json`, JSON.stringify({ artifactSha256, candidateCssSha256: hash(stylesheet),
      tokenSnapshot: '663277c6 unpublished preparation snapshot', tokenSha256: hash(tokenRaw), textures,
      method: 'CSS-only candidate injected for visual preparation, real navigation clicks. Not a new built artifact, functional acceptance, or live-flag test.',
      width, height, errors, requests, rows }, null, 2));
    assert.equal(measured.horizontalOverflow, 0, `${screen}/${mode} horizontal overflow`);
    assert.deepEqual(measured.rightOverflow, [], `${screen}/${mode} controls`);
    if (screen === 'team') assert(measured.cards.length === 3 && measured.cards.every(r => r.y >= 0 && r.bottom <= height), 'team cards fit');
    if (mode === 'candidate' && measured.foil) {
      assert.equal(measured.foil.animation, 'none', 'reduced-motion foil');
      assert(Number(measured.foil.artZIndex) > Number(measured.foil.zIndex), 'foil behind portrait');
    }
  };
  for (const [screen, label, preview] of [
    ['cafe', 'Cafe', true], ['team', 'Team & cards', false], ['collection', 'Companions', true],
    ['equipment', 'Equipment', true], ['invitations', 'Invitations', true],
  ]) {
    await nav(label);
    if (preview) await previewReady();
    const pause = page.getByRole('button', { name: 'Pause rotation', exact: true });
    if (await pause.count()) await pause.first().click();
    const stateBefore = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
    await capture(screen, 'before');
    style = await page.addStyleTag({ content: candidateCss });
    await page.locator('.dp-app').evaluate((app, vars) => {
      app.dataset.lookV2 = 'true';
      for (const [key, value] of Object.entries(vars)) app.style.setProperty(key, value);
    }, vars);
    await capture(screen, 'candidate');
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), stateBefore, 'cosmetic candidate preserves account');
    await style.evaluate(e => e.remove());
    await page.locator('.dp-app').evaluate((app, vars) => {
      delete app.dataset.lookV2;
      for (const key of Object.keys(vars)) app.style.removeProperty(key);
    }, vars);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  console.log(JSON.stringify({ output, width, height, captures: rows.length, errors, requests }));
} finally { await browser.close(); }
