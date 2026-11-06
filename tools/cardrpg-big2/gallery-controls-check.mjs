// REFERENCE: ReviewStudio.tsx; studio.css. Actual computed controls, not stylesheet inference.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const artifact = process.env.BIG_ARTIFACT || '/tmp/cardrpg-big2-lab-polish-index.html';
const output = process.env.BIG_GALLERY_CONTROLS_OUT || 'reports/cardrpg-big2/review/gallery-controls-before';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [], errors = [];
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: 'Review studio', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await page.getByRole('button', { name: 'Skill gallery', exact: true }).hover();
    const controls = await page.evaluate(() => {
      const rect = r => ({ x: r.x, y: r.y, width: r.width, height: r.height });
      const checkboxes = [...document.querySelectorAll('.b2-gallery-tools input[type=checkbox]')].map(input => {
        const label = input.closest('label'), text = [...label.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
        const range = document.createRange(); range.selectNodeContents(text);
        const box = input.getBoundingClientRect(), caption = range.getBoundingClientRect();
        return { text: text.textContent.trim(), box: rect(box), caption: rect(caption), gap: caption.x - box.right, centerOffset: Math.abs(box.y + box.height / 2 - caption.y - caption.height / 2) };
      });
      const tab = document.querySelector('.b2-studio nav button[aria-pressed=true]'), style = getComputedStyle(tab);
      const luminance = color => {
        const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      };
      const a = luminance(style.color), b = luminance(style.backgroundColor);
      return { checkboxes, stage: rect(document.querySelector('.b2-gallery-stage').getBoundingClientRect()), tab: { color: style.color, background: style.backgroundColor, contrast: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) }, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    rows.push({ width, height, ...controls });
    await page.screenshot({ path: `${output}/${width}-gallery.png` });
    if (process.env.BIG_GALLERY_EXPECT_POLISH === '1') {
      assert.equal(controls.checkboxes.length, 2);
      for (const c of controls.checkboxes) { assert.ok(c.box.width >= 16 && c.box.width <= 22); assert.ok(c.box.height >= 16 && c.box.height <= 22); assert.ok(c.gap >= 5 && c.gap <= 14); assert.ok(c.centerOffset <= 3); }
      assert.ok(controls.tab.contrast >= 4.5); assert.equal(controls.overflow, false);
      if (process.env.BIG_GALLERY_EXPECT_FIT === '1') assert.ok(controls.stage.y + controls.stage.height <= height, JSON.stringify(controls.stage));
    }
    if (process.env.BIG_GALLERY_EXPECT_FOCUS === '1') {
      const before = await page.evaluate(() => {
        window.__b2FocusModel = window.__b2Gallery;
        return { id: window.__b2Gallery.galleryId, camera: window.__b2Gallery.camera, at: window.__b2Gallery.animationAt };
      });
      await page.getByRole('button', { name: 'Focus stage', exact: true }).click();
      const focus = await page.evaluate(() => {
        const r = document.querySelector('.b2-gallery-stage').getBoundingClientRect(), m = window.__b2Gallery;
        return { stage: { x:r.x,y:r.y,width:r.width,height:r.height }, sameModel: m === window.__b2FocusModel,
          selection:{id:m.galleryId,camera:m.camera,at:m.animationAt}, overflow:document.documentElement.scrollWidth>innerWidth };
      });
      rows.at(-1).focus = focus;
      await page.screenshot({ path: `${output}/${width}-focused.png` });
      assert.equal(focus.sameModel, true); assert.deepEqual(focus.selection, before);
      assert.ok(focus.stage.height >= controls.stage.height + 80, JSON.stringify(focus));
      assert.ok(focus.stage.y + focus.stage.height <= height); assert.equal(focus.overflow, false);
      assert.equal(await page.getByRole('button', { name: 'Play preview', exact: true }).isVisible(), true);
      assert.equal(await page.getByRole('button', { name: 'Preview sound off', exact: true }).isVisible(), true);
      await page.getByRole('button', { name: 'Show controls', exact: true }).click();
      assert.equal(await page.getByLabel('Gallery unit', { exact: true }).isVisible(), true);
      assert.equal(await page.evaluate(() => window.__b2Gallery === window.__b2FocusModel), true);
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await writeFile(`${output}/checks.json`, JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), rows, errors }, null, 2));
}
console.log(JSON.stringify({ rows, errors }));
