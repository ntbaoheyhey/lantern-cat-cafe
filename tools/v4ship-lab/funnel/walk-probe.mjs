import{createRequire}from'node:module';import{writeFileSync}from'node:fs';
const require=createRequire(new URL('../../../apps/web/package.json',import.meta.url));const{chromium}=require('@playwright/test');const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720}});const start=performance.now();let clicks=0;const rows=[];
async function observe(name){const r={name,ms:Math.round(performance.now()-start),clicks,headings:await page.getByRole('heading').allTextContents(),buttons:await page.getByRole('button').allTextContents(),state:await page.evaluate(()=>({screen:window.__depthReview?.screen,result:window.__depthReview?.battle?.result,round:window.__depthReview?.battle?.round}))};rows.push(r);console.log(JSON.stringify(r));}
async function click(name){await page.getByRole('button',{name,exact:true}).click({timeout:20000});clicks++;}
try{await page.goto('http://127.0.0.1:5994');await click('Play free');await page.getByRole('button',{name:/^Fight/}).click();clicks++;await click('Fight');await page.waitForFunction(()=>window.__depthReview?.watching===true);await observe('battle');
const coach=page.getByRole('dialog',{name:'Tutorial',exact:true});if(await coach.isVisible()){await coach.getByRole('button',{name:'Skip',exact:true}).click();clicks++;}
await page.waitForFunction(()=>window.__depthReview?.screen==='result',null,{timeout:240000});await observe('result');await click('Complete lesson');await page.waitForTimeout(1000);await observe('home after lesson');
if(await coach.isVisible()){await coach.getByRole('button',{name:'Skip',exact:true}).click();clicks++;}
await click('Welcome');await click('Skip reveal');for(const name of ['Dismiss celebration','Skip celebration'])if(await page.getByRole('button',{name,exact:true}).isVisible())await click(name);
await page.getByRole('dialog',{name:'Recruit',exact:true}).getByRole('button',{name:'Close',exact:true}).click();clicks++;
await page.getByRole('button',{name:/^Fight/}).click();clicks++;await click('Fight');await observe('campaign start');
await page.waitForFunction(()=>window.__depthReview?.screen==='result',null,{timeout:600000});await observe('campaign result');await click('Next');await page.waitForTimeout(1500);await observe('after campaign');

}catch(e){console.log(JSON.stringify({failure:e.name}));await observe('blocked');}finally{writeFileSync(new URL('../../../reports/v4-ship/S2/walk-probe.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),rows},null,2)+'\n');await browser.close();}
