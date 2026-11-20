/** Natural fixture actives, sampled with the same temporal-light mask as reference. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from '../v3a2/browser-fixture.mjs';
import {root,evidenceMeta} from '../v3a2/check-gates.mjs';
const label=process.argv[2]??'baseline';
if(!/^[a-z0-9-]+$/.test(label))throw Error('Invalid label');
const out=resolve(root,'reports/v3-solo/Q7',label+'-field');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),fixtures={};
try{
 for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture),rows=[];
  let active=0;
  for(let i=0;i<3300&&active<3;i++){
   const state=await page.evaluate(i=>{
    const m=window.__depthReview,s=window.__depthScene,q=window.__v3a2;
    m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(i===0?0:1000/30,1000+i*1000/30);m.paused=true;
    if(m.plan!==q.colourPlan){q.colourPlan=m.plan;q.colourBase=false;q.colourContact=false;q.colourResolve=false;}
    const plan=m.plan;if(!plan||plan.sequence?.tier!=='active')return null;
    const since=m.animationAt-plan.beats[2].start;
    const beat=!q.colourBase&&since>=-400&&since<-300?'entrance':!q.colourContact&&since>=33&&since<100?'contact':!q.colourResolve&&since>=200&&since<267?'resolve':null;
    if(!beat)return null;
    q['colour'+({entrance:'Base',contact:'Contact',resolve:'Resolve'})[beat]]=true;
    s.render({...s.view(),fixedTime:12+i/30,paused:true},1/30);
    return {frame:i,beat,skill:plan.presentationId??plan.skillId,since,heads:s.labelAudit.heads,numbers:s.numbers.drawn,field:(()=>{const r=s.effects.canvas.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})(),effects:s.effects.canvas.toDataURL('image/png')};
   },i);
   if(!state)continue;
   if(state.beat!=='entrance'&&!rows.some(r=>r.action===active&&r.beat==='entrance'))continue;
   await page.clock.runFor(1);const png=await page.screenshot();
   const path=resolve(out,fixture.id+'-'+active+'-'+state.beat+'.png');await writeFile(path,png);
   const effects=resolve(out,fixture.id+'-'+active+'-'+state.beat+'-effects.png');await writeFile(effects,Buffer.from(state.effects.split(',')[1],'base64'));delete state.effects;
   rows.push({...state,action:active,path:path.slice(root.length+1),sha256:createHash('sha256').update(png).digest('hex')});
   if(state.beat==='resolve')active++;
  }
  const parity=await page.evaluate(()=>{const m=window.__depthReview,q=window.__v3a2,a=structuredClone(q.initial),b=structuredClone(m.battle);q.R.playBattle(a,'auto');q.R.playBattle(b,'auto');return JSON.stringify(a)===JSON.stringify(b);});
  fixtures[fixture.id]={rows,errors,parity};console.log(fixture.id,rows.length,'frames',parity?'parity PASS':'parity FAIL');await page.close();
 }
}finally{await browser.close();}
await writeFile(resolve(out,'capture.json'),JSON.stringify({_meta:evidenceMeta(),fixtures},null,2)+'\n');
if(Object.values(fixtures).some(f=>!f.parity||f.errors.length||f.rows.length!==9))throw Error('Incomplete active sampling');
