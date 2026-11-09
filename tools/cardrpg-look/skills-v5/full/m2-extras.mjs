import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {open,apply,audit} from './harness.mjs';
import {coverage} from '../../b2/coverage.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=process.env.V5_ARTIFACT,out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const cats=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'];
const rows=[],faceRows=[],errors=[];const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await open(page,artifact);
 for(const cat of cats){
  await apply(page,{gallery:cat+'-4',progress:.56});
  await page.evaluate(()=>{const m=window.__depthReview;for(const a of m.galleryBattle.actors)a.statuses=[{id:'scald',stacks:5,remaining:3},{id:'scent',stacks:1,remaining:2},{id:'cozy',stacks:3,remaining:2}].map(s=>({...s,source:a.id,appliedRound:1}));m.notify(false)});
  const data=await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const s=window.__depthScene,e=s.cardEffects;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;const real=s.renderer.domElement.toDataURL('image/png');e.root.visible=false;e.setLightsEnabled(false);s.post.render(s.scene,s.camera,0,0,'#ffffff',true);const without=s.renderer.domElement.toDataURL('image/png');e.root.visible=true;e.setLightsEnabled(true);return{real,without,masks:e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(v=>v.toArray()),headTops:Array.from(e.protectedHeadTops),stats:{...s.stats}}});
  for(const key of ['real','without']){const path=out+'/'+cat+'-'+key+'.png';await writeFile(path,Buffer.from(data[key].split(',')[1],'base64'));data[key]=path;}faceRows.push({id:cat,...data});
  await sharp(await page.screenshot()).resize(960,600).webp({quality:82}).toFile(out+'/'+cat+'.webp');rows.push({id:cat,ui:await page.evaluate(audit),bounds:await page.evaluate(coverage)});
 }
 await page.close();
 for(const [width,height]of [[1024,600],[1280,720],[1440,900]]){
  const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});await open(p,artifact);await apply(p,{gallery:'clover-4',progress:.62});
  await p.evaluate(()=>{const m=window.__depthReview;m.labOpen=true;m.labPanel='gallery';m.notify(false)});await p.waitForTimeout(100);
  rows.push({id:'gallery',width,layout:await p.evaluate(()=>{const a=document.querySelector('.dp-arena').getBoundingClientRect(),b=document.querySelector('.dp-lab-gallery').getBoundingClientRect();return{overlap:a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,arena:a.toJSON(),controls:b.toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}}),bounds:await p.evaluate(coverage)});
  await sharp(await p.screenshot()).webp({quality:82}).toFile(out+'/'+width+'-gallery.webp');await p.close();
 }
 // Hints are deliberately disabled in dev harness; remove the query for this explicit UI test.
 const p=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});await open(p,artifact);await p.evaluate(()=>history.replaceState(null,'',location.pathname));
 const cases=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));await apply(p,cases.find(r=>r.id==='P1'));
 const hint=p.getByRole('status',{name:'Status hint'});await hint.waitFor();const text=await hint.innerText();await p.getByRole('button',{name:'Hide status hints for this session'}).click();
 await apply(p,cases.find(r=>r.id==='P2'));rows.push({id:'legend',text,closed:await hint.count()===0});await p.close();
}finally{await browser.close();await writeFile(out+'/extras.json',JSON.stringify({rows,errors},null,2));await writeFile(out+'/face-frames.json',JSON.stringify(faceRows))}
