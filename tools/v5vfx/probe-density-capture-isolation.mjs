/** Synthetic capture-protocol diagnostic, with no game or performance claim. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),out=resolve(process.env.CXV_DENSITY_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-F-density-capture-isolation'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));await mkdir(out,{recursive:true});
const script=await readFile(import.meta.filename);await writeFile(resolve(out,'probe.mjs'),script);
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={utc:new Date().toISOString(),synthetic:true,browser:browser.version(),toolSha256:createHash('sha256').update(script).digest('hex'),rows:[]};
try{
 for(const initial of [1,2]){
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:initial});
  await page.setContent('<style>body{margin:0;background:#314b67;color:white;font:40px sans-serif}div{width:400px;height:200px;background:#d39a51}</style><div>Density capture diagnostic</div>');
  await page.evaluate(()=>{globalThis.__ratios=[];let last;function frame(){if(last!==devicePixelRatio){last=devicePixelRatio;__ratios.push(last);}requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  const cdp=await page.context().newCDPSession(page);
  for(const ratio of [2,1.5,1])for(const method of ['playwright-css','cdp-css']){
   await cdp.send('Emulation.clearDeviceMetricsOverride');await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});await page.waitForFunction(r=>devicePixelRatio===r,ratio);
   const before=await page.evaluate(()=>({devicePixelRatio,innerWidth,innerHeight,ratios:__ratios}));
   const bytes=method==='playwright-css'?await page.screenshot({scale:'css'}):Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/ratio}})).data,'base64');
   await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
   const after=await page.evaluate(()=>({devicePixelRatio,innerWidth,innerHeight,ratios:__ratios})),path=resolve(out,`${initial}-${ratio}-${method}.png`);await writeFile(path,bytes);
   report.rows.push({initial,ratio,method,before,after,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),path});
  }await page.close();
 }
}catch(error){report.failure=String(error);throw error;}finally{await browser.close();report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report.rows.map(({initial,ratio,method,after,width,height})=>({initial,ratio,method,after:after.devicePixelRatio,width,height}))));
