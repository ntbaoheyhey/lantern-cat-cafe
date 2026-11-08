// REFERENCE: A5 B1/B2. Audit all registered carrier cells; descriptive TRAIN results only.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = 'reports/cardrpg-big/a5/b2/set-carriers-12';
const sha = data => createHash('sha256').update(data).digest('hex');
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const bytes = await readFile(root + '/results.json'), data = JSON.parse(bytes);
const m = await read(root + '/REGISTERED-METHOD.json');
assert.deepEqual(data.registration, m); assert.equal(data.methodHash, sha(JSON.stringify(m)));
assert.equal(m.seedOffset, 0); assert.equal(m.count, 50);
for (const [path, hash] of Object.entries(m.source)) assert.equal(sha(await readFile(root + '/source-snapshot/' + path)), hash, path);
for (const [path, hash] of Object.entries(m.scripts)) assert.equal(sha(await readFile(path)), hash, path);
assert.equal(data.rows.length, m.cases); assert.equal(new Set(data.rows.map(row => row.key)).size, m.cases);
const setIds = ['hearthloom','moonwick','mossbrew','rainlace','crumbweave','bellsteel','emberfelt','velvetrim'];
const lookup = new Map(data.rows.map(row => [row.key, row]));
for (const context of m.contexts) for (let scene = 0; scene < 8; scene++) for (const mode of m.modes) for (const setId of setIds) {
  const key = JSON.stringify({ context: context.id, scene, mode, setId }), row = lookup.get(key);
  assert(row?.complete, key); assert.equal(row.outcomes.length, m.count);
  assert.match(row.outcomes, /^[01]+$/); assert.equal(row.digest, sha(row.outcomes));
  assert.equal(row.wins, [...row.outcomes].filter(code => code === '1').length);
  for (const skill of context.requiredSkills) assert(row.skills.includes(skill), 'Kit ineligible: ' + key + '/' + skill);
  if (mode === 'matched-utility') assert(row.minPowerRatio >= .98 && row.maxPowerRatio <= 1.02);
  for (const n of [row.scald, row.rounds, ...Object.values(row.actions)]) assert(Number.isSafeInteger(n) && n >= 0);
}
const wilson = (wins, n) => {
  const p = wins / n, z = 1.959963984540054, d = 1 + z*z/n;
  const mid = (p+z*z/(2*n))/d, half = z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [mid-half, mid+half];
};
function aggregate(rows) {
  const battles = rows.length * m.count, wins = rows.reduce((n, r) => n+r.wins, 0), gear = {}, actions = {};
  for (const row of rows) {
    for (const [effect, event] of Object.entries(row.gear)) {
      const value = gear[effect] ??= { count: 0, amount: 0 };
      value.count += event.count; value.amount += event.amount;
    }
    for (const [skill, count] of Object.entries(row.actions)) actions[skill] = (actions[skill] ?? 0)+count;
  }
  return { battles, wins, rate: wins/battles, scald: rows.reduce((n, r) => n+r.scald, 0), gear, actions,
    meanRounds: rows.reduce((n, r) => n+r.rounds, 0)/battles,
    meanUtility: rows.reduce((n, r) => n+r.utility, 0)/battles,
    meanReferenceUtility: rows.reduce((n, r) => n+r.referenceUtility, 0)/battles };
}
function paired(before, after) {
  assert.equal(before.outcomes.length, after.outcomes.length);
  const n = before.outcomes.length;
  let improved = 0, worsened = 0;
  for (let i = 0; i < n; i++) {
    improved += Number(before.outcomes[i] === '0' && after.outcomes[i] === '1');
    worsened += Number(before.outcomes[i] === '1' && after.outcomes[i] === '0');
  }
  const gain = (improved-worsened)/n, variance = ((improved+worsened)-n*gain*gain)/(n-1);
  const half = 1.959963984540054*Math.sqrt(variance/n);
  return { improved, worsened, gainPp: gain*100, pairedNormal95Pp: [(gain-half)*100,(gain+half)*100] };
}
const contexts = m.contexts.map(context => {
  const modes = m.modes.map(mode => {
    const rows = data.rows.filter(row => row.context === context.id && row.mode === mode);
    assert.equal(rows.length, 64);
    const sets = setIds.map(setId => ({ setId, ...aggregate(rows.filter(row => row.setId === setId)) }));
    const scenes = m.scenarios.map((scenario, scene) => {
      const cases = rows.filter(row => row.scene === scene), best = Math.max(...cases.map(row => row.wins));
      const intended = cases.find(row => row.setId === context.intendedSet);
      return { scene, enemies: scenario.enemies, intendedRate: intended.wins/m.count,
        bestRate: best/m.count, intendedLeads: intended.wins === best,
        leaders: cases.filter(row => row.wins === best).map(row => row.setId),
        saturatedSets: cases.filter(row => row.wins >= .95*m.count).length,
        pairs: cases.map(row => ({ setId: row.setId, wins: row.wins, wilson95: wilson(row.wins,m.count),
          intendedVersusThis: paired(row, intended) })) };
    });
    return { mode, sets, primary: scenes[context.primaryScene], contrast: scenes[context.contrastScene], scenes };
  });
  return { ...context, modes };
});
const oldBytes = await readFile(m.oldReceipt.path); assert.equal(sha(oldBytes), m.oldReceipt.sha256);
const old = JSON.parse(oldBytes);
const totals = m.modes.map(mode => ({ mode, sets: setIds.map(setId => ({ setId,
  ...aggregate(data.rows.filter(row => row.setId === setId && row.mode === mode)) })) }));
const normalizationPairs = data.rows.filter(row => row.mode === 'matched-utility').map(row => {
  const fixed = lookup.get(JSON.stringify({ context: row.context, scene: row.scene, mode: 'fixed-core', setId: row.setId }));
  return { context: row.context, scene: row.scene, setId: row.setId, fixedCoreVersusMatched: paired(row,fixed) };
});
const summary = { status: 'TRAIN diagnostic, not acceptance or a production change',
  receipts: [{path:root+'/results.json',sha256:sha(bytes)},m.oldReceipt], cells:m.cases,battles:m.battles,
  oldHomogeneousSets: setIds.map(setId => {
    const rows = old.rows.filter(row => row.kind === 'sets' && row.setId === setId);
    assert.equal(rows.length,8); return { setId, wins:rows.reduce((n,r)=>n+r.wins,0),battles:400,rate:rows.reduce((n,r)=>n+r.wins,0)/400 };
  }), contexts, totals, normalizationPairs,
  limitations: [...m.limitations,
    'All cross-context aggregates are descriptive; own role-kit budgets and team difficulties differ.',
    'Wilson and paired normal intervals shown per 50-seed cell; no pooled independent-context confidence claim.',
    'Explicit gear-trigger counters omit permanent effects. Scald counts do not isolate extension damage.',
    'Primary situations are predeclared; an unplanned winning scene does not retrospectively satisfy a niche gate.',
    'No human playtest and no fresh acceptance seeds.'] };
await writeFile(root+'/summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({cells:m.cases,battles:m.battles,primary:contexts.map(c=>({context:c.id,set:c.intendedSet,
  modes:c.modes.map(v=>({mode:v.mode,rate:v.primary.intendedRate,leaders:v.primary.leaders,saturated:v.primary.saturatedSets}))})),
  ember:contexts.find(c=>c.carrier==='mallow').modes.map(v=>({mode:v.mode,...v.sets.find(s=>s.setId==='emberfelt')}))}));
