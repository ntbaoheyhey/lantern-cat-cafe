/** Lane C: 30 real minutes, x1, UI actions only. Adapted from retained A6 driver.
 * No account grants, seed replay, game-clock jumps, direct commands or skipped fights.
 * Capture an earned normal and boss encounter from the same run for the C10 demo.
 */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFile,access,mkdir,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const tag=process.argv.find(v=>v.startsWith('--tag='))?.slice(6)??'';
if(tag&&!/^[a-z0-9-]+$/.test(tag))throw Error('Tag must be lowercase letters, numbers and hyphens.');
const suffix=tag?'-'+tag:'',output=resolve(root,`reports/cardrpg-c/first-session${suffix}.json`),shotDirectory=`reports/cardrpg-c/shots/c11-session${suffix}`,segment=1;
if(await access(output).then(()=>true,()=>false))throw Error('Preserve the existing account evidence; use a new --tag.');
const stopped=async()=>access(resolve(root,'reports/cardrpg-c/STOP-C')).then(()=>true,()=>false);
const ps=()=>execFileSync('ps',['-axo','pid,comm,args'],{encoding:'utf8'}).split('\n').filter(line=>/python|iopaint|realesrgan/.test(line)&&/iopaint|lama|realesrgan|sam[_-]/i.test(line));
if(ps().length)throw Error('PSD heavy job active; start real timing after it completes.');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal','--remote-debugging-port=5973']});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:`/tmp/cardrpg-c-first-session${suffix}-video`,size:{width:1280,height:720}}});
const page=await context.newPage(),video=page.video(),videoStartedAt=Date.now();
try{
  page.setDefaultTimeout(2500);
  const report = { startedAt: new Date().toISOString(), activeSeconds: 0, actions: [], rewards: [], encounters: [], errors: [], stalls: [], lastReward: 0, trainingKeys: [], sawBook: false };
  report.sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  report.driverSha256=createHash('sha256').update(await readFile(import.meta.filename)).digest('hex');
  report.timingNotes='Wall-clock UI observation, including player actions and loading; not an isolated renderer benchmark.';
  const started = Date.now(), baseSeconds = report.activeSeconds;
  const seconds = () => baseSeconds + (Date.now() - started) / 1000;
  page.on('pageerror', e => report.errors.push({ at: seconds(), error: e.message }));
  page.on('console', message => { if (message.type() === 'error') report.errors.push({ at: seconds(), error: message.text(), source: 'console' }); });
  // A fight spanning the lock handoff is excluded from duration summaries.
  if (segment > 1 && report.liveEncounter) report.liveEncounter.crossedLease = true;
  if (segment === 1) {
    await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
    await page.getByRole('button', { name: 'Cats', exact: true }).waitFor();
    report.strategy = 'Real UI only; one level per completed route, plus the named loss fix. No fixture grants, skips or speed changes.';
    // Observe browser frame delivery without changing the model or its clock.
    await page.evaluate(() => {
      const probe = { active: false, last: 0, samples: [], casts: [], lastPlan:null }; window.__a6FrameProbe = probe;
      const frame = time => {
        const model = window.__depthReview;
        if(model?.plan && model.plan!==probe.lastPlan){probe.lastPlan=model.plan;if(model.plan.ultimate)probe.casts.push({seed:model.battle?.seed,id:model.plan.actorId,skill:model.plan.skillId,at:performance.now()});}
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
    for (const [width, height] of [[1280, 720]]) {
      await page.setViewportSize({ width, height }); await page.waitForTimeout(250);
      const temporary = `/tmp/cardrpg-c-first-session-${width}-${name}.png`, file = `${width}-${name}.webp`;
      await page.screenshot({ path: temporary });
      execFileSync('cwebp', ['-quiet', '-q', '83', temporary, '-o', resolve(directory, file)]);
      report.shots.push({ name, width, height, file, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  async function click(locator, name) {
    const target = locator.first();
    if (!await target.isVisible().catch(() => false) || !await target.isEnabled()) return false;
    await target.click(); report.actions.push({ at: seconds(), action: name }); return true;
  }
  const button = name => page.getByRole('button', { name, exact: typeof name === 'string' });
  const close = () => click(button('Close'), 'Close sheet');
  let prior = report.latest, liveEncounter = report.liveEncounter, unhandled = 0, lastCheckpoint = baseSeconds;
  while (Date.now() - started < 1800 * 1000 && !await stopped()) {
    try {
      const s = await page.evaluate(() => {
        const m = window.__depthReview;
        if (!m) return null;
        const r = m.state.run, b = m.battle;
        return { guide: document.querySelector('.uv-shell')?.dataset.a6Guide, unlock: document.querySelector('.a6-unlock-toast strong')?.textContent ?? '', screen: m.screen, watching: m.showBattle, sceneReady: m.sceneReady, paused: m.paused, speed: m.state.settings.speed, tutorial: m.state.tutorial,
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
        if (!liveEncounter) liveEncounter = { at: seconds(), seed: s.battle?.seed, tutorial: s.tutorial < 3, boss: s.battle?.boss, chapter:s.battle?.chapter, node:s.route?.current, readyAt:null, pausedDuring:false, speed:s.speed };
        if (s.sceneReady && !s.paused && liveEncounter.readyAt === null) liveEncounter.readyAt = seconds();
        liveEncounter.pausedDuring ||= s.paused;
        const combo = page.getByLabel('Bond combo', { exact: true });
        if (!report.comboScreenshot && await combo.isVisible().catch(() => false)) { await page.screenshot({ path: '/tmp/cardrpg-c-first-combo.png' }); report.comboScreenshot = true; }
        acted = true;
      } else if (s.screen === 'prepare') {
        if (s.tutorial >= 3) await capture('prepare');
        acted = await click(button(/^Fight/), 'Fight');
      } else if (s.screen === 'result') {
        if (liveEncounter) { report.encounters.push({ ...liveEncounter, seconds: seconds() - liveEncounter.at, playbackSeconds: liveEncounter.readyAt === null ? null : seconds() - liveEncounter.readyAt, result: s.battle?.result, rounds: s.battle?.round, combos: s.battle?.combos, hpRemaining:s.battle?.hpRemaining }); liveEncounter = null; }
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
        } else acted = await click(button(/^(Next|Complete lesson)/), 'Next result');
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
        else if (!s.active && !(report.dailyCheckedRuns??[]).includes(s.nextRunId) && await page.locator('.uv-events button').filter({hasText:'Today’s tasks'}).count()) {
          report.dailyCheckedRuns??=[];report.dailyCheckedRuns.push(s.nextRunId);
          acted = await click(button('Today’s tasks'), 'Open daily tasks');
        }
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
        const before=await page.evaluate(()=>{const m=window.__depthReview,item=m.state.gear.find(g=>g.id===m.itemId)??m.state.gear[0];return item?{id:item.id,enhancement:item.enhancement}:null;});
        acted = await click(button(/^Enhance(?: \+\d+)?$/), 'Apply named gear enhancement');
        const after=before?await page.evaluate(id=>window.__depthReview.state.gear.find(g=>g.id===id)?.enhancement,before.id):null;
        report.hintUpgrades ??= []; report.hintUpgrades.push({at: seconds(), kind:'gear', clicked:acted, applied:!!before&&after===before.enhancement+1, item:before?.id, before:before?.enhancement, after});
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
      if (unhandled === 8) { report.stalls.push({ at: seconds(), screen: s.screen, notice: s.notice, buttons: await page.getByRole('button').allTextContents() }); await page.screenshot({ path: '/tmp/cardrpg-c-session-stall.png' }); }
      if (seconds() - lastCheckpoint > 30) {
        const heavy=ps();if(heavy.length){report.timingInterruptedBy=heavy;break;}
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
    const times = encounters.filter(e => !!e.boss === boss && !e.crossedLease && !e.pausedDuring && e.speed === 1 && e.playbackSeconds !== null).map(e => e.playbackSeconds);
    return { samples: times.length, medianSeconds: quantile(times,.5), p90Seconds: quantile(times,.9) };
  };
  const losses = encounters.filter(e => e.result === 'enemy');
  report.ultimateCasts=await page.evaluate(()=>window.__a6FrameProbe?.casts??[]);
  const frames = await page.evaluate(() => window.__a6FrameProbe?.samples ?? []);
  const trailingGap = Math.max(0, report.activeSeconds-report.lastReward);
  const gaps = [...report.rewards.map(r => r.gap),trailingGap];
  report.summary = { activeSeconds: Math.round(report.activeSeconds*100)/100, encounters: encounters.length,
    wins: encounters.filter(e => e.result === 'party').length, losses: losses.length,
    firstLossSeconds: losses.length ? Math.round((losses[0].at+losses[0].seconds)*100)/100 : null,
    normalWinHpMedian: quantile(encounters.filter(e=>!e.boss&&e.result==='party').map(e=>e.hpRemaining),.5),
    browser: 'Chromium with Metal ANGLE, headless, x1 UI clicks; durations begin after sceneReady',
    losses10: losses.filter(e => e.at+e.seconds<=600).length, losses30: losses.filter(e => e.at+e.seconds<=1800).length,
    normal: duration(false), boss: duration(true),
    frameDelivery: { samples: frames.length, medianMs: quantile(frames, .5), p95Ms: quantile(frames, .95) },
    visibleRewards: { count: report.rewards.length, medianGap: quantile(gaps,.5), maxGap: Math.round(Math.max(...gaps)*100)/100, trailingGap: Math.round(trailingGap*100)/100 },
    errors: report.errors.length, stalls: report.stalls.length };
  console.log(JSON.stringify({ summary: report.summary }));
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  report.video={path:await video.path(),startOffsetSeconds:Math.max(0,(Date.parse(report.startedAt)-videoStartedAt)/1000)};
  await context.close();
  await writeFile(output,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();}
