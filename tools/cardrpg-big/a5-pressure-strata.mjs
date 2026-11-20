// REFERENCE: Pressure strata42. Interpret original outcomes; never run a battle.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Rng, deriveSeed } from '../../packages/game-rules/src/rng.ts';

const root = 'reports/cardrpg-big/a5/b1/pressure-strata-42';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const reg = await json(root + '/REGISTERED-METHOD.json');
for (const [path, digest] of Object.entries(reg.inputs))
  assert.equal(sha(await readFile(path)), digest, path);
assert.deepEqual(reg.intervals, [[0,.2],[.2,.4],[.4,.6],[.6,.8],[.8,1]]);
const original = await json('reports/cardrpg-big/a5/b1/encounter-spread-500-08/REGISTERED-METHOD.json');
const summary = await json('reports/cardrpg-big/a5/b1/encounter-spread-500-08/summary.json');
const draws = Array.from({ length: 500 }, (_, i) => {
  const seed = i + 1, draw = new Rng(deriveSeed(seed, 732517)).int(0,1000000);
  // int is inclusive: retain the possible exact upper endpoint in the last bin.
  return { seed, draw, u: draw / 1000000, bin: Math.min(4, Math.floor(draw / 200000)) };
});
const wilson = (wins, n) => {
  const p = wins / n, z = 1.959963984540054, d = 1 + z*z/n;
  const c = (p + z*z/(2*n))/d, h = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n))/d;
  return [c-h,c+h];
};
const stats = codes => {
  assert(codes.length > 1);
  const n = codes.length, before = codes.filter(c => c >= 2).length;
  const after = codes.filter(c => c % 2 === 1).length;
  const improved = codes.filter(c => c === 1).length, worsened = codes.filter(c => c === 2).length;
  const gain = (improved-worsened)/n, se = Math.sqrt(Math.max(0,(improved+worsened)/n-gain*gain)/n);
  return { n, before, after, improved, worsened, gainPp:100*gain,
    beforeWilson95:wilson(before,n), afterWilson95:wilson(after,n),
    pairedNormal95Pp:[100*(gain-1.96*se),100*(gain+1.96*se)],
    beforeSaturated:before/n>=.95, afterSaturated:after/n>=.95 };
};
const variants = [];
for (const name of ['spread30','spread50']) {
  const path = `reports/cardrpg-big/a5/b1/encounter-spread-500-08/${name}/equipped/results.json`;
  const data = await json(path), prior = summary.variants.find(v => v.name === name);
  assert.equal(data.sample,'train'); assert.equal(data.offset,0); assert.equal(data.count,500);
  assert.equal(data.scope,'equipped'); assert.equal(data.rows.length,384);
  assert.deepEqual(data.source,original.variants[name].source);
  assert.equal(data.source['packages/game-rules/src/rng.ts'],reg.inputs['packages/game-rules/src/rng.ts']);
  assert.equal(sha(await readFile(path)),prior.sha256);
  const sourcePath = `reports/cardrpg-big/a5/b1/encounter-spread-07/${name}/battle.ts.txt`;
  assert.equal(sha(await readFile(sourcePath)),data.source['packages/game-rules/src/cardrpg/depth/battle.ts']);
  assert((await readFile(sourcePath,'utf8')).includes('new Rng(deriveSeed(setup.seed,732517)).int(0,1000000)/1000000'));
  const rows = data.rows.map(row => {
    assert(row.complete); assert.match(row.outcomes,/^[0-3]{500}$/);
    assert.equal(row.digest,sha(JSON.stringify(row.outcomes)));
    const codes = [...row.outcomes].map(Number), unconditional = stats(codes);
    const old = prior.rows.find(r => r.key === row.key); assert(old);
    for (const key of ['before','after','improved','worsened']) assert.equal(unconditional[key],old[key]);
    assert(Math.abs(unconditional.gainPp-old.gainPp)<1e-9);
    const bins = reg.intervals.map((interval,bin) => ({bin,interval,
      ...stats(codes.filter((_,i) => draws[i].bin === bin))}));
    for (const key of ['n','before','after','improved','worsened'])
      assert.equal(bins.reduce((n,b) => n+b[key],0),unconditional[key]);
    return {key:row.key,templateId:row.templateId,chapter:row.chapter,cardId:row.cardId,unconditional,bins};
  });
  const conditional = rows.flatMap(row => row.bins.map(bin => ({key:row.key,...bin})));
  variants.push({name,cells:rows.length,unconditionalOver12:rows.filter(r => r.unconditional.gainPp>12+1e-9).length,
    anyStratumOver12:rows.filter(r => r.bins.some(b => b.gainPp>12+1e-9)).length,
    stratumComparisons:conditional.length,strataOver12:conditional.filter(b => b.gainPp>12+1e-9).length,
    negativeStrata:conditional.filter(b => b.gainPp<0).length,zeroStrata:conditional.filter(b => b.gainPp===0).length,
    beforeSaturatedStrata:conditional.filter(b => b.beforeSaturated).length,
    afterSaturatedStrata:conditional.filter(b => b.afterSaturated).length,
    worst:[...conditional].sort((a,b) => b.gainPp-a.gainPp)[0],rows});
}
const result = {status:'PASS: original receipt reconstruction; descriptive diagnosis only',newBattles:0,
  acceptanceSamples:0,registrationSha256:sha(await readFile(root+'/REGISTERED-METHOD.json')),
  binCounts:reg.intervals.map((interval,bin) => ({bin,interval,n:draws.filter(d => d.bin===bin).length})),
  draws,variants,limitations:[
    'Five predeclared bins use the independent encounter draw, with all 500 original seeds retained.',
    'Within-bin comparisons still mix seeds and rolled items; this is not a fixed-pressure causal estimate.',
    'Bin samples are smaller; 1,920 comparisons per candidate are descriptive, without multiplicity correction.',
    'Both candidates predate current Hush and pacing changes. No current-production or acceptance claim.',
    'Existing unconditional results and rejection decisions remain unchanged. No gate was moved.'
  ]};
