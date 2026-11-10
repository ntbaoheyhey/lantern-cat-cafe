/** Real wall-clock browser play, using UI clicks for every game action.
 * Two fifteen-minute timing-lock leases keep the same browser and account alive.
 * The review hook is read only: no grants, time jumps, direct commands or skipped fights.
 */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const root = resolve(import.meta.dirname, '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');
const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const output = resolve(root, arg('out', 'reports/cardrpg-a6/first-session.json'));
const segment = Number(arg('segment', 0));
const segmentSeconds = Number(arg('segment-seconds', 900));
if (!Number.isFinite(segmentSeconds) || segmentSeconds < 1 || segmentSeconds > 900) {
  throw Error('Each timing-lock segment must last between one and nine hundred seconds.');
}
const stopped = async () => access(resolve(root, 'STOP-A6')).then(() => true, () => false);
if (!segment) {
  const browser = await chromium.launch({ headless: true, args: ['--remote-debugging-port=5963'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.newPage();
  try {
    for (let i = 1; i <= 2; i++) {
      const code = await new Promise((done, reject) => {
        const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A6-first-session-${i}`, process.execPath, 'tools/cardrpg-a6/first-session.mjs', `--segment=${i}`, `--segment-seconds=${segmentSeconds}`, `--out=${output}`], { cwd: root, stdio: 'inherit' });
        child.on('error', reject); child.on('close', done);
      });
      if (code || await stopped()) { process.exitCode = code || 0; break; }
    }
  } finally { await browser.close(); }
} else {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:5963');
  const page = browser.contexts().flatMap(context => context.pages())[0];
  if (!page) throw Error('The parent browser page is unavailable.');
  page.setDefaultTimeout(2500);
  const report = segment === 1 ? { startedAt: new Date().toISOString(), activeSeconds: 0, actions: [], rewards: [], encounters: [], errors: [], stalls: [], lastReward: 0, trainingKeys: [], sawBook: false } : JSON.parse(await readFile(output, 'utf8'));
  const started = Date.now(), baseSeconds = report.activeSeconds;
  const seconds = () => baseSeconds + (Date.now() - started) / 1000;
  page.on('pageerror', e => report.errors.push({ at: seconds(), error: e.message }));
  page.on('console', message => { if (message.type() === 'error') report.errors.push({ at: seconds(), error: message.text(), source: 'console' }); });
  // A fight spanning the lock handoff is excluded from duration summaries.
  if (segment > 1 && report.liveEncounter) report.liveEncounter.crossedLease = true;
  if (segment === 1) {
    await page.goto('http://127.0.0.1:5960/?demo=1&squad=1&cardrpg2=1&a6=1');
    await page.getByRole('button', { name: 'Cats', exact: true }).waitFor();
  }
  async function click(locator, name) {
    const target = locator.first();
    if (!await target.isVisible().catch(() => false) || !await target.isEnabled()) return false;
    await target.click(); report.actions.push({ at: seconds(), action: name }); return true;
  }
  const button = name => page.getByRole('button', { name, exact: typeof name === 'string' });
  const close = () => click(button('Close'), 'Close sheet');
  let prior = report.latest, liveEncounter = report.liveEncounter, unhandled = 0, lastCheckpoint = baseSeconds;
  while (Date.now() - started < segmentSeconds * 1000 && !await stopped()) {
    try {
      const s = await page.evaluate(() => {
        const m = window.__depthReview;
        if (!m) return null;
        const r = m.state.run, b = m.battle;
        return { guide: document.querySelector('.uv-shell')?.dataset.a6Guide, unlock: document.querySelector('.a6-unlock-toast strong')?.textContent ?? '', screen: m.screen, watching: m.showBattle, tutorial: m.state.tutorial,
          freeInvite: m.state.freeInvite, fish: m.state.account.currencies.fish,
          currencies: m.state.account.currencies, team: m.state.team,
          cards: m.state.account.cards.map(c => ({ id: c.cardId, level: c.level, stars: c.stars })),
          selected: m.cardId, nextRunId: m.state.nextRunId, active: !!r && !r.complete,
          idleReady: !!document.querySelector('.a6-idle .uv-tips:not(:disabled)'), fastReady: !!document.querySelector('.a6-fast-reward:not(:disabled)'), eventsOpen: !!document.querySelector('[data-screen="events"]'),
          route: r ? { id: r.id, points: r.points, complete: r.complete, current: r.current, visited: r.visited.length, rewards: r.rewardChoices.length, kind: r.nodes.find(n => n.id === r.current)?.kind } : null,
          battle: b ? { seed: b.seed, result: b.result, round: b.round, boss: r?.nodes.find(n => n.id === r.current)?.kind === 'boss', combos: b.v4?.events.filter(e => e.kind === 'bond.combo').length ?? 0 } : null,
          notice: m.notice, error: m.error, cleared: m.state.cleared };
      });
      if (!s) { await page.waitForTimeout(1000); continue; }
      if (prior && (s.cards.length > prior.cards.length || s.cards.some(c => c.level > (prior.cards.find(p => p.id === c.id)?.level ?? 0) || c.stars > (prior.cards.find(p => p.id === c.id)?.stars ?? 0)) || Object.entries(s.currencies).some(([key, value]) => value > prior.currencies[key]) || s.cleared.length > prior.cleared.length || s.unlock && s.unlock !== prior.unlock || s.route?.id === prior.route?.id && ((s.route?.points ?? 0) > (prior.route?.points ?? 0) || (s.route?.rewards ?? 0) > (prior.route?.rewards ?? 0)))) {
        report.rewards.push({ at: seconds(), gap: seconds() - report.lastReward, screen: s.screen }); report.lastReward = seconds();
      }
      prior = s;
      let acted = false;
      if (s.watching) {
        if (!liveEncounter) liveEncounter = { at: seconds(), seed: s.battle?.seed, tutorial: s.tutorial < 3, boss: s.battle?.boss };
        const combo = page.getByLabel('Bond combo', { exact: true });
        if (!report.comboScreenshot && await combo.isVisible().catch(() => false)) { await page.screenshot({ path: '/tmp/cardrpg-a6-first-combo.png' }); report.comboScreenshot = true; }
        acted = true;
      } else if (s.screen === 'prepare') {
        acted = await click(button(/^Fight/), 'Fight');
      } else if (s.screen === 'result') {
        if (liveEncounter) { report.encounters.push({ ...liveEncounter, seconds: seconds() - liveEncounter.at, result: s.battle?.result, rounds: s.battle?.round, combos: s.battle?.combos }); liveEncounter = null; }
        acted = await click(button(/^Next/), 'Next result');
      } else if (s.screen === 'hub') {
        const trainingKey = `${s.nextRunId}:${s.fish}`;
        if (s.guide === 'patrol') acted = await click(button(/^Night Patrol/), 'First patrol');
        else if (s.guide === 'recruit') acted = await click(button('Recruit'), 'First friend');
        else if (s.guide === 'upgrade') acted = await click(button('Cats'), 'First level');
        else if (s.eventsOpen) {
          acted = await click(page.locator('.a6-daily button:not(:disabled)').filter({hasText:/^Collect/}), 'Collect A6 cafe gift');
          if(!acted) acted = await click(page.getByRole('button',{name:'Collect reward',exact:true}).and(page.locator(':not(:disabled)')), 'Collect daily reward');
          if (!acted) acted = await close();
        } else if (!s.active && s.idleReady) acted = await click(button(/^Collect Night tips/), 'Collect night tips');
        else if (!s.active && s.fastReady) acted = await click(button(/^Fast reward/), 'Fast reward');
        else if (!s.active && await page.locator('.uv-events button').filter({hasText:'Today’s tasks'}).count()) acted = await click(button('Today’s tasks'), 'Open daily tasks');
        else if (!s.freeInvite) acted = await click(button('Recruit'), 'Open recruit');
        else if (!report.sawBook) acted = await click(button('Cats'), 'Open cats');
        else if (!s.active && !report.trainingKeys.includes(trainingKey)) { report.trainingKeys.push(trainingKey); acted = await click(button('Cats'), 'Train cats'); }
        else acted = await click(button(/^Night Patrol/), 'Night Patrol');
      } else if (s.screen === 'gacha') {
        if (!s.freeInvite) acted = await click(button('Welcome a friend'), 'Free invitation');
        else if (await page.getByRole('heading', { name: 'Welcome home' }).isVisible().catch(() => false)) acted = await click(button('Meet your cats'), 'Meet recruited cat');
        else if (await page.locator('[data-beat="idle"]').count()) acted = await close();
        else acted = true;
      } else if (s.screen === 'collection') {
        if (s.guide === 'upgrade') acted = await click(button('Level up'), 'First cat level');
        else if (!report.sawBook && await button('Bond Book').isVisible().catch(() => false)) acted = await click(button('Bond Book'), 'Read Bond Book');
        else {
          const candidate = s.cards.filter(c => s.team.includes(c.id)).sort((a, b) => a.level - b.level)[0];
          if (candidate && candidate.id !== s.selected && candidate.level < 8) acted = await click(page.locator('.uv-cat-grid button').filter({ hasText: new RegExp(candidate.id, 'i') }), 'Select lowest-level teammate');
          else if (candidate?.level < 8) acted = await click(button('Level up'), 'Level up');
          if (!acted) acted = await close();
        }
      } else if (s.screen === 'bonds') {
        report.sawBook = true; acted = await click(button('Build a bonded team'), 'Formation from Bond Book');
      } else if (s.screen === 'team') {
        if (!report.recommended) { acted = await click(button('Use recommended crew'), 'Use recommended crew'); report.recommended = true; }
        else acted = await close();
      } else if (s.screen === 'map') {
        if (s.route?.rewards) acted = await click(page.locator('.dp-reward'), 'Choose earned boon');
        if (!acted) acted = await click(button(/Heal the team/), 'Rest and heal');
        if (!acted) acted = await click(button('Take 70 run points'), 'Claim treasure');
        if (!acted) acted = await click(button('Save your points and leave'), 'Leave shop');
        if (!acted && s.route?.kind === 'event') acted = await click(page.locator('.cr-panel .dp-three button:not(:disabled)'), 'Resolve story event');
        if (!acted) acted = await click(page.locator('.dp-node:not(:disabled)'), 'Enter next node');
        if (!acted) acted = await close();
      } else acted = await close();
      unhandled = acted ? 0 : unhandled + 1;
      if (unhandled === 8) { report.stalls.push({ at: seconds(), screen: s.screen, notice: s.notice, buttons: await page.getByRole('button').allTextContents() }); await page.screenshot({ path: '/tmp/cardrpg-a6-session-stall.png' }); }
      if (seconds() - lastCheckpoint > 30) {
        lastCheckpoint = seconds(); report.activeSeconds = seconds(); report.latest = s; report.liveEncounter = liveEncounter;
        await writeFile(output, JSON.stringify(report, null, 2) + '\n');
        console.log(JSON.stringify({ segment, seconds: Math.round(seconds()), screen: s.screen, encounters: report.encounters.length, rewards: report.rewards.length, stalls: report.stalls.length }));
      }
    } catch (error) { report.errors.push({ at: seconds(), error: String(error) }); }
    await page.waitForTimeout(1000);
  }
  report.activeSeconds = seconds();
  report.liveEncounter = liveEncounter;
  report.latest = prior;
  report.endedAt = new Date().toISOString();
  const quantile = (values, q) => {
    const sorted = values.slice().sort((a,b) => a-b);
    return sorted.length ? Math.round(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*q))]*100)/100 : null;
  };
  const encounters = report.encounters.filter(e => !e.tutorial);
  const duration = boss => {
    const times = encounters.filter(e => !!e.boss === boss && !e.crossedLease).map(e => e.seconds);
    return { samples: times.length, medianSeconds: quantile(times,.5), p90Seconds: quantile(times,.9) };
  };
  const losses = encounters.filter(e => e.result === 'enemy');
  const trailingGap = Math.max(0, report.activeSeconds-report.lastReward);
  const gaps = [...report.rewards.map(r => r.gap),trailingGap];
  report.summary = { activeSeconds: Math.round(report.activeSeconds*100)/100, encounters: encounters.length,
    wins: encounters.filter(e => e.result === 'party').length, losses: losses.length,
    losses10: losses.filter(e => e.at+e.seconds<=600).length, losses30: losses.filter(e => e.at+e.seconds<=1800).length,
    normal: duration(false), boss: duration(true),
    visibleRewards: { count: report.rewards.length, medianGap: quantile(gaps,.5), maxGap: Math.round(Math.max(...gaps)*100)/100, trailingGap: Math.round(trailingGap*100)/100 },
    errors: report.errors.length, stalls: report.stalls.length };
  if(segment === 2) console.log(JSON.stringify({ summary: report.summary }));
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  // Exit disconnects this observer; the parent retains the browser and page.
  process.exit(0);
}
