// REFERENCE: PROMPT-A4 hard rules and ownership. Read-only pre-PR guard.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base='daba7d7cd7d6cea4b5ce4ee21d11925ef4f9ae5d';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const paths=[...new Set([...git('diff','--name-only',base).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')])].filter(Boolean);
const prohibited=[/^packages\/game-rules\/src\/config\.ts$/,/^(contracts|supabase|\.github)\//,
 /^apps\/web\/src\/game\/squad\/turn3d\//,/^packages\/game-rules\/src\/cardrpg\/depth\/auto-extras\//,
 /^(tools|docs|reports)\/cardrpg-look\//,/^docs\/design\/cardrpg\/(LOOK-BIBLE|MECHANICS-LAB)\.md$/,
 /(^|\/)(Battle\.tsx|chapter-stage\.ts|look-tokens\.json|look-assets\.json|card-staging\.ts|card-effects[^/]*\.ts)$/,
 /^assets\//,/(^|\/)(wallet|auth|siwe)(\/|\.)/i,/relic-reader/];
const bad=paths.filter(path=>prohibited.some(rule=>rule.test(path)));
assert.deepEqual(bad,[],'A4 diff touched protected or B-owned paths');
const path='docs/cardrpg3/baseline-v1.html';
assert.equal(statSync(path).size,23937000);
assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),'9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
for(const row of readFileSync('reports/cardrpg-big/baseline/sim-hashes.txt','utf8').trim().split('\n')){
 const [expected,file]=row.split(/\s+/);assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),expected,file);
}
assert.equal(git('diff',base,'--','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','apps/web/package.json'),'','Dependency manifests changed');
assert.match(git('branch','--show-current'),/^codex\/cardrpg-a4-/);
console.log(JSON.stringify({scope:'PASS',baseline:'PASS',historicalSimFiles:13,changed:paths,author:git('var','GIT_AUTHOR_IDENT')},null,2));
