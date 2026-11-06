// Pure rules only; run nice10 if shared timing lock is owned. No timing claims.
import { loadRules } from '../cardrpg-sim/load.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
const { load, vite } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const E = await load('packages/game-rules/src/cardrpg/depth/auto-extras/index.ts');
const split = process.argv[2] || 'train', count = Number(process.env.BIG_SEEDS || 50);
const offset = split === 'heldout' ? 50000 : 4000;
const teams = { starter: ['mochi', 'soot', 'clover'], garden: ['mochi', 'mallow', 'clover'], tide: ['panko', 'mallow', 'sorrel'] };
const variants = {
  off: E.DEFAULT_AUTO_EXTRAS,
  'tea-cloud': { autoExtras: true, teaCloud: true, frontRelay: false, intentLens: false },
  'front-relay': { autoExtras: true, teaCloud: false, frontRelay: true, intentLens: false },
  'intent-lens': { autoExtras: true, teaCloud: false, frontRelay: false, intentLens: true },
  all: { autoExtras: true, teaCloud: true, frontRelay: true, intentLens: true },
};
const hash = text => createHash('sha256').update(text).digest('hex');
const rows = [], parity = [], rawOff = [], failures = [];
const output = process.env.BIG_MECHANICS_OUT || 'reports/cardrpg-big2/mechanics';
await mkdir(output, { recursive: true });
try {
  for (const level of [1, 6]) for (const [team, ids] of Object.entries(teams)) for (const chapter of [1, 2, 3]) for (const encounter of ['first', 'boss']) {
    const cells = Object.fromEntries(Object.keys(variants).map(v => [v, []]));
    for (let index = 1; index <= count; index++) {
      const seed = offset + index, account = R.createDepthAccount(seed);
      const prototype = account.account.cards[0];
      account.account.cards = ids.map(id => ({ ...prototype, cardId: id, level, stars: 1 }));
      account.team = [...ids]; account.rows = Object.fromEntries(ids.map((id, i) => [id, i === 0 ? 'front' : 'rear']));
      // Equal bare-gear cells, never modifies catalogue/economy values.
      account.equipment = {}; account.cleared = Array.from({ length: chapter - 1 }, (_, i) => i + 1);
      const start = R.startRun(account, chapter, seed);
      if (!start.ok) throw Error(start.error);
      const run = start.state.run;
      const node = encounter === 'boss' ? run.nodes.find(n => n.kind === 'boss') : R.availableNodes(run)[0];
      const setup = { seed, chapter, cats: R.battleCats(account), enemies: node.enemies };
      const baseline = R.playBattle(R.createBattle(setup), 'auto');
      const baselineText = JSON.stringify(baseline), baselineHash = hash(baselineText);
      for (const [variant, options] of Object.entries(variants)) {
        const end = E.playAutoExtras(R.createBattle(setup), E.createAutoExtrasMemory(), options);
        const finalText = JSON.stringify(end), actualHash = hash(finalText);
        const procs = Object.fromEntries(['tea-cloud', 'front-relay'].map(id => [id, end.log.filter(e => e.skillId === `auto-extra:${id}` && e.kind === 'auto-extra').length]));
        const row = { seed, won: end.result === 'party', rounds: end.round, actions: end.choices.length,
          remainingPartyHp: end.actors.filter(a => a.side === 'party').reduce((s, a) => s + a.hp, 0), procs, finalHash: actualHash,
          baselineHash, resultChanged: end.result !== baseline.result };
        cells[variant].push(row);
        if (variant === 'off' || variant === 'intent-lens') {
          const equal = finalText === baselineText;
          parity.push({ level, team, chapter, encounter, seed, variant, baselineHash, actualHash, equal });
          if (!equal) failures.push(parity.at(-1));
          if (variant === 'off') rawOff.push(JSON.stringify({ level, team, chapter, encounter, seed, baseline, disabled: end }));
        }
      }
    }
    for (const [variant, runs] of Object.entries(cells)) rows.push({ level, team, chapter, encounter, variant, count,
      wins: runs.filter(r => r.won).length, winRate: runs.filter(r => r.won).length / count,
      medianActions: [...runs].sort((a, b) => a.actions - b.actions)[Math.floor(count / 2)].actions,
      procs: Object.fromEntries(['tea-cloud', 'front-relay'].map(id => [id, runs.reduce((sum, r) => sum + r.procs[id], 0)])),
      resultChanges: runs.filter(r => r.resultChanged).length, runs });
    await writeFile(`${output}/${split}-partial.json`, JSON.stringify({ rows, parityCount: parity.length, failures }));
    console.log(JSON.stringify({ level, team, chapter, encounter, wins: Object.fromEntries(Object.entries(cells).map(([v, runs]) => [v, runs.filter(r => r.won).length])) }));
  }
} finally { await vite.close(); }
const paths = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'packages/game-rules/src/cardrpg/depth'], { encoding: 'utf8' }).trim().split('\n');
const sources = Object.fromEntries(await Promise.all(paths.map(async p => [p, hash(await readFile(p))])));
await writeFile(`${output}/${split}-off-states.jsonl.gz`, gzipSync(rawOff.join('\n')));
await writeFile(`${output}/${split}.json`, JSON.stringify({ split, count, offset, sources,
  method: '50 paired seeds per level/team/chapter/encounter/variant. Bare gear at levels1/6, stars1. Actual seeded first-node or boss roster; no production HP/ATK overrides. Full final-state serialization parity, independent of UI. This is not an economy or whole-run simulation.',
  rows, parity, failures }, null, 2));
console.log(JSON.stringify({ split, cells: rows.length, battles: rows.length * count, parity: parity.length, failures: failures.length }));
if (failures.length) process.exitCode = 1;
