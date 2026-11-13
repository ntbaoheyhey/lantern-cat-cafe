import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,openFixture,config} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P4');await mkdir(out,{recursive:true});
const b=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(b,config.fixtures[1]),rows=[],shots=[];
 for(const chapter of [1,2,3]){
  const row=await page.evaluate(chapter=>{const s=window.__depthScene,v={...s.view(),chapter,fixedTime:10,paused:true};s.render(v,0);const before=s.weather.canvas.toDataURL();s.render({...v,fixedTime:13},0);const animated=before!==s.weather.canvas.toDataURL(),high={...s.weather.audit};s.render({...v,reducedMotion:true},0);const still=s.weather.canvas.toDataURL();s.render({...v,fixedTime:13,reducedMotion:true},0);const reducedStatic=still===s.weather.canvas.toDataURL();s.render({...v,quality:'low'},0);const low={...s.weather.audit};s.render(v,0);s.weather.canvas.hidden=true;return {chapter,animated,reducedStatic,high,low};},chapter);
  assert.ok(row.animated);assert.ok(row.reducedStatic);assert.ok(row.low.particles<row.high.particles);rows.push(row);
  shots.push(await sharp(await page.screenshot()).resize(640,360).png().toBuffer());
  await page.evaluate(()=>window.__depthScene.weather.canvas.hidden=false);
  shots.push(await sharp(await page.screenshot()).resize(640,360).png().toBuffer());
 }
 assert.deepEqual(errors,[]);
 await sharp({create:{width:1280,height:1108,channels:3,background:'#171620'}}).composite([
  {input:Buffer.from('<svg width="1280" height="28"><text x="12" y="20" fill="white" font-size="17">Before / chapter ambience — cafe embers and steam / orchard fireflies / pantry snow and steam</text></svg>'),left:0,top:0},...shots.map((input,i)=>({input,left:i%2*640,top:28+Math.floor(i/2)*360}))
 ]).png().toFile(resolve(out,'compare-weather.png'));
 await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),rows,errors},null,2)+'\n');
 console.log('PASS: 3 chapter palettes, 4 sprite kinds, animated field, static reduced motion, smaller Low pool');
}finally{await b.close();}
