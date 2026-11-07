// REFERENCE: review-measurements.mjs; validation/review-source-acceptance.json.
// Run only after selected retries finish. No historical PID wait is reused.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path,'utf8'));
const out='reports/cardrpg-big2';
const progressBytes=await readFile(`${out}/review/run-steps.json`),progress=JSON.parse(progressBytes);
const sourcePath=`${out}/validation/review-source-acceptance.json`;
const sourceBytes=await readFile(sourcePath),source=JSON.parse(sourceBytes);
assert(source.accepted);
assert.equal(source.head,progress.sourceHead);
assert.equal(source.sha256,progress.sha256);
assert.equal(hash(await readFile(source.artifact)),progress.sha256);
assert.deepEqual(source.rows.map(row=>row.name).sort(),['build','demo-types','e2e','lint','tests','typecheck']);
for(const row of source.rows){assert.equal(row.exit,0);assert.equal(hash(await readFile(row.log)),row.sha256);}
const required=['e2e','studio','gallery-controls','image-pack','loading','stage-life','mechanics','audio','audio-startup','hitstop','cold','lifecycle','navigation','flow','video','boss-battles','flag-off-prepare','flag-off-browser'];
for(const name of required)assert.equal(progress.steps[name]?.status,'passed',name);
const flag=await json(`${out}/review/flag-off/checks.json`);
assert(!flag.incomplete);
assert.equal(flag.buildHead,progress.sourceHead);
assert.deepEqual(flag.errors,[]);assert.deepEqual(flag.prohibitedModules,[]);assert.deepEqual(flag.modelRequests,[]);
assert.equal(flag.harnessSha256,hash(await readFile('tools/cardrpg-big2/flag-off-check.mjs')));
const bosses=await json(`${out}/review/boss-battles/captures.json`);
assert.equal(bosses.sha256,progress.sha256);assert.deepEqual(bosses.errors,[]);
assert.deepEqual(bosses.rows.map(row=>row.chapter),[1,2,3]);
for(const row of bosses.rows){
 assert(row.accountUnchanged);
 const detail=await json(`${out}/review/boss-battles/chapter-${row.chapter}.json`);
 assert.equal(hash(await readFile(row.video)),detail.videoSha256);
 assert.equal(detail.setup.options.autoExtras,false);
 assert(Number(detail.probe.streams[0].nb_read_frames)>100);
}
const receipt={recordedAt:new Date().toISOString(),artifactSha256:progress.sha256,sourceHead:progress.sourceHead,
 functionalAccepted:true,performanceThresholdsAccepted:false,
 method:'Original source-suite failure and original functional failures retained. All six independently accepted source logs are hash-verified; every required functional step is passed on the pinned standalone artifact. Natural boss video hashes and corrected default-entry chunk inventory are checked. Successful collection does not establish performance acceptance.',
 sourceAcceptance:sourcePath,sourceAcceptanceSha256:hash(sourceBytes),runStepsSha256:hash(progressBytes),steps:required};
await writeFile(`${out}/review/functional-acceptance.json`,JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
