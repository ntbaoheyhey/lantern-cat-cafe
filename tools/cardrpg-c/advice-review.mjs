/** Controlled loss-panel states only; never an earned-session or recovery-rate claim. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,expect}=require('@playwright/test');
const output=resolve(root,'reports/cardrpg-c/shots/c11-advice');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const report={fixture:'Controlled finished loss and deliberately held advice worker; no combat replay or recovery estimate.',shots:[],errors:[],complete:false};
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  if(await access(resolve(root,'reports/cardrpg-c/STOP-C')).then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.addInitScript(()=>{
   window.__pendingAdvice=[];
   window.__adviceRequests=0;
   const NativeWorker=window.Worker;
   window.Worker=class extends NativeWorker{
    postMessage(data,...options){
     if(data?.state&&data?.setup&&data?.key){window.__adviceRequests++;window.__pendingAdvice.push(()=>super.postMessage(data,...options));}
     else super.postMessage(data,...options);
    }
   };
  });
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
  await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const makeLoss=async()=>{
   await page.evaluate(()=>{
    const m=window.__depthReview;m.offline=true;m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.tutorialBattle=null;m.watching=false;m.plan=null;
    m.start(1,'campaign',1);if(!m.state.run)throw Error(m.notice);m.enter(m.state.run.nodes[0].id);
    m.state.run.battle.result='enemy';m.watching=false;m.screen='result';m.notify(false);
   });
   await page.getByRole('region',{name:'Your next change'}).waitFor();
  };
  const state=()=>page.evaluate(()=>{const m=window.__depthReview;return JSON.stringify({currencies:m.state.account.currencies,cards:m.state.account.cards,run:m.state.run.id,screen:m.screen});});
  const capture=async name=>{
   await page.waitForFunction(()=>Array.from(document.images).filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-advice-${width}-${name}.png`;
   await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','82',tmp,'-o',resolve(output,file)]);
   const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,adviceState:document.querySelector('.dp-v4-advice')?.getAttribute('data-advice-state'),busy:document.querySelector('.dp-v4-advice')?.getAttribute('aria-busy'),workerRequests:window.__adviceRequests,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length}));
   if(metrics.overflow||metrics.broken)throw Error(JSON.stringify(metrics));
   await expect(page.getByRole('region',{name:'Your next change'})).toBeInViewport({ratio:1});
   report.shots.push({width,height,file,name,...metrics});
  };
  await makeLoss();
  const region=page.getByRole('region',{name:'Your next change'}),before=await state();
  await expect(region).toHaveAttribute('aria-busy','true');
  await expect(region.getByRole('button',{name:'Finding your next change…'})).toBeDisabled();
  await expect(page.getByRole('button',{name:/^Back to cafe/})).toBeEnabled();
  await capture('checking');
  await page.waitForFunction(()=>window.__pendingAdvice.length===1);
  await page.evaluate(()=>window.__pendingAdvice.splice(0).forEach(send=>send()));
  await expect(region).toHaveAttribute('data-advice-state',/^(ready|no-change)$/,{timeout:10000});
  await expect(page.getByRole('status',{name:'New discovery'})).toHaveCount(0);
  // Automatic discovery acknowledgements clone the account after the answer arrives.
  await expect(region).toHaveAttribute('data-advice-state',/^(ready|no-change)$/);
  if(await page.evaluate(()=>window.__adviceRequests)!==1)throw Error('An unchanged encounter restarted its comparison.');
  await expect(region).toHaveAttribute('aria-busy','false');
  await expect(region.getByRole('button')).toBeEnabled();
  if(await state()!==before)throw Error('The comparison changed the account.');
  await capture('completed');
  await makeLoss();const timeoutBefore=await state();
  await expect(region).toHaveAttribute('data-advice-state','timeout',{timeout:10000});
  await expect(region.getByRole('button')).toBeEnabled();
  await expect(region).toHaveAttribute('aria-busy','false');
  if(await state()!==timeoutBefore)throw Error('Timeout changed the account.');
  await capture('timeout');
  if(await page.evaluate(()=>window.__adviceRequests)!==2)throw Error('Expected exactly one worker per distinct encounter.');
  await region.getByRole('button').click();
  await expect(page.locator('[data-screen="collection"], [data-screen="inventory"], [data-screen="team"]')).toBeVisible();
  report.shots.at(-1).fallbackReviewOpened=true;
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));
 report.complete=true;
}finally{
 await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({output,shots:report.shots.length,errors:report.errors,complete:report.complete}));
