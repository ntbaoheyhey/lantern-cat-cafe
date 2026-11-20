// Q3 D4 learning experiment; uses existing draw, not a recorder extension.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 const rows=[];
 for(let trial=0;trial<3;trial++)for(const method of ['cold','compile-and-upload']){
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D4&revision=1');await page.waitForFunction(()=>window.__drill?.ready);
  const result=await page.evaluate(async method=>{
   const p=window.__drill;p.stop();p.draw(0);const preparationStart=performance.now();
   if(method==='compile-and-upload'){p.renderer.initTexture(p.drill.texture);await p.renderer.compileAsync(p.scene,p.camera);}
   const preparationMs=performance.now()-preparationStart,trace=[];
   await new Promise(resolve=>{const start=performance.now();const frame=()=>{const ms=performance.now()-start,before=performance.now();p.draw(ms);trace.push({ms,drawMs:performance.now()-before});if(ms<700)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});
   const gaps=trace.slice(1).map((row,i)=>({from:trace[i].ms,to:row.ms,gap:row.ms-trace[i].ms}));
   return{preparationMs,maxFrameGapMs:Math.max(...gaps.map(r=>r.gap)),entryMaxFrameGapMs:Math.max(...gaps.filter(r=>r.to>=180&&r.from<=380).map(r=>r.gap)),maxDrawMs:Math.max(...trace.map(r=>r.drawMs)),trace};
  },method);
  rows.push({trial,method,...result});await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3/flipbook-preparation-study.json',JSON.stringify({at:new Date().toISOString(),method:'Fresh pages, three paired700msRAF trials; host load/cache may vary; no film timing claim.',rows},null,2)+'\n');
 console.log(JSON.stringify(rows.map(({trace,...r})=>r)));
}finally{await browser.close();}
