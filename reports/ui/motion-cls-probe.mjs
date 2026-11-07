import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import {writeFileSync} from 'node:fs';import {createServer} from 'node:net';
const root=process.cwd(),web=root+'/apps/web';const {chromium}=createRequire(web+'/package.json')('@playwright/test');
await new Promise((ok,fail)=>{const s=createServer();s.once('error',fail);s.listen(5354,()=>s.close(ok));});
const server=spawn('node',['e2e/support/serve.mjs','dist-v2/e2e-5361','5354'],{cwd:web,stdio:'inherit'});let browser;
try{for(let i=0;i<100;i++){try{if((await fetch('http://localhost:5354')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});await page.goto('http://localhost:5354/motion-fixture/e2e/fixtures/motion-view.html');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
await page.evaluate(()=>{window.shifts=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.shifts.push({value:e.value,sources:e.sources.map(s=>({node:s.node?.outerHTML,previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))});}).observe({type:'layout-shift'});});
await page.getByRole('button',{name:'Play sample cues'}).click();await page.waitForTimeout(350);const data=await page.evaluate(()=>window.shifts);writeFileSync(root+'/reports/ui/logs/motion-builder/cls-sources.json',JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data));
}finally{await browser?.close();server.kill('SIGTERM');}
