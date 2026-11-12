import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const work=process.env.C2_WORK??resolve(root,'work/cardrpg-c2'),base=process.env.C2_URL??'http://127.0.0.1:5970';
await mkdir(work,{recursive:true});await mkdir(resolve(root,'docs/cardrpg-c2'),{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage({deviceScaleFactor:1});
const shots=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const rules='/@fs'+resolve(root,'packages/game-rules/src/cardrpg/depth/index.ts');
try{
for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
 await page.setViewportSize({width,height});await page.goto(base+'/?demo=1&squad=1&cardrpg2=1&a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(async rules=>{const R=await import(rules),m=window.__depthReview;m.offline=true;m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(11,0),true));m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.start(1,'campaign',1);m.enter('0-0');m.notice='';m.notify(false);},rules);
 await page.waitForTimeout(500);
 const prepare=resolve(work,`formation-${width}-prepare.png`);await page.screenshot({path:prepare});shots.push({name:`Preparation · ${width}×${height}`,path:prepare});
 for(const chapter of [1,2,3])for(const kind of ['first','boss']){
  const ids=await page.evaluate(async({rules,chapter,kind})=>{const R=await import(rules),m=window.__depthReview;const enemies=kind==='boss'?[R.CHAPTERS[chapter-1].boss]:R.generateMap(11,chapter)[0].enemies;
   const b=R.createBattle({seed:11,chapter,formationC2:true,gameplayV4:true,skillsV5:true,gameplayA6:true,cats:R.battleCats(m.state),enemies});
   m.state.run=null;m.tutorialBattle=null;m.galleryBattle=b;m.plan=null;m.paused=true;m.watching=false;m.sceneStarted=true;m.screen='map';m.notice='';m.notify(false);return b.actors.map(a=>a.id);
  },{rules,chapter,kind});
  await page.waitForFunction(ids=>{const s=window.__depthScene;return s?.ready&&s.actors.size===ids.length&&ids.every(id=>s.actors.has(id));},ids,{timeout:90000});
  await page.waitForTimeout(250);
  const audit=await page.evaluate(()=>window.__depthScene.sizeAudit());let overlap=0;
  for(const [i,a] of audit.units.entries())for(const b of audit.units.slice(i+1)){const p=a.box,q=b.box;const intersection=Math.max(0,Math.min(p.x+p.width,q.x+q.width)-Math.max(p.x,q.x))*Math.max(0,Math.min(p.y+p.height,q.y+q.height)-Math.max(p.y,q.y));overlap=Math.max(overlap,intersection/Math.min(p.width*p.height,q.width*q.height));}
  if(overlap>.150001||audit.units.filter(u=>u.side==='party').length!==4||audit.units.some(u=>u.ratio<.2999))throw Error(`Formation bounds failed: ${chapter}/${kind}/${width}: ${overlap}`);
  const path=resolve(work,`formation-${width}-${chapter}-${kind}.png`);await page.screenshot({path});shots.push({name:`Chapter ${chapter} · ${kind==='first'?'first wave':'boss'} · ${width}×${height}`,path,overlap,audit});
 }
}
if(errors.length)throw Error(errors.join('\n'));
for(const shot of shots){shot.data=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;canvas.getContext('2d').drawImage(image,0,0);return canvas.toDataURL('image/webp',.82).split(',')[1];},'data:image/png;base64,'+(await readFile(shot.path)).toString('base64'));}
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>C2 · Formation</title><style>body{margin:0;background:#241e22;color:#f6e5c4;font:16px/1.5 system-ui}header{padding:32px;max-width:1100px;margin:auto}h1{font:42px Georgia;margin:0}main{max-width:1500px;margin:auto;padding:20px}figure{margin:0 0 32px}img{display:block;width:100%;border-radius:16px}figcaption{padding:10px 4px}p{max-width:900px}a{color:#f6cb83}</style><header><h1>Four friends, two rows</h1><p>Front: shield · Back: bow. The back row is raised by half a slot. Cat silhouettes occupy 31% of the stage height; bosses retain 1.7–1.95× scale. Actual rendered bounds are checked below, including the nearest party member and boss.</p><p>Captured from the running game. Fixtures provide encounter coverage; these screenshots do not measure earned progress or balance. Full-resolution images are embedded; this file works offline.</p></header><main>${shots.map(s=>`<figure><img alt="${s.name}" src="data:image/webp;base64,${s.data}"><figcaption>${s.name}${s.audit?` · maximum overlap ${(s.overlap*100).toFixed(2)}% · ${s.audit.units.length} units`:''}</figcaption></figure>`).join('')}</main></html>`;
await writeFile(resolve(root,'docs/cardrpg-c2/formation.html'),html);
await writeFile(resolve(work,'formation-measurements.json'),JSON.stringify(shots.map(({data,path,...s})=>s),null,2));
console.log(JSON.stringify({screens:shots.length,maxOverlap:Math.max(...shots.map(s=>s.overlap??0)),errors:errors.length}));
}finally{await browser.close();}
