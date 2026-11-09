import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createRequire} from 'node:module';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=process.env.V5_OUT,artifact=process.env.V5_ARTIFACT;await mkdir(out+'/frames',{recursive:true});
const cases=JSON.parse(await readFile(process.env.V5_REGISTRATION)).filter(r=>!process.env.V5_IDS||process.env.V5_IDS.split(',').includes(r.id));
const followup=process.env.V5_FOLLOWUP?JSON.parse(await readFile(process.env.V5_FOLLOWUP)):[];
const result={sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),speed:4,method:'Real automatic battles via published rules and model.act/tick. No gallery or injected plans. Active semantic windows correlated with exact layer identity, target coordinates and nonzero alpha in renderer instance submissions; each first semantic cell has an actual canvas frame for visual verification. Submission alone is not proof of visible pixels.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
 await page.goto('file://'+artifact+'?dev=1');await page.waitForFunction(()=>window.__depthReview&&window.__v5LiveStart);
 for(const row of cases){
  await page.evaluate(row=>window.__v5LiveStart(row.setup,4),row);
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  await page.evaluate(pins=>{
   window.__liveShapePins=pins;
   const m=window.__depthReview,s=window.__depthScene,e=s.cardEffects;
   window.__liveRows=[];window.__liveCells={};window.__liveFinished=false;window.__liveFrames=0;
   if(!e.__audited){e.__audited=true;e.__submitted=[];e.__lane='body';
    const original=e.render;e.render=function(...args){this.__submitted.length=0;this.__lane='body';return original.apply(this,args)};
    for(const method of ['renderStatusBeats','renderV5Cues','renderAction']){const original=e[method];e[method]=function(...args){const old=this.__lane;this.__lane=method;const value=original.apply(this,args);this.__lane=old;return value};}
    const place=e.place;e.place=function(layer,...args){const before=this.stats.instances;place.call(this,layer,...args);if(this.stats.instances>before)this.__submitted.push({lane:this.__lane,primitive:layer.primitive,layer,x:this.focus.x,z:this.focus.z,alpha:this.pools.get(layer.primitive).alpha.getX(this.pools.get(layer.primitive).mesh.count-1),count:this.stats.instances-before});};
   }
   let previous=null,record=null;const closing=[];
   const tick=()=>{
    window.__liveFrames++;for(let i=closing.length-1;i>=0;i--){const old=closing[i];if(++old.frames>=2){const hidden=getComputedStyle(s.renderer.domElement).visibility==='hidden'||s.renderer.domElement.getBoundingClientRect().width===0;old.record.cleared=e.disposed||!s.renderer.domElement.isConnected||hidden||e.actionFrame?.plan!==old.plan;old.record.clearReason=e.disposed?'disposed':!s.renderer.domElement.isConnected?'detached':hidden?'hidden':'next-render';closing.splice(i,1)}}const plan=m.plan,v=s.view(),p=v.cardPresentation,at=m.animationAt;
    if(plan!==previous&&record){closing.push({record,plan:previous,frames:0});record=null;}
    if(plan&&plan!==previous){previous=plan;record={round:m.battle.round,skill:plan.skillId,actionId:plan.events[0]?.actionId,actor:plan.actorId,duration:plan.duration,frames:0,active:{},received:p?{beats:p.beats,reactions:p.reactions,landings:p.landings}:null};window.__liveRows.push(record);}
    if(plan&&record&&p){record.frames++;
     const cues=[...p.beats.map(b=>({...b,key:'status:'+b.statusId+':'+b.kind,lane:'renderStatusBeats'})),...(p.reactions??[]).map(b=>({...b,key:'reaction:'+b.id,lane:'renderV5Cues'})),...(p.landings??[]).map(b=>({...b,key:'shape:'+b.shape,lane:'renderV5Cues'}))];
     for(const cue of cues){if(at<cue.at||at>=cue.at+cue.duration)continue;const look=window.__v5LiveLooks,expected=cue.statusId?[cue.kind==='burst'?look.burst:look.statuses[cue.statusId]?.[cue.kind==='trigger'?'tick':cue.kind]]:cue.key.startsWith('reaction:')?cue.id==='crumb-burst'?[look.burst]:cue.id==='rupture'?[look.cues.tension,look.cues.thread,look.cues.consumed]:cue.id==='wildfire'?[look.cues.fire,look.cues.ember]:cue.primerIds.map(id=>look.statuses[id]?.flight):cue.shape==='multi-hit'?[look.cues.strike]:[look.cues.splash,look.cues.arc];
      const targets=[cue.targetId,...cue.targets??[]].map(id=>s.positions.get(id)).filter(Boolean);
      const n=e.__submitted.filter(x=>x.lane===cue.lane&&expected.includes(x.layer)&&x.alpha>.002&&targets.some(p=>Math.abs(p.x-x.x)<.001&&Math.abs(p.z-x.z)<.001)).reduce((n,x)=>n+x.count,0);if(!n)continue;record.active[cue.key]=(record.active[cue.key]??0)+1;
      const target=m.battle.actors.find(a=>a.id===cue.targetId),source=m.battle.actors.find(a=>a.id===cue.sourceId);const keys=[cue.key];if(cue.key.startsWith('status:')&&cue.kind==='apply'&&target?.side==='party'&&source?.side==='enemy')keys.push('enemy-'+cue.key);
      for(const key of keys)if(!window.__liveCells[key])window.__liveCells[key]={key,round:record.round,actionId:record.actionId,skill:record.skill,at,target:cue.targetId,submitted:n,frame:s.renderer.domElement.toDataURL('image/png')};
     }
     for(const pin of window.__liveShapePins){
      if(plan.events[0]?.actionId!==pin.actionId||plan.skillId!==pin.skillId||at<plan.beats[2].start||at>=plan.beats[3].start)continue;
      const target=s.positions.get(pin.target),n=e.__submitted.filter(x=>x.lane==='renderAction'&&x.alpha>.002&&target&&Math.abs(target.x-x.x)<.001&&Math.abs(target.z-x.z)<.001).reduce((n,x)=>n+x.count,0);
      if(n){record.active[pin.key]=(record.active[pin.key]??0)+1;if(!window.__liveCells[pin.key])window.__liveCells[pin.key]={key:pin.key,round:record.round,actionId:record.actionId,skill:record.skill,at,target:pin.target,submitted:n,frame:s.renderer.domElement.toDataURL('image/png')};}
     }
     for(const actor of m.visualBattle.actors)for(const status of actor.statuses){const key='active:'+status.id;if(!window.__liveCells[key])window.__liveCells[key]={key,round:record.round,actionId:record.actionId,skill:record.skill,at,target:actor.id,stacks:status.stacks,frame:s.renderer.domElement.toDataURL('image/png')};}
    }
    if(!plan)previous=null;
    if(m.battle?.result&&!m.plan&&!closing.length){window.__liveFinished=true;return;}window.__liveRaf=requestAnimationFrame(tick);
   };m.paused=false;m.notify(false);window.__liveRaf=requestAnimationFrame(tick);
  },followup.filter(p=>p.case===row.id&&p.key.startsWith('shape:')).map(p=>({key:p.key,skillId:p.frame.plan.skillId,target:p.target,actionId:p.frame.plan.events[0].actionId})));
  await page.waitForFunction(()=>window.__liveFinished,null,{timeout:300000});
  const data=await page.evaluate(()=>({plans:window.__liveRows,cells:window.__liveCells,frames:window.__liveFrames,battle:window.__depthReview.battle}));
  for(const [key,cell]of Object.entries(data.cells)){const path='frames/'+row.id+'-'+key.replaceAll(':','-')+'.webp';await sharp(Buffer.from(cell.frame.split(',')[1],'base64')).webp({quality:80}).toFile(out+'/'+path);cell.frame=path;}
  const json=JSON.stringify(data.battle);const hash=createHash('sha256').update(json).digest('hex');delete data.battle;
  result.rows.push({id:row.id,seed:row.seed,sha256:hash,parity:hash===row.sha256,...data});await writeFile(out+'/coverage.json.gz',gzipSync(JSON.stringify(result)));console.log(JSON.stringify({id:row.id,parity:hash===row.sha256,plans:data.plans.length,cells:Object.keys(data.cells)}));
 }
}finally{await browser.close();await writeFile(out+'/coverage.json.gz',gzipSync(JSON.stringify(result)));}
