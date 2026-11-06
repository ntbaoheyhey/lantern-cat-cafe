import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = process.env.BIG_FLOW_OUT || 'reports/cardrpg-big/flow/runtime';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const speed = Number(process.env.BIG_FLOW_SPEED || 1);
const scenarios = JSON.parse(process.env.BIG_FLOW_CASES || '[[1280,720,1,1,11],[1440,900,2,1,23],[1024,600,1,1,37],[1280,720,1,4,53],[1280,720,2,4,71]]');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height, dpr, cpu, seed] of scenarios) {
    const name = `${width}x${height}-dpr${dpr}-cpu${cpu}-seed${seed}`;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.addInitScript(() => {
      const data = window.__flow = { frames: [], actions: [], clicks: [], rounds: [], last: 0, active: null, pending: [], completed: [] };
      const capture = event => {
        const button = event.target.closest('button');
        const name = button?.textContent.trim();
        if (!['Fight', 'Pause', 'Resume', 'Skip to result', 'Watch replay'].includes(name)) return;
        const click = { name, at: performance.now(), responseAt: null };
        data.clicks.push(click);
        data.pending.push(click);
      };
      document.addEventListener('pointerdown', capture, true);
      requestAnimationFrame(function sample(at) {
        const model = window.__depthReview;
        const plan = model?.plan;
        const frame = model?.frame;
        const key = model?.showBattle && plan ? `${plan.id}:${plan.skillId}` : null;
        if (data.active && data.active.key !== key) { data.active.ended = at; data.active = null; }
        if (key && !data.active) {
          data.active = { key, id: plan.id, skill: plan.skillId, name: plan.name, actor: plan.actorId,
            round: model.visualBattle.round, started: at, duration: plan.duration, ended: null,
            impactAt: null, bannerFrames: [], beforeHp: model.visualBattle.actors.map(actor => ({ id: actor.id, hp: actor.hp })),
            finalHp: model.battle.actors.map(actor => ({ id: actor.id, hp: actor.hp })), prematureHp: false,
            speed: model.state.settings.speed, ultimate: plan.ultimate };
          data.actions.push(data.active);
        }
        if (data.active) {
          const active = data.active;
          if (frame.beat.kind === 'anticipation' || frame.beat.kind === 'travel') {
            active.prematureHp ||= active.beforeHp.some(previous => model.visualBattle.actors.find(actor => actor.id === previous.id)?.hp !== previous.hp);
          } else if (active.impactAt === null) active.impactAt = at;
          const banner = document.querySelector('.dp-skill-banner');
          if (banner && !banner.hidden) active.bannerFrames.push(at);
        }
        for (const click of data.pending) {
          const visible = click.name === 'Fight' || click.name === 'Watch replay' ? model?.showBattle
            : click.name === 'Pause' ? model?.paused && [...document.querySelectorAll('button')].some(button => button.textContent === 'Resume')
            : click.name === 'Resume' ? !model?.paused && [...document.querySelectorAll('button')].some(button => button.textContent === 'Pause')
            : model?.screen === 'result' && !model?.showBattle;
          if (visible) click.responseAt = performance.now();
        }
        data.pending = data.pending.filter(click => click.responseAt === null);
        if (model?.screen === 'result' && !model.showBattle && data.completed.at(-1)?.lastAction !== data.actions.length) {
          data.completed.push({ at, lastAction: data.actions.length, result: model.battle.result, round: model.battle.round });
        }
        if (data.last) data.frames.push({ at, ms: at - data.last, action: key, beat: frame?.beat.kind,
          elapsed: model?.animationAt, paused: model?.paused, round: model?.visualBattle?.round,
          calls: window.__depthScene?.stats.calls, triangles: window.__depthScene?.stats.triangles });
        data.last = at;
        requestAnimationFrame(sample);
      });
    });
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: /Tangled Cafe/ }).waitFor({ timeout: 60000 });
    // Only seed selection is fixture setup. Every battle action runs through the normal UI controller.
    await page.evaluate(seed => { window.__depthReview.state.account.seed = seed; }, seed);
    await page.getByRole('button', { name: /Tangled Cafe/ }).click();
    await page.locator('.dp-node:enabled').first().click();
    await page.getByRole('button', { name: 'Fight', exact: true }).click();
    await page.getByRole('combobox', { name: 'Playback speed', exact: true }).selectOption(String(speed));
    await page.waitForFunction(() => window.__depthReview.battle.choices.length >= 2);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const pausedAt = await page.evaluate(() => window.__depthReview.animationAt);
    await page.waitForTimeout(180);
    assert.equal(await page.evaluate(() => window.__depthReview.animationAt), pausedAt);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    await page.getByRole('button', { name: 'Watch replay', exact: true }).waitFor();
    const expected = await page.evaluate(() => JSON.stringify(window.__depthReview.battle));
    await page.getByRole('button', { name: 'Watch replay', exact: true }).click();
    await page.getByRole('button', { name: 'Close replay', exact: true }).waitFor({ timeout: 180000 });
    await page.waitForTimeout(100);
    const actual = await page.evaluate(() => JSON.stringify(window.__depthReview.battle));
    assert.equal(actual, expected);
    const data = await page.evaluate(() => window.__flow);
    const replayAt = data.clicks.find(click => click.name === 'Watch replay').at;
    const actions = data.actions.filter(action => action.started >= replayAt);
    const actorActions = actions.filter(action => action.actor);
    const timings = actorActions.map(action => ({ ...action,
      actualMs: action.ended - action.started,
      limitMs: (action.actor.startsWith('foe-') ? 1400 : action.ultimate ? 2800 : action.skill.endsWith('-1') ? 1200 : 1800) / speed,
      bannerMs: action.bannerFrames.length ? action.bannerFrames.at(-1) - action.bannerFrames[0] : 0,
    }));
    const gaps = actions.slice(1).map((action, index) => ({ from: actions[index].skill, to: action.skill,
      ms: action.started - actions[index].ended, roundTransition: action.round !== actions[index].round }));
    const roundGaps = actorActions.slice(1).flatMap((action, index) => action.round !== actorActions[index].round
      ? [action.started - actorActions[index].ended] : []);
    const frameTimes = data.frames.map(frame => frame.ms).sort((a, b) => a - b);
    const row = { name, width, height, dpr, cpu, seed, speed, errors, replayMatches: true,
      responses: data.clicks.map(click => ({ name: click.name, ms: click.responseAt - click.at })),
      fightMs: data.completed.at(-1).at - replayAt,
      actions: timings.length, actionMaxMs: Math.max(...timings.map(action => action.actualMs)),
      actionBudgetMisses: timings.filter(action => action.actualMs > action.limitMs),
      roundGapMaxMs: Math.max(0, ...roundGaps),
      gapMaxMs: Math.max(0, ...gaps.map(gap => gap.ms)),
      prematureHp: timings.filter(action => action.prematureHp).length,
      bannerMinMs: Math.min(...timings.map(action => action.bannerMs)), bannerMaxMs: Math.max(...timings.map(action => action.bannerMs)),
      pageMaxMs: frameTimes.at(-1), above25: frameTimes.filter(ms => ms > 25).length, above50: frameTimes.filter(ms => ms > 50).length,
      p95: frameTimes[Math.floor(frameTimes.length * .95)], frames: frameTimes.length };
    await writeFile(`${output}/${name}.json`, JSON.stringify({ row, timings, gaps, data }, null, 2));
    rows.push(row);
    console.log(JSON.stringify({ ...row, actionBudgetMisses: row.actionBudgetMisses.map(action => ({ skill: action.skill, actualMs: action.actualMs, limitMs: action.limitMs })) }));
    await writeFile(`${output}/summary.json`, JSON.stringify({ artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
      method: 'Fresh offline pages, cache disabled, real Fight/Pause/Resume/Skip/Replay clicks. Pointer-down to the first RAF with matching visible UI measures response. Full x1 replay uses recorded choices and exactly matches the skipped result. All page-open RAF samples retained. Seed is the only fixture setup.', rows }, null, 2));
    assert.deepEqual(errors, []);
    assert.equal(row.prematureHp, 0);
    await page.close();
  }
} finally { await browser.close(); }
