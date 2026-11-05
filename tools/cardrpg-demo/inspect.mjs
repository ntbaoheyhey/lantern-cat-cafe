import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.CARDRPG_URL||'http://127.0.0.1:5520',source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),artifactSha256=base.startsWith('file:')?createHash('sha256').update(await fs.readFile(fileURLToPath(base))).digest('hex'):null;
const out=process.env.CARDRPG_CAPTURE||'reports/cardrpg/layout';await fs.mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});const rows=[],errors=[];
try{for(const [width,height] of [[1024,600],[1280,720],[1440,900]]){
 const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(base.startsWith('file:')?base:base+'/?demo&squad=1&squad3d=1&squadDebug=1');if(base.startsWith('file:'))await p.getByRole('button',{name:/Prepare patrol/}).click();await p.getByRole('button',{name:/Begin patrol/}).click();await p.waitForFunction(()=>window.__turn3dReview?.controller.canChoose);
 await p.evaluate(()=>{const c=window.__turn3dReview.controller;c.fixedTime=1;c.notify()});await p.waitForFunction(()=>window.__turn3dReview.scene?.stats.loaded>=7);await p.waitForTimeout(200);
 const capture=async(name)=>{
  await p.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.view().actors.length});await p.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});await p.waitForTimeout(100);
  rows.push({width,height,name,...await p.evaluate(()=>{const r=window.__turn3dReview;const box=s=>{const q=document.querySelector(s)?.getBoundingClientRect();return q?{x:q.x,y:q.y,width:q.width,height:q.height,bottom:q.bottom,right:q.right}:null};return {docHeight:document.documentElement.scrollHeight,docWidth:document.documentElement.scrollWidth,stage:box('.t3-stage'),skills:box('.t3-skills'),party:box('.t3-party'),partyContents:[...document.querySelectorAll('.t3-party .sq-card')].map(e=>({client:e.clientHeight,scroll:e.scrollHeight})),labels:r.scene.labelAudit,models:r.scene.audit?.(),labelBoxes:[...document.querySelectorAll('.t3-anchor')].map(e=>{const q=e.getBoundingClientRect(),b=document.querySelector('.t3-stage').getBoundingClientRect();return {name:e.textContent,x:q.x-b.x,y:q.y-b.y,width:q.width,height:q.height}}),stats:r.scene.stats}})});
  await p.screenshot({path:`${out}/${width}-${name}.png`});
 };
 await capture('planning');
 for(const encounter of ['group','boss']){await p.evaluate(encounter=>{const c=window.__turn3dReview.controller;c.reset({encounter,gearMode:'starter'});while(c.presenter.busy)c.presenter.skip();c.fixedTime=1;c.notify()},encounter);await capture(encounter)}
 await p.close();
}}finally{await b.close();await fs.writeFile(`${out}/checks.json`,JSON.stringify({source,artifactSha256,date:new Date().toISOString(),errors,rows},null,2));console.log(JSON.stringify({source,artifactSha256,errors,cases:rows.length}))}

assert.deepEqual(errors,[]);
const overlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
for(const r of rows){
 assert.equal(r.docHeight,r.height,`${r.width} ${r.name}: page overflow`);
 assert.equal(r.docWidth,r.width);assert.deepEqual(r.models.outside,[]);assert.deepEqual(r.models.overlaps,[]);assert.deepEqual(r.labels.missing,[]);
 assert.ok(r.skills.bottom<=r.height&&r.party.bottom<=r.height);for(const c of r.partyContents)assert.ok(c.scroll<=c.client,`${r.width}: party status content clipped`);
 for(const u of r.models.units){assert.ok(u.box.height/r.stage.height<=(u.role==='yarn'?.6:.38),`${r.width} ${u.id}: height budget`);assert.ok(Math.abs(Math.abs(u.yaw)-32*Math.PI/180)<.001)}
 for(const [i,a] of r.labelBoxes.entries()){
  assert.ok(a.x>=0&&a.y>=0&&a.x+a.width<=r.stage.width&&a.y+a.height<=r.stage.height,`${r.width}: label outside ${a.name}`);
  for(const b of r.labelBoxes.slice(i+1))assert.ok(!overlap(a,b),`${r.width}: labels overlap ${a.name} / ${b.name}`);
  for(const u of r.models.units)assert.ok(!overlap(a,u.box),`${r.width}: label covers model ${a.name} / ${u.id}`);
 }
}
console.log('PASS: viewport, all model bounds, actual DOM labels, scales and resting yaw');
