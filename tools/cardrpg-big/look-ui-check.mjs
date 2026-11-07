// REFERENCE: reports/cardrpg-big/look-ui/PLAN.md. Requires the shared timing lock.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';

const [width, height] = (process.env.LOOK_META_SIZE || '1280,720').split(',').map(Number);
const output = process.env.LOOK_META_OUT || `reports/cardrpg-big/look-ui/l0/${width}`;
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const receipt = { artifact, artifactSha256: hash(await readFile(artifact)), harnessSha256: hash(await readFile(import.meta.filename)),
  method: 'Built artifact, real navigation and Look A/B clicks; viewport images and transparent-text background samples. No timing acceptance claim.',
  width, height, errors: [], requests: [], rows: [], toggles: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const save = () => writeFile(`${output}/checks.json`, JSON.stringify(receipt, null, 2));
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => receipt.errors.push(String(error)));
  page.on('request', request => { if (/^https?:/.test(request.url())) receipt.requests.push(request.url()); });
  const previewReady = () => page.waitForFunction(() => {
    const scene = window.__depthPreviewScene;
    return scene?.ready && scene.stats.calls > 0 && scene.stats.triangles > 0;
  }, null, { timeout: 60000 });
  await page.goto('file://' + artifact);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  assert.equal(await page.locator('.dp-app').getAttribute('data-look-v2'), 'true', 'explicit LOOK demo starts ON');
  const capture = async (screen, mode) => {
    await page.locator('.cr-content').evaluate(e => e.scrollTo(0, 0));
    await page.locator('.cr-content img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const measured = await page.evaluate(() => {
      const bounds = r => ({ x: r.x, y: r.y, width: r.width, height: r.height });
      const app = document.querySelector('.dp-app'), texts = [];
      const walker = document.createTreeWalker(document.querySelector('.dp-cafe'), NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        const e = n.parentElement, value = n.textContent.trim(), style = getComputedStyle(e);
        if (!value || ['STYLE','SCRIPT','OPTION'].includes(e.tagName) || style.visibility !== 'visible' || style.display === 'none') continue;
        const range = document.createRange(); range.selectNodeContents(n);
        let opacity = 1; for (let p = e; p; p = p.parentElement) opacity *= Number(getComputedStyle(p).opacity);
        for (const r of range.getClientRects()) {
          if (r.width < 2 || r.height < 2 || r.x < 0 || r.y < 0 || r.right > innerWidth || r.bottom > innerHeight) continue;
          if (!document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).includes(e)) continue;
          texts.push({ text: value.slice(0, 100), tag: e.tagName, className: e.className,
            colour: style.color, fontSize: style.fontSize, fontWeight: style.fontWeight, opacity, disabled: !!e.closest(':disabled'), bounds: bounds(r) });
        }
      }
      const controls = [...app.querySelectorAll('.dp-cafe button,.dp-cafe select,.dp-cafe h1')].filter(e => e.getClientRects().length);
      const cards = [...app.querySelectorAll('.dp-formation-card .dp-cat')].map(e => bounds(e.getBoundingClientRect()));
      const foil = [...app.querySelectorAll('.dp-cat .cr-portrait')].map(e => ({
        opacity: getComputedStyle(e,'::before').opacity, animation: getComputedStyle(e,'::before').animationName,
        zIndex: getComputedStyle(e,'::before').zIndex, artZIndex: getComputedStyle(e.querySelector('img')).zIndex }));
      return { horizontalOverflow: document.documentElement.scrollWidth-innerWidth,
        rightOverflow: controls.filter(e => e.getBoundingClientRect().right > innerWidth+1).map(e => e.textContent.slice(0,100)),
        cards, texts, foil };
    });
    const path = `${output}/${screen}-${mode}.png`;
    await page.screenshot({ path });
    const row = { screen, mode, screenshot: path, sha256: hash(await readFile(path)), ...measured };
    if (mode === 'on') {
      const mask = await page.addStyleTag({ content: '.dp-cafe,.dp-cafe *,.dp-cafe *::before,.dp-cafe *::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}' });
      row.background = `${output}/${screen}-text-background.png`;
      await page.screenshot({ path: row.background });
      row.backgroundSha256 = hash(await readFile(row.background));
      await mask.evaluate(e => e.remove());
    }
    receipt.rows.push(row); await save();
    assert.equal(measured.horizontalOverflow, 0, screen + ' viewport overflow');
    assert.deepEqual(measured.rightOverflow, [], screen + ' controls fit');
    if (screen === 'team') assert(measured.cards.length === 3 && measured.cards.every(r => r.y >= 0 && r.y+r.height <= height), 'team cards fit');
    if (mode === 'on') for (const f of measured.foil) {
      assert.equal(f.animation, 'none', 'reduced motion');
      assert(Number(f.artZIndex) > Number(f.zIndex), 'foil behind portrait');
    }
  };
  for (const [screen, label, preview] of [
    ['cafe','Cafe',true], ['team','Team & cards',false], ['collection','Companions',true],
    ['equipment','Equipment',true], ['invitations','Invitations',true],
  ]) {
    await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:label,exact:true}).click();
    if (preview) await previewReady();
    const pause = page.getByRole('button',{name:'Pause rotation',exact:true});
    if (await pause.count()) await pause.first().click();
    const before = await page.evaluate(() => JSON.stringify({ state:window.__depthReview.state,screen:window.__depthReview.screen,selected:window.__depthReview.selectedCat }));
    for (const mode of ['off','on']) {
      if (preview) await page.evaluate(() => { window.__lookPreviousScene = window.__depthPreviewScene; });
      await page.getByRole('button',{name:'Look A/B',exact:true}).click();
      assert.equal(await page.locator('.dp-app').getAttribute('data-look-v2'), String(mode==='on'));
      if (preview) {
        await page.waitForFunction(() => window.__depthPreviewScene && window.__depthPreviewScene !== window.__lookPreviousScene);
        await previewReady();
      }
      const after = await page.evaluate(() => JSON.stringify({ state:window.__depthReview.state,screen:window.__depthReview.screen,selected:window.__depthReview.selectedCat }));
      assert.equal(after,before,'toggle preserves model state and screen');
      receipt.toggles.push({ screen,mode,preservedState:true,recreatedPreview:preview });
      await capture(screen,mode);
    }
  }
  assert.deepEqual(receipt.errors, []); assert.deepEqual(receipt.requests, []);
  await save(); console.log(JSON.stringify({output,captures:receipt.rows.length,toggles:receipt.toggles.length,errors:receipt.errors}));
} finally { await save(); await browser.close(); }
