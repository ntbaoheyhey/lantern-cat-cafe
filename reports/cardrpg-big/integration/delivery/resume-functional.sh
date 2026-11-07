#!/bin/sh
set -eu
cd /Users/bao/taskbar-hero-cardrpg-big-delivery
while kill -0 11785 2>/dev/null; do sleep 3; done
node --input-type=module - <<'JS'
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const p=JSON.parse(await readFile('reports/cardrpg-big/integration/delivery/path-resume/checks.json','utf8'));
assert.equal(p.sha256,'9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
assert.equal(p.rows.length,3);assert(p.rows.every(r=>r.passed&&r.errors.length===0));
JS
sleep 7
BIG_ARTIFACT="$PWD/docs/cardrpg3/index.html" BIG_LAB_OUT=reports/cardrpg-big/integration/delivery/mechanics-resume BIG_LAB_EXPECT_POLISH=1 node tools/cardrpg-big/with-timing-lock.mjs delivery-mechanics-resume node tools/cardrpg-big2/mechanics-check.mjs > reports/cardrpg-big/integration/delivery/mechanics-resume.log 2>&1
node --input-type=module - <<'JS'
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/integration/delivery/';
const old=JSON.parse(await readFile(root+'functional.json','utf8'));
const path=JSON.parse(await readFile(root+'path-resume/checks.json','utf8'));
const mechanics=JSON.parse(await readFile(root+'mechanics-resume/checks.json','utf8'));
assert.equal(old.rows.length,8);assert(old.rows.every(r=>r.exit===0));
assert.equal(path.rows.length,3);assert(path.rows.every(r=>r.passed&&r.errors.length===0));
assert.equal(mechanics.rows.length,4);assert.deepEqual(mechanics.errors,[]);
assert.equal(path.sha256,old.sha256);assert.equal(mechanics.sha256,old.sha256);
await writeFile(root+'functional-resumed.json',JSON.stringify({at:new Date().toISOString(),artifact:old.artifact,sha256:old.sha256,completed:10,expected:10,complete:true,previousReceipt:root+'functional.json',previousSuccessfulSteps:old.rows.map(r=>r.name),resumed:[{name:'path',receipt:root+'path-resume/checks.json',cases:3},{name:'mechanics',receipt:root+'mechanics-resume/checks.json',cases:4}],method:'Eight original zero-exit steps plus two completed resumed checks. Original partial path retained separately.'},null,2));
JS
