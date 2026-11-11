/** Real A6 shell projection gate. Baseline mode records the old failures. */
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {apply} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const manifest=JSON.parse(await readFile('assets/cardrpg-look/v3-real/manifest.json','utf8'));
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT),baseline=process.env.ART_BASELINE==='1';
await mkdir(out,{recursive:true});const result={baseline,errors:[],rows:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));
 await page.goto('file://'+artifact+'?dev=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 const cases=process.env.ART_ALL==='1'?manifest.units.map(u=>[u.id,u.kind==='cat'?u.id+'-1':'enemy:'+u.id]):[['normal','mochi-1'],['yarn-giant','enemy:yarn-giant'],['rain-spool','enemy:rain-spool'],['pantry-crown','enemy:pantry-crown'],['kettle-knight','enemy:kettle-knight']];
 for(const [name,gallery] of cases){
  await apply(page,{gallery,progress:-1});
  for(const [width,height] of [[1440,900],[1280,720]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(80);
   const row=await page.evaluate(({manifest,baseline})=>{
    const s=window.__depthScene,m=window.__depthReview;m.plan=null;m.state.settings.reducedMotion=true;m.notify(false);
    for(let i=0;i<2;i++)s.render({...s.view(),fixedTime:3.2,paused:true,reducedMotion:true,frame:null},0);s.dirty=false;
    // Old artifacts have no scaleAudit: measure the same source-body boxes here.
    const scale=s.scaleAudit?.()??{width:s.width,height:s.height,modelToStage:2,units:m.battle.actors.filter(a=>a.hp>0).map(a=>{
     const p=s.puppets.get(a.id),u=manifest.units.find(u=>u.id===p.asset),r=p.model.userData.paintedRig,g=p.model.children[0],V=p.base.constructor;
     const [l,t,rr,b]=u.fallbackBodyRect;g.updateWorldMatrix(true,true);let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
     for(let i=0;i<8;i++){const v=new V(((i&1?rr:l)-.5)*r.height*r.aspect,(1-(i&2?t:b))*r.height,i&4?.1:0).applyMatrix4(g.matrixWorld).project(s.camera),x=(v.x*.5+.5)*s.width,y=(.5-v.y*.5)*s.height;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
     return{id:a.id,asset:p.asset,side:a.side,kind:u.kind,height:(b-t)*r.height*p.root.scale.y/2,box:{x:x0,y:y0,width:x1-x0,height:y1-y0},ratio:(y1-y0)/s.height,fallback:true};
    })};
    const party=scale.units.filter(u=>u.side==='party'),avg=party.reduce((n,u)=>n+u.ratio,0)/party.length;
    const failures=[];for(const u of party){if(u.ratio<.22)failures.push(u.asset+': party below22%');if(Math.abs(u.ratio/avg-1)>.08)failures.push(u.asset+': party height differs>8%');}
    for(const u of scale.units.filter(u=>u.kind==='boss'))if(u.ratio>.55)failures.push(u.asset+': boss above55%');
    const faces=party.map(u=>{const p=s.puppets.get(u.id),v=p.base.clone();p.head.getWorldPosition(v);v.y+=.2*p.root.scale.y;v.project(s.camera);return{id:u.id,x:(v.x*.5+.5)*s.width,y:(.5-v.y*.5)*s.height};});
    for(const boss of scale.units.filter(u=>u.kind==='boss'))for(const f of faces){const b=boss.box;if(f.x>b.x&&f.x<b.x+b.width&&f.y>b.y&&f.y<b.y+b.height)failures.push(boss.asset+': covers '+f.id+' face');}
    if(s.audit().outside.length)failures.push('cropped silhouette: '+s.audit().outside.join(','));
    if(s.labelAudit.overlaps)failures.push('HP label overlap');
    if(s.labelAudit.missing.length)failures.push('missing HP label');
    return{a6:m.a6Mode,scale,faces,labels:s.labelAudit,bounds:s.audit(),failures};
   },{manifest,baseline});
   result.rows.push({name,width,height,...row});
   if(!row.a6)throw Error('Requires current A6 shell');
   if(process.env.ART_ALL!=='1'||['mochi','clover','yarn-giant','pantry-crown'].includes(name))await sharp(await page.screenshot()).webp({quality:83}).toFile(`${out}/${name}-${width}.webp`);
  }
 }
}finally{await browser.close();await writeFile(out+'/scale-screen.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.rows.filter(r=>r.failures.length).map(r=>({name:r.name,width:r.width,failures:r.failures,ratios:r.scale.units.map(u=>[u.asset,Math.round(u.ratio*1000)/10])}));
console.log(JSON.stringify({baseline,rows:result.rows.length,errors:result.errors,failures}));if(result.errors.length||!baseline&&failures.length)process.exitCode=1;
