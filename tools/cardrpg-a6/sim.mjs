/** One A6 simulation entry point. Reuses public rules and the V5 loader/route-bot pattern.
 * Run under with-timing-lock.mjs after df -h ~. No model calls, registration or source hashes.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { availableParallelism } from 'node:os';

const root = resolve(import.meta.dirname, '../..');
const arg = (key, fallback) => process.argv.find(value => value.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const quantile = (values, q) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * q))] ?? null;
const mean = values => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
const pct = (n, total) => total ? 100 * n / total : 0;
const round = value => value === null ? null : Math.round(value * 100) / 100;
const take = result => { assert(result.ok, result.error); return result.state; };
const allTeams = ids => ids.flatMap((a, i) => ids.slice(i + 1).flatMap((b, j) => ids.slice(i + j + 2).map(c => [a, b, c])));

async function simulation(bundleUrl, mode) {
  const { R, C, onboarding, presentation, pacing } = await import(bundleUrl);
  assert(mode === 'before' || typeof R.setGameplayA6 === 'function', 'A6 rules are not connected yet; use --mode=before for Q1.');
  const state = seed => {
    let s = R.setSkillsV5(R.createDepthAccount(seed, 0), true);
    if (mode === 'a6' && R.setGameplayA6) s = R.setGameplayA6(s, true);
    return s;
  };
  const flag = s => s.gameplayA6 ? { gameplayA6: true } : {};
  const teams = allTeams(C.CARDS.map(c => c.id));
  // Four authored crews plus a fixed, evenly spaced sample of mixed squads.
  // Every selected team receives all 500 seeds; avoid an exhaustive balance matrix.
  const varietyTeams = [...new Map([...R.CREWS_V5.map(c => [...c.cats]), ...teams.filter((_, i) => i % 8 === 0)]
    .map(team => [team.slice().sort().join(','), team])).values()];
  const normalEnemies = [['button-guard', 'sock-skipper'], ['needle-moth', 'teacup-healer'], ['sock-skipper', 'binding-thread']];
  const durationCache = new Map();
  const adviceCache = new Map();
  let replayVerified = false;
  const actionSeconds = (identity, death, setup) => {
    const key = `${identity}/${death}/${!!setup.gameplayA6}/${setup.enemies.some(id => R.ENEMY_BY_ID[id]?.tier === 'boss')}`;
    if (!durationCache.has(key)) {
      const marker = { version: 3, seq: 0, turn: 0, round: 0, actionId: 0, beat: 0,
        type: 'action_start', actorId: 'sim', skillId: identity, targetIds: [], amount: 0 };
      const events = death ? [marker, { ...marker, type: 'death', beat: 2 }] : [marker];
      durationCache.set(key, pacing.paceActionA6(presentation.createCardActionPlan(events, identity), setup).duration / 1000);
    }
    return durationCache.get(key);
  };
  // Authored x1 timeline, not a browser performance claim. Includes the real 300 ms round beat.
  function measure(b) {
    const casts = Object.fromEntries(b.initial.cats.map(c => [c.id, 0]));
    let seconds = Math.max(0, b.round - 1) * .3, death = false;
    for (const event of b.log) {
      if (event.kind === 'defeat') death = true;
      if (event.kind !== 'action' && event.kind !== 'enemy-action') continue;
      const actor = b.actors.find(a => a.id === event.actorId);
      const identity = actor?.side === 'enemy' ? `enemy:${actor.catalogId}${event.round % 3 === 0 ? '' : ':basic'}` : event.skillId;
      seconds += actionSeconds(identity, death, b.initial) + .08;
      death = false;
      if (actor?.side === 'party' && event.skillId?.endsWith('-4') && !event.text.includes('prevented the action')) casts[actor.catalogId]++;
    }
    return { rounds: b.round, seconds, win: b.result === 'party', casts };
  }
  function fixture(team, seed, chapter = 3) {
    const s = state(seed);
    // Fixed level-six, four Epic-slot fixture, separate from naturally earned bot accounts.
    s.account.cards = team.map(id => ({ id, cardId: id, level: 6, stars: 1, shards: 0, soulbound: true }));
    s.team = [...team]; s.gear = []; s.equipment = {}; s.cleared = [1, 2, 3];
    const themes = { guardian: 'hearthloom', witch: 'moonwick', alchemist: 'mossbrew' };
    for (const id of team) {
      s.rows[id] = R.CAT_BY_ID[id].row; s.skills[id] = R.defaultSkills(s, id);
      for (const [index, slot] of C.EQUIPMENT_SLOTS.entries()) {
        const item = R.makeGear(s, `${themes[C.CARD_BY_ID[id].role]}-${slot}-epic`, seed + index * 7919);
        s.gear.push(item); (s.equipment[id] ??= {})[slot] = item.id;
      }
    }
    if (!team.some(id => s.rows[id] === 'front')) s.rows[team[0]] = 'front';
    return { s, setup: { seed, chapter, gameplayV4: true, skillsV5: true, ...flag(s), challengeLevel: 6, cats: R.battleCats(s) } };
  }
  function battle(setup) {
    const result = R.playBattle(R.createBattle(setup), 'auto');
    if (!replayVerified) { assert.deepEqual(R.replayBattle(result.initial, result.choices), result); replayVerified = true; }
    return result;
  }
  function upgrade(s) {
    // The bot's concrete cheapest legal level hint. No free currency or hidden stat grant.
    for (const card of s.account.cards.filter(c => s.team.includes(c.cardId)).sort((a, b) => a.level - b.level || a.cardId.localeCompare(b.cardId))) {
      const result = R.metaCommand(s, { type: 'level', cardId: card.id });
      if (result.ok) return { state: result.state, hint: `Raise ${R.CAT_BY_ID[card.cardId].name} to level ${card.level + 1}` };
    }
    return { state: s, hint: null };
  }
  function adviceFor(s, encounter) {
    // The existing advisor always samples seeds 1–10. A route ID is only a stale-click guard.
    // Reuse identical build/encounter work; restore that guard for the current live account.
    if (mode !== 'before') return R.recommendBuildV4(s, encounter);
    const build = JSON.parse(R.adviceBuildKeyV4(s)); delete build.run;
    // Funds affect this advisor only through whether each one-level change is legal.
    // Preserve that exact legality while sharing the fixed-seed combat evaluation.
    build.currencies = s.team.map(id => {
      const card = s.account.cards.find(c => c.cardId === id);
      return [id, R.changeBuildV4(s, { kind: 'level', cardId: card.id }).ok];
    });
    const { seed: ignoredSeed, ...fixedEncounter } = encounter;
    void ignoredSeed;
    const key = JSON.stringify([build, fixedEncounter]);
    if (!adviceCache.has(key)) adviceCache.set(key, R.recommendBuildV4(s, encounter));
    const advice = adviceCache.get(key);
    return advice ? { ...advice, expectedBuild: R.adviceBuildKeyV4(s) } : null;
  }
  function equip(s) {
    for (const id of s.team) for (const slot of C.EQUIPMENT_SLOTS) {
      const worn = new Set(Object.entries(s.equipment).filter(([cat]) => cat !== id).flatMap(([, slots]) => Object.values(slots)));
      const best = s.gear.filter(g => R.GEAR_BY_ID[g.templateId].slot === slot && !worn.has(g.id)).map(item => ({ item, utility: R.itemUtilityV4(s, id, item) })).sort((a, b) => b.utility - a.utility)[0]?.item;
      if (best && s.equipment[id]?.[slot] !== best.id) s = take(R.equipGear(s, id, best.id));
    }
    return s;
  }
  // Preview before a public claim: failed transactions otherwise clone the full retained route.
  function claims(s, now) {
    if (s.run && !s.run.complete) return s;
    const cafe = R.claimCafeShiftV4(s, Math.floor(now * 1000)); if (cafe.ok) s = cafe.state;
    for (const q of C.QUESTS.filter(q => { const p=s.account.quests[q.id]; return p && !p.claimed && p.progress>=q.target; })) { const r = R.metaCommand(s, { type: 'claimQuest', questId: q.id }); if (r.ok) s = r.state; }
    for (const goal of R.STAR_REWARDS_V4) { if(R.starRewardPreviewV4(s,goal.id).reason)continue; const r = R.claimStarRewardV4(s, goal.id); if (r.ok) s = r.state; }
    for (const goal of R.MILESTONES_V4) { if(R.milestonePreviewV4(s,goal.id).reason)continue; const r = R.claimMilestoneV4(s, goal.id); if (r.ok) s = r.state; }
    if (R.gameplayA6(s)) {
      const ms = Math.floor(now * 1000);
      if(!R.dailyBoardA6(s,ms).login.reason) { const login = R.claimDailyA6(s, ms, 'login'); if (login.ok) s = login.state; }
      for (const task of R.DAILY_TASKS_A6) { if(R.dailyBoardA6(s,ms).tasks.find(t=>t.id===task.id).reason)continue; const r = R.claimDailyA6(s, ms, 'task', task.id); if (r.ok) s = r.state; }
      for (const points of R.WEEKLY_CHESTS_A6) { if(R.dailyBoardA6(s,ms).weekly.find(w=>w.points===points).reason)continue; const r = R.claimDailyA6(s, ms, 'weekly', points); if (r.ok) s = r.state; }
      for (const floor of R.TOWER_CHESTS_A6) { if(R.towerChestA6(s,floor).reason)continue; const r = R.claimTowerChestA6(s, floor); if (r.ok) s = r.state; }
    }
    return s;
  }
  const rewardState = s => ({ currency: Object.values(s.account.currencies).reduce((a, b) => a + b, 0), power: R.teamPowerV4(s), gear: s.gear.length, clears: s.cleared.length, stars: R.starCountV4(s), found: s.v4?.journey?.found.length ?? 0, routePoints: s.run?.points ?? 0, routeChoices: s.run?.rewardChoices.length ?? 0, routeBoons: Object.values(s.run?.boons ?? {}).reduce((sum, n) => sum + n, 0) });
  const progressed = (before, after) => Object.keys(before).some(key => after[key] > before[key]);
  function resolveStop(s) {
    const run = s.run;
    if (run.rewardChoices.length) return take(R.chooseReward(s, run.rewardChoices[0]));
    if (!run.current) return take(R.enterNode(s, R.availableNodes(run)[0].id));
    const node = run.nodes.find(n => n.id === run.current);
    if (node.kind === 'campfire') return take(R.resolveNode(s, 'heal'));
    if (node.kind === 'treasure') return take(R.resolveNode(s, 'charm'));
    if (node.kind === 'shop') return take(R.resolveNode(s, run.points >= 45 ? R.shopStock(run)[0] : 'leave'));
    const event = R.EVENTS.find(e => e.id === node.eventId);
    const option = [...event.choices].filter(o => o.cost <= run.points).sort((a, b) => b.heal - a.heal)[0];
    return take(R.resolveNode(s, option.id));
  }
  function firstSession(seed) {
    let s = state(seed), seconds = 5, losses10 = 0, losses30 = 0, hints = 0, retryWins = 0, battles = 0;
    const timeline = [{ at: 0, kind: 'Fresh save' }], gaps = [], rewards = [0], combat = [], lossExamples = [];
    // Exact public tutorial setup; presentation-only tutorial completion unlocks the welcome draw.
    const tutorial = battle({ seed: 7, chapter: 1, gameplayV4: true, skillsV5: true, ...flag(s), cats: R.battleCats(s), enemies: ['practice-cushion'], tutorial: true, enemyStats: { 'practice-cushion': { hp: 300, attack: 60, defense: 0 } } });
    seconds += measure(tutorial).seconds + 5; s.tutorial = 3;
    s = take(onboarding.firstInvitation(s, 4)); rewards.push(seconds); timeline.push({ at: round(seconds), kind: 'Welcome invitation' });
    for (let step = 0; step < 1500 && seconds < 1800; step++) {
      const before = rewardState(s); let kind = 'Route choice';
      if (!s.run || s.run.complete) {
        s = claims(s, seconds); s = equip(s); const raised = upgrade(s); s = raised.state;
        kind = raised.hint ?? 'Start patrol';
        s = take(R.startRun(s, Math.min(3, s.cleared.length + 1), seed + s.nextRunId * 7919));
        seconds += 8;
      } else if (s.run.battle) {
        s = take(R.commitPreparation(s));
        const b = R.playBattle(s.run.battle, 'auto'), result = measure(b); seconds += result.seconds + 5; battles++;
        if (seconds <= 1800) combat.push({ kind: b.initial.enemies.some(id => R.ENEMY_BY_ID[id].tier === 'boss') ? 'boss' : 'normal', ...result });
        const pendingResult = s;
        s = take(R.finishEncounter(s)); kind = result.win ? 'Battle reward' : 'Defeat';
        if (!result.win && seconds <= 1800) {
          losses30++; if (seconds <= 600) losses10++;
          const example = { at: round(seconds), chapter: b.chapter, band: b.initial.challengeLevel, enemies: b.initial.enemies, levels: s.team.map(id => s.account.cards.find(c => c.cardId === id).level) };
          lossExamples.push(example);
          const advice = adviceFor(s, b.initial);
          if (advice) {
            s = take(R.applyResultAdviceV4(pendingResult, advice));
            hints++; kind = advice.label;
            // Same enemy seed/lineup, full health after loss, same public equipped stats.
            const retry = battle({ ...b.initial, cats: R.battleCats(s), plan: s.v4.plan, hp: undefined });
            retryWins += Number(retry.result === 'party'); example.hint = advice.label; example.retryWin = retry.result === 'party';
          }
        }
      } else { s = resolveStop(s); seconds += 5; }
      if (seconds > 1800) break;
      if (progressed(before, rewardState(s))) { rewards.push(seconds); timeline.push({ at: round(seconds), kind }); }
    }
    rewards.push(1800);
    for (let i = 1; i < rewards.length; i++) gaps.push(rewards[i] - rewards[i - 1]);
    return { seed, gaps, losses10, losses30, hints, retryWins, battles, combat, lossExamples, timeline: seed === 1 || seed === 60001 ? timeline : undefined };
  }
  function economy(seed, sessionsPerDay) {
    let s = take(onboarding.firstInvitation(state(seed), 4)), pityDay = null;
    let firstEpic = s.account.history.some(r => ['epic', 'legendary'].includes(r.rarity)) ? 1 : null;
    let firstLegendary = s.account.history.some(r => r.rarity === 'legendary') ? 1 : null;
    const days = []; let paidDraws = 0;
    for (let day = 1; day <= 7; day++) {
      const before = rewardState(s);
      for (let session = 0; session < sessionsPerDay; session++) {
        const now = (day - 1) * 86400 + (session + 1) * (86400 / (sessionsPerDay + 1));
        s = take(R.syncCalendarDay(s, Math.floor(now * 1000))); s = claims(s, now);
        if (!s.run || s.run.complete) {
          s = equip(s);
          for (let i = 0; i < 3; i++) s = upgrade(s).state;
          s = take(R.startRun(s, Math.min(3, s.cleared.length + 1), seed + day * 7919 + session * 71));
        }
        // A four-minute check-in, or one completed patrol, whichever comes first.
        // Carry unfinished routes across visits; never grant an unplayed route's rewards.
        let elapsed = 0;
        while (s.run && !s.run.complete && elapsed < 240) {
          if (s.run.battle) {
            const b = R.playBattle(s.run.battle, 'auto'); elapsed += measure(b).seconds + 5;
            s = take(R.finishEncounter(s));
          } else { s = resolveStop(s); elapsed += 5; }
        }
        s = claims(s, now + elapsed);
        while (s.account.currencies.stamps >= R.invitationBannerV4('standard', s).cost.stamps) {
          const r = R.metaCommand(s, { type: 'pull', bannerId: 'standard', seed: seed + day * 9349 + paidDraws * 97 });
          if (!r.ok) break; s = r.state; paidDraws++;
          const rarity = s.account.history.at(-1).rarity;
          if (['epic', 'legendary'].includes(rarity)) firstEpic ??= day;
          if (rarity === 'legendary') firstLegendary ??= day;
          if (Object.values(s.account.pity).reduce((n, p) => n + p.totalPulls, 0) >= R.invitationBannerV4('standard').hardPity) pityDay ??= day;
        }
      }
      days.push({ day, progress: progressed(before, rewardState(s)), chapter: s.cleared.length, power: round(R.teamPowerV4(s)), paidDraws });
    }
    return { seed, sessionsPerDay, days, firstEpic, firstLegendary, pityDay, idleCap: R.cafeShiftV4(s, 8 * 86400000).capHours };
  }
  return { async job(job) {
    const seeds = Array.from({ length: job.count }, (_, i) => job.first + i);
    if (job.kind === 'session') return seeds.map(firstSession);
    if (job.kind === 'tower') return seeds.map(seed => {
      const { s } = fixture(['mochi', 'soot', 'clover'], seed);
      const floor = 1 + (seed - 1) % 30; s.towerBest = floor - 1;
      const entered = take(R.enterNode(take(R.startTowerFloorA6(s, floor)), '0-0'));
      return { seed, floor, ...measure(R.playBattle(entered.run.battle, 'auto')) };
    });
    if (job.kind === 'economy') return seeds.flatMap(seed => [economy(seed, 2), economy(seed, 5)]);
    if (job.kind === 'variety') return job.teams.map(team => {
      let wins = 0;
      for (const seed of seeds) { const { setup } = fixture(team, seed); wins += Number(battle({ ...setup, enemies: ['pantry-crown'] }).result === 'party'); }
      return { team, wins, count: seeds.length };
    });
    return seeds.flatMap(seed => {
      const team = teams[(seed - 1) % teams.length], chapter = 1 + (seed - 1) % 3, { setup } = fixture(team, seed, chapter);
      return ['normal', 'boss'].map(kind => ({ seed, kind, ...measure(battle({ ...setup, enemies: kind === 'normal' ? normalEnemies[chapter - 1] : [R.CHAPTERS[chapter - 1].boss] })) }));
    });
  }, teams, varietyTeams };
}

if (!isMainThread) {
  const sim = await simulation(workerData.bundleUrl, workerData.mode);
  parentPort.on('message', async ({ id, job }) => {
    try { const start = performance.now(); const result = await sim.job(job); parentPort.postMessage({ id, result, seconds: (performance.now() - start) / 1000 }); }
    catch (error) { parentPort.postMessage({ id, error: error.stack }); }
  });
} else {
  const count = Number(arg('count', '500')), first = Number(arg('first-seed', '1')), mode = arg('mode', 'before');
  assert(Number.isInteger(count) && count >= 1 && count <= 500);
  assert((first >= 1 && first + count - 1 <= 500) || first === 60001 && count === 500, 'Use dev seeds 1–500 or the one final 60001–60500 block.');
  assert(['before', 'a6'].includes(mode));
  const output = resolve(root, arg('out', 'reports/cardrpg-a6/sim-latest.json'));
  assert(output.startsWith(resolve(root, 'reports/cardrpg-a6') + '/'), 'Keep evidence inside this lane.');
  if (first === 60001) assert(!await readFile(resolve(root, 'reports/cardrpg-a6/final-sim.json')).catch(() => null), 'The fresh block has already been observed.');
  const started = performance.now(), temp = await mkdtemp('/tmp/cardrpg-a6-sim-'), workers = [];
  let leaseTimer;
  try {
    const require = createRequire(resolve(root, 'apps/web/package.json')), { build } = await import(require.resolve('vite'));
    const entry = resolve(temp, 'entry.ts');
    await writeFile(entry, [
      ['R', 'packages/game-rules/src/cardrpg/depth/index.ts'], ['C', 'packages/game-rules/src/cardrpg/index.ts'],
      ['onboarding', 'packages/game-rules/src/cardrpg/depth/onboarding.ts'],
      ['presentation', 'apps/web/src/game/cardrpg/depth/card-action-plan.ts'],
      ['pacing', 'apps/web/src/game/cardrpg/depth/pacing-a6.ts'],
    ].map(([name, file]) => `export * as ${name} from ${JSON.stringify(resolve(root, file))};`).join('\n'));
    await build({ configFile: false, root, envDir: false, publicDir: false, logLevel: 'silent', build: { emptyOutDir: false, outDir: temp, minify: false, lib: { entry, formats: ['es'], fileName: () => 'rules.mjs' } } });
    const bundleUrl = pathToFileURL(resolve(temp, 'rules.mjs')).href;
    const sim = await simulation(bundleUrl, mode), jobs = [], result = { pacing: [], session: [], economy: [], variety: [], tower: [] }, workSeconds = {};
    for (let offset = 0; offset < count; offset += 5) for (const kind of ['pacing', 'session', 'economy', ...(mode === 'a6' ? ['tower'] : [])]) jobs.push({ kind, first: first + offset, count: Math.min(5, count - offset) });
    for (let offset = 0; offset < sim.varietyTeams.length; offset += 5) jobs.push({ kind: 'variety', teams: sim.varietyTeams.slice(offset, offset + 5), first, count });
    const totalJobs = jobs.length; let finished = 0;
    const work = Promise.all(Array.from({ length: Math.min(12, availableParallelism()) }, () => new Promise((done, reject) => {
      const worker = new Worker(import.meta.filename, { workerData: { bundleUrl, mode } }); workers.push(worker);
      const next = () => { const job = jobs.shift(); if (!job) return done(); worker.postMessage({ id: job.kind, job }); };
      worker.on('message', message => { if (message.error) return reject(Error(message.error)); result[message.id].push(...message.result); workSeconds[message.id] = (workSeconds[message.id] ?? 0) + message.seconds; finished++; next(); });
      worker.on('error', reject); next();
    })));
    await Promise.race([work, new Promise((_, reject) => { leaseTimer = setTimeout(() => reject(Error('A6 simulation exceeded its 19-minute lock lease.')), 19 * 60 * 1000); })]);
    assert.equal(finished, totalJobs);
    const normals = result.pacing.filter(x => x.kind === 'normal'), bosses = result.pacing.filter(x => x.kind === 'boss');
    const earned = result.session.flatMap(r => r.combat), earnedNormals = earned.filter(r => r.kind === 'normal'), earnedBosses = earned.filter(r => r.kind === 'boss');
    const pacing = (normal, boss) => ({ normalRounds: quantile(normal.map(x => x.rounds), .5), normalSeconds: round(quantile(normal.map(x => x.seconds), .5)), normalP90: round(quantile(normal.map(x => x.seconds), .9)), bossSeconds: round(quantile(boss.map(x => x.seconds), .5)), bossP90: round(quantile(boss.map(x => x.seconds), .9)), normalSamples: normal.length, bossSamples: boss.length });
    const ultimateRates = rows => sim.teams.flat().filter((id, i, all) => all.indexOf(id) === i).map(id => { const eligible = rows.filter(r => id in r.casts); return { id, count: eligible.length, rate: round(pct(eligible.filter(r => r.casts[id] > 0).length, eligible.length)) }; });
    const normalUlts = ultimateRates(normals), bossUlts = ultimateRates(bosses);
    result.variety.sort((a, b) => b.wins / b.count - a.wins / a.count || a.team.join().localeCompare(b.team.join()));
    const best = result.variety[0].wins / count, nearBest = result.variety.filter(r => r.wins / count >= best - .05).length;
    const top20 = result.variety.slice(0, 20), maxPresence = Math.max(...sim.teams.flat().map(id => pct(top20.filter(r => r.team.includes(id)).length, top20.length)));
    const economySummary = [2, 5].map(sessions => { const rows = result.economy.filter(r => r.sessionsPerDay === sessions); return { sessions, progressEveryDay: pct(rows.filter(r => r.days.every(d => d.progress)).length, rows.length), epicDay2: pct(rows.filter(r => r.firstEpic && r.firstEpic <= 2).length, rows.length), pityDay6: pct(rows.filter(r => r.pityDay && r.pityDay <= 6).length, rows.length), legendaryDay6: pct(rows.filter(r => r.firstLegendary && r.firstLegendary <= 6).length, rows.length), medianDrawsDay7: quantile(rows.map(r => r.days.at(-1).paidDraws), .5), idleCap: rows[0].idleCap }; });
    const towerFloors = Array.from({ length: 30 }, (_, i) => {
      const rows = result.tower.filter(r => r.floor === i + 1);
      return { floor: i + 1, count: rows.length, medianSeconds: round(quantile(rows.map(r => r.seconds), .5)), winRate: round(pct(rows.filter(r => r.win).length, rows.length)) };
    }).filter(r => r.count);
    const summary = {
      seeds: [first, first + count - 1], count, mode, seconds: round((performance.now() - started) / 1000), workSeconds,
      tower: mode === 'a6' ? { medianSeconds: round(quantile(result.tower.map(r => r.seconds), .5)), p90Seconds: round(quantile(result.tower.map(r => r.seconds), .9)), floors: towerFloors } : null,
      pacing: pacing(earnedNormals, earnedBosses), fixedPacing: pacing(normals, bosses),
      ultimates: { normal: normalUlts, boss: bossUlts },
      firstSession: { medianGap: round(quantile(result.session.flatMap(r => r.gaps), .5)), p90MaxGap: round(quantile(result.session.map(r => Math.max(...r.gaps)), .9)), meanLosses10: round(mean(result.session.map(r => r.losses10))), maxLosses10: Math.max(...result.session.map(r => r.losses10)), meanLosses30: round(mean(result.session.map(r => r.losses30))), maxLosses30: Math.max(...result.session.map(r => r.losses30)), hintRetries: result.session.reduce((n, r) => n + r.hints, 0), hintWinRate: result.session.some(r => r.hints) ? round(pct(result.session.reduce((n, r) => n + r.retryWins, 0), result.session.reduce((n, r) => n + r.hints, 0))) : null },
      variety: { teams: result.variety.length, nearBest, bestWinRate: round(best * 100), maxTop20CatPresence: maxPresence, top20 }, economy: economySummary,
      limitations: [...(mode === 'a6' ? ['Tower spreads 500 level-six, four-Epic fixture builds across thirty fixed floors; floor enemies and combat seeds remain fixed. Authored duration and per-floor summaries are separate from earned-player progress.'] : []), 'G1 uses naturally earned first-session encounters, excluding the tutorial. Seconds are authored x1 timelines, excluding browser overhead; Q15 real-click timing is separate.', 'G2 and G4 use level-six four-Epic fixtures with unlocked kits. New-player/economy accounts use earned public commands without fixture grants.', 'Visible route points, earned boon choices and selected boons count as rewards alongside account currency, gear and Power.', 'First-session defeats use the real recommendBuildV4/applyResultAdviceV4 hint. Same-seed retry is a counterfactual and grants no rewards.', `${result.variety.length} fixed candidate teams (the four V5 crews plus evenly spaced mixed squads) each use every seed. This is not an exhaustive ranking of all 220 teams; tied top-20 teams use lexical order.`, 'Economy uses four-minute check-ins (at most one completed patrol), two or five per day; unfinished routes carry into the next visit. Epic means Epic or better.'],
    };
    const rows = [
      ['G1 normal', `${summary.pacing.normalRounds} rounds; median ${summary.pacing.normalSeconds} seconds; 90th percentile ${summary.pacing.normalP90} seconds`, '6–10 rounds; median 20–35 seconds; 90th percentile ≤45 seconds'],
      ['G1 boss', `median ${summary.pacing.bossSeconds} seconds; 90th percentile ${summary.pacing.bossP90} seconds`, 'median 45–90 seconds; 90th percentile ≤110 seconds'],
      ...(summary.tower ? [['G1 Tower', `median ${summary.tower.medianSeconds} seconds; 90th percentile ${summary.tower.p90Seconds}; floor medians ${Math.min(...towerFloors.map(f => f.medianSeconds))}–${Math.max(...towerFloors.map(f => f.medianSeconds))} seconds`, '20–50 seconds per floor']] : []),
      ['G2 ultimates', `normal ${Math.min(...normalUlts.map(r => r.rate))}–${Math.max(...normalUlts.map(r => r.rate))} percent; boss minimum ${Math.min(...bossUlts.map(r => r.rate))} percent`, 'each cat 35–70 percent normal; ≥90 percent boss'],
      ['G3 first session', `median gap ${summary.firstSession.medianGap} seconds; losses by 10 minutes: mean ${summary.firstSession.meanLosses10}, worst ${summary.firstSession.maxLosses10}; by 30 minutes: mean ${summary.firstSession.meanLosses30}, worst ${summary.firstSession.maxLosses30}; ${summary.firstSession.hintWinRate === null ? "hint retry not observed (no losses)" : `hint retry wins ${summary.firstSession.hintWinRate} percent`}`, 'gap ≤90 seconds; zero early losses; ≤2 total losses; retry wins ≥80 percent'],
      ['G4 variety', `${nearBest} of ${result.variety.length} tested teams within five percentage points; highest top-20 cat presence ${maxPresence} percent`, '≥4 teams; no cat above 70 percent'],
      ...economySummary.map(e => [`G5 ${e.sessions === 2 ? 'casual' : 'regular'}`, `daily progress ${round(e.progressEveryDay)} percent; Epic by day two ${round(e.epicDay2)} percent; pity budget by day six ${round(e.pityDay6)} percent; actual Legendary by day six ${round(e.legendaryDay6)} percent; idle cap ${e.idleCap} hours`, 'daily progress; Epic by day two; regular pity by day six; idle cap 12 hours']),
    ];
    const table = ['| Gate | Measured | Target |', '|---|---|---|', ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n');
    const text = `# A6 ${mode === 'before' ? 'BEFORE baseline' : 'simulation'}\n\n${count} seeds (${first}–${first + count - 1}); ${summary.seconds} seconds.\n\n${table}\n\nWhat this means: this compact run exposes pacing, first-session and economy gaps for iteration; simulated time does not establish browser performance or human enjoyment.\n\n${summary.limitations.map(s => '- ' + s).join('\n')}\n`;
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, JSON.stringify({ summary, lossExamples: result.session.slice().sort((a,b) => b.losses30-a.losses30 || a.seed-b.seed).flatMap(r => r.lossExamples.map(e => ({ seed:r.seed, ...e }))).slice(0,6), timeline: result.session.find(r => r.timeline)?.timeline }, null, 2) + '\n');
    if (arg('report', '')) await writeFile(resolve(root, arg('report', '')), text);
    if (first === 60001 && output !== resolve(root, 'reports/cardrpg-a6/final-sim.json')) await writeFile(resolve(root, 'reports/cardrpg-a6/final-sim.json'), JSON.stringify(summary, null, 2) + '\n');
    console.log(`${count} seeds; ${summary.seconds}s; ${mode}\n${table}\nWhat this means: authored timing and real-rule bot results; browser timing remains a separate check.`);
  } finally { clearTimeout(leaseTimer); await Promise.all(workers.map(worker => worker.terminate())); await rm(temp, { recursive: true, force: true }); }
}
