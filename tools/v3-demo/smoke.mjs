/** Real-click live/file:// smoke. Review hooks below only observe state. */
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const {chromium, expect} = require('@playwright/test');
const sharp = require('sharp');
const mode = process.argv.includes('--static') ? 'static' : 'live';
const width = process.argv.includes('--1440') ? 1440 : 1280;
const height = width === 1440 ? 900 : 720;
const id = `${mode}-${width}`;
const out = resolve(root, 'reports/v3-demo');
await mkdir(resolve(out, 'shots'), {recursive: true});
const report = {id, started: new Date().toISOString(), viewport: {width, height},
  source: 'Fresh account; real UI clicks; no save injection, combat mutation, or skipped result.',
  errors: [], externalRequests: [], shots: [], visits: []};
const browser = await chromium.launch({headless: true, args: ['--use-angle=metal']});
const context = await browser.newContext({viewport: {width, height}});
if (mode === 'static') await context.route(/^https?:/, async route => {
  report.externalRequests.push(route.request().url());
  await route.abort();
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', error => report.errors.push({kind: 'pageerror', message: error.message}));
page.on('console', message => {
  if (message.type() === 'error') report.errors.push({kind: 'console', message: message.text()});
});
const step = name => {report.visits.push(name); console.log(`${id}: ${name}`);};
async function coach() {
  const tutorial = page.getByRole('dialog', {name: 'Tutorial', exact: true});
  try {await tutorial.waitFor({timeout: 1800});}
  catch {return;}
  await tutorial.getByRole('button', {name: 'Skip', exact: true}).click();
}
async function celebrations() {
  for (const name of ['Dismiss celebration', 'Skip celebration']) {
    const button = page.getByRole('button', {name, exact: true});
    if (await button.isVisible()) await button.click();
  }
}
async function closeSheet(name) {
  await page.getByRole('dialog', {name, exact: true}).getByRole('button', {name: 'Close', exact: true}).click();
  await page.getByRole('button', {name: /^Fight/}).waitFor();
}
async function shot(name) {
  await page.waitForTimeout(250);
  const file = `${id}-${name}.png`;
  await sharp(await page.screenshot()).resize({width: 1280, withoutEnlargement: true}).png().toFile(resolve(out, 'shots', file));
  const layout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    broken: [...document.images].filter(image => image.getClientRects().length && getComputedStyle(image).visibility !== 'hidden' && !image.naturalWidth).map(image => image.getAttribute('src')),
  }));
  report.shots.push({name, file, ...layout});
}
async function waitVictory(campaign = false) {
  const started = Date.now();
  let ultimateShot = false;
  while (Date.now() - started < 600000) {
    const state = await page.evaluate(() => {
      const m = window.__depthReview;
      return {screen: m?.screen, result: m?.battle?.result,
        ultimate: !!m?.plan?.ultimate, at: m?.animationAt ?? 0,
        plate: m?.plan?.sequence?.plate, round: m?.battle?.round};
    });
    if (campaign && !ultimateShot && state.ultimate && state.plate && state.at >= state.plate.start && state.at < state.plate.end) {
      await shot('04-ultimate'); ultimateShot = true; step('ultimate cinematic displayed');
    }
    if (state.screen === 'result') {
      expect(state.result).toBe('party');
      await expect(page.getByRole('heading', {name: 'Victory', exact: true})).toBeVisible();
      if (campaign) {
        report.battle = await page.evaluate(() => {
          const m = window.__depthReview, b = m.battle;
          return {result: b.result, round: b.round, seed: b.initial.seed,
            ultimates: b.log.filter(event => event.kind === 'action' && event.skillId.endsWith('-4')).map(event => ({round: event.round, skill: event.skillId})),
            rewards: [...document.querySelectorAll('[data-reward-id]')].map(node => node.getAttribute('aria-label') || node.textContent),
            audioReady: window.__thAudio.ready,
            voice: window.__thAudio.hits.filter(hit => hit.id.startsWith('voice.') && hit.id.includes('.ult.') && hit.result === 'played').map(hit => hit.id),
            packs: window.__thAudio.diagnostics.packs};
        });
        expect(report.battle.ultimates.length).toBeGreaterThan(0);
        expect(report.battle.voice.length).toBeGreaterThan(0);
        expect(report.battle.rewards.length).toBeGreaterThan(0);
        expect(ultimateShot).toBe(true);
        report.battle.elapsedMs = Date.now() - started;
      }
      return;
    }
    await page.waitForTimeout(350);
  }
  throw new Error('Battle did not reach victory within 10 minutes.');
}
try {
  await page.goto(mode === 'live' ? 'http://localhost:5994' : `file://${root}/docs/cardrpg-v3-demo/index.html`);
  await expect(page.getByRole('button', {name: 'Play free', exact: true})).toBeEnabled({timeout: 60000});
  step('landing'); await shot('01-landing');
  await page.getByRole('button', {name: 'Play free', exact: true}).click();
  await page.getByRole('button', {name: /^Fight/}).waitFor();
  await page.waitForFunction(() => window.__thAudio?.ready === true);
  report.audioAfterFirstClick = true;
  step('home and unlocked audio'); await shot('02-home');

  await page.getByRole('button', {name: /^Fight/}).click();
  await page.getByRole('button', {name: 'Fight', exact: true}).click();
  await coach(); await waitVictory(); step('practice victory');
  await page.getByRole('button', {name: 'Complete lesson', exact: true}).click();
  await coach(); await celebrations();
  await page.getByRole('button', {name: 'Welcome', exact: true}).click();
  await page.getByRole('button', {name: 'Skip reveal', exact: true}).click();
  await celebrations(); await closeSheet('Recruit'); step('free welcome recruit');

  await page.getByRole('button', {name: /^Fight/}).click();
  await expect(page.getByRole('button', {name: 'Fight', exact: true})).toBeEnabled();
  await celebrations(); await shot('03-prepare');
  await page.getByRole('button', {name: 'Fight', exact: true}).click();
  await page.getByRole('button', {name: 'Change playback speed', exact: true}).click();
  await page.getByRole('button', {name: 'Change playback speed', exact: true}).click();
  step('full campaign wave at 3x'); await waitVictory(true);
  step('campaign victory and rewards'); await shot('05-victory');
  await page.getByRole('button', {name: 'Read details', exact: true}).click();
  await page.getByRole('button', {name: 'Key moments', exact: true}).click();
  expect(await page.getByRole('dialog').last().innerText()).not.toContain('Your crew did not cast an ultimate');
  await page.getByRole('button', {name: 'Improve team', exact: true}).click();
  await coach(); await celebrations();
  await closeSheet('Team');
  report.afterReward = await page.evaluate(() => ({currencies: window.__depthReview.state.account.currencies, runComplete: window.__depthReview.state.run?.complete ?? true}));

  await page.getByRole('button', {name: 'Forge', exact: true}).last().click();
  await coach(); await celebrations();
  await page.getByRole('button', {name: 'Enhance +1', exact: true}).click();
  await coach();
  const before = await page.evaluate(() => ({currencies: {...window.__depthReview.state.account.currencies}, gear: window.__depthReview.state.gear[0].enhancement}));
  await page.getByRole('button', {name: 'Confirm enhance +1', exact: true}).click();
  await expect(page.getByRole('button', {name: 'Confirm enhance +2', exact: true})).toBeVisible();
  const after = await page.evaluate(() => ({currencies: {...window.__depthReview.state.account.currencies}, gear: window.__depthReview.state.gear[0].enhancement}));
  report.forge = {before, after};
  expect(after.gear).toBe(before.gear + 1);
  expect(after.currencies.stamps).toBeLessThan(before.currencies.stamps);
  step('forge enhancement completed'); await shot('06-forge');
  await page.getByRole('button', {name: 'Close dialog', exact: true}).click();
  await page.getByRole('button', {name: 'Materials', exact: true}).click();
  await expect(page.locator('[data-screen="inventory"]')).toBeVisible(); step('bag materials');
  await closeSheet('Bag');
  await page.getByRole('button', {name: 'Team', exact: true}).click();
  await expect(page.locator('[data-screen="team"]')).toBeVisible();
  step('team'); await shot('07-team'); await closeSheet('Team');
  await page.getByRole('button', {name: 'Open menu', exact: true}).click();
  await page.getByRole('button', {name: 'Open Fuji wallet', exact: true}).click();
  await coach();
  await expect(page.getByRole('dialog', {name: 'Fuji panel', exact: true})).toBeVisible();
  if (mode === 'live') await expect(page.getByTestId('chain-address')).toBeVisible();
  else await expect(page.getByRole('button', {name: 'Connect', exact: true})).toBeVisible();
  step(mode === 'live' ? 'local guest wallet' : 'offline wallet panel'); await shot('08-wallet');
  report.offline = await page.evaluate(() => window.__demoOffline ?? null);
  expect(report.errors).toEqual([]);
  expect(report.externalRequests).toEqual([]);
  expect(report.shots.filter(row => row.overflow || row.broken.length)).toEqual([]);
  if (mode === 'static') expect(report.offline.networkAttempts).toEqual([]);
  report.pass = true;
} catch (error) {
  report.pass = false; report.failure = String(error);
  report.lastBody = (await page.locator('body').innerText().catch(() => '')).slice(-2000);
  await sharp(await page.screenshot().catch(() => Buffer.alloc(0))).resize({width: 1280, withoutEnlargement: true}).png().toFile(resolve(out, 'shots', `${id}-failure.png`)).catch(() => {});
  process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString();
  await writeFile(resolve(out, `${id}-smoke.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({id, pass: report.pass, errors: report.errors.length, shots: report.shots.length, failure: report.failure}));
  await browser.close();
}
