/** Verify the current self-contained A6 file; reviewer fixtures are separate from earned play. */
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {writeFile,mkdir,stat} from 'node:fs/promises';
const root='/Users/bao/taskbar-hero-cardrpg-a6',require=createRequire(root+'/apps/web/package.json');
const {chromium,expect}=require('@playwright/test');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const rows=[],errors=[],requests=[],shots=[],output=root+'/reports/cardrpg-a6/shots/q14-offline';
await mkdir(output,{recursive:true});
try {
 for(const [width,height] of [[1440,900],[1280,720]]){
  const context=await browser.newContext({viewport:{width,height}});
  await context.route(/^https?:/,async route=>{requests.push(route.request().url());await route.abort();});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push({width,error:e.message}));
  page.on('console',e=>{if(e.type()==='error')errors.push({width,error:e.text()});});
  const started=Date.now();await page.goto(`file://${root}/docs/cardrpg-a6/index.html`);
  await expect(page.getByRole('button',{name:/^Night Patrol/})).toBeEnabled({timeout:60000});
  rows.push({width,height,readyMs:Date.now()-started,a6:await page.evaluate(()=>window.__depthReview.state.gameplayA6)});
  const shot=async name=>{
   await page.waitForTimeout(250);
   const temporary=`/tmp/cardrpg-a6-offline-${width}-${name}.png`,file=`${width}-${name}.webp`;
   await page.screenshot({path:temporary});execFileSync('cwebp',['-quiet','-q','82',temporary,'-o',`${output}/${file}`]);
   shots.push({name,width,height,file,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),broken:await page.locator('img').evaluateAll(images=>images.filter(i=>i.getClientRects().length&&!i.naturalWidth).map(i=>i.src))});
  };
  await shot('home');
  await page.getByRole('button',{name:/^Night Patrol/}).click();
  await page.getByRole('button',{name:/^Fight/}).click();
  await expect(page.getByRole('button',{name:/^Next/})).toBeVisible({timeout:120000});
  await shot('result');
  await page.getByRole('button',{name:/^Next/}).click();
  // Existing review commands exercise every lazy sheet in the embedded bundle.
  await page.evaluate(()=>{const m=window.__depthReview;m.state.tutorial=4;m.state.freeInvite=true;m.shortcut('unlock');m.shortcut('chapter');if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.go('hub');});
  for(const name of ['collection','team','inventory','bonds','tower','events','gacha','map','relics']){
   if(name==='events'){await page.evaluate(()=>window.__depthReview.go('hub'));await page.getByRole('button',{name:'Events',exact:true}).click();}
   else await page.evaluate(screen=>window.__depthReview.go(screen),name);
   if(name==='relics'){
    await page.getByRole('button',{name:'Load demo relics',exact:true}).click();
    await page.getByRole('button',{name:'Equip Legendary lantern cup',exact:true}).click();
    await expect(page.getByText('Team bonus +8%',{exact:true})).toBeVisible();
    await shot('relics');
   } else await expect(page.locator(`[data-screen="${name}"]`)).toBeVisible();
  }
  await context.close();
 }
 const report={date:new Date().toISOString(),source:'file:// current A6 artifact with all HTTP(S) requests blocked; tutorial uses real clicks; sheet coverage uses explicit reviewer unlocks.',rows,shots,bytes:(await stat(root+'/docs/cardrpg-a6/index.html')).size,errors,externalRequests:requests};
 await writeFile(root+'/reports/cardrpg-a6/q14-offline-check.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({rows,bytes:report.bytes,shots:shots.length,errors,externalRequests:requests,layoutErrors:shots.filter(s=>s.overflow||s.broken.length)}));
 if(errors.length||requests.length||rows.some(r=>!r.a6)||shots.some(s=>s.overflow||s.broken.length))process.exitCode=1;
}finally{await browser.close();}
