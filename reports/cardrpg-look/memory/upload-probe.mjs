import {chromium} from '/Users/bao/taskbar-hero-cardrpg-look/apps/web/node_modules/@playwright/test/index.mjs';
import {withTimingLock} from '/Users/bao/taskbar-hero-cardrpg-look/tools/cardrpg-look/lock.mjs';
await withTimingLock('LOOK texture upload attribution',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{window.__uploads=[];for(const key of ['texImage2D','texSubImage2D']){const original=WebGL2RenderingContext.prototype[key];WebGL2RenderingContext.prototype[key]=function(...args){const image=args.at(-1),start=performance.now();const result=original.apply(this,args);const ms=performance.now()-start;if(ms>10)window.__uploads.push({key,ms,type:image?.constructor?.name,width:image?.width,height:image?.height,stack:new Error().stack.split('\n').slice(1,4)});return result}}});
 await page.goto('file:///Users/bao/taskbar-hero-cardrpg-look/docs/cardrpg-look/index.html');await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});console.log(JSON.stringify(await page.evaluate(()=>window.__uploads)));
 }finally{await browser.close()}
});
