/** Real wall-clock browser play, using UI clicks for every game action.
 * Two fifteen-minute timing-lock leases keep the same browser and account alive.
 * The review hook is read only: no grants, time jumps, direct commands or skipped fights.
 */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '../..');
const require = createRequire(resolve(root, 'apps/web/package.json'));
const { chromium } = require('@playwright/test');
const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const output = resolve(root, arg('out', 'reports/cardrpg-a6/first-session.json'));
const segment = Number(arg('segment', 0));
const segmentSeconds = Number(arg('segment-seconds', 900));
const shotDirectory = arg('shots', '');
if (shotDirectory && !resolve(root, shotDirectory).startsWith(resolve(root, 'reports/cardrpg-a6/shots') + '/'))
  throw Error('Keep review captures inside the lane screenshots directory.');
if (!Number.isFinite(segmentSeconds) || segmentSeconds < 1 || segmentSeconds > 900) {
  throw Error('Each timing-lock segment must last between one and nine hundred seconds.');
}
const stopped = async () => access(resolve(root, 'STOP-A6')).then(() => true, () => false);
// Reuse a saved earned encounter for a bounded browser pacing check. This is an
// explicit replay fixture, separate from the untouched thirty-minute UI run.
if (arg('pacing-fixture', '')) {
  const fixture = JSON.parse(await readFile(resolve(root, arg('pacing-fixture', '')), 'utf8'));
  const browser = await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
  const page = await browser.newPage({viewport:{width:1440,height:900}}), errors = [];
  const report = {date:new Date().toISOString(),source:'Saved earned encounter; actual x1 browser playback after sceneReady. Fixture is not new-player progression.',enemies:fixture.initial.enemies,errors};
  const temporaryShots=[];
  page.on('pageerror', e=>errors.push(e.message));
  page.on('console', e=>{if(e.type()==='error')errors.push(e.text());});
  try {
    await page.goto('http://127.0.0.1:5960/?demo=1&squad=1&cardrpg2=1&a6=1');
    await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
    await page.evaluate(async ({fixture,modulePath})=>{
      const R=await import(modulePath),m=window.__depthReview;
      m.plan=null;m.watching=false;m.tutorialBattle=null;m.replay=null;m.galleryBattle=null;
      m.state=fixture.state;m.state.run.battle=R.createBattle(fixture.initial);
      m.state.settings.speed=1;m.paused=false;m.autoContinue=false;m.go('prepare');
      const probe={samples:[],last:0};window.__a6PacingFrames=probe;
      const frame=time=>{if(m.showBattle&&m.sceneReady&&!m.paused){if(probe.last)probe.samples.push(time-probe.last);probe.last=time;}else probe.last=0;requestAnimationFrame(frame);};requestAnimationFrame(frame);
    },{fixture,modulePath:`/@fs${root}/packages/game-rules/src/cardrpg/depth/index.ts`});
    await page.getByRole('button',{name:/^Fight/}).click();
    await page.waitForFunction(()=>window.__depthReview.sceneReady,null,{timeout:90000});
    const started=Date.now();let bossShot=false,ultimateShot=false;
    while(await page.evaluate(()=>window.__depthReview.showBattle)) {
      if(await stopped())throw Error('STOP-A6 requested');
      if(Date.now()-started>600000)throw Error('Pacing fixture exceeded ten minutes.');
      if(shotDirectory) {
        const ultimate=await page.locator('.a6-ultimate-cutin').isVisible();
        const name=!bossShot&&Date.now()-started>1500?'boss':!ultimateShot&&ultimate?'ultimate':null;
        if(name){const path=`/tmp/cardrpg-a6-pacing-${name}.png`;await page.screenshot({path});temporaryShots.push({name,path});if(name==='boss')bossShot=true;else ultimateShot=true;}
      }
      await page.waitForTimeout(100);
    }
    report.seconds=(Date.now()-started)/1000;
    const data=await page.evaluate(()=>({rounds:window.__depthReview.battle.round,result:window.__depthReview.battle.result,frames:window.__a6PacingFrames.samples}));
    const sorted=data.frames.sort((a,b)=>a-b),q=p=>Math.round((sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))]??0)*100)/100;
    Object.assign(report,{rounds:data.rounds,result:data.result,frameDelivery:{samples:sorted.length,medianMs:q(.5),p95Ms:q(.95)},ultimateSeen:ultimateShot});
    if(shotDirectory){await mkdir(resolve(root,shotDirectory),{recursive:true});for(const shot of temporaryShots)execFileSync('cwebp',['-quiet','-q','82',shot.path,'-o',resolve(root,shotDirectory,`1440-${shot.name}.webp`)]);}
    await writeFile(resolve(root,arg('pacing-out','reports/cardrpg-a6/q13g-fixture-pacing.json')),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
  } finally {await browser.close();}
  process.exit(process.exitCode??0);
}
// A read-only observer can reuse an already-running session: no second renderer or UI driver.
if (process.argv.includes('--observe-pacing')) {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:5963');
  const page = browser.contexts().flatMap(context => context.pages())[0];
  const pacingOutput = resolve(root, arg('pacing-out', 'reports/cardrpg-a6/q13g-browser-pacing.json'));
  const report = { startedAt: new Date().toISOString(), source: 'Read-only observer of the existing x1 first-session browser; time begins after sceneReady.', encounters: [], errors: [] };
  let live = null, priorWatching = true; // The first partial encounter must be excluded.
  const save = () => writeFile(pacingOutput, JSON.stringify(report, null, 2) + '\n');
  try {
    while (!await stopped()) {
      const s = await page.evaluate(() => {
        const m = window.__depthReview, r = m?.state.run, b = m?.battle;
        return m ? { watching: m.showBattle, ready: m.sceneReady, paused: m.paused, speed: m.state.settings.speed,
          tutorial: m.state.tutorial < 3, seed: b?.seed, result: b?.result, chapter: b?.chapter,
          boss: r?.nodes.find(n => n.id === r.current)?.kind === 'boss', node: r?.current } : null;
      });
      if (s?.watching && !priorWatching) live = { ...s, seenAt: Date.now(), readyAt: null, pausedDuring: false };
      if (s?.watching && live) {
        live.pausedDuring ||= s.paused;
        if (s.ready && !s.paused && !live.readyAt) live.readyAt = Date.now();
      }
      if (!s?.watching && live) {
        const { readyAt, seenAt, ...encounter } = live;
        report.encounters.push({ ...encounter, ready: undefined, watching: undefined, paused: undefined,
          startedAt: new Date(seenAt).toISOString(), readyWaitMs: readyAt ? readyAt - seenAt : null,
          seconds: readyAt ? (Date.now() - readyAt) / 1000 : null, result: s?.result,
          valid: !!readyAt && !live.pausedDuring && !live.tutorial && live.speed === 1 });
        live = null; await save();
      }
      if (s) priorWatching = s.watching;
      await page.waitForTimeout(100);
    }
  } catch (error) {
    if (!/closed|disconnected/i.test(String(error))) report.errors.push(String(error));
  }
  report.endedAt = new Date().toISOString();
  const sessionReport=await readFile(resolve(root,arg('session-report','reports/cardrpg-a6/q13f-first-session.json')),'utf8').then(JSON.parse).catch(()=>null);
  if(sessionReport){const crossed=new Set(sessionReport.encounters.filter(e=>e.crossedLease).map(e=>e.seed));for(const encounter of report.encounters)if(crossed.has(encounter.seed)){encounter.valid=false;encounter.exclusion='Crossed timing-lock lease';}}
  const quantile = (values, q) => { const v = values.slice().sort((a,b) => a-b); return v.length ? Math.round(v[Math.min(v.length - 1, Math.floor(v.length*q))]*100)/100 : null; };
  const duration = boss => { const v = report.encounters.filter(e => e.valid && e.boss === boss).map(e => e.seconds); return {samples:v.length, medianSeconds:quantile(v,.5), p90Seconds:quantile(v,.9)}; };
  report.summary = {normal:duration(false), boss:duration(true), errors:report.errors.length};
  await save(); console.log(JSON.stringify(report.summary)); process.exit(0);
}
if (!segment) {
  const videoDirectory = arg('video-dir', '');
  if (videoDirectory && !videoDirectory.startsWith('/tmp/cardrpg-a6-')) throw Error('Keep raw review video in the lane A6 temporary directory.');
  const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal', '--remote-debugging-port=5963'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(videoDirectory ? {recordVideo:{dir:videoDirectory,size:{width:1280,height:800}}} : {}) });
  const page = await context.newPage(), video = page.video(), videoStartedAt = Date.now();
  try {
    for (let i = 1; i <= 2; i++) {
      const code = await new Promise((done, reject) => {
        const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs', `A6-first-session-${i}`, process.execPath, 'tools/cardrpg-a6/first-session.mjs', `--segment=${i}`, `--segment-seconds=${segmentSeconds}`, `--out=${output}`, `--shots=${shotDirectory}`], { cwd: root, stdio: 'inherit' });
        child.on('error', reject); child.on('close', done);
      });
      if (code || await stopped()) { process.exitCode = code || 0; break; }
    }
  } finally {
    await browser.close();
    if (video) {
      const report = await readFile(output, 'utf8').then(JSON.parse).catch(() => ({interrupted:true}));
      report.video = {path:await video.path(),startOffsetSeconds:report.startedAt ? Math.max(0,(Date.parse(report.startedAt)-videoStartedAt)/1000) : 0};
      await writeFile(output, JSON.stringify(report,null,2)+'\n');
    }
  }
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
    report.strategy = 'Real UI only; one level per completed route, plus the named loss fix. No fixture grants, skips or speed changes.';
    // Observe browser frame delivery without changing the model or its clock.
    await page.evaluate(() => {
      const probe = { active: false, last: 0, samples: [] }; window.__a6FrameProbe = probe;
      const frame = time => {
        const model = window.__depthReview;
        if (model?.showBattle && model.sceneReady && !model.paused) {
          if (probe.active && probe.samples.length < 120000) probe.samples.push(time - probe.last);
          probe.active = true;
        } else probe.active = false;
        probe.last = time; requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }
  async function capture(name) {
    if (!shotDirectory || report.shots?.some(shot => shot.name === name)) return;
    const directory = resolve(root, shotDirectory); await mkdir(directory, { recursive: true });
    report.shots ??= [];
    for (const [width, height] of [[1440, 900], [1280, 720]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(250);
      const temporary = `/tmp/cardrpg-a6-first-session-${width}-${name}.png`, file = `${width}-${name}.webp`;
      await page.screenshot({ path: temporary });
      execFileSync('cwebp', ['-quiet', '-q', '83', temporary, '-o', resolve(directory, file)]);
      report.shots.push({ name, width, height, file, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
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
          battle: b ? { seed: b.seed, result: b.result, round: b.round, hpRemaining: b.actors.filter(a => a.side === 'party').reduce((n,a)=>n+a.hp,0)/Math.max(1,b.actors.filter(a=>a.side==='party').reduce((n,a)=>n+a.maxHp,0)), chapter:b.chapter, boss: r?.nodes.find(n => n.id === r.current)?.kind === 'boss', combos: b.v4?.events.filter(e => e.kind === 'bond.combo').length ?? 0 } : null,
          notice: m.notice, error: m.error, cleared: m.state.cleared };
      });
      if (!s) { await page.waitForTimeout(1000); continue; }
      if (prior && (s.cards.length > prior.cards.length || s.cards.some(c => c.level > (prior.cards.find(p => p.id === c.id)?.level ?? 0) || c.stars > (prior.cards.find(p => p.id === c.id)?.stars ?? 0)) || Object.entries(s.currencies).some(([key, value]) => value > prior.currencies[key]) || s.cleared.length > prior.cleared.length || s.unlock && s.unlock !== prior.unlock || s.route?.id === prior.route?.id && ((s.route?.points ?? 0) > (prior.route?.points ?? 0) || (s.route?.rewards ?? 0) > (prior.route?.rewards ?? 0)))) {
        report.rewards.push({ at: seconds(), gap: seconds() - report.lastReward, screen: s.screen }); report.lastReward = seconds();
      }
      prior = s;
      let acted = false;
      if (s.watching) {
        if (!liveEncounter) liveEncounter = { at: seconds(), seed: s.battle?.seed, tutorial: s.tutorial < 3, boss: s.battle?.boss, chapter:s.battle?.chapter, node:s.route?.current };
        const combo = page.getByLabel('Bond combo', { exact: true });
        if (!report.comboScreenshot && await combo.isVisible().catch(() => false)) { await page.screenshot({ path: '/tmp/cardrpg-a6-first-combo.png' }); report.comboScreenshot = true; }
        acted = true;
      } else if (s.screen === 'prepare') {
        if (s.tutorial >= 3) await capture('prepare');
        acted = await click(button(/^Fight/), 'Fight');
      } else if (s.screen === 'result') {
        if (liveEncounter) { report.encounters.push({ ...liveEncounter, seconds: seconds() - liveEncounter.at, result: s.battle?.result, rounds: s.battle?.round, combos: s.battle?.combos, hpRemaining:s.battle?.hpRemaining }); liveEncounter = null; }
        if (s.battle?.result === 'enemy') {
          const advice = page.locator('.dp-v4-advice'), fix = advice.getByRole('button').first();
          if (await fix.isVisible().catch(() => false)) {
            await capture('loss');
            const label = await fix.innerText(), description = await advice.innerText();
            report.lossAdvice ??= []; report.lossAdvice.push({at:seconds(),label,description});
            acted = await click(fix, `Follow loss advice: ${label}`);
            if (acted && !label.startsWith('Apply')) report.pendingFix = label.includes('gear') ? 'gear' : /stars?/i.test(description) ? 'star' : 'level';
          } else if (await advice.isVisible().catch(() => false)) acted = true;
          if (!acted) acted = await click(button(/^(Next|Back to cafe|Back to Tower)/), 'Return after loss');
        } else acted = await click(button(/^Next/), 'Next result');
      } else if (s.screen === 'hub') {
        const trainingKey = String(s.nextRunId);
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
        if (report.pendingFix === 'level' || report.pendingFix === 'star') {
          const fix = report.pendingFix; report.pendingFix = null;
          acted = await click(button(fix === 'star' ? 'Add a star' : 'Level up'), 'Apply named loss upgrade');
          report.hintUpgrades ??= []; report.hintUpgrades.push({ at: seconds(), kind: fix, applied: acted, cat: s.selected });
          if (!acted) acted = await close();
        } else if (s.guide === 'upgrade') {
          acted = await click(button('Level up'), 'First cat level');
          if (acted) report.trainedRoute = s.nextRunId;
        }
        else if (!report.sawBook && await button('Bond Book').isVisible().catch(() => false)) acted = await click(button('Bond Book'), 'Read Bond Book');
        else {
          const candidate = s.cards.filter(c => s.team.includes(c.id)).sort((a, b) => a.level - b.level)[0];
          if (report.trainedRoute !== s.nextRunId && candidate && candidate.id !== s.selected && candidate.level < 8) acted = await click(page.locator('.uv-cat-grid button').filter({ hasText: new RegExp(candidate.id, 'i') }), 'Select lowest-level teammate');
          else if (report.trainedRoute !== s.nextRunId && candidate?.level < 8) {
            acted = await click(button('Level up'), 'Level up');
            if (acted) report.trainedRoute = s.nextRunId;
          }
          if (!acted) acted = await close();
        }
      } else if (s.screen === 'inventory' && report.pendingFix === 'gear') {
        report.pendingFix = null;
        const detail = page.locator('.uv-detail details').filter({has: page.locator('summary').filter({hasText:'Enhance or compare'})});
        if (await detail.count() && !await detail.getAttribute('open').then(v => v !== null)) await detail.locator('summary').click();
        acted = await click(button('Enhance'), 'Apply named gear enhancement');
        report.hintUpgrades ??= []; report.hintUpgrades.push({at: seconds(), kind:'gear', applied:acted});
        if (!acted) acted = await close();
      } else if (s.screen === 'bonds') {
        report.sawBook = true; acted = await click(button('Build a bonded team'), 'Formation from Bond Book');
      } else if (s.screen === 'team') {
        if (!report.recommended) { acted = await click(button('Use recommended crew'), 'Use recommended crew'); report.recommended = true; }
        else acted = await close();
      } else if (s.screen === 'map') {
        await capture('map');
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
  const frames = await page.evaluate(() => window.__a6FrameProbe?.samples ?? []);
  const trailingGap = Math.max(0, report.activeSeconds-report.lastReward);
  const gaps = [...report.rewards.map(r => r.gap),trailingGap];
  report.summary = { activeSeconds: Math.round(report.activeSeconds*100)/100, encounters: encounters.length,
    wins: encounters.filter(e => e.result === 'party').length, losses: losses.length,
    firstLossSeconds: losses.length ? Math.round((losses[0].at+losses[0].seconds)*100)/100 : null,
    normalWinHpMedian: quantile(encounters.filter(e=>!e.boss&&e.result==='party').map(e=>e.hpRemaining),.5),
    browser: 'Chromium with Metal ANGLE, headless, x1 UI clicks',
    losses10: losses.filter(e => e.at+e.seconds<=600).length, losses30: losses.filter(e => e.at+e.seconds<=1800).length,
    normal: duration(false), boss: duration(true),
    frameDelivery: { samples: frames.length, medianMs: quantile(frames, .5), p95Ms: quantile(frames, .95) },
    visibleRewards: { count: report.rewards.length, medianGap: quantile(gaps,.5), maxGap: Math.round(Math.max(...gaps)*100)/100, trailingGap: Math.round(trailingGap*100)/100 },
    errors: report.errors.length, stalls: report.stalls.length };
  if(segment === 2) console.log(JSON.stringify({ summary: report.summary }));
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  // Exit disconnects this observer; the parent retains the browser and page.
  process.exit(0);
}
