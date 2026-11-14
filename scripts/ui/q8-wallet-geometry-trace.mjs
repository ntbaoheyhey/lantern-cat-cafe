import {openAudioScreen} from '../audio/ui-fixtures.mjs';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const {chromium}=createRequire(new URL('../../apps/web/package.json',import.meta.url))('@playwright/test');
process.env.CHAIN_LOCAL_WEB_PORT='5995';process.env.CHAIN_LOCAL_API_PORT='5997';process.env.CHAIN_LOCAL_RPC_PORT='8546';process.env.CHAIN_LOCAL_FIXTURE_ISOLATION='1';
const {startLocal}=await import('../../tools/chain/local.mjs');
const local=await startLocal({web:true}),browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 await page.route('https://api.avax-test.network/**',r=>r.abort());
 await openAudioScreen(page,'wallet-panel','http://127.0.0.1:5995');
 await page.evaluate(async()=>{const {LESSONS}=await import('/src/game/cardrpg/shell/lessons.ts');localStorage.setItem('lantern.coach.v3',JSON.stringify(Object.fromEntries(Object.keys(LESSONS).map(k=>[k,k!=='wallet']))));window.dispatchEvent(new Event('coach:changed'));window.dispatchEvent(new Event('chain:wallet'));});
 await page.locator('.b-coach[data-ready="true"]').waitFor();
 const result=await page.evaluate(async()=>{
  const samples=[],target=document.querySelector('[data-tutorial-id="wallet-title"]'),spot=document.querySelector('.b-coach-focus'),panel=document.querySelector('.b-coach-card'),dialog=target.closest('dialog');
  const rect=n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};
  for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);samples.push({time:performance.now(),target:rect(target),spot:rect(spot),panel:rect(panel),style:[spot.style.top,panel.style.top],dialog:rect(dialog),scroll:[window.scrollY,dialog.scrollTop]});}
  const ancestors=[];for(let n=spot;n;n=n.parentElement){const s=getComputedStyle(n);ancestors.push({tag:n.tagName,cls:n.className,position:s.position,transform:s.transform,filter:s.filter,contain:s.contain,padding:s.padding,margin:s.margin,overflow:s.overflow,animation:s.animation,rect:rect(n)});}
  return {samples,ancestors};
 });
 writeFileSync('reports/v3-shell/b2/q8/wallet-geometry-trace.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({samples:result.samples.slice(-8),ancestors:result.ancestors},null,2));
}finally{await browser.close();await local.stop();}
