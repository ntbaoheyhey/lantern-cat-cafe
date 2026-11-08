// REFERENCE: PROMPT-A5 hard rules. Read-only scope, dependency and byte guards.
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base='f1b433e89ec4626cb73daff24d35c699bcd94e0d';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const paths=[...new Set([...git('diff','--name-only',base).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')])].filter(Boolean);
const prohibited=[/^packages\/game-rules\/src\/config\.ts$/, /^(contracts|supabase|\.github)\//,
 /^apps\/web\/src\/game\/squad\/turn3d\//, /^packages\/game-rules\/src\/cardrpg\/depth\/auto-extras\//,
 /^(tools|docs|reports)\/cardrpg-look\//, /^docs\/design\/cardrpg\/(LOOK-BIBLE|MECHANICS-LAB)\.md$/,
 /(^|\/)(Battle\.tsx|chapter-stage\.ts|look-tokens\.json|look-assets\.json|card-staging\.ts|card-effects[^/]*\.ts)$/,
 /^assets\//, /(^|\/)(wallet|auth|siwe)(\/|\.)/i, /relic-reader/];
assert.deepEqual(paths.filter(p=>prohibited.some(rule=>rule.test(p))),[],'Protected or B-owned path changed');
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const baseline='docs/cardrpg3/baseline-v1.html';
assert.equal(statSync(baseline).size,23937000);
assert.equal(sha(baseline),'9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
const historical=readFileSync('reports/cardrpg-big/baseline/sim-hashes.txt','utf8').trim().split('\n');
for(const row of historical){const [expected,path]=row.split(/\s+/);assert.equal(sha(path),expected,path);}
assert.equal(git('diff',base,'--','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','apps/web/package.json'),'');
assert.match(git('branch','--show-current'),/^codex\/cardrpg-a5-/);
assert.equal(git('config','user.email'),'108352255+ntbaoheyhey@users.noreply.github.com');
console.log(JSON.stringify({scope:'PASS',baseline:'PASS',historicalSimFiles:historical.length,changed:paths,author:git('var','GIT_AUTHOR_IDENT')},null,2));
