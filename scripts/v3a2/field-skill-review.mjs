/** Actual painted canvas alpha, ink heights, three-beat strips and frame-rate evidence. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,config,openFixture} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/V2');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const rows=[],performance={},errors=[];
const preview=process.argv.includes('--preview');
const select=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
try{
 const {page,errors:pageErrors}=await openFixture(browser,config.fixtures[0]);
 const ids=await page.evaluate(async root=>{const {SEQUENCES}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/sequence.ts');return [...SEQUENCES].filter(([,t])=>t.sequence.tier!=='ultimate').map(([id])=>id).sort();},root);
 for(const id of select??(preview?['mochi-1','soot-2','clover-2','panko-3']:ids)){
  await page.evaluate(id=>{window.__depthReview.inspect(id,0);window.__depthScene.prepare();},id);
  for(let retry=0;retry<400;retry++){
   if(await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;s.prepare();return s.ready&&s.actors.size===m.battle.actors.length&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);}))break;
   await page.clock.runFor(34);await new Promise(resolve=>setTimeout(resolve,20));
   if(retry===399)throw Error('Rig loading '+id);
  }
  await page.clock.runFor(100);
  const timing=await page.evaluate(()=>{const p=window.__depthReview.plan;return {impact:p.beats[2].start,duration:p.duration,tier:p.sequence.tier};});
  const frames=[],shots=[];
  for(const [beat,t] of [timing.impact-130,timing.impact+33,timing.impact+200].entries()){
   const sample=await page.evaluate(t=>{
    const m=window.__depthReview,s=window.__depthScene;m.animationAt=t;s.render({...s.view(),fixedTime:10+t/1000,paused:true},1/30);
    const canvas=s.effects.canvas,c=canvas.getContext('2d'),pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
    let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=64)visible++;
    const scale=canvas.width/s.width;
    return {t,coverage:visible/(innerWidth*innerHeight*scale*scale),field:{...s.effects.field.audit},numbers:s.numbers.drawn,effects:canvas.toDataURL('image/png')};
   },t);
   await page.clock.runFor(1);
   const png=await page.screenshot();shots.push(await sharp(png).resize(400,225).png().toBuffer());
   await writeFile(resolve(out,`${id}-effect-${beat}.png`),Buffer.from(sample.effects.split(',')[1],'base64'));delete sample.effects;frames.push(sample);
   if(preview&&beat===1)await writeFile(resolve(out,'preview-'+id+'.png'),png);
  }
  await sharp({create:{width:1200,height:253,channels:3,background:'#171620'}}).composite([
   ...shots.map((input,i)=>({input,left:i*400,top:28})),
   {input:Buffer.from(`<svg width="1200" height="28"><text x="12" y="20" fill="white" font-size="15">${id} · ${timing.tier} · release / contact / recovery · original cat café effects</text></svg>`),left:0,top:0}
  ]).png().toFile(resolve(out,`sequence-${id}.png`));
  rows.push({id,...timing,frames,peakCoverage:Math.max(...frames.map(f=>f.coverage))});
  console.log(`${id}: ${(rows.at(-1).peakCoverage*100).toFixed(2)}% viewport`);
 }
 errors.push(...pageErrors);await page.close();
 if(!preview&&!select)for(const fixture of config.fixtures){
  const {page,errors:pageErrors}=await openFixture(browser,fixture,{fixedClock:false});
  performance[fixture.id]=await page.evaluate(async()=>{
   const m=window.__depthReview,s=window.__depthScene,start=performance.now(),intervals=[];let count=0,previous=start;cancelAnimationFrame(s.raf);
   await new Promise(resolve=>{const tick=now=>{const delta=now-previous;previous=now;m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(delta,now);m.paused=true;s.render({...s.view(),fixedTime:10+(now-start)/1000,quality:'high',paused:true},delta/1000);intervals.push(delta);count++;if(now-start<12000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
   const seconds=(performance.now()-start)/1000;return {frames:count,seconds,fps:count/seconds,longFrames:intervals.filter(d=>d>25).length,units:s.actors.size};
  });errors.push(...pageErrors);await page.close();console.log(`${fixture.id}: ${performance[fixture.id].fps.toFixed(2)}fps`);
 }
}finally{await browser.close();}
if(select){const old=JSON.parse(await (await import('node:fs/promises')).readFile(resolve(out,'browser-review.json'),'utf8'));rows.push(...old.rows.filter(r=>!select.includes(r.id)));Object.assign(performance,old.performance);}
await writeFile(resolve(out,preview?'preview.json':'browser-review.json'),JSON.stringify({_meta:evidenceMeta(),method:'Coverage counts actual painted canvas pixels with alpha >=64 after face/HUD masks, divided by full viewport pixels; no bounding-box proxy.',rows,performance,errors},null,2)+'\n');
if(errors.length)throw Error(errors.join('\n'));
