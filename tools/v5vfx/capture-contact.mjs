/** Fresh, independently reset Kettle contact comparisons; baseline is an in-memory diagnostic. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {runtimeEvidence} from './runtime-evidence.mjs';
const root=process.cwd(),out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/R1-kettle-contact');
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Each mode/form opens a new page, resetting pose history. Baseline reconstructs R2 Kettle layer anchors/size in memory. Real fixture events are unchanged. All modes retain broad legacy body protection.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const suffix of [':basic',''])for(const mode of ['baseline','contact','reduced']){
  const name=(suffix?'basic':'signature')+'-'+mode,dir=resolve(out,name);await mkdir(dir,{recursive:true});
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{url:'http://127.0.0.1:6310',fixedClock:false});report.url=page.url();
  await page.evaluate(async({root,suffix,mode})=>{
   const {V5_SKILL_TIMELINES}=await import('/src/game/cardrpg/spine/vfx-registry.ts');
   const id='enemy:kettle-knight'+suffix,t=V5_SKILL_TIMELINES.get(id),strength=suffix?.8:1;
   if(mode==='baseline')V5_SKILL_TIMELINES.set(id,{...t,layers:t.layers.map(l=>({...l,anchor:l.anchor==='contact'?'target':l.anchor,...(l.id==='release'?{size:.52*strength}:l.id==='material'?{size:.30*strength,alpha:.40,glyph:'needle'}:{})}))});
   const m=window.__depthReview;m.state.settings.reducedMotion=mode==='reduced';m.inspect(id,0,false);m.notify(false);
   const selected=V5_SKILL_TIMELINES.get(id);V5_SKILL_TIMELINES.set('cxv-kettle-'+mode,{...selected,id:'cxv-kettle-'+mode});m.plan={...m.plan,presentationId:'cxv-kettle-'+mode};
  },{root,suffix,mode});
  await page.waitForFunction(()=>window.__depthScene.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  const setup=await page.evaluate(()=>{
   const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.animationAt=0;s.render({...s.view(),fixedTime:20,paused:true},0);
   const id=m.plan.events.find(e=>e.actorId===m.plan.actorId&&e.type==='damage').targetIds[0],b=s.bounds(s.actors.get(id));
   return{id,impact:m.plan.beats[2].start,clip:{x:Math.max(0,Math.floor(b.x-110)),y:Math.max(0,Math.floor(b.y-70)),width:500,height:Math.min(420,720-Math.max(0,Math.floor(b.y-70)))}};
  });
  const samples=[];
  for(const [i,age]of [-100,-40,0,33,90,220].entries()){
   samples.push(await page.evaluate(({setup,age,mode})=>{
    const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.animationAt=setup.impact+age;s.render({...s.view(),fixedTime:20+m.animationAt/1000,paused:true},0);
    let label=document.querySelector('[data-cxv-contact]');if(!label){label=document.createElement('div');label.dataset.cxvContact='true';document.body.append(label);}
    Object.assign(label.style,{position:'fixed',left:setup.clip.x+4+'px',top:setup.clip.y+4+'px',color:'#fff4d8',background:'#21182dee',font:'13px monospace',padding:'3px',zIndex:'99999'});label.textContent=`${mode} · contact ${age}ms`;
    if(s.effects.timeline.audit.id!=='cxv-kettle-'+mode)throw Error('Registry comparison not active');
    return{age,timeline:s.effects.timeline.audit.id,source:s.socket(m.plan.actorId,'mainHand'),target:s.socket(setup.id,'vfxOrigin'),feet:s.socket(setup.id,'feet'),head:s.socket(setup.id,'head'),draws:s.effects.stats.draws};
   },{setup,age,mode}));
   await page.screenshot({path:resolve(dir,`frame-${i}.png`),clip:setup.clip});
  }
  const sheet=resolve(out,name+'.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','6','-i',resolve(dir,'frame-%d.png'),'-vf','scale=500:-1,tile=3x2','-frames:v','1','-q:v','3',sheet]);report.rows.push({name,sheet,samples});report.errors.push(...errors);await page.close();
 }
}finally{await browser.close();report.finished=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({rows:report.rows.length,errors:report.errors}));if(report.errors.length)process.exitCode=1;
