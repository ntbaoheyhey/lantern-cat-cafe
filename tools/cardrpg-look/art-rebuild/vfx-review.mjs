// Fixed gallery diagnostics, not natural gameplay or performance acceptance.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {open,apply,audit} from '../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.ART_ARTIFACT),out=resolve(process.env.ART_OUT);
await mkdir(out,{recursive:true});
const receipt={artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),shots:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const width=Number(process.env.ART_WIDTH||1440),height=width===1024?600:900;
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',e=>receipt.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')receipt.errors.push(m.text())});
 await open(page,artifact);
 for(const id of (process.env.ART_IDS||'mochi-1,mochi-2,mochi-3,mochi-4,enemy:sock-skipper,enemy:teacup-healer').split(',')){
  for(const [progress,beat,fraction] of [['charge',0,.82],['travel',1,.55],['impact',2,.55],['recover',3,.5]]){
   await apply(page,{gallery:id,progress:0});
   await page.evaluate(async({beat,fraction})=>{const m=window.__depthReview,b=m.plan.beats[beat];m.animationAt=b.start+b.duration*fraction;m.notify(false);await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)},{beat,fraction});
   const stats=await page.evaluate(()=>({audit:window.__depthScene.stats,effects:window.__depthScene.cardEffects.stats,frame:window.__depthScene.view().frame,
    pools:window.__depthScene.cardEffects.root.children.filter(p=>p.visible&&p.count).map(p=>({name:p.name,count:p.count})),
    canvas:window.__depthScene.renderer.domElement.getBoundingClientRect().toJSON()}));
   const file=id.replaceAll(':','-')+'-'+progress+'.webp';
   await sharp(await page.screenshot({clip:stats.canvas})).resize({width:960}).webp({quality:87}).toFile(out+'/'+file);
   receipt.shots.push({id,progress,file,...stats,...await page.evaluate(audit)});
  }
 }
 await page.close();
}finally{await browser.close();await writeFile(out+'/review.json',JSON.stringify(receipt,null,2)+'\n')}
const tiles=[];
for(const [i,s] of receipt.shots.entries()){
 tiles.push({input:await sharp(out+'/'+s.file).resize(480,230,{fit:'contain',background:'#172d36'}).toBuffer(),left:(i%4)*480,top:Math.floor(i/4)*260+30});
 tiles.push({input:Buffer.from(`<svg width="480" height="30"><text x="8" y="22" font-size="18" fill="#fff0d2">${s.id} / ${s.progress}</text></svg>`),left:(i%4)*480,top:Math.floor(i/4)*260});
}
await sharp({create:{width:1920,height:Math.ceil(receipt.shots.length/4)*260,channels:3,background:'#172d36'}}).composite(tiles).webp({quality:88}).toFile(out+'/sheet.webp');
console.log(JSON.stringify({shots:receipt.shots.length,errors:receipt.errors}));
