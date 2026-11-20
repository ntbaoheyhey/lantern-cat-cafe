/** Lab-only style comparison. No model, clocks, artwork or recorder edits. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const lab='tools/v3craft-lab/v4-contrast',out=lab+'/raw/drill-'+(process.argv[2]??'r1');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={at:new Date().toISOString(),scope:'Private same-clock owned-art comparison, synthetic DOM counts only; no gameplay claim.',sourceHashes:{},variants:[]};
for(const p of ['battle.css','hud-details.css']){
 const path='apps/web/src/game/cardrpg/battle-v3/'+p;
 report.sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
}
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'));
 await page.evaluate(()=>{
  const statuses=document.querySelector('.b3-statuses');
  statuses.innerHTML='<span role="img" aria-label="Lab count only" style="color:#b9e98a"><svg viewBox="0 0 20 20"><path d="M10 2 17 5 16 12 10 18 4 12 3 5Z"/></svg><b>3</b></span>';
  document.querySelectorAll('.b3-stars').forEach((el,i)=>el.textContent='★'.repeat([1,2,3,5][i%4]));
 });
 const style=await page.addStyleTag({content:'/* lab variant */'});
 for(const variant of ['baseline','dark','light']){
  const css=variant==='baseline'?'':await readFile(lab+'/'+variant+'.css','utf8');
  await style.evaluate((el,css)=>el.textContent=css,css);await page.clock.runFor(34);
  await page.screenshot({path:out+'/'+variant+'.png'});
  const metadata=await page.evaluate(()=>{
   const selectors=['.b3-statuses b','.b3-speed','.b3-stars','.b3-auto'],rows=[];
   for(const selector of selectors)for(const [index,el]of [...document.querySelectorAll(selector)].entries()){
    const cs=getComputedStyle(el),r=el.getBoundingClientRect(),rects=[];
    const walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    while(walk.nextNode()){
     const n=walk.currentNode;if(!n.textContent.trim()||n.parentElement.closest('svg'))continue;
     const range=document.createRange();range.selectNodeContents(n);
     for(const b of range.getClientRects())rects.push({x:b.x,y:b.y,width:b.width,height:b.height});
    }
    const ancestors=[];
    for(let node=el;node;node=node.parentElement){
     const s=getComputedStyle(node);
     if(s.opacity!=='1'||s.filter!=='none'||s.mixBlendMode!=='normal')ancestors.push({class:node.className,opacity:s.opacity,filter:s.filter,blend:s.mixBlendMode});
    }
    rows.push({selector,index,text:el.textContent,color:cs.color,fontSize:cs.fontSize,fontWeight:cs.fontWeight,background:cs.backgroundColor,backgroundImage:cs.backgroundImage,rect:{x:r.x,y:r.y,width:r.width,height:r.height},rects,ancestors});
   }
   return rows;
  });
  const mask=await page.addStyleTag({content:'/* glyph mask */'});
  for(const [name,fill]of [['background','transparent'],['black','#000'],['white','#fff']]){
   await mask.evaluate((el,fill)=>el.textContent='.b3-statuses b,.b3-speed,.b3-stars,.b3-auto{-webkit-text-fill-color:'+fill+'!important;text-shadow:none!important}',fill);
   await page.screenshot({path:out+'/'+variant+'-'+name+'.png'});
  }
  await mask.evaluate(el=>el.remove());
  report.variants.push({variant,cssSha256:createHash('sha256').update(css).digest('hex'),metadata});
 }
 report.errors=errors;await page.close();
}finally{await browser.close();}
await writeFile(out+'/drill.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({variants:report.variants.length,errors:report.errors}));
if(report.errors.length)process.exitCode=1;
