import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { web, requireWeb } from '../../../visual-support.mjs';
const { createServer } = await import(requireWeb.resolve('vite'));
const vite = await createServer({ configFile: false, root: web, envDir: false, server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom' });
const registration = JSON.parse(await readFile(process.env.V5_REGISTRATION))[0];
let before;
try {
  const R = await vite.ssrLoadModule('/@fs/' + process.cwd() + '/packages/game-rules/src/cardrpg/depth/index.ts');
  const battle = R.createBattle(registration.setup);
  while (!battle.result) {
    before = structuredClone(battle);
    const actor = R.currentActor(battle);
    if (!(actor.side === 'party' ? R.act(battle, R.chooseAction(battle, 'auto')) : R.enemyAct(battle))) throw Error('Rejected registered choice');
  }
} finally { await vite.close(); }
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('file://' + process.env.V5_ARTIFACT + '?dev=1');
  await page.waitForFunction(() => window.__v5LiveStart && window.__depthReview);
  await page.evaluate(({ setup, before }) => {
    window.__v5LiveStart(setup, 1);
    const m = window.__depthReview; m.tutorialBattle = before; m.notify(false);
  }, { setup: registration.setup, before });
  await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
  await page.evaluate(() => {
    window.__endScene = window.__depthScene;
    const m = window.__depthReview; m.paused = false; m.notify(false);
  });
  await page.waitForFunction(() => window.__depthReview.screen === 'result' && !window.__depthReview.plan);
  await page.waitForTimeout(250);
  const result = await page.evaluate(() => ({
    screen: window.__depthReview.screen, canvasConnected: window.__endScene.renderer.domElement.isConnected,
    suspended: window.__endScene.view().suspended, canvasRect: window.__endScene.renderer.domElement.getBoundingClientRect().toJSON(),
    ancestors: (() => { const rows=[]; let node=window.__endScene.renderer.domElement; while(node){const css=getComputedStyle(node); rows.push({tag:node.tagName,class:node.className,hidden:node.hidden,display:css.display,visibility:css.visibility,opacity:css.opacity}); node=node.parentElement;} return rows; })(),
    effectsDisposed: window.__endScene.cardEffects.disposed, retainedActionReference: !!window.__endScene.cardEffects.actionFrame,
    transientLabels: document.querySelectorAll('.dp-combo-callout,.dp-float-number').length,
    visibleTransientLabels: [...document.querySelectorAll('.dp-combo-callout,.dp-float-number')].filter(e=>e.getBoundingClientRect().width>0).length,
    battle: JSON.stringify(window.__depthReview.battle),
  }));
  const digest = createHash('sha256').update(result.battle).digest('hex'); delete result.battle;
  await mkdir(process.env.V5_OUT, { recursive: true });
  await page.screenshot({ path: process.env.V5_OUT + '/result.png' });
  const receipt = { method: 'Focused final-action replay from exact rules-generated predecessor of registered Oven1. Not a replacement natural battle sample.', case: registration.id, ...result, digest, parity: digest === registration.sha256, errors };
  await writeFile(process.env.V5_OUT + '/end-state.json', JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify(receipt));
} finally { await browser.close(); }
