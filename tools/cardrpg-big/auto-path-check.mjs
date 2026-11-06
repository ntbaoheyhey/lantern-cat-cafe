import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const output = 'reports/cardrpg-big/auto/screens';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const rows = [];
const file = 'file://' + resolve('docs/cardrpg3/index.html');
const sizes = [[1280, 720], [1440, 900], [1024, 600]];
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(file);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    const screenshot = async name => page.screenshot({ path: `${output}/${width}-${name}.png` });
    const state = () => page.evaluate(() => {
      const m = window.__depthReview;
      return { screen: m.screen, battle: m.battle && JSON.parse(JSON.stringify(m.battle)), phase: m.animationAt, choices: m.battle?.choices.length, tutorial: m.state.tutorial };
    });
    await screenshot('hub');
    await page.getByRole('button', { name: /Team & cards/ }).click();
    assert.equal(await page.getByLabel(/card [123]/).count(), 0);
    await screenshot('team');
    await page.getByRole('button', { name: 'Cafe', exact: true }).click();
    await page.getByRole('button', { name: /Try the practice table/ }).click();
    await page.getByRole('heading', { name: 'Prepare your team', exact: true }).waitFor();
    await page.getByText(/\/5 simulated wins/).waitFor();
    await screenshot('prepare');
    await page.getByRole('button', { name: 'Fight', exact: true }).click();
    await page.waitForFunction(() => window.__depthReview?.battle?.choices.length >= 2);
    assert.equal(await page.getByRole('button', { name: /Play card|Defend|Pour energy/ }).count(), 0);
    assert.equal(await page.getByLabel('Auto', { exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await state();
    await page.waitForTimeout(350);
    const still = await state();
    assert.equal(still.choices, paused.choices);
    assert.equal(still.phase, paused.phase);
    await screenshot('paused');
    await page.getByLabel('Playback speed', { exact: true }).selectOption('2');
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    await page.getByRole('heading', { name: 'Victory', exact: true }).waitFor();
    const result = await state();
    await screenshot('result');
    await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
    await page.getByRole('heading', { name: 'Victory', exact: true }).waitFor({ timeout: 120000 });
    assert.deepEqual((await state()).battle, result.battle);
    await page.getByRole('button', { name: 'Close replay', exact: true }).click();
    await page.getByRole('button', { name: 'Complete lesson', exact: true }).click();
    assert.equal((await state()).tutorial, 3);
    await page.getByRole('button', { name: 'Open free welcome invitation', exact: true }).click();
    await page.getByRole('button', { name: /Save & settings/ }).click();
    await page.getByRole('button', { name: 'Unlock all cats and build materials', exact: true }).click();
    await page.getByRole('button', { name: 'Unlock chapters and Tower', exact: true }).click();
    await page.getByRole('button', { name: 'Cafe', exact: true }).click();
    await page.getByRole('button', { name: /Tangled Cafe/ }).click();
    const encounters = [];
    for (const id of ['0-0', '1-0', '2-0', '3-0', '4-0', '5-0', '6-0']) {
      const node = await page.evaluate(id => window.__depthReview.state.run.nodes.find(node => node.id === id), id);
      const nodeButton = page.locator('.dp-node:enabled').filter({ has: page.locator('b', { hasText: new RegExp(`^${node.kind}$`) }) }).first();
      await nodeButton.click();
      if (['battle', 'boss'].includes(node.kind)) {
        await page.getByRole('heading', { name: 'Prepare your team', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Fight', exact: true }).click();
        await page.waitForFunction(() => window.__depthReview?.battle?.choices.length >= 1);
        await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
        encounters.push((await state()).battle.result);
        await screenshot(node.kind === 'boss' ? 'boss-result' : `route-${id}`);
        await page.getByRole('button', { name: 'Continue to rewards', exact: true }).click();
        const rewards = page.locator('.dp-reward');
        if (await rewards.count()) await rewards.first().click();
      } else if (node.kind === 'event') {
        await page.locator('.cr-panel .dp-three button:enabled').first().click();
      } else if (node.kind === 'treasure') {
        await page.getByRole('button', { name: 'Take 70 run points', exact: true }).click();
      } else if (node.kind === 'shop') {
        await page.getByRole('button', { name: 'Save your points and leave', exact: true }).click();
      } else if (node.kind === 'campfire') {
        await page.getByRole('button', { name: 'Heal the team · 35% HP', exact: true }).click();
      }
    }
    assert.deepEqual(encounters, ['party', 'party', 'party']);
    await page.getByRole('button', { name: /Save & settings/ }).click();
    await page.getByRole('button', { name: 'Export save code', exact: true }).click();
    const save = await page.getByLabel('Save code', { exact: true }).inputValue();
    assert.ok(save.startsWith('THC7.'));
    assert.equal(await page.getByLabel('Playback speed', { exact: true }).inputValue(), '2');
    await page.getByRole('button', { name: 'Import save code', exact: true }).click();
    assert.equal((await state()).screen, 'hub');
    for (const mode of ['Daily challenge', 'Tower · best 0']) {
      await page.getByRole('button', { name: mode, exact: true }).click();
      await page.locator('.dp-node:enabled').first().click();
      await page.getByRole('button', { name: 'Fight', exact: true }).click();
      await page.waitForFunction(() => window.__depthReview?.battle?.choices.length >= 1);
      await page.getByRole('button', { name: 'Leave table', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
    await page.waitForFunction(() => window.__depthReview?.battle?.choices.length >= 1);
    await page.getByLabel('Playback speed', { exact: true }).selectOption('4');
    await page.getByRole('button', { name: 'Improve team', exact: true }).waitFor({ timeout: 120000 });
    await screenshot('watched-result');
    await page.getByRole('button', { name: 'Improve team', exact: true }).click();
    assert.equal((await state()).screen, 'team');
    assert.deepEqual(errors, []);
    rows.push({ width, height, passed: true, errors, campaignResults: encounters, saveBytes: save.length });
    console.log(JSON.stringify(rows.at(-1)));
    await page.close();
  }
} finally {
  await writeFile(`${output}/checks.json`, JSON.stringify({ method: 'Real UI clicks in fresh offline Chromium pages. Read-only evaluation inspects progress and node metadata. No policy-command playback.', rows }, null, 2));
  await browser.close();
}
