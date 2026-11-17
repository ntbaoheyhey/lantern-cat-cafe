/** Production fixtures: enemy comparisons and approved hero actions, at most five contact sheets. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''),'Supply a fresh evidence label');
const out=resolve(root,'work/v5/CXI/effects',label),url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1';
const req=createRequire(resolve(root,'apps/web/package.json')),{chromium}=req('@playwright/test'),{build}=await import(req.resolve('vite'));
const temporary=await mkdtemp('/tmp/v5-cxi-fixture-'),entry=resolve(temporary,'entry.ts');
await writeFile(entry,`export {pilotFixture} from '${root}/apps/web/src/game/cardrpg/vfx-layered/fixture.ts';\nexport {configureSequence} from '${root}/apps/web/src/game/cardrpg/battle-v3/sequence.ts';`);
await build({root,configFile:false,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:temporary,minify:false,lib:{entry,formats:['es'],fileName:()=> 'fixture.mjs'}}});
const {pilotFixture,configureSequence}=await import(pathToFileURL(resolve(temporary,'fixture.mjs')).href);
await mkdir(out,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const index=await readFile(resolve(root,'apps/web/dist/index.html'));
assert.equal(hash(Buffer.from(await (await fetch(url)).arrayBuffer())),hash(index));
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),url,indexSha256:hash(index),method:'Existing pilotFixture and configureSequence bundled outside browser; production browser receives fixture DTO only, no development module requests. Three frames around contact.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/*',route=>{
  const request=route.request(),target=new URL(request.url());
  if(request.method()!=='POST'||target.origin==='http://127.0.0.1:6301')return route.continue();
  const body=request.postDataJSON(),calls=Array.isArray(body)?body:[body];
  return target.hostname==='api.avax-test.network'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method))?route.continue():route.abort();
 });
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto(url);await page.getByRole('button',{name:'Play free',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:60000});
 const groups=[
  ...['button-guard','spool-ram','kettle-knight'].map(owner=>({name:`enemy-${owner}`,ids:[`enemy:${owner}`]})),
  ...[['mochi','soot'],['clover','panko']].map(owners=>({name:`heroes-${owners.join('-')}`,ids:owners.flatMap(owner=>[`${owner}-1`,`${owner}-4`])}))
 ];
 for(const group of groups){
  const layers=[];
  for(const [row,id] of group.ids.entries()){
  const fixture=pilotFixture(id),plan=configureSequence(fixture.plan);
  await page.evaluate(({battle,plan,id})=>{
   const m=window.__depthReview;m.state.tutorial=4;Object.assign(m.state.settings,{quality:'high',speed:1,reducedMotion:false});
   Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,galleryId:id,animationAt:0,paused:true,sceneStarted:true,labOpen:false,screen:'map'});m.notify(false);
  },{battle:fixture.battle,plan,id});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  const impact=plan.beats[2].start,frames=[];
  const times=id.endsWith('-4')?[Math.max(0,impact-150),impact+90,impact+220]:[impact,impact+90,impact+220];
  for(const [i,ms]of times.entries()){
   await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);},ms);
   const path=resolve(out,id.replaceAll(':','-')+'-'+i+'.png');await page.screenshot({path});frames.push(path);
  }
  const sheet=resolve(out,group.name+'.jpg');
  for(const [i,path] of frames.entries())layers.push({input:await sharp(path).resize(480,270).toBuffer(),left:i*480,top:row*270});
  report.rows.push({id,impact,times,frames,sheet});
  }
  await sharp({create:{width:1440,height:270*group.ids.length,channels:3,background:'#171326'}}).composite(layers).jpeg({quality:78}).toFile(resolve(out,group.name+'.jpg'));
 }
}finally{
 await browser.close();await rm(temporary,{recursive:true,force:true});await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({label,rows:report.rows.length,errors:report.errors}));
assert.equal(report.errors.length,0,'Capture page errors');
