import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {withTimingLock} from '../lock.mjs';
import {coverage} from './coverage.mjs';
import {silhouetteContrast} from './readability.mjs';
const artifact=resolve(process.env.B2_ARTIFACT||'docs/cardrpg-look/index.html'),out=process.env.B2_OUT||'reports/cardrpg-look/b2/v0';
await mkdir(out,{recursive:true});
const snapshot=await mkdtemp('/tmp/cardrpg-b2-shots-'), frozenArtifact=snapshot+'/index.html', artifactBytes=await readFile(artifact);
await writeFile(frozenArtifact,artifactBytes);
const earned=JSON.parse(await readFile('tools/cardrpg-look/fixtures/a4-earned.json')).events[0];
const crew=JSON.parse(await readFile('tools/cardrpg-look/fixtures/a4-events.json'));
const receipt={artifact,sha256:createHash('sha256').update(artifactBytes).digest('hex'),method:'Fixed camera B, fixedTime3.2, paused presentation fixtures. Round1 watchNow deterministic account; impact at plan impact+70ms; Clover at 62%. No rules edits.',rows:[]};
const sizes=JSON.parse(process.env.B2_SIZES||'[[1280,720,1],[1024,600,1]]');
try { for(const [width,height,dpr]of sizes)await withTimingLock(`B2 six shots ${width} ${out}`,async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));await page.goto('file://'+frozenArtifact+(process.env.B2_DEV==='1'?'?dev=1':''));
  await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.camera='wide';m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.evaluate(f=>{const m=window.__depthReview;m.battle.v4={version:1,plan:f.initial.plan,events:f.events.filter(e=>e.kind==='crew-active')};for(const c of f.initial.cats){const a=m.battle.actors.find(a=>a.catalogId===c.id);if(a){a.skills=[...c.skills];a.row=c.row}}window.__b2Battle=structuredClone(m.battle);m.notify(false)},crew);
  const settle=async()=>{await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false})};
  const shot=async(name)=>{await settle();const detail=await page.evaluate(coverage);if(process.env.B2_CONTRAST&&width===1280&&['1-round1','4-wave','5-boss'].includes(name)){detail.contrast=await silhouetteContrast(page);await settle();}const file=`${width}-${name}.png`;await page.screenshot({path:`${out}/${file}`});receipt.rows.push({name,width,height,dpr,file,...detail,errors:[...errors]});console.log(JSON.stringify({name,width,units:detail.units.map(u=>[u.asset,+u.heightPercent.toFixed(1)]),errors}));await writeFile(`${out}/shots.json`,JSON.stringify(receipt,null,2))};
  await shot('1-round1');
  await page.evaluate(()=>{const m=window.__depthReview;m.inspect('mochi-4',0);m.galleryBattle=structuredClone(window.__b2Battle);m.animationAt=m.plan.beats[2].start+70;m.notify(false)});await shot('2-mochi');
  await page.evaluate(()=>window.__depthReview.inspect('clover-4',.62));await shot('3-clover');
  await page.evaluate(()=>{const m=window.__depthReview;m.inspect('enemy:teacup-healer',-1);const extra=structuredClone(m.battle.actors.find(a=>a.side==='enemy'));m.galleryBattle=structuredClone(window.__b2Battle);extra.id='foe-2-teacup-healer';extra.slot=2;m.galleryBattle.actors.push(extra);m.galleryBattle.queue.push(extra.id);m.notify(false)});await shot('4-wave');
  await page.evaluate(()=>{const m=window.__depthReview;m.inspect('enemy:yarn-giant',0);m.galleryBattle.v4={version:1,plan:{focus:'support',care:'protect'},events:[]};m.notify(false)});await settle();
  await page.evaluate(()=>{const m=window.__depthReview;m.plan={...m.plan};m.galleryBattle.v4.events.push({version:1,sequence:99,round:1,kind:'boss-phase',bossId:'yarn-giant',from:1,to:2,threshold:.5,text:'Yarn Giant · The tangle awakens'});m.animationAt=m.plan.beats[2].start+40;m.notify(false)});await shot('5-boss');
  await page.evaluate(()=>window.__depthReview.inspect('sorrel-1',-1));await settle();
  await page.evaluate(async e=>{const s=window.__depthScene;await s.playEntrance(e.itemId,e);s.entrance.startedAt=2.6;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false},earned);await shot('6-earned');
 }finally{await browser.close()}
});

} finally { await rm(snapshot,{recursive:true}); }