await writeFile(root+'/results.json',JSON.stringify(result,null,2)+'\n');
await writeFile(root+'/RESULTS.md',`# Encounter pressure strata42\n\nAll original384 fourth-slot cells ×500 paired TRAIN outcomes are retained for both candidates. This audit ran **zero new battles**. Conditional counts sum exactly to every original unconditional count. Five intervals of the gear-independent pressure draw were registered before calculation; bin sizes are ${result.binCounts.map(b=>b.n).join(', ')}.\n\n|Old candidate|Unconditional cells >12pp|Cells with any stratum >12pp|Strata >12pp /1,920|Largest conditional gain|Negative /zero strata|\n|---|---:|---:|---:|---:|---:|\n${variants.map(v=>`|${v.name}|${v.unconditionalOver12}|${v.anyStratumOver12}|${v.strataOver12}|${v.worst.gainPp.toFixed(2)}pp (n=${v.worst.n})|${v.negativeStrata} /${v.zeroStrata}|`).join('\n')}\n\nSmaller unconditional item gains do not establish uniform effects across similar encounter pressures. These smaller bins still mix gear rolls and combat seeds; their maxima involve many comparisons and are not a new acceptance gate or a fixed-pressure causal effect. All marginal Wilson intervals, paired normal intervals, ties, negative effects and saturation remain in [results.json](results.json).\n\nThe old candidates predate current Hush and pacing changes. Their original aggregates and rejection decisions stand. No combat source, fixture, seed, gate or production behavior changed; fresh acceptance20001–20500 remains unused.\n`);
console.log(JSON.stringify({status:result.status,newBattles:0,binCounts:result.binCounts,
  variants:variants.map(({rows,...v})=>v)}));
