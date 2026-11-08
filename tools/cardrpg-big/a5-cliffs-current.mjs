// REFERENCE: A5 B1. Current-source component ablation, never an acceptance run.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { loadRules } from './a5-drafts/b1-prep/a5-load.mjs';
import { fixtures } from './a5-drafts/b1-prep/a5-candidate-fixtures.mjs';

const out = 'reports/cardrpg-big/a5/b1/current-cliffs-24';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const reg = JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`, 'utf8'));
assert.equal(reg.count, 50); assert.equal(reg.seedOffset, 0); assert.equal(reg.keys.length, 68);
for (const [path, digest] of Object.entries({ ...reg.source, ...reg.tools })) assert.equal(sha(await readFile(path)), digest, path);
const originalBytes = await readFile(reg.original.path);
assert.equal(sha(originalBytes), reg.original.sha256);
const original = new Map(JSON.parse(originalBytes).rows.map(row => [row.key, row]));
const registrationSha = sha(JSON.stringify(reg));
const cp = JSON.parse(await readFile(`${out}/partial.json`, 'utf8').catch(e => { if (e.code === 'ENOENT') return '{}'; throw e; }));
if (cp.registrationSha) assert.equal(cp.registrationSha, registrationSha);
const rows = cp.rows ?? [], replays = cp.replays ?? [], variants = ['none', 'main', 'affixes', 'unique', 'set4', 'all'];
const suite = await loadRules(), R = suite.depth;
const { setups } = fixtures(R, suite.legacy);
const started = Date.now(), pause = new Error('checkpoint');
const save = () => writeFile(`${out}/partial.json`, JSON.stringify({ registrationSha, rows, replays }));
try {
  for (const key of reg.keys) {
    const meta = JSON.parse(key);
    let row = rows.find(row => row.key === key);
    if (!row) { row = { key, ...meta, outcomes: Object.fromEntries(variants.map(v => [v, ''])), shareSum: 0 }; rows.push(row); }
    for (let seed = row.outcomes.none.length + 1; seed <= reg.count; seed++) {
      const fixture = setups(meta, seed), battles = {};
      for (const variant of variants) {
        const b = R.playBattle(R.createBattle(fixture.setups[variant]), 'auto');
        if (seed === 1) assert.deepEqual(R.replayBattle(b.initial, b.choices), b);
        battles[variant] = b; row.outcomes[variant] += b.result === 'party' ? '1' : '0';
      }
      const code = (battles.none.result === 'party' ? 2 : 0) + (battles.all.result === 'party' ? 1 : 0);
      assert.equal(String(code), original.get(key).outcomes[seed - 1], `Current22 paired fixture drift: ${key}, seed${seed}`);
      row.shareSum += fixture.share;
      if (reg.exampleKeys.includes(key) && code === 1 && !replays.some(row => row.key === key)) {
        const path = `${out}/${meta.templateId}-ch${meta.chapter}-seed${seed}.json`;
        await writeFile(path, JSON.stringify({ key, seed, before: battles.none, after: battles.all }, null, 2));
        replays.push({ key, seed, path, tracePending: true });
      }
      if (Date.now() - started >= 110000) { await save(); process.exitCode = 75; throw pause; }
    }
    row.complete = true; await save();
  }
  const wilson = (wins, n) => { const p = wins/n, z = 1.96, d = 1+z*z/n, c = (p+z*z/(2*n))/d, h = z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d; return [c-h,c+h]; };
  const summaries = rows.map(row => {
    const before = [...row.outcomes.none].filter(v => v === '1').length;
    return { ...JSON.parse(row.key), beforeWins: before, meanShare: row.shareSum / reg.count,
      components: Object.fromEntries(variants.map(variant => {
        const outcomes = [...row.outcomes[variant]];
        assert.equal(outcomes.length, reg.count);
        const wins = outcomes.filter(v => v === '1').length;
        const improved = outcomes.filter((v,i) => v === '1' && row.outcomes.none[i] === '0').length;
        const worsened = outcomes.filter((v,i) => v === '0' && row.outcomes.none[i] === '1').length;
        return [variant, { wins, n: reg.count, gainPp: 100*(wins-before)/reg.count, improved, worsened,
          wilson95: wilson(wins, reg.count), sha256: sha(row.outcomes[variant]) }];
      })) };
  });
  assert.equal(replays.length, reg.exampleKeys.length);
  await writeFile(`${out}/results.json`, JSON.stringify({ registrationSha, count: reg.count, source: reg.source,
    method: reg.method, keys: reg.keys, variants, rows, summaries, replays }, null, 2));
  console.log(JSON.stringify({ status: 'PASS', cases: rows.length, battles: rows.length*reg.count*variants.length, examples: replays.length }));
} catch (error) { if (error !== pause) throw error; }
finally { await suite.close(); }
