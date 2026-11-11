// Seeded legal A6 battle replay at real x1; state exists only in an isolated review page.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=resolve(process.env.PUPPET_PREVIEW_ROOT||process.cwd());
const require=createRequire(root+'/apps/web/package.json');
const {createServer}=await import(require.resolve('vite'));
const {chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=resolve(process.env.ART_OUT),artifact=resolve(process.env.ART_ARTIFACT);
await mkdir(out,{recursive:true});
const vite=await createServer({configFile:false,root:root+'/apps/web',envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
let setup,choices;
try{
 const R=await vite.ssrLoadModule('/@fs/'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
 let state=R.createDepthAccount(20261110);state=R.setGameplayV4(state,true);state=R.setSkillsV5(state,true);state=R.setGameplayA6(state,true);
 setup={seed:20261110,chapter:1,cats:R.battleCats(state).filter(c=>['mochi','soot'].includes(c.id)),enemies:['yarn-giant'],gameplayV4:true,skillsV5:true,gameplayA6:true};
 const battle=R.playBattle(R.createBattle(setup),'auto');choices=battle.choices;
 if(!battle.result||!choices.length)throw Error('Pilot rules replay did not resolve');
 await writeFile(out+'/replay.json',JSON.stringify({setup,choices,expectedResult:battle.result,rounds:battle.round})+'\n');
}finally{await vite.close();}
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const result={method:'Seeded legal A6 rules replay, x1 wall-clock playback. Isolated fixture, not first-session pacing.',errors:[],frames:[],actions:[],initial:null};
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
 await page.goto('file://'+artifact+'?a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(({setup,choices})=>{const m=window.__depthReview;m.galleryBattle=null;m.tutorialBattle=null;m.state.lastBattle=setup;m.state.lastChoices=choices;m.replayLast();m.paused=true;m.state.settings.speed=1;m.camera='wide';m.notify(false);},{setup,choices});
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady,null,{timeout:120000});
 result.initial=await page.evaluate(async()=>{const s=window.__depthScene;await new Promise(requestAnimationFrame);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;return{a6:window.__depthReview.a6Mode,actors:[...s.puppets.values()].map(p=>({id:p.asset,illustrated:!!p.model.userData.lookPuppet,height:p.height})),labels:s.labelAudit,stats:s.stats};});
 if(['mochi','soot','yarn-giant'].some(id=>!result.initial.actors.some(a=>a.id===id&&a.illustrated)))throw Error('Pilot did not load all three illustrated actors');
 await sharp(await page.screenshot()).webp({quality:90}).toFile(out+'/battle-1440.webp');
 await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(250);
 await sharp(await page.screenshot()).webp({quality:89}).toFile(out+'/battle-1280.webp');
 await page.setViewportSize({width:1440,height:900});
 await page.evaluate(()=>{const m=window.__depthReview;m.paused=false;m.notify(false);window.__puppetFrameTimes=[];let previous=performance.now();const sample=now=>{window.__puppetFrameTimes.push(now-previous);previous=now;if(window.__puppetFrameTimes.length<10000)requestAnimationFrame(sample);};requestAnimationFrame(sample);});
 const start=Date.now(),limit=Number(process.env.ART_SECONDS||75)*1000,seen=new Set();
 while(Date.now()-start<limit){
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;return{result:m.battle?.result,screen:m.screen,round:m.battle?.round,action:m.plan?.presentationId??m.plan?.skillId,progress:m.plan?m.animationAt/m.plan.duration:0,ultimate:!!m.plan?.ultimate,labels:s.labelAudit.overlaps,stats:s.stats,parts:[...s.puppets.values()].map(p=>({id:p.asset,arm:p.model.getObjectByName('puppet_armR')?.rotation.z}))};});
  result.frames.push({seconds:(Date.now()-start)/1000,...state});
  if(state.action&&!seen.has(state.action)){seen.add(state.action);result.actions.push(state.action);await sharp(await page.screenshot()).webp({quality:86}).toFile(out+'/action-'+state.action.replaceAll(/[^a-z0-9-]/gi,'-')+'.webp');}
  if(state.result&&state.screen==='result')break;
 }
 result.frameTimes=await page.evaluate(()=>{const a=window.__puppetFrameTimes.slice(30).sort((a,b)=>a-b);return{samples:a.length,median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1)};});
 result.seconds=(Date.now()-start)/1000;
}finally{await browser.close();await writeFile(out+'/battle-review.json',JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({seconds:result.seconds,actions:result.actions,frameTimes:result.frameTimes,errors:result.errors}));
if(result.errors.length)process.exitCode=1;
