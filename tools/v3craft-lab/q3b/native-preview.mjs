// Live composition authoring via the established Q2 production seek method.
// No recorder or acceptance timing changes. LEARN/Q3.B.md.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const width=Number(process.argv[2]??1280),height=Number(process.argv[3]??720),fixture=process.argv[4]??'wave3';
const tier=process.argv[5]??'ultimate';
const out=`tools/v3craft-lab/q3b/raw/native-${fixture}-${width}${tier==='basic'?'-basic':''}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===fixture),{width,height});
 const plan=await page.evaluate(tier=>{
  const s=window.__depthScene,m=window.__depthReview;if(!s.craft||!s.craftLoaded)throw Error('Opt-in Soot renderer not ready');
  m.paused=false;m.sceneReady=true;
  for(let i=0;i<150;i++){
   if(!m.plan)m.step();const plan=m.plan;if(!plan)throw Error('No plan before Soot ultimate');
   if(plan.actorId==='soot'&&plan.ultimate===(tier==='ultimate')){m.paused=true;m.animationAt=0;return{skillId:plan.skillId,actorId:plan.actorId,targetIds:plan.targetIds,duration:plan.duration,impact:plan.beats[2].start};}
   while(m.plan)m.tick(100);
  }
  throw Error('Soot ultimate was not reached');
 },tier);
 const phases=[];
 for(const ms of tier==='basic'?[0,75,150,225,250,266.667,283.333,300,316.667,333.333,350,383.333,416.667,425,500,600,700,800]:[0,200,400,600,633.333,700,800,900,1000,1066.667,1100,1133.333,1175,1400,1600,1800,2000,2200]){
  phases.push(await page.evaluate(({ms,tier})=>{
   const m=window.__depthReview,s=window.__depthScene;m.animationAt=ms;s.render({...s.view(),fixedTime:10+ms/1000,paused:true},0);
   return{ms,craft:structuredClone((tier==='basic'?s.craftBasic:s.craft).audit),camera:s.audit().camera,units:s.sizeAudit().units};
  },{ms,tier}));
  await page.locator('canvas[data-look-spine]').screenshot({path:`${out}/${ms}.png`});
 }
 writeFileSync(`${out}/preview.json`,JSON.stringify({at:new Date().toISOString(),width,height,fixture,errors,plan,phases},null,2)+'\n');
 console.log(JSON.stringify({width,height,fixture,errors,plan,phases:phases.length}));
}finally{await browser.close();}
