/** Paired single-item effects in C2, using actual combat and authored enemies.
 * Power shares are not win-rate evidence. Saturated cells stay in the report.
 * This diagnostic never changes stats, seeds, enemy budgets or production rules.
 */
import { mkdir, readFile, writeFile, access, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { loadRuntime, root, freshAccount } from './runtime.mjs';

export function pairedSummary(outcomes) {
 if (!outcomes.length || outcomes.some(x => ![0, 1, 2, 3].includes(x))) throw Error('Expected paired binary outcomes');
 // Bit 1: baseline win; bit 0: equipped win.
 const n = outcomes.length, gain = outcomes.filter(x => x === 1).length, loss = outcomes.filter(x => x === 2).length;
 const before = outcomes.filter(x => x & 2).length, after = outcomes.filter(x => x & 1).length;
 const delta = (gain - loss) / n;
 const se = n > 1 ? Math.sqrt(Math.max(0, (gain + loss) / n - delta * delta) / (n - 1)) : null;
 return { n, beforeWins: before, afterWins: after, changedToWin: gain, changedToLoss: loss,
  gainPp: 100 * delta, pairedNormal95Pp: se === null ? null : [100 * (delta - 1.96 * se), 100 * (delta + 1.96 * se)],
  saturatedBefore: before === 0 || before === n, saturatedAfter: after === 0 || after === n,
  pass: Math.abs(delta) <= .12 };
}

export function fixture(R, { seed, level, chapter, template, cardId, mode }) {
 const state = freshAccount(R, seed, 0);
 state.cleared = [1, 2, 3]; state.account.chapter = 3;
 state.account.cards.forEach(c => { c.level = level; c.stars = 1; });
 state.gear = []; state.equipment = {};
 if (mode === 'fourth') for (const id of state.team) {
  state.equipment[id] = {};
  for (const slot of ['weapon', 'outfit', 'charm', 'relic']) {
   if (id === cardId && slot === template.slot) continue;
   const set = id === cardId ? template.setId : id === 'soot' ? 'moonwick' : id === 'clover' ? 'mossbrew' : 'hearthloom';
   const piece = R.makeGear(state, `${set}-${slot}-epic`, seed);
   state.gear.push(piece); state.equipment[id][slot] = piece.id;
  }
 } else if (mode !== 'bare') throw Error('Unknown loadout');
 const equipped = structuredClone(state), piece = R.makeGear(equipped, template.id, seed);
 piece.enhancement = 12;
 for (const id of piece.affixes) piece.rolls[id] = R.AFFIX_BY_ID[id].tiers[piece.tier - 1][1];
 equipped.gear.push(piece); (equipped.equipment[cardId] ??= {})[template.slot] = piece.id;
 const started = R.startRun(state, chapter, seed, 'campaign', '2026-11-12', level);
 if (!started.ok) throw Error(started.error);
 return { state, equipped, run: started.state.run };
}

const cells = [{ level: 1, chapter: 1 }, { level: 6, chapter: 2 }, { level: 6, chapter: 3 }];
export function measureTemplate(R, template, first, count, baselineCache = new Map()) {
 const cards = freshAccount(R, first, 0).team, rows = [];
 for (const cardId of cards) for (const mode of ['bare', 'fourth']) for (const cell of cells) {
  const outcomes = { '5-0': [], '6-0': [] };
  for (let seed = first; seed < first + count; seed++) {
   const f = fixture(R, { ...cell, seed, template, cardId, mode });
   const before = R.battleCats(f.state), after = R.battleCats(f.equipped);
   for (const nodeId of Object.keys(outcomes)) {
    const node = f.run.nodes.find(n => n.id === nodeId);
    const shared = { seed, chapter: cell.chapter, enemies: node.enemies, enemyStats: R.campaignEnemyStatsA6(f.run, node),
     challengeLevel: cell.level, gameplayV4: true, skillsV5: true, gameplayA6: true, formationC2: true };
    // Cache only byte-identical public battle setups; never approximate a nearby
    // build or omit a saturated outcome. Rarity comparisons often share a base.
    const setup = { ...shared, cats: before };
    const key = createHash('sha256').update(JSON.stringify(setup)).digest('hex');
    if (!baselineCache.has(key)) baselineCache.set(key, R.playBattle(R.createBattle(setup), 'auto').result === 'party');
    const equippedWin = R.playBattle(R.createBattle({ ...shared, cats: after }), 'auto').result === 'party';
    outcomes[nodeId].push((baselineCache.get(key) ? 2 : 0) | (equippedWin ? 1 : 0));
   }
  }
  for (const [node, pairs] of Object.entries(outcomes)) rows.push({ template: template.id, cardId, mode, ...cell, node,
   ...pairedSummary(pairs), pairs: pairs.join('') });
 }
 return rows;
}

if (!isMainThread) {
 const { R } = await import(pathToFileURL(workerData.runtimeFile).href), cache = new Map();
 parentPort.on('message', id => {
  try { parentPort.postMessage({ rows: measureTemplate(R, R.GEAR_BY_ID[id], workerData.first, workerData.count, cache) }); }
  catch (error) { parentPort.postMessage({ error: String(error.stack ?? error) }); }
 });
} else if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
 const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
 const out = resolve(arg('out', resolve(root, 'work/cardrpg-c2/item-impact')));
 const count = Number(arg('count', '100')), first = Number(arg('first-seed', '95001'));
 const workers = Number(arg('workers', '1')), resume = process.argv.includes('--resume');
 if (![count, first].every(n => Number.isSafeInteger(n) && n > 0)) throw Error('Invalid seed range');
 if (!Number.isInteger(workers) || workers < 1 || workers > 8) throw Error('Choose 1–8 local CPU workers');
 await mkdir(out, { recursive: true });
 if (await access(resolve(out, 'summary.json')).then(() => true, () => false)) throw Error('Keep previous measurement; choose a new output directory');
 const runtimeFile = resolve(out, 'runtime/runtime.mjs');
 const { R } = resume ? await import(pathToFileURL(runtimeFile).href) : await loadRuntime(resolve(out, 'runtime'));
 const ids = arg('ids')?.split(','), templates = R.GEAR.filter(t => !ids || ids.includes(t.id));
 if (!templates.length || ids?.some(id => !templates.some(t => t.id === id))) throw Error('Unknown template');
 const metadata = { fixtureVersion: 1, first, count, templates: templates.map(t => t.id),
  runtimeSha256: createHash('sha256').update(await readFile(runtimeFile)).digest('hex') };
 const metadataPath = resolve(out, 'measurement.json');
 if (resume) {
  if (JSON.stringify(JSON.parse(await readFile(metadataPath))) !== JSON.stringify(metadata)) throw Error('Resume must use the identical frozen runtime, fixtures and seed range');
 } else await writeFile(metadataPath, JSON.stringify(metadata), { flag: 'wx' });
 const rows = [], pending = [];
 for (const template of templates) {
  const file = resolve(out, `${template.id}.json`);
  if (resume && await access(file).then(() => true, () => false)) {
   const saved = JSON.parse(await readFile(file));
   if (saved.length !== 48 || saved.some(r => r.template !== template.id || r.n !== count || !/^[0-3]+$/.test(r.pairs) || r.pairs.length !== count ||
    Object.entries(pairedSummary([...r.pairs].map(Number))).some(([key, value]) => JSON.stringify(r[key]) !== JSON.stringify(value)))) throw Error('Invalid completed template: ' + template.id);
   rows.push(...saved);
  } else pending.push(template.id);
 }
 const stopped = async () => { if (await access(resolve(root, 'STOP-C2')).then(() => true, () => false)) throw Error('STOP-C2 requested'); };
 const save = async itemRows => {
  const id = itemRows[0].template, temporary = resolve(out, `${id}.partial`);
  await writeFile(temporary, JSON.stringify(itemRows)); await rename(temporary, resolve(out, `${id}.json`));
  rows.push(...itemRows);
  console.log(JSON.stringify({ template: id, cells: itemRows.length, worstAbsoluteImpactPp: Math.max(...itemRows.map(r => Math.abs(r.gainPp))), misses: itemRows.filter(r => !r.pass).length }));
 };
 console.log(JSON.stringify({ preservedTemplates: rows.length / 48, pendingTemplates: pending.length, workers, runtimeSha256: metadata.runtimeSha256 }));
 const pool = [];
 try {
  if (workers === 1) {
   const cache = new Map();
   for (const id of pending) { await stopped(); await save(measureTemplate(R, R.GEAR_BY_ID[id], first, count, cache)); }
  } else {
   let nextIndex = 0;
   await Promise.all(Array.from({ length: Math.min(workers, pending.length) }, () => new Promise((done, fail) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { runtimeFile, first, count } }); pool.push(worker);
    let retired = false;
    const next = async () => { await stopped(); const id = pending[nextIndex++]; if (id) worker.postMessage(id); else { retired = true; await worker.terminate(); done(); } };
    worker.on('message', async result => { try { if (result.error) throw Error(result.error); await save(result.rows); await next(); } catch (error) { fail(error); } });
    worker.on('error', fail); worker.on('exit', code => { if (!retired) fail(Error('Item worker exited unexpectedly: ' + code)); });
    next().catch(fail);
   })));
  }
 } finally { await Promise.allSettled(pool.map(w => w.terminate())); }
 rows.sort((a,b) => templates.findIndex(t=>t.id===a.template)-templates.findIndex(t=>t.id===b.template) || a.cardId.localeCompare(b.cardId) || a.mode.localeCompare(b.mode) || a.chapter-b.chapter || a.node.localeCompare(b.node));
 const summary = { runtimeSha256: createHash('sha256').update(await readFile(resolve(out, 'runtime/runtime.mjs'))).digest('hex'),
  seedRange: [first, first + count - 1], templates: templates.length, cells: rows.length,
  method: 'Actual C2 auto combat. Same seeded enemies before/after adding one +12, maximum-authored-roll piece. Bare crew and fourth set slot; levels/chapter 1/1, 6/2, 6/3; late ordinary and boss. Equal stars and full starting HP. Every template and active crew placement included. No player-scaled or synthetic enemy pressure. Intervals are paired normal approximations; sample bounds do not establish universal item effects.',
  tradeTreasure: 'CHAIN Treasure remains cosmetic; this tool does not enable legacy relic bonuses.',
  worstGainPp: Math.max(...rows.map(r => r.gainPp)), worstAbsoluteImpactPp: Math.max(...rows.map(r => Math.abs(r.gainPp))), misses: rows.filter(r => !r.pass),
  saturatedBefore: rows.filter(r => r.saturatedBefore).length, saturatedAfter: rows.filter(r => r.saturatedAfter).length,
  completeCatalog: templates.length === R.GEAR.length, minimumSamplesPerCell: count,
  pass: templates.length === R.GEAR.length && count >= 100 && rows.every(r => r.pass), rows: rows.map(({ pairs, ...row }) => row) };
 await writeFile(resolve(out, 'summary.json'), JSON.stringify(summary, null, 2));
 console.log(JSON.stringify({ pass: summary.pass, cells: summary.cells, worstGainPp: summary.worstGainPp, misses: summary.misses.length }));
}
