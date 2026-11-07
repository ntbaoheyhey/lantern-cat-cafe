// Adapted from the accepted A portrait harness; only this B-owned copy expands all12 IDs.
// One size/DPR per external timing lock;2 navigation+4 A/B actions, no timing claims.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const expected = process.env.LOOK_PORTRAIT_SHA;
assert(expected?.match(/^[a-f0-9]{64}$/), 'Pin the new adopted artifact with LOOK_PORTRAIT_SHA; never reuse L0 receipts');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const artifactSha256 = hash(await readFile(artifact));
assert.equal(artifactSha256, expected);
const manifestPath = 'apps/web/src/game/cardrpg/look-assets.json';
const manifestBytes = await readFile(manifestPath), manifest = JSON.parse(manifestBytes);
assert.equal(manifest.version, 2); assert.equal(manifest.pathBase, 'repository-root');
const ids = Object.keys(manifest.portraits);
assert.equal(ids.length,12);
for (const id of ids) assert(manifest.portraits[id]?.portrait?.['2x'], `${id}: published density pair required`);
const [width, height, dpr] = (process.env.LOOK_PORTRAIT_CONFIG || '1280,720,1').split(',').map(Number);
assert([1, 2].includes(dpr));
assert([[1024, 600], [1280, 720], [1440, 900]].some(pair => pair[0] === width && pair[1] === height));
const output = process.env.LOOK_PORTRAIT_OUT || `reports/cardrpg-big/look-ui/l1-portraits/${width}-dpr${dpr}`;
await mkdir(output, { recursive: true });
const receipt = { artifact, artifactSha256, manifestSha256: hash(manifestBytes), width, height, dpr,
  harnessSha256: hash(await readFile(import.meta.filename)), errors: [], remote: [], portraits: [], toggles: [], captures: [],
  method: 'Real offline navigation/Look A/B clicks; resolved currentSrc and decoded bitmap dimensions. Crop review is separate. No timing/visual-quality acceptance.' };
const save = () => writeFile(`${output}/checks.json`, JSON.stringify(receipt, null, 2) + '\n');
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => receipt.errors.push(String(e)));
  page.on('console', message => { if (message.type() === 'error') receipt.errors.push(message.text()); });
  page.on('request', r => { if (/^https?:/.test(r.url())) receipt.remote.push(r.url()); });
  await page.goto('file://' + artifact);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
  const state = () => page.evaluate(() => JSON.stringify({ account: window.__depthReview.state,
    screen: window.__depthReview.screen, selected: window.__depthReview.selectedCat }));
  const capture = async (name, locator = page) => {
    const path = `${output}/${name}.png`; await locator.screenshot({ path });
    receipt.captures.push({ path, sha256: hash(await readFile(path)) });
  };
  for (const [screen, label] of [['collection', 'Companions'], ['team', 'Team & cards']]) {
    await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: label, exact: true }).click();
    const before = await state();
    const screenIds = screen === 'collection' ? ids : await page.evaluate(() => window.__depthReview.state.team);
    assert(screenIds.length > 0 && screenIds.every(id => ids.includes(id)));
    for (const mode of ['off', 'on']) {
      const on = mode === 'on';
      if (await page.locator('.dp-app').getAttribute('data-look-v2') !== String(on))
        await page.getByRole('button', { name: 'Look A/B', exact: true }).click();
      assert.equal(await page.locator('.dp-app').getAttribute('data-look-v2'), String(on));
      assert.equal(await state(), before, 'Live A/B preserves account/route/selection');
      receipt.toggles.push({ screen, mode, preservedState: true });
      for (const id of screenIds) {
        const image = page.getByRole('button', { name: new RegExp(`^${id},`, 'i') }).locator('.cr-portrait img').first();
        await image.scrollIntoViewIfNeeded();
        const measurement = await image.evaluate(async (img, { id, entry, on }) => {
          await img.decode();
          const registry = window.__cardAssets;
          const classic = registry[`assets/cardrpg3/portraits/${id}.webp`];
          const one = registry[entry['1x']], two = registry[entry['2x']];
          const bitmap = await createImageBitmap(await (await fetch(img.currentSrc)).blob());
          const result = { current: img.currentSrc === classic ? 'classic' : img.currentSrc === one ? '1x' : img.currentSrc === two ? '2x' : 'unknown',
            srcMatches: img.getAttribute('src') === (on ? one : classic),
            srcSetMatches: on ? img.getAttribute('srcset') === `${one} 1x, ${two} 2x` : !img.hasAttribute('srcset'),
            decodedWidth: bitmap.width, decodedHeight: bitmap.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
            objectFit: getComputedStyle(img).objectFit, bounds: img.getBoundingClientRect().toJSON() };
          bitmap.close(); return result;
        }, { id, entry: manifest.portraits[id].portrait, on });
        receipt.portraits.push({ screen, mode, id, ...measurement }); await save();
        assert(measurement.srcMatches && measurement.srcSetMatches, `${id}: source contract`);
        if (on) {
          assert(['1x', '2x'].includes(measurement.current));
          if (dpr === 2) assert.equal(measurement.current, '2x', `${id}: high-DPR source`);
          assert.equal(measurement.decodedWidth, measurement.current === '2x' ? 512 : 256);
          assert.equal(measurement.decodedHeight, measurement.current === '2x' ? 640 : 320);
        } else assert.equal(measurement.current, 'classic');
        assert.equal(measurement.objectFit, 'contain');
        assert(measurement.bounds.width > 0 && measurement.bounds.height > 0, `${id}: visible portrait`);
        if (on && width === 1280 && dpr === 1)
          await capture(`${screen}-${id}-on`, image.locator('..'));
        // All12 decoded individually; one full UI screenshot per screen/mode below.
      }
      if (screen === 'collection' && !manifest.portraits.marigold) {
        const fallback = page.getByRole('button', { name: /^Marigold,/ }).locator('.cr-portrait img').first();
        const unchanged = await fallback.evaluate(async img => {
          await img.decode();
          return img.currentSrc === window.__cardAssets['assets/cardrpg3/portraits/marigold.webp'] && !img.hasAttribute('srcset');
        });
        assert(unchanged, 'Unpublished cat keeps its classic portrait in both modes');
        receipt.portraits.push({ screen, mode, id: 'marigold', fallbackUnchanged: true });
      }
      await page.locator('.cr-content').evaluate(e => e.scrollTo(0, 0));
      // Collection uses content-visibility:auto. Let the restored viewport
      // paint before capturing it after visiting offscreen cards.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${screen}/${mode}: horizontal overflow`);
      await capture(`${screen}-${mode}`);
    }
  }
  assert.deepEqual(receipt.errors, []); assert.deepEqual(receipt.remote, []);
  assert.equal(hash(await readFile(artifact)), artifactSha256);
  receipt.passed = true;
  console.log(JSON.stringify({ output, portraits: receipt.portraits.length, toggles: receipt.toggles.length, passed: true }));
} finally { await save(); await browser.close(); }
