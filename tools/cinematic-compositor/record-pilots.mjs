import {createRequire} from 'node:module';import {mkdir,rm,rename,writeFile,copyFile} from 'node:fs/promises';import {resolve} from 'node:path';import {spawn} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),out=resolve(root,'reports/v3-battle/A3'),desktop='/Users/bao/Desktop/TaskbarHero-REVIEW';await mkdir(desktop,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{for(const id of (process.argv.slice(2).length?process.argv.slice(2):['mochi','soot','clover'])){
 const temp=resolve(root,'work/pilot-capture',id),context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:temp,size:{width:1280,height:720}}}),page=await context.newPage();
 await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(async id=>{
  const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
  m.sceneError='';m.state.tutorial=4;m.state.settings.speed=1;m.state.settings.quality='high';
  for(const card of m.state.account.cards){card.level=6;m.state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(s=>s.id);}
  const b=R.createBattle({seed:71,chapter:3,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(m.state),enemies:['yarn-giant','binding-thread','binding-thread']});b.v4.committed=true;
  const caster=b.actors.find(a=>a.catalogId===id);caster.charge=100;b.queue=[caster.id,...b.queue.filter(a=>a!==caster.id)];
  m.tutorialBattle=b;m.galleryBattle=null;m.plan=null;m.sceneStarted=true;m.watching=true;m.paused=true;m.screen='map';m.notify(false);
 },id);
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:90000});await page.evaluate(()=>document.fonts.ready);
 const start=performance.now();await page.evaluate(()=>{const m=window.__depthReview;m.paused=false;m.notify(false);});
 // Poll in short intervals so the recording remains bounded and the caller can report progress.
 for(let i=0;i<12;i++)await page.waitForTimeout(5000);
 const state=await page.evaluate(()=>({result:window.__depthReview.battle?.result,round:window.__depthReview.battle?.round,sceneError:window.__depthReview.sceneError,sequence:window.__depthScene?.cinema.audit}));
 if(state.sceneError)throw Error(state.sceneError);
 const video=page.video();await context.close();const raw=await video.path(),target=resolve(out,'pilot-'+id+'.webm');
 for(const pass of ['1','2'])await new Promise((yes,no)=>{const proc=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss','2','-i',raw,'-t','60','-vf','fps=30','-c:v','libvpx-vp9','-b:v','360k','-row-mt','1','-cpu-used','5','-passlogfile',resolve(temp,'encode'),'-pass',pass,'-an',...(pass==='1'?['-f','null','/dev/null']:[target])],{stdio:'ignore'});proc.on('exit',code=>code===0?yes():no(Error('encode '+code)));});
 await copyFile(target,resolve(desktop,'pilot-'+id+'.webm'));await copyFile(resolve(out,id+'-ult-film.png'),resolve(desktop,'pilot-'+id+'-film.png'));await rm(temp,{recursive:true,force:true});
 await writeFile(resolve(out,'pilot-'+id+'-battle.json'),JSON.stringify({id,recordedSeconds:(performance.now()-start)/1000,state},null,2));console.log(JSON.stringify({id,state}));
}}finally{await browser.close();}
