// REFERENCE: Home54 registered UI cases. Earned continuation plus explicitly synthetic boundary cases.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from '../../a4-load.mjs';
const root='reports/cardrpg-big/a5/e2-home-band',out=root+'/fixtures';
const sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});
const loader=await loadRules();
try {
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts');
 const accept=r=>{assert(r.ok,r.error);return r.state;};
 const originPath='reports/cardrpg-big/a5/engagement/advice-55/earned-checkpoint.json',originBytes=await readFile(originPath);
 let earned=accept(R.abandonRun(JSON.parse(originBytes)));
 while(earned.v4.journey.pending.length)earned=accept(R.acknowledgeDiscoveryV4(earned,earned.v4.journey.pending[0].sequence));
 assert.deepEqual(earned.cleared,[]);assert.equal(earned.run.challengeLevel,5);
 const first=structuredClone(earned);first.run=null;
 const active=accept(R.startRun(earned,1,7930,'campaign','2026-11-06',2));
 const retained=accept(R.abandonRun(active));
 const next=structuredClone(retained);next.cleared=[1];
 const stars=R.importSave(await readFile('reports/cardrpg-big/a5/e2-home-stars/fixtures/bands.save','utf8'));
 const fixtures=[];
 for(const [name,state,band,chapter,method] of [
  ['earned',earned,5,1,'Original earned Home03 checkpoint; public abandon and discovery acknowledgement only.'],
  ['first',first,1,1,'Synthetic UI boundary: earned level5 crew with no previous run.'],
  ['retained',retained,2,1,'Public band2 start and abandon from the earned account; current crew ceiling5.'],
  ['next',next,1,2,'Synthetic chapter unlock only; previous run still chapter1 band2.'],
  ['active',active,2,1,'Public band2 route; navigation must preserve exact account state.'],
  ['stars',stars,2,1,'Existing labelled synthetic star/band fixture, unchanged.'],
  ['off',R.setGameplayV4(retained,false),null,1,'Same retained account with the existing public flag toggle.'],
 ]) {
  const code=R.exportSave(state)+'\n',path=out+'/'+name+'.save';
  await writeFile(path,code);await writeFile(out+'/'+name+'.json',JSON.stringify(state,null,2)+'\n');
  fixtures.push({name,path,sha256:sha(code),statePath:out+'/'+name+'.json',band,chapter,method});
 }
 await writeFile(out+'/checks.json',JSON.stringify({originPath,originSha256:sha(originBytes),fixtures,samplesRun:0},null,2)+'\n');
 console.log(JSON.stringify({fixtures:fixtures.length,battlesRun:0}));
} finally {await loader.vite.close();}
