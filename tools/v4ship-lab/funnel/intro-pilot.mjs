/** Real clicks in a fresh browser; no save, auth or battle state mutations. */
import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=require('sharp');
const out=resolve(root,'reports/v4-ship/S3/ui');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const width=Number(process.env.V4_WIDTH??1280),height=width===1280?720:900;
const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),start=performance.now();
const report={at:new Date().toISOString(),width,height,mode:'Development plus disposable Anvil',clicks:[],errors:[],httpFailures:[],popups:0};
const at=()=>Math.round(performance.now()-start),safe=text=>String(text).replace(/0x[a-f\d]{64,}/gi,'[hex]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,200);
page.on('pageerror',e=>report.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')report.errors.push(safe(e.text()));});
page.on('response',r=>{if(r.status()>=400)report.httpFailures.push({status:r.status(),path:new URL(r.url()).pathname});});context.on('page',()=>report.popups++);
const click=async name=>{await page.getByRole('button',{name,exact:true}).click({timeout:60000});report.clicks.push({name,atMs:at()});};
const capture=async name=>{await sharp(await page.screenshot()).resize({width:1024}).png().toFile(resolve(out,`${width}-${name}.png`));};
try{
 await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await click('Play free');await page.getByRole('button',{name:'Start trial',exact:true}).waitFor({timeout:60000});
 await capture('intro');await click('Start trial');
 await page.waitForFunction(()=>document.querySelector('.dp-battle')?.checkVisibility(),null,{timeout:30000});report.battleMs=at();
 console.log(JSON.stringify({event:'battle started',battleMs:report.battleMs,clicks:report.clicks.length}));
 await page.getByRole('button',{name:'Mint trial reward',exact:true}).waitFor({timeout:200000});report.rewardMs=at();
 await capture('reward');await click('Mint trial reward');
 await page.getByRole('heading',{name:'Prepare your workshop',exact:true}).waitFor({timeout:60000});report.receiptMs=at();
 report.receiptLink=await page.getByRole('link',{name:'Reward transaction · Snowtrace',exact:true}).getAttribute('href');
 report.overflow=await page.evaluate(()=>({horizontal:document.documentElement.scrollWidth>innerWidth,clipped:[...document.querySelectorAll('button,h1,h2,h3,p,label')].filter(e=>e.checkVisibility()&&e.clientWidth&&e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflowX==='hidden').map(e=>e.textContent.slice(0,60))}));
 await capture('cafe');report.pass=report.errors.length===0&&report.httpFailures.length===0&&report.popups===0&&report.battleMs<=30000&&report.receiptMs<=180000;
 if(process.env.V4_FULL==='1'){
  report.workshop=[];
  for(const [button,next] of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){
   await click(button);await page.getByRole('button',{name:next,exact:true}).waitFor({timeout:60000});report.workshop.push({button,atMs:at()});console.log(JSON.stringify({event:'workshop step',button,atMs:at()}));
  }
  await click('Face the boss');await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:180000});report.bossCompleteMs=at();
  await capture('proof');await click('Open wallet history');await page.getByRole('dialog',{name:'Fuji market',exact:true}).waitFor({timeout:20000});report.historyMs=at();
  report.pass&&=report.errors.length===0&&report.httpFailures.length===0&&report.popups===0;
 }
 console.log(JSON.stringify({event:'intro complete',battleMs:report.battleMs,receiptMs:report.receiptMs,errors:report.errors.length,httpFailures:report.httpFailures.length,pass:report.pass}));
}catch(e){report.pass=false;report.failure=safe(e.message);await capture('failure').catch(()=>{});console.log(JSON.stringify({pass:false,failure:report.failure,atMs:at()}));process.exitCode=1;}
finally{await writeFile(resolve(out,`${width}-pilot.json`),JSON.stringify(report,null,2)+'\n');await browser.close();}
