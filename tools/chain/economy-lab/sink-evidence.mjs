import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {sha,root} from './runtime.mjs';
import {resolve} from 'node:path';
const B='reports/v3-shell/b2/',signed=path=>({path,sha256:sha(resolve(root,path))});
const testPrefix=process.argv[2];
assert(!testPrefix||/^[a-zA-Z0-9-]+$/.test(testPrefix),'Invalid test evidence prefix');
function test(path){
 const text=readFileSync(resolve(root,path),'utf8'),passed=Number(text.match(/Tests\s+(\d+) passed/)?.[1]??text.match(/(?:#|ℹ) pass (\d+)/)?.[1]??0);
 assert(passed>0&&!/FAIL |Tests\s+\d+ failed|(?:#|ℹ) fail [1-9]/.test(text),`Passing test evidence required: ${path}`);
 return {exitCode:0,passed,log:signed(path)};
}
const browser=JSON.parse(readFileSync(resolve(root,B+'econ/SINK-BROWSER.json')));
assert.deepEqual(browser.errors,[]);
assert(browser.sources?.length>0,'Current source signatures are required');
for(const source of browser.sources)assert.equal(sha(resolve(root,source.path)),source.sha256,'Stale sink browser evidence: '+source.path);
const checks=Object.fromEntries(['rules','server','ui','model'].map(kind=>[kind,test(B+'tests/'+(testPrefix?`${testPrefix}-${kind}`:`e2-${kind}${kind==='ui'?'-final':''}`)+'.log')]));
const sources={rules:signed('packages/game-rules/src/cardrpg/economy-sinks-v3.ts'),server:signed('supabase/functions/_shared/economy-v3.ts'),ui:signed('apps/web/src/game/cardrpg/chain/EconomySinksB2.tsx'),sim:signed('tools/chain/economy-lab/studio.mjs')};
const sinks=browser.sinks.map(row=>({...sources,id:row.id,benefit:row.benefit,costShown:row.quote.includes(String(Number(BigInt(row.yarnBurn)/10n**18n))),oddsShown:row.quote.includes('100%'),screenshot:row.screenshot,test:checks.server,receipt:row.transactionHash}));
assert.equal(sinks.length,3);
writeFileSync(resolve(root,B+'econ/SINKS.json'),JSON.stringify({sinks,checks,bellsOnlyTest:checks.rules,config:signed('packages/game-rules/src/cardrpg/economy-lab.ts'),method:'Server ledger reservations, exact existing YARN sealPayments burn verification, idempotent finalization, no random currency or outcome. Same recipe quote executes in token simulation. Real Anvil browser screenshots and receipts; explicit visual fixtures are documented in SINK-BROWSER.json.'},null,2)+'\n');
