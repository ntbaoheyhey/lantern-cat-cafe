/** Native production geometry and cleanup across a pending HUD optimization. */
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {chromium,config,openFixture,runtimeEvidence,judgeUrl} from './production-fixture.mjs';

const [label,compare]=process.argv.slice(2);assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/hud-native',label);assert(!existsSync(out));await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),url:judgeUrl,...runtimeEvidence(),toolSha256:hash(await readFile(import.meta.filename)),viewport:{width:1280,height:720},method:'Actual built IdentifiedFocusBanner and bound visual-model status source. Direct diagnostic paint at frozen boss state, four existing heroes, two motion modes, six pending-status cases and four invalidations. Pending statuses are changed synchronously without React commit, then restored. Native DOM measurement failure injection tests clone cleanup. No source-module fetch, behavior replacement, gameplay or performance claim.',runs:[],captures:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal';
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{setupPage:page=>page.addInitScript(()=>{
   const descriptor=Object.getOwnPropertyDescriptor(Node.prototype,'textContent');window.__cxiTotalWrites=0;
   Object.defineProperty(Node.prototype,'textContent',{...descriptor,set(value){if(this instanceof Element&&this.matches('.b3-total b'))window.__cxiTotalWrites++;return descriptor.set.call(this,value);}});
  })});
  await page.locator('.b3-wave-intro').waitFor({state:'hidden'});
  await page.evaluate(reduced=>{const s=window.__depthScene,m=window.__depthReview;cancelAnimationFrame(s.raf);m.plan=null;m.animationAt=0;m.paused=true;m.state.settings.reducedMotion=reduced;m.notify(false);s.phaseNoticeAt=-100;s.render({...s.view(),fixedTime:30,paused:true,galleryPreview:true},0);for(const a of document.getAnimations()){a.currentTime=300;a.pause();}},reduced);
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
  const heroes=await page.evaluate(()=>window.__depthReview.visualBattle.actors.filter(a=>a.side==='party').map(a=>a.catalogId));assert.equal(heroes.length,4);
  const run={mode,groups:[],captures:[],errors,blockedRequests};report.runs.push(run);
  for(const hero of heroes){
   const evidence=await page.evaluate(hero=>{
    const m=window.__depthReview,s=window.__depthScene,banner=s.cinema.identified,title=document.querySelector('.b3-focus-name'),actors=m.visualBattle.actors;
    const rules=JSON.stringify(m.battle),saved=actors.map(a=>({a,id:a.id,shield:a.shield,statuses:a.statuses})),nodes=[...document.querySelectorAll('.b3-world')],owner=actors.find(a=>a.catalogId===hero),id=owner.id;
    const identity={id,name:owner.name,portrait:'/units/'+s.actors.get(id).asset+'/portrait.webp',anchors:s.anchors};
    const visible=n=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return!n.hidden&&r.width>0&&r.height>0&&c.display!=='none'&&c.visibility!=='hidden';};
    const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};
    const restore=()=>{for(const v of saved)Object.assign(v.a,{id:v.id,shield:v.shield,statuses:v.statuses});};
    const leaks=()=>document.querySelectorAll('.b3-world[inert][aria-hidden="true"]').length;
    const measure=(name,key,reset=true)=>{
     const before=nodes.map(n=>n.outerHTML);if(reset)banner.reset();title.hidden=false;banner.paint(key,'Café guardians protect every friend',identity);
     return{hero,name,placement:structuredClone(banner.placement),parentOffset:{...banner.parentOffset},title:{...rect(title),text:title.textContent,caster:title.dataset.caster,placement:title.dataset.placement,style:title.getAttribute('style')},labels:nodes.map(n=>({id:n.dataset.actor,rect:rect(n),children:[...n.querySelectorAll('*')].filter(visible).map(rect)})),clean:leaks()===0&&JSON.stringify(before)===JSON.stringify(nodes.map(n=>n.outerHTML))};
    };
    const groups=[];
    try{
     for(const name of ['current','empty','shield','wide','overflow','missing']){
      restore();for(const {a,id}of saved){if(name==='missing'){a.id='missing:'+id;continue;}if(name!=='current'){a.shield=name==='empty'?0:45;a.statuses=(name==='wide'?[12345,99,3]:name==='overflow'?[12345,99,3,4,5]:[]).map(stacks=>({id:'burn',stacks,remaining:1}));}}
      groups.push(measure(name,{}));
     }
     restore();
     for(const name of ['translated-hud','font','translated-parent','hidden-hud']){
      const top=document.querySelector('.b3-top'),parent=title.parentElement,styles=[top,parent,title].map(n=>({n,style:n.getAttribute('style'),hidden:n.hidden})),key={};measure('prime',key);
      try{
       if(name==='translated-hud')top.style.transform='translate(13px,7px)';
       if(name==='font')title.style.fontSize='29px';
       if(name==='translated-parent')parent.style.transform='translate(13px,-7px)';
       if(name==='hidden-hud')top.hidden=true;
       if(name==='font')document.fonts.dispatchEvent(new Event('loadingdone'));else window.dispatchEvent(new Event('resize'));
       groups.push(measure(name,key,false));
      }finally{for(const {n,style,hidden}of styles){if(style===null)n.removeAttribute('style');else n.setAttribute('style',style);n.hidden=hidden;}window.dispatchEvent(new Event('resize'));}
     }
     const original=Element.prototype.getBoundingClientRect;let injected=0,caught='';
     try{
      Element.prototype.getBoundingClientRect=function(){if(this.closest?.('.b3-world[inert][aria-hidden="true"]')&&++injected===3)throw Error('CXI injected pending geometry failure');return original.call(this);};
      try{measure('throw',{});}catch(e){caught=e.message;}
     }finally{Element.prototype.getBoundingClientRect=original;}
     const cleanup={injected,caught,remainingClones:leaks()};const final=measure('capture',{});
     return{groups,cleanup,final,rulesUnchanged:JSON.stringify(m.battle)===rules};
    }finally{restore();}
   },hero);
   assert(evidence.rulesUnchanged);assert.equal(evidence.groups.length,10);assert(evidence.groups.every(x=>x.clean));assert.equal(evidence.cleanup.caught,'CXI injected pending geometry failure');assert.equal(evidence.cleanup.remainingClones,0);run.groups.push(...evidence.groups);(run.cleanup??=[]).push({hero,...evidence.cleanup});
   await page.evaluate(async()=>{for(const img of document.querySelectorAll('.b3-focus-name img'))await img.decode();for(const a of document.getAnimations()){a.currentTime=300;a.pause();}document.activeElement?.blur();});await page.mouse.move(0,0);
   const raw=resolve(out,mode+'-'+hero+'.png');await page.screenshot({path:raw});const {data,info}=await sharp(raw).removeAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,1280);assert.equal(info.height,720);
   const preview=resolve(out,mode+'-'+hero+'-1024.jpg');await sharp(raw).resize(1024,576).jpeg({quality:92}).toFile(preview);const stats=await sharp(preview).stats();assert(stats.channels.every(x=>x.stdev>10));
   const capture={mode,hero,utc:new Date().toISOString(),raw,rgbSha256:hash(data),path:preview,sha256:hash(await readFile(preview)),dimensions:[1024,576],stdev:stats.channels.map(x=>x.stdev)};report.captures.push(capture);run.captures.push(capture);await save();
  }
  run.totalText=await page.evaluate(async()=>{const b=document.querySelector('.b3-total b'),before=b.textContent,start=window.__cxiTotalWrites;for(let i=0;i<40;i++)await new Promise(requestAnimationFrame);return{frames:40,writes:window.__cxiTotalWrites-start,before,after:b.textContent};});assert.equal(run.totalText.before,run.totalText.after);assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);run.complete=true;await save();await page.close();
 }
 if(compare){const before=JSON.parse(await readFile(resolve(compare),'utf8'));assert(before.complete);assert.equal(before.runs.length,report.runs.length);for(let i=0;i<report.runs.length;i++){assert.deepEqual(report.runs[i].groups,before.runs[i].groups);assert(report.runs[i].totalText.writes<=1,'Unchanged total damage text should not be rewritten every RAF');}assert.equal(report.captures.length,before.captures.length);for(let i=0;i<report.captures.length;i++)assert.equal(report.captures[i].rgbSha256,before.captures[i].rgbSha256,'Full native RGB parity');report.exactMatchTo=resolve(compare);}
 report.complete=true;
}catch(error){report.failure=error.stack;process.exitCode=1;}
finally{await browser.close();report.finishedUtc=new Date().toISOString();report.identityAfter=runtimeEvidence();if(report.indexSha256!==report.identityAfter.indexSha256){report.complete=false;process.exitCode=1;report.failure='Production index changed during probe';}await save();console.log(JSON.stringify({out,complete:report.complete,groups:report.runs.reduce((n,r)=>n+r.groups.length,0),captures:report.captures.length,failure:report.failure}));}
