/** 30-day economy projection through real public transactions and DepthModel
 * battle timelines. This is a modeled player policy, not a month of UI testing.
 * The B3 driver remains the separate authority for real 30-minute balance. */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { loadRuntime, root, freshAccount, fraction, decisionDelay } from './runtime.mjs';
import { chooseAction, executeModelAction, remember } from './policy.mjs';
import { createEconomyLedger } from './economy-ledger.mjs';
const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const out = resolve(arg('out', resolve(root, 'work/cardrpg-c2/loot')));
const days = Number(arg('days', '30')), count = Number(arg('count', '200')), first = Number(arg('first-seed', '90001'));
const profiles = [{ id: 'casual', minutes: 30, upgrades: 1 }, { id: 'regular', minutes: 60, upgrades: 2 }, { id: 'heavy', minutes: 180, upgrades: 3 }].filter(p => !arg('profile') || p.id === arg('profile'));
if (!profiles.length || ![days, count, first].every(n => Number.isSafeInteger(n) && n > 0)) throw Error('Invalid simulation parameters');
await mkdir(out, { recursive: true });
const runtimeFile = resolve(out, 'runtime/runtime.mjs');
const { R, DepthModel } = isMainThread ? await loadRuntime(resolve(out, 'runtime')) : await import(pathToFileURL(workerData.runtimeFile).href);
const source = !isMainThread ? null : { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
 runtimeSha256: createHash('sha256').update(await readFile(resolve(out, 'runtime/runtime.mjs'))).digest('hex'),
 driverSha256: createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'), date: new Date().toISOString() };
const DAY = 86400000, frame = 1000 / 60;
const epoch = Date.UTC(2026, 10, 12);
const rank = { common: 0, rare: 1, epic: 2, legendary: 3 };

function project(seed, profile) {
 const m = new DepthModel(true, true, true, true, true); m.state = freshAccount(R, seed, epoch);
 const ledger = createEconomyLedger(m.state, R.GEAR_BY_ID), memory = {}, economy = { homes: {}, attempted: {}, seenGear: '', failedRoutes: 0 };
 const view = { eventsOpen: false, tipsOpen: false, eventTab: 'login', revealDone: false };
 const combat = { wins: 0, losses: 0, completed: 0, skips: 0, seconds: 0, byMode: {} };
 let now = epoch, actionIndex = 0, currentBattle = null, day = 1;
 const apply = (result, source) => {
  if (!result.ok) throw Error(`${source}: ${result.error}`);
  const before = m.state; m.apply(result); ledger.record(before, m.state, { day, source });
 };
 const available = (result, source) => result.ok ? { result, source } : null;

 function atHome() {
  const s = m.state, key = `${day}:${s.nextRunId}`, dailyKey = String(day);
  const attempts = economy.homes[key] ??= { upgrades: 0 };
  const once = tag => !economy.attempted[`${dailyKey}:${tag}`];
  const tried = tag => { economy.attempted[`${dailyKey}:${tag}`] = true; };
  // Claim visible earned sources; the rules preserve capped entitlements.
  if (!R.idleChestA6(s, Math.floor(now)).reason) return { result: R.claimIdleA6(s, Math.floor(now)), source: 'idle' };
  const board = R.dailyBoardA6(s, Math.floor(now));
  if (!board.login.reason) return { result: R.claimDailyA6(s, Math.floor(now), 'login'), source: 'login' };
  const task = board.tasks.find(t => !t.reason);
  if (task) return { result: R.claimDailyA6(s, Math.floor(now), 'task', task.id), source: 'daily-task' };
  const weekly = board.weekly.find(w => !w.reason);
  if (weekly) return { result: R.claimDailyA6(s, Math.floor(now), 'weekly', weekly.points), source: 'weekly' };
  for (const milestone of R.MILESTONES_V4) if (!R.milestonePreviewV4(s, milestone.id).reason)
   return { result: R.claimMilestoneV4(s, milestone.id), source: 'journal' };
  for (const reward of R.STAR_REWARDS_V4) if (!R.starRewardPreviewV4(s, reward.id).reason)
   return { result: R.claimStarRewardV4(s, reward.id), source: 'stars' };
  for (const id of Object.keys(s.account.quests)) if (!R.boardPreviewV4(s, id).reason)
   return { result: R.metaCommand(s, { type: 'claimQuest', questId: id }), source: 'quest-board' };
  for (const floor of R.TOWER_CHESTS_A6) if (!R.towerChestA6(s, floor).reason)
   return { result: R.claimTowerChestA6(s, floor), source: 'tower-chest' };
  if (!R.idleChestA6(s, Math.floor(now), true).reason) return { result: R.claimIdleA6(s, Math.floor(now), true), source: 'fast' };

  const signature = `${s.account.nextId}:${s.gear.length}`;
  if (economy.seenGear !== signature) {
   economy.seenGear = signature;
   const equipped = available(R.autoEquipA6(s), 'equip'); if (equipped) return equipped;
  }
  // Keep equipped pieces and a varied shelf. Record minting before any salvage.
  if (s.gear.length > 48) {
   const worn = new Set(Object.values(s.equipment).flatMap(Object.values));
   const spare = s.gear.filter(g => !worn.has(g.id)).sort((a, b) => rank[R.GEAR_BY_ID[a.templateId].rarity] - rank[R.GEAR_BY_ID[b.templateId].rarity] || a.id.localeCompare(b.id))[0];
   if (spare) return { result: R.salvageGear(s, spare.id), source: 'salvage' };
  }
  // Save earned invitations for gear until the first Legendary, then alternate
  // gear/cats. This declared collecting goal is identical for all play profiles.
  const banner = ledger.report.firstLegendaryDay === null || (s.account.daily.draws % 2 === 0) ? 'equipment' : 'standard';
  const draw = R.metaCommand(s, { type: 'pull', bannerId: banner, seed: (seed + day * 104729 + actionIndex * 7919) >>> 0, count: 1 });
  if (draw.ok) return { result: draw, source: `recruit:${banner}` };
  const templates = [...R.GEAR].sort((a, b) => rank[b.rarity] - rank[a.rarity] || a.id.localeCompare(b.id));
  const selected = templates.find(t => !R.selectorEligibilityV4(s, 'gear', t.id));
  if (selected) return { result: R.chooseSelectorV4(s, 'gear', selected.id), source: 'selector' };
  if (once('tailor')) {
   tried('tailor');
   const rarity = ledger.report.firstLegendaryDay === null ? 'legendary' : ledger.report.firstEpicDay === null ? 'epic' : null;
   if (rarity) for (const t of templates.filter(t => t.rarity === rarity)) {
    const craft = available(R.craftGear(s, t.id), 'tailor'); if (craft) return craft;
   }
  }
  if (once('forge') && fraction(seed, `forge:${day}`) < .35) {
   tried('forge');
   const craft = available(R.metaCommand(s, { type: 'forge', recipeId: 'mend-pantry-key' }), 'forge'); if (craft) return craft;
  }
  if (attempts.upgrades < profile.upgrades) {
   const option = R.upgradeOptionsA6(s)[0];
   if (option) { attempts.upgrades++; return { result: R.applyUpgradeA6(s, option.change, option.expectedBuild), source: 'upgrade' }; }
  }
  return null;
 }

 for (day = 1; day <= days; day++) {
  now = epoch + (day - 1) * DAY;
  apply(R.syncCalendarDay(m.state, now), 'calendar');
  const end = now + profile.minutes * 60000;
  let guard = 0;
  while (now < end && guard++ < 50000) {
   if (m.showBattle) {
    const identity = `${m.tutorialBattle ? 'tutorial' : m.state.run?.id}:${m.battle.seed}:${m.state.run?.current}`;
    if (identity !== currentBattle) { currentBattle = identity; now += 400; m.sceneReady = true; }
    if (m.canSkip && fraction(seed, `economy-skip:${identity}`) < .2) { m.skip(); combat.skips++; }
    else {
     const start = now;
     if (m.canAct) { now += 80; m.step(); }
     if (m.plan) {
      const ms = Math.min(Math.max(0, end - now), Math.ceil(Math.max(0, m.plan.duration - m.animationAt) / frame) * frame);
      now += ms; m.tick(ms, Math.floor(now));
     } else { now += frame; m.tick(frame, Math.floor(now)); }
     combat.seconds += (now - start) / 1000;
    }
    continue;
   }
   const intro = R.introductionA6(m.state).guide;
   const home = !m.state.run || m.state.run.complete;
   if (home && !intro && m.screen !== 'result') {
    const next = atHome();
    if (next) {
     const delay = decisionDelay(seed, actionIndex++, { type: next.source });
     if (now + delay >= end) break;
     now += delay; apply(next.result, next.source); now += 150; continue;
    }
    // One optional daily route and Tower attempt per active day for the longer
    // profiles. All use ordinary eligibility, encounters and shared reward caps.
    const dayKey = `${day}:mode`, tried = economy.attempted[dayKey] ??= [];
    let mode = 'campaign';
    if (profile.id !== 'casual' && m.state.cleared.includes(1) && !tried.includes('daily')) mode = 'daily';
    else if (profile.id === 'heavy' && m.state.cleared.includes(1) && m.state.towerBest < 30 && !tried.includes('tower')) mode = 'tower';
    tried.push(mode);
    const p = R.patrolDefaultsA6(m.state);
    const chapter = economy.failedRoutes >= 2 ? Math.max(1, ...m.state.cleared) : p.chapter;
    const result = R.startRun(m.state, chapter, (seed + m.state.nextRunId * 7919) >>> 0, mode, new Date(now).toISOString().slice(0, 10), p.band);
    now += decisionDelay(seed, actionIndex++, { type: 'start' });
    apply(result, `start:${mode}`); m.go('map'); continue;
   }
   Object.assign(view, { screen: m.screen, watching: false, canSkip: m.canSkip, now: Math.floor(now), cardId: m.cardId });
   let action = chooseAction(R, m.state, view, memory);
   if (!action) throw Error(`No economy action at ${m.screen}`);
   // After the first clear, longer profiles sometimes take both elite branches
   // to earn the mastery used by the real selector gate.
   if (action.type === 'enter' && profile.id !== 'casual' && m.state.run?.mode === 'campaign' && m.state.cleared.includes(m.state.run.chapter) && !m.state.masteries.includes(m.state.run.chapter)) {
    const elite = R.availableNodes(m.state.run).find(n => n.kind === 'elite'); if (elite) action = { type: 'enter', id: elite.id };
   }
   const delay = decisionDelay(seed, actionIndex++, action);
   if (now + delay >= end) break;
   now += delay; view.now = Math.floor(now);
   const before = m.state, battle = action.type === 'finish' ? m.battle : null;
   const sourceName = action.type === 'finish' && !m.tutorialBattle ? `encounter:${m.state.run.mode}:${m.state.run.nodes.find(n => n.id === m.state.run.current)?.kind}` : action.type;
   executeModelAction(R, m, view, action); remember(memory, action, before);
   ledger.record(before, m.state, { day, source: sourceName });
   if (battle && !battle.initial.tutorial) {
    combat.completed++; combat[battle.result === 'party' ? 'wins' : 'losses']++;
    const mode = before.run.mode; combat.byMode[mode] = (combat.byMode[mode] ?? 0) + 1;
    if (m.state.run.complete) economy.failedRoutes = m.state.run.won ? 0 : economy.failedRoutes + 1;
   }
   if (action.type === 'welcome') now += 5400;
   if (['open-team', 'open-cats', 'open-events', 'open-recruit', 'patrol'].includes(action.type)) now += 100;
   now += 150;
  }
  if (guard >= 50000) throw Error('Economy action guard exceeded');
  ledger.report.daily.push({ day, bag: m.state.gear.length, currencies: { ...m.state.account.currencies },
   materials: m.state.materials, seals: m.state.seals, accountXp: m.state.account.accountXp,
   power: R.teamPowerV4(m.state), cleared: [...m.state.cleared], towerBest: m.state.towerBest,
   firstEpicDay: ledger.report.firstEpicDay, firstLegendaryDay: ledger.report.firstLegendaryDay });
 }
 return { seed, profile, days, combat, ...ledger.finish(m.state) };
}

// Local CPU workers run frozen rule code only; no agent/model delegation.
if (!isMainThread) {
 parentPort.on('message', ({ seed, profile }) => {
  try { parentPort.postMessage({ report: project(seed, profile) }); }
  catch (error) { parentPort.postMessage({ error: String(error.stack ?? error) }); }
 });
} else {
 const workers = Number(arg('workers', '1'));
 if (!Number.isInteger(workers) || workers < 1 || workers > 12) throw Error('Choose 1–12 local CPU workers');
 const jobs = profiles.flatMap(profile => Array.from({ length: count }, (_, i) => ({ seed: first + i, profile })));
 for (const job of jobs) {
  const file = resolve(out, `${job.profile.id}-${job.seed}.json`);
  if (await access(file).then(() => true, () => false)) throw Error('Preserve earlier projection: ' + file);
 }
 const reports = [], pool = [];
 const stopped = () => access(resolve(root, 'STOP-C2')).then(() => true, () => false);
 const save = async report => {
  reports.push({ seed: report.seed, profile: report.profile.id });
  await writeFile(resolve(out, `${report.profile.id}-${report.seed}.json`), JSON.stringify(report), { flag: 'wx' });
  console.log(JSON.stringify({ profile: report.profile.id, seed: report.seed, epic: report.firstEpicDay,
   legendary: report.firstLegendaryDay, bag: report.finalBag, combats: report.combat.completed, sinkRatios: report.sinkRatios }));
 };
 try {
  if (workers === 1) {
   for (const { seed, profile } of jobs) { if (await stopped()) throw Error('STOP-C2 requested'); await save(project(seed, profile)); }
  } else {
   let nextIndex = 0;
   await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, () => new Promise((done, fail) => {
    const worker = new Worker(new URL(import.meta.url), { argv: process.argv.slice(2), workerData: { runtimeFile } }); pool.push(worker);
    let retired = false;
    const next = async () => {
     if (await stopped()) throw Error('STOP-C2 requested');
     const job = jobs[nextIndex++];
     if (job) worker.postMessage(job);
     else { retired = true; await worker.terminate(); done(); }
    };
    worker.on('message', async message => {
     try { if (message.error) throw Error(message.error); await save(message.report); await next(); }
     catch (error) { fail(error); }
    });
    worker.on('error', fail);
    worker.on('exit', code => { if (!retired) fail(Error(`Economy worker exited unexpectedly: ${code}`)); });
    next().catch(fail);
   })));
  }
  reports.sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
  await writeFile(resolve(out, 'index.json'), JSON.stringify({ source, days, count, profiles, first, workers, reports }, null, 2));
 } finally { await Promise.allSettled(pool.map(worker => worker.terminate())); }
}
