import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {createServer} from 'node:net';
const root='/Users/bao/taskbar-hero-ui-main-cxr2';const dest='/Users/bao/taskbar-hero-ui-art2/apps/web/e2e/ui/art2-baseline';
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),'340f88b92405ceb6b5421b207307fdbb283b2ca3');
await new Promise((resolve,reject)=>{const s=createServer();s.once('error',reject);s.listen(5390,'127.0.0.1',()=>s.close(resolve));});
const server=spawn('node',['e2e/support/serve.mjs','dist-v2/e2e-5381','5390'],{cwd:root+'/apps/web',stdio:'inherit'});
const {chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');let browser;
try{
 for(let i=0;i<100;i++){try{if((await fetch('http://localhost:5390')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch();mkdirSync(dest,{recursive:true});const records=[];
 for(const width of [1280,1600]){
  const context=await browser.newContext({viewport:{width,height:width===1280?720:900},reducedMotion:'reduce'});const page=await context.newPage();
  await page.clock.install({time:Date.UTC(2026,10,3,12)});await page.clock.pauseAt(Date.UTC(2026,10,3,12));
  await page.addInitScript(()=>localStorage.setItem('taskbar-hero.howToPlaySeen','1'));await page.goto('http://localhost:5390/#landing');
  for(const screen of ['landing','class']){
   if(screen==='class')await page.getByTestId('landing-start').click();await expect(page.getByTestId(screen==='landing'?'landing-hero':'class-picker')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
   const bytes=await page.screenshot({animations:'disabled',path:dest+'/'+screen+'-'+width+'.png'});records.push({screen,width,sha256:createHash('sha256').update(bytes).digest('hex')});
  }await context.close();
 }
 writeFileSync(dest+'/source.json',JSON.stringify({head:'340f88b92405ceb6b5421b207307fdbb283b2ca3',source:'Accepted main production-like local guest build; existing default-off flag; fixed clock; no app/source edits',records},null,2)+'\n');console.log('BASELINES PASS',records.length);
}finally{await browser?.close();server.kill('SIGTERM');}
