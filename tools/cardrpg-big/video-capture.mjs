import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const execute = promisify(execFile);
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_VIDEO_OUT || 'reports/cardrpg-big/video';
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
const temporary = await mkdtemp(resolve(tmpdir(), 'cardrpg-big-video-'));
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });

async function open() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 },
    recordVideo: { dir: temporary, size: { width: 1280, height: 720 } } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto('file://' + artifact);
  await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
  return { context, page, errors };
}

async function save(recording, name, duration, detail) {
  await recording.page.waitForTimeout(1000);
  const video = recording.page.video();
  await recording.context.close();
  const raw = await video.path();
  const path = resolve(output, `${name}.webm`);
  // The recording ends with a one-second hold. Keep the preceding action window.
  await execute('ffmpeg', ['-v', 'error', '-y', '-sseof', String(-(duration + 1)), '-i', raw,
    '-t', String(duration), '-an', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0', path]);
  const { stdout } = await execute('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration,size:stream=width,height,codec_name', '-of', 'json', path]);
  const probe = JSON.parse(stdout);
  assert(Math.abs(Number(probe.format.duration) - duration) < .5, 'Clip duration differs from the recorded window');
  rows.push({ name, path: `${output}/${name}.webm`, duration, probe, errors: recording.errors,
    sha256: createHash('sha256').update(await readFile(path)).digest('hex'), ...detail });
  await writeFile(`${output}/captures.json`, JSON.stringify({ artifact, sha256,
    method: 'Silent Chromium recordings at1280×720 and1×. Hero clips cycle real authored skills through the isolated Feel lab fixture. Boss capture uses the normal route UI and automatic controller. FFmpeg trims the final action window before a one-second hold. Recording stays outside performance runs.', rows }, null, 2));
  assert.deepEqual(recording.errors, []);
  console.log(JSON.stringify({ name, duration: probe.format.duration, bytes: probe.format.size }));
}

try {
  const inventory = await open();
  const actions = await inventory.page.evaluate(() => window.__depthReview.galleryActions
    .filter(action => !action.enemy && /-[1-4]$/.test(action.id)));
  await inventory.context.close();
  const owners = [...new Set(actions.map(action => action.owner))];
  assert.equal(owners.length, 12);
  const requested = process.env.BIG_VIDEO_NAMES?.split(',');
  for (const owner of [...owners, 'clover-ultimate']) {
    if (requested && !requested.includes(owner)) continue;
    const recording = await open();
    const { page } = recording;
    const skills = owner === 'clover-ultimate'
      ? actions.filter(action => action.id === 'clover-4')
      : actions.filter(action => action.owner === owner);
    assert(skills.length > 0);
    const accountBefore = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    await page.getByLabel('Preview action', { exact: true }).selectOption(skills[0].id);
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await page.getByLabel('Preview speed', { exact: true }).selectOption('1');
    await page.getByLabel('Preview camera', { exact: true }).selectOption('wide');
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    const duration = owner === 'clover-ultimate' ? 8 : 25;
    const started = Date.now();
    const played = [];
    let index = 0;
    while (Date.now() - started < duration * 1000) {
      const skill = skills[index++ % skills.length];
      await page.evaluate(id => window.__depthReview.inspect(id, 0, true), skill.id);
      played.push({ id: skill.id, startedMs: Date.now() - started });
      const remaining = duration * 1000 - (Date.now() - started);
      const planned = await page.evaluate(() => window.__depthReview.plan.duration);
      await page.waitForTimeout(Math.max(0, Math.min(remaining, planned + 100)));
    }
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), accountBefore);
    await save(recording, owner, duration, { kind: 'isolated-gallery', speed: 1, played, accountRestored: true });
  }

  if (!requested || requested.includes('boss')) {
    const recording = await open();
    const { page } = recording;
    const navigation = page.getByRole('navigation', { name: 'Cafe screens' });
    await navigation.getByRole('button', { name: 'Save & settings', exact: true }).click();
    await page.getByRole('button', { name: 'Unlock all cats and build materials', exact: true }).click();
    await navigation.getByRole('button', { name: 'Cafe', exact: true }).click();
    await page.getByRole('button', { name: /Tangled Cafe/ }).click();
    let bossStarted = 0;
    for (let index = 0; index < 7; index++) {
      const node = await page.evaluate(index => window.__depthReview.state.run.nodes.find(node => node.id === `${index}-0`), index);
      assert(node, `Missing route row ${index}`);
      await page.locator('.dp-node:enabled').filter({ has: page.locator('b', { hasText: new RegExp(`^${node.kind}$`) }) }).first().click();
      if (node.kind === 'battle' || node.kind === 'boss') {
        await page.getByRole('button', { name: 'Fight', exact: true }).click();
        await page.getByLabel('Playback speed', { exact: true }).selectOption('1');
        if (node.kind === 'boss') {
          bossStarted = Date.now();
          await page.getByRole('button', { name: 'Continue to rewards', exact: true }).waitFor({ timeout: 240000 });
          break;
        }
        await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
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
    assert(bossStarted > 0, 'The normal route must reach its boss');
    const duration = (Date.now() - bossStarted) / 1000;
    const battle = await page.evaluate(() => {
      const m = window.__depthReview;
      return { result: m.battle.result, choices: m.battle.choices.length, seed: m.battle.initial.seed,
        enemies: m.battle.initial.enemies, speed: m.state.settings.speed };
    });
    await save(recording, 'boss', duration, { kind: 'automatic-route-boss', fixture: 'Visible unlock shortcut grants level10/3star cats before entering chapter1.', battle });
  }
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
