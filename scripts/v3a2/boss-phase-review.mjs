import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,openFixture,config} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P3');await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(b,config.fixtures.find(f=>f.id==='boss'));
 await page.evaluate(async()=>{await window.__depthScene.bossPhase.image.decode();window.__phaseBefore=JSON.stringify(window.__depthReview.battle);});
 const samples=[],shots=[];
 for(const [time,phase] of [[10,1],[11,2],[11.2,2],[11.8,2],[13.49,2],[13.5,2],[14,3],[14.8,3],[16.5,3]]){
  samples.push(await page.evaluate(({time,phase})=>{const s=window.__depthScene,v=s.view(),id=Object.keys(v.bossPhases)[0];s.render({...v,bossPhases:{[id]:phase},fixedTime:time,paused:true},0);return {time,...s.bossPhase.audit};},{time,phase}));
  if([10,11.8,13.5,14.8].includes(time))shots.push(await sharp(await page.screenshot()).resize(640,360).png().toBuffer());
 }
 assert.equal(samples[4].visible,true);assert.equal(samples[5].visible,false);assert.equal(samples[5].aura,true);
 assert.equal(samples[7].phase,3);assert.equal(samples[8].visible,false);
 const unchanged=await page.evaluate(()=>window.__phaseBefore===JSON.stringify(window.__depthReview.battle));assert.ok(unchanged);assert.deepEqual(errors,[]);
 await sharp({create:{width:1280,height:748,channels:3,background:'#171620'}}).composite([
  {input:Buffer.from('<svg width="1280" height="28"><text x="12" y="20" fill="white" font-size="17">Before / phase II cinematic / lingering aura / phase III cinematic — presentation-only phase probe</text></svg>'),left:0,top:0},
  ...shots.map((input,i)=>({input,left:i%2*640,top:28+Math.floor(i/2)*360}))
 ]).png().toFile(resolve(out,'compare-boss-phases.png'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),duration:2.5,samples,battleUnchanged:unchanged,errors},null,2)+'\n');
 console.log('PASS: 2.5s transition, phases2/3, lingering rim aura, unchanged battle state');
}finally{await b.close();}
