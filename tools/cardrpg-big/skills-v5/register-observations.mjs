// Fix S8 natural battle and earned-day7 observations before any browser measurement.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const dir=process.argv[2];assert(dir);
const sha=b=>createHash('sha256').update(b).digest('hex'),artifact=resolve(dir+'/index.html'),build=JSON.parse(await readFile(dir+'/build.json','utf8'));
assert.equal(sha(await readFile(artifact)),build.sha256);assert(build.skillsV5&&build.gameplayV4);
for(const [p,h]of Object.entries(build.sourceHashes))if(p.startsWith('apps/')||p.startsWith('packages/'))assert.equal(sha(await readFile(p)),h,p);
const fixture='packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json',fixtures=JSON.parse(await readFile(fixture,'utf8')).fixtures;
const perf='reports/cardrpg-big/skills-v5/s8/performance',script='tools/cardrpg-big/skills-v5/performance.mjs';await mkdir(perf,{recursive:true});
const cases=[{id:'opening-cpu4',cpu:4,fixture:null},...fixtures.map(f=>({id:f.id+'-native',cpu:1,fixture:f.id}))];
await writeFile(perf+'/REGISTERED-METHOD.json',JSON.stringify({registeredAt:new Date().toISOString(),artifact,artifactSha256:build.sha256,fixture,fixtureSha256:sha(await readFile(fixture)),script,scriptSha256:sha(await readFile(script)),cases,gates:{castMaxMs:16.8,peakDraws:130,offlineColdCPU4MaxMs:120},method:'One natural x1 battle per case. Fresh native Metal headless page,1280x720,DPR1. Five selected S5 fixtures and one fresh tutorial opening atCPU4; same inherited A renderer. Keep all cold/pre-ready frames, losses and outliers; cast statistic is ready-scene active-action frames. No post-hoc selection or automatic repeats; no B860 matrix.'},null,2)+'\n',{flag:'wx'});
const day7='reports/cardrpg-big/skills-v5/s8/day7',save='reports/cardrpg-big/skills-v5/s5/selected/economy/day7/regular-0.save',day7script='tools/cardrpg-big/skills-v5/day7-browser.mjs';await mkdir(day7,{recursive:true});
await writeFile(day7+'/REGISTERED-METHOD.json',JSON.stringify({registeredAt:new Date().toISOString(),artifact,artifactSha256:build.sha256,save,saveSha256:sha(await readFile(save)),script:day7script,scriptSha256:sha(await readFile(day7script)),method:'Predeclared regular account0, earned day7. UI imports/starts next uncleared chapter at current crew band, first route/boon/event; one available advice retry maximum. Natural UI seeds are recorded and may differ from numeric day7 roots. No best-account selection, grants or clock acceleration; one x1 route fixture, separate from90accounts and acceptance.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({cases:cases.map(c=>c.id),day7:save,artifactSha256:build.sha256}));
