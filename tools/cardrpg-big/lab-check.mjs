import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_LAB_OUT || 'reports/cardrpg-big/demo/screens';
const artifactBytes = await readFile(artifact);
const sha256 = createHash('sha256').update(artifactBytes).digest('hex');
assert(artifactBytes.length <= 24_000_000, 'Offline HTML exceeds the 24 MB gate');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [], requests = [], captures = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
    const opening = await page.evaluate(() => ({ frames: window.__cardFrameMeter.frames, maxMs: window.__cardFrameMeter.maxMs }));
    assert(opening.frames > 0, 'The frame meter must record before the first screen appears');
    const accountBefore = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    const drawer = page.getByRole('region', { name: 'Feel lab', exact: true });
    const capture = async name => {
      const layout = await drawer.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const body = element.querySelector('.dp-lab-body');
        return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
          pageOverflow: document.documentElement.scrollWidth - innerWidth,
          panelOverflow: element.scrollWidth - element.clientWidth,
          bodyOverflow: body.scrollWidth - body.clientWidth };
      });
      assert(layout.left >= 0 && layout.top >= 0 && layout.right <= width && layout.bottom <= height);
      assert.equal(layout.pageOverflow, 0);
      assert.equal(layout.panelOverflow, 0);
      assert.equal(layout.bodyOverflow, 0);
      const controls = await drawer.evaluate(element => {
        const luminance = color => {
          const [red, green, blue] = color.match(/[\d.]+/g).slice(0, 3).map(Number)
            .map(channel => channel / 255)
            .map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
          return red * .2126 + green * .7152 + blue * .0722;
        };
        const tabs = [...element.querySelectorAll('.dp-lab-tabs button')].map(button => {
          const style = getComputedStyle(button);
          const foreground = luminance(style.color), background = luminance(style.backgroundColor);
          return { text: button.textContent, selected: button.getAttribute('aria-pressed'),
            foreground: style.color, background: style.backgroundColor,
            contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
        });
        const checks = [...element.querySelectorAll('input[type=checkbox]')].map(input => {
          const label = input.closest('label');
          const text = [...label.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
          const range = document.createRange();
          range.selectNode(text);
          const inputBox = input.getBoundingClientRect(), textBox = range.getBoundingClientRect();
          return { text: text.textContent.trim(), gap: textBox.left - inputBox.right,
            centerDifference: Math.abs(inputBox.top + inputBox.height / 2 - textBox.top - textBox.height / 2) };
        });
        return { tabs, checks };
      });
      for (const tab of controls.tabs) assert(tab.contrast >= 4.5, `${tab.text} contrast ${tab.contrast} is below 4.5`);
      for (const check of controls.checks) {
        assert(check.gap >= 0 && check.gap <= 12, `${check.text} is detached from its checkbox`);
        assert(check.centerDifference <= 3, `${check.text} is vertically misaligned`);
      }
      const path = `${output}/${width}-${name}.png`;
      await page.screenshot({ path });
      captures.push({ name, path, layout, controls });
    };
    await capture('gallery-home');
    await drawer.getByRole('button', { name: 'Before / after', exact: true }).click();
    await capture('comparison');
    await drawer.getByRole('button', { name: 'Motion', exact: true }).click();
    await capture('motion');
    await drawer.getByRole('button', { name: 'Brief checklist', exact: true }).click();
    assert.equal(await drawer.locator('.dp-brief-list li').count(), 12);
    await capture('checklist');
    await drawer.getByRole('button', { name: 'Open invitations', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__depthReview.screen), 'gacha');
    assert.equal(await drawer.count(), 0);
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    await drawer.getByRole('button', { name: 'Performance', exact: true }).click();
    await drawer.getByLabel('Show live frame overlay').check();
    await page.waitForFunction(() => document.querySelector('.dp-frame-overlay output')?.textContent.includes('Max'));
    await capture('performance');
    await drawer.getByRole('button', { name: 'Skill gallery', exact: true }).click();
    await drawer.getByLabel('Preview action', { exact: false }).selectOption('clover-4');
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await drawer.getByLabel('Preview camera').selectOption('far');
    await drawer.getByLabel('Preview speed').selectOption('0.25');
    await drawer.getByLabel('Effect only', { exact: true }).check();
    await drawer.getByRole('slider', { name: 'Action progress', exact: true }).press('End');
    const preview = await page.evaluate(() => {
      const m = window.__depthReview;
      return { id: m.galleryId, ratio: m.animationAt / m.plan.duration, speed: m.gallerySpeed, camera: m.camera, effectOnly: m.galleryEffectOnly };
    });
    assert(Math.abs(preview.ratio - .999) < 1e-9);
    assert.deepEqual({ ...preview, ratio: .999 }, { id: 'clover-4', ratio: .999, speed: .25, camera: 'far', effectOnly: true });
    await capture('gallery-stage');
    await drawer.getByRole('button', { name: 'Play preview', exact: true }).click();
    await page.waitForFunction(() => window.__depthReview.plan === null, null, { timeout: 20000 });
    await drawer.getByRole('button', { name: 'Return to cafe', exact: true }).click();
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), accountBefore);
    assert.equal(await page.evaluate(() => window.__depthReview.showBattle), false);
    const closing = await page.evaluate(() => {
      const meter = window.__cardFrameMeter;
      return { frames: meter.frames, maxMs: meter.maxMs, above25: meter.above25, above50: meter.above50, ringSize: meter.samples.length };
    });
    assert(closing.frames > opening.frames && closing.maxMs >= opening.maxMs);
    assert.equal(closing.ringSize, 240);
    await page.getByRole('button', { name: 'Hide frame overlay', exact: true }).click();
    assert.equal(await page.getByRole('complementary', { name: 'Live frame performance' }).count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    rows.push({ width, height, captures, preview, opening, closing, errors, requests, accountRestored: true });
    await writeFile(`${output}/checks.json`, JSON.stringify({ artifact, sha256, bytes: artifactBytes.length,
      method: 'Fresh offline pages and real lab/gallery/checklist/performance clicks. Screenshots verify layout. Overlay counts include screenshot overhead and are diagnostic only. Controlled performance uses the separate raw-frame harness.', rows }, null, 2));
    console.log(JSON.stringify({ width, captures: captures.length, errors: errors.length, requests: requests.length }));
    await context.close();
  }
} finally { await browser.close(); }
