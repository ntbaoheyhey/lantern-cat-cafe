import {writeFile} from 'node:fs/promises';
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
const browser=await chromium.launch({headless:true}),results=[];
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
  await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.tutorial();m.notice='';m.notify(false);});
  await page.locator('.c2-seat').first().waitFor();
  for(const layoutHeight of [900,700,562.5]){
   const result=await page.evaluate(async layoutHeight=>{
    const {stageLayoutC2}=await import('/src/game/cardrpg/stage/layout-c2.ts');
    const m=window.__depthReview,b=m.battle;
    const units=[...b.initial.cats.map(c=>({id:c.id,side:'party',row:c.row,aspect:1})),...b.actors.filter(a=>a.side==='enemy').map(a=>({id:a.id,side:'enemy',row:a.row,aspect:1.1}))];
    const boxes=stageLayoutC2(units,1000,562.5,layoutHeight);
    for(const el of document.querySelectorAll('.c2-seat')){
     const box=boxes.get(el.dataset.seat);Object.assign(el.style,{left:`${box.footX/10}%`,top:`${box.y/5.625}%`,height:`${box.height/5.625}%`,width:`${box.width/10}%`,zIndex:String(box.order),transition:'none'});
    }
    return [...document.querySelectorAll('.c2-seat')].map(el=>{
     const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.c2-seat');
     return{id:el.dataset.seat,box:{x:r.x,y:r.y,width:r.width,height:r.height},hit:top?.dataset.seat,receivesCenter:top===el};
    });
   },layoutHeight);
   await page.screenshot({path:new URL(`./preview-${width}-${layoutHeight}.jpg`,import.meta.url).pathname,type:'jpeg',quality:78});
   results.push({width,height,layoutHeight,rows:result});
  }
  await page.close();
 }
 await writeFile(new URL('./preview-layout.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
 console.log(JSON.stringify(results.map(r=>({width:r.width,layoutHeight:r.layoutHeight,blocked:r.rows.filter(x=>!x.receivesCenter).map(x=>[x.id,x.hit])}))));
}finally{await browser.close();}
