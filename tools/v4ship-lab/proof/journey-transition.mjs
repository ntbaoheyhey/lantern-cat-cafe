import {createRequire} from 'node:module';
const require=createRequire('/Users/bao/taskbar-hero-chain/apps/web/package.json'),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 for(const mode of ['skip','play']){
  await fetch('http://127.0.0.1:5997/__fixture/begin',{method:'POST'});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.getByRole('button',{name:'Play free',exact:true}).click();
  await page.getByRole('button',{name:'Start trial',exact:true}).waitFor();
  await page.evaluate(()=>{window.__transitionTrace=[];const m=window.__depthReview;
   for(const name of ['finish','leave','replayEncounter']){const original=m[name].bind(m);m[name]=(...args)=>{window.__transitionTrace.push({method:name,at:performance.now(),phase:document.querySelector('[data-journey-phase]')?.dataset.journeyPhase,result:m.replay?.result});return original(...args);};}
   let last='';m.subscribe(()=>{const value=JSON.stringify({show:m.showBattle,watching:m.watching,result:m.replay?.result,screen:m.screen});if(value!==last){last=value;window.__transitionTrace.push({at:performance.now(),value});}});
  });
  await page.getByRole('button',{name:'Start trial',exact:true}).click();
  await page.locator('.dp-battle').waitFor();
  if(mode==='skip')await page.getByRole('button',{name:'Skip to result',exact:true}).click();
  await page.waitForFunction(()=>!window.__depthReview?.showBattle,{},{timeout:150000});
  await page.waitForTimeout(500);
  console.log(JSON.stringify({mode,...await page.evaluate(()=>({trace:window.__transitionTrace,phase:document.querySelector('[data-journey-phase]')?.dataset.journeyPhase,body:document.body.innerText.slice(0,500)}))}));
  await page.close();await fetch('http://127.0.0.1:5997/__fixture/rollback',{method:'POST'});
 }
}finally{await browser.close();}
