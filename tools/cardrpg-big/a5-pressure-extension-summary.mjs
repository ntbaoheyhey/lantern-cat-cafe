// REFERENCE: A5 B1. Independent same-sample precision summary; no gate or seed changes.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big/a5/b1/encounter-spread-500-08';
const sha = x => createHash('sha256').update(x).digest('hex');
const registration = JSON.parse(await readFile(root + '/REGISTERED-METHOD.json'));
const wilson = (wins, n) => {
  const p = wins / n, z = 1.959963984540054, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d;
  const h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [c - h, c + h];
};
const variants = [];
for (const name of ['spread30', 'spread50']) {
  const method = registration.variants[name];
  const pilotBytes = await readFile(method.pilotPath);
  assert.equal(sha(pilotBytes), method.pilotSha256);
  const pilot = JSON.parse(pilotBytes);
  const path = `${root}/${name}/equipped/results.json`, bytes = await readFile(path), data = JSON.parse(bytes);
  assert.equal(data.sample, 'train'); assert.equal(data.offset, 0); assert.equal(data.count, 500);
  assert.deepEqual(data.source, method.source); assert.equal(data.rows.length, 384);
  const rows = data.rows.map(row => {
    assert(row.complete); assert.equal(row.outcomes.length, 500);
    assert.match(row.outcomes, /^[0-3]+$/); assert.equal(row.digest, sha(JSON.stringify(row.outcomes)));
    assert.equal(row.outcomes.slice(0, 50), pilot.rows.find(p => p.key === row.key).outcomes);
    const codes = [...row.outcomes].map(Number);
    const before = codes.filter(n => n >= 2).length, after = codes.filter(n => n % 2).length;
    const improved = codes.filter(n => n === 1).length, worsened = codes.filter(n => n === 2).length;
    const delta = (improved - worsened) / 500;
    const se = Math.sqrt(((improved + worsened) / 500 - delta ** 2) / 500);
    const saved = data.summaries.find(s => s.key === row.key);
    assert.equal(saved.beforeWins, before); assert.equal(saved.wins, after);
    assert(Math.abs(saved.gainPp - delta * 100) < 1e-9);
    return { key: row.key, templateId: row.templateId, chapter: row.chapter, cardId: row.cardId,
      before, after, beforeWilson95: wilson(before, 500), afterWilson95: wilson(after, 500),
      improved, worsened, gainPp: 100 * delta, pairedNormal95Pp: [100 * (delta - 1.96 * se), 100 * (delta + 1.96 * se)] };
  });
  variants.push({ name, path, sha256: sha(bytes), cells: rows.length,
    misses: rows.filter(r => r.gainPp > 12 + 1e-9).length,
    worst: [...rows].sort((a, b) => b.gainPp - a.gainPp)[0],
    beforeSaturated: rows.filter(r => r.before >= 475).length,
    afterSaturated: rows.filter(r => r.after >= 475).length, rows });
}
await writeFile(root + '/summary.json', JSON.stringify({ method: 'Same384 cells, all500 TRAIN seeds; exact original50 prefixes. Wilson95 for marginal win rates; paired intervals are explicitly normal approximations. No fresh acceptance.', variants }, null, 2));
await writeFile(root + '/RESULTS.md', `# Full TRAIN encounter-pressure precision extension\n\nThe original07 screening rejection remains retained. Both registered candidates extend exactly the original50 outcomes to500; no rule/fixture/gate change or rerolled seed.\n\n|Candidate|Cells over12pp|Worst gain|Before/after saturation≥95%|\n|---|---:|---:|---:|\n${variants.map(v => `|${v.name}|${v.misses}/384|${v.worst.gainPp.toFixed(1)}pp|${v.beforeSaturated}/${v.afterSaturated}|`).join('\n')}\n\nThe full samples distinguish persistent residuals from the noisy50-pair maximum. ${variants.some(v => v.misses) ? 'Remaining misses are real measured failures; neither a smaller maximum nor nonsaturation establishes gate closure.' : 'These fourth-slot TRAIN cells pass; bare placements and the other gates are still unmeasured on these candidates.'} No candidate adoption or wider matrix follows automatically. The ±30%/±50% encounter pressure also has a player-predictability cost; that cost is not erased by a numeric improvement.\n\n[Independent summary](summary.json) retains every paired count, both marginal Wilson intervals, labelled paired normal intervals and raw receipt hashes. Fresh20001–20500 stays unused.\n`);
console.log(JSON.stringify(variants.map(({ name, misses, worst, beforeSaturated, afterSaturated }) => ({ name, misses, worstGainPp: worst.gainPp, beforeSaturated, afterSaturated }))));
