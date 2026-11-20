import {createRequire} from 'node:module';import {writeFileSync} from 'node:fs';
const require=createRequire('/Users/bao/taskbar-hero-chain/apps/web/package.json'),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{await page.goto('http://127.0.0.1:5995/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');const start=performance.now();
 const result=await page.evaluate(async()=>{const {readCounters}=await import('/src/game/cardrpg/shell/LiveCounters.tsx');const {loadChainConfig}=await import('/src/game/cardrpg/chain/runtime.ts');const config=await loadChainConfig();return {config,counters:await readCounters({force:true})};});
 const report={at:new Date().toISOString(),ms:Math.round(performance.now()-start),...result,errors};writeFileSync('reports/v4-ship/S4/fuji-counters.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
