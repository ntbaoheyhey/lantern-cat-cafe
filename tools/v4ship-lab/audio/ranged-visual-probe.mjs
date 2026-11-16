/** Read actual submitted ranged paint layers and source starts in the shipping scene. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio} from './journey-observer.mjs';
import {prepareImpactObservation,evaluateImpactObservation} from './impact-observer.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-visual-probe-${attempt}.json`),raw=output.replace('.json','.events.json.gz');
assert(!existsSync(output)&&!existsSync(raw),'Preserve previous evidence');
const hash=b=>createHash('sha256').update(b).digest('hex'),git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP');stop();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-13.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const unchanged=()=>git(['diff','--name-only',build.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'])==='';assert(unchanged());
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const folder=resolve(root,'assets/cardrpg-look/vfx-layered'),timelines=Object.fromEntries(readdirSync(folder).filter(n=>n.endsWith('.json')).map(n=>{const t=JSON.parse(readFileSync(resolve(folder,n)));return [t.id,t];}));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report={at:new Date().toISOString(),sourceCommit:build.sourceCommit,buildEvidence:buildPath,
 scope:'Two real first-trial battles at both shipping sizes. Observe actual Canvas2D drawImage calls for flight-anchored layers and contact layers, alongside existing causal audio. This records submitted paint, not visible pixels or physical onset. No screenshots, generated images, ART edits or playback changes.',
 harness:{path:relative(root,import.meta.filename),sha256:hash(readFileSync(import.meta.filename))},rows:[],complete:false};
const rawRows=[],save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});assert(r.ok,`Fixture ${action}`);};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const width of [1280,1440]){
  stop();assert(unchanged());const height=width===1440?900:720,row={viewport:{width,height},errors:[],blocked:[],rollback:false};report.rows.push(row);save();let context,active=false;
  try{
   await fixture('begin');active=true;context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});const page=await context.newPage();
   page.on('pageerror',e=>row.errors.push(String(e.message).slice(0,200)));
   await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&(u.hostname==='fonts.googleapis.com'&&r.resourceType()==='stylesheet'||u.hostname==='fonts.gstatic.com'&&r.resourceType()==='font');if(local||font)await route.continue();else{row.blocked.push(u.origin+u.pathname);await route.abort();}});
   await prepareJourneyAudio(page);await prepareImpactObservation(page);
   await page.addInitScript(timelines=>{
    const state=window.__rangedPaint={scenes:[],draws:[],errors:[]},attached=new WeakSet();
    const attach=()=>{
     const scene=window.__depthScene;if(!scene||attached.has(scene))return;
     const layered=scene.effects?.layered;if(!layered?.renderClip){state.errors.push('Missing layered renderer');return;}
     attached.add(scene);const sequence=state.scenes.length;state.scenes.push({sequence,craftBasic:!!scene.craftBasic,craft:!!scene.craft});
     const render=layered.renderClip;
     layered.renderClip=function(c,view,width,height,id,passive){
      const plan=view.frame?.plan,owner=view.models?.[plan?.actorId]??view.actors.find(a=>a.id===plan?.actorId)?.cardRpg?.cardId;
      if(!plan||passive||!['soot','binding-thread'].includes(owner))return render.apply(this,arguments);
      const timeline=timelines[id],image=this.images.get(id),draw=c.drawImage,elapsed=view.frame.elapsed;
      c.drawImage=function(...args){
       const result=draw.apply(this,args);
       if(args.length!==9||!image||!timeline)return result;
       const [sx,sy,sw,sh]=args.slice(1,5),layer=timeline.layers.find(l=>(l.flipbook?.regions??[l.region]).some(r=>image.x+r[0]===sx&&image.y+r[1]===sy&&r[2]===sw&&r[3]===sh));
       if(layer&&this.globalAlpha>0&&['flight','target'].includes(layer.anchor)){
        const m=this.getTransform(),ratio=this.canvas.width/width;
        state.draws.push({scene:sequence,planId:plan.id,actorId:plan.actorId,owner,skillId:plan.skillId,presentationId:id,ultimate:!!plan.ultimate,elapsed,impactMs:plan.beats[2].start,at:performance.now(),layer:layer.name,anchor:layer.anchor,alpha:this.globalAlpha,x:m.e/ratio,y:m.f/ratio,source:scene.effects.socket(plan.actorId,'mainHand'),canvasVisible:this.canvas.checkVisibility(),sceneReady:scene.ready});
       }
       return result;
      };
      try{return render.apply(this,arguments);}finally{c.drawImage=draw;}
     };
    };
    window.__rangedTimer=setInterval(attach,10);
   },timelines);
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');await page.getByRole('button',{name:'Play free',exact:true}).waitFor();await observeJourneyAudio(page);
   await page.getByRole('button',{name:'Play free',exact:true}).click();await page.getByRole('button',{name:'Start trial',exact:true}).click();
   await page.getByRole('button',{name:'Mint trial reward',exact:true}).waitFor({timeout:200000});
   const data=await page.evaluate(()=>{clearInterval(window.__rangedTimer);clearInterval(window.__impactObserverTimer);return {audio:window.__journeyAudio,impact:window.__impactObservation,paint:window.__rangedPaint};});rawRows.push({viewport:row.viewport,...data});
   const impact=evaluateImpactObservation(data.impact,data.audio);row.contactCoverage=impact.observedImpactCoveragePass;row.contacts=impact.causallyPlayedContacts;row.scenes=data.paint.scenes;
   row.plans=data.impact.plans.filter(p=>p.expectsAction&&['soot','binding-thread'].includes(p.owner)).map(p=>{
    const draws=data.paint.draws.filter(d=>d.planId===p.planId&&d.actorId===p.actorId),flight=draws.filter(d=>d.anchor==='flight'&&d.elapsed<p.impactMs),contact=draws.filter(d=>d.layer==='impact-burst'&&d.elapsed>=p.impactMs);
    const audio=data.impact.events.filter(e=>e.plan===p.sequence),first=flight[0],last=flight.at(-1);
    return {owner:p.owner,planId:p.planId,actorId:p.actorId,presentationId:p.presentationId,ultimate:p.ultimate,impactMs:p.impactMs,flightDraws:flight.length,firstFlightMs:first?.elapsed??null,lastFlightMs:last?.elapsed??null,flightDisplacementPx:first&&last?Math.hypot(last.x-first.x,last.y-first.y):null,firstContactPaintMs:contact[0]?.elapsed??null,drawnLayers:[...new Set(draws.map(d=>d.layer))],audio:audio.map(e=>({cue:e.cue,role:e.role,at:e.at,requests:e.requests})),allDrawsVisible:draws.length>0&&draws.every(d=>d.canvasVisible&&d.sceneReady)};
   });
   row.draws=data.paint.draws.length;row.pass=row.plans.length>0&&row.plans.every(p=>p.flightDraws>0&&p.firstContactPaintMs!==null&&p.allDrawsVisible)&&row.contactCoverage&&!row.errors.length&&!row.blocked.length&&!data.paint.errors.length;
   assert(row.pass,'Ranged paint diagnostic incomplete');
  }catch(error){row.failure=String(error.message).replace(/0x[\da-f]{64,}/gi,'[hash]').slice(0,250);throw error;}
  finally{if(context)await context.close();if(active){await fixture('rollback');row.rollback=true;}save();}
  console.log(JSON.stringify({viewport:row.viewport,plans:row.plans.length,draws:row.draws,pass:row.pass,rollback:row.rollback}));
 }
 assert(unchanged());report.complete=true;
}finally{await browser.close();const bytes=gzipSync(JSON.stringify(rawRows));writeFileSync(raw,bytes);report.events={path:relative(root,raw),sha256:hash(bytes)};save();}
