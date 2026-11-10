/** Reviewer fixtures and screenshots. This is not a natural-progression or timing claim. */
import {createRequire} from 'node:module';
import {writeFile,mkdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,expect}=require('@playwright/test');
const arg=(name,fallback)=>process.argv.find(v=>v.startsWith(`--${name}=`))?.split('=').slice(1).join('=')??fallback;
const tag=arg('tag','quality'),names=arg('screens','home,collection,team,bonds,prepare,recruit').split(',');
const sizes=arg('sizes','1440x900,1280x720').split(',').map(v=>v.split('x').map(Number));
const output=resolve(root,'reports/cardrpg-a6/shots',tag),shots=[],errors=[];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const lease=setTimeout(()=>{console.error('Screenshot review exceeded 19-minute lease.');process.exit(2);},19*60*1000);
try {
 for(const [width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  await page.goto('http://127.0.0.1:5960/?demo=1&squad=1&cardrpg2=1&a6=1');
  await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  await page.evaluate(()=>{const m=window.__depthReview;m.state.tutorial=4;m.state.freeInvite=true;m.shortcut('unlock');m.shortcut('chapter');if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.go('hub');});
  for(const name of names){
   if(await access(resolve(root,'STOP-A6')).then(()=>true,()=>false))throw Error('STOP-A6');
   if(name==='home')await page.evaluate(()=>window.__depthReview.go('hub'));
   else if(name==='prepare')await page.evaluate(()=>{const m=window.__depthReview;m.state.run=null;m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);});
   else if(name==='recruit'){
    await page.evaluate(()=>{const m=window.__depthReview;m.state.run=null;m.tutorialBattle=null;m.watching=false;m.plan=null;m.go('gacha');});
    await page.getByRole('button',{name:/^Recruit ×10/}).click();
    await page.locator('[data-beat="reveal"]').waitFor();
   }else if(name==='daily'){
    await page.evaluate(()=>window.__depthReview.go('hub'));
    await page.getByRole('button',{name:'Events',exact:true}).click();
   }else{
    await page.evaluate(screen=>{const m=window.__depthReview;m.watching=false;m.plan=null;m.go(screen);},name);
    await page.locator(`[data-screen="${name}"]`).waitFor();
   }
   await page.waitForTimeout(name==='recruit'?80:350);
   await page.waitForFunction(()=>Array.from(document.images).filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-a6-${tag}-${width}-${name}.png`;
   await page.screenshot({path:tmp});
   execFileSync('cwebp',['-quiet','-q','82',tmp,'-o',resolve(output,file)]);
   const detail=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth>innerWidth,
    illustrated:[...document.querySelectorAll('img')].filter(i=>i.getClientRects().length&&i.currentSrc.includes('cardrpg-a6/illustrations')).length,
    broken:[...document.images].filter(i=>i.getClientRects().length&&!i.naturalWidth).map(i=>i.src),
   }));
   shots.push({name,width,height,file,...detail});
   if(detail.overflow||detail.broken.length)throw Error(JSON.stringify(detail));
  }
  await page.close();
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 await writeFile(resolve(output,'review.json'),JSON.stringify({fixture:'Reviewer unlocks; no natural-progression claim.',shots,errors},null,2)+'\n');
 console.log(JSON.stringify({shots:shots.length,errors,output}));
}finally{clearTimeout(lease);await browser.close();}
