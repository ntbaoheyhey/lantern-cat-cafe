// REFERENCE: PROMPT-A5 B3. This is one paired fixture, not a cohort acceptance gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('../../reports/cardrpg-big/a5/b3/day7-x1-e2/',import.meta.url);
test('the exact real-click day7 route wins with advice and loses with its original plan',()=>{
 const bytes=readFileSync(new URL('checks.json',base)),browser=JSON.parse(bytes);
 const pair=JSON.parse(readFileSync(new URL('paired-route.json',base)));
 assert.equal(pair.sourceReceiptSha256,createHash('sha256').update(bytes).digest('hex'));
 assert(browser.complete);assert.deepEqual(browser.errors,[]);assert.deepEqual(browser.remote,[]);
 assert.equal(pair.withAdvice.won,true);assert.equal(pair.withoutAdvice.won,false);
 assert.deepEqual(pair.withAdvice.encounters.map(e=>e.battle),browser.encounters.map(e=>e.battle));
 assert.equal(pair.withAdvice.encounters.at(-1).kind,'boss');
 assert.equal(pair.withoutAdvice.encounters.at(-1).kind,'boss');
 const a=pair.withAdvice.encounters[0].battle.initial,b=pair.withoutAdvice.encounters[0].battle.initial;
 assert.notDeepEqual(a.plan,b.plan);
 assert.deepEqual({...a,plan:null},{...b,plan:null});
 assert.deepEqual(a.plan,browser.applied.state.v4.plan);
 assert.deepEqual(b.plan,browser.before.state.v4.plan);
});
