import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-replay-navigation';
await mkdir(output,{recursive:true});const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of(baseline?[true]:[false,true])){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();page.setDefaultTimeout(15000);
 for(const origin of['result','save'])for(const action of['close','escape','guide']){
  await page.evaluate(async({root,origin,reduced})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(826161,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.state.account.cards.forEach(c=>c.level=12);
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);R.playBattle(m.battle,'auto');R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go(origin);window.__navBefore=structuredClone(m.state);
   m.replayLast();m.skip();
  },{root,origin,reduced});
  await page.getByRole('button',{name:'Close replay',exact:false}).waitFor();
  if(action==='close'){await page.getByRole('button',{name:'Close',exact:true}).focus();await page.keyboard.press('Enter');}
  else if(action==='escape')await page.keyboard.press('Escape');
  else{await page.getByRole('button',{name:'Open menu'}).click();await page.getByRole('button',{name:'Read Field guide',exact:true}).click();}
  const after=await page.evaluate(()=>({screen:window.__depthReview.screen,replayActive:!!window.__depthReview.replay,unchanged:JSON.stringify(window.__depthReview.state)===JSON.stringify(window.__navBefore)}));
  if(!baseline){expect(after).toEqual({screen:action==='guide'?'codex':origin,replayActive:false,unchanged:true});
   if(after.screen==='codex')await page.getByRole('heading',{name:'Field guide',exact:true}).first().waitFor();
   else if(after.screen==='save')await page.getByRole('button',{name:'Replay last battle'}).waitFor();else await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();
  }
  report.checks.push({width,reduced,origin,action,...after});
  if(!baseline){await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));await page.waitForTimeout(350);
   const file=output+'/'+width+'-'+(reduced?'reduced':'motion')+'-'+origin+'-'+action;await page.screenshot({path:file+'.png'});execFileSync('magick',[file+'.png','-quality','82',file+'.webp']);report.shots.push(file+'.webp');}
 }
 await page.close();console.log(JSON.stringify({width,reduced,checks:report.checks.length}));
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
