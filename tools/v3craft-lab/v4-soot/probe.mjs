/** A3 production socket/seek check. Uses established fixture; no recorder changes. */
import {writeFile} from 'node:fs/promises';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const cases=[];
try{
 for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture);
  const value=await page.evaluate(async()=>{
   const s=window.__depthScene,m=window.__depthReview;
   const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   m.paused=false;
   for(let i=0;i<100;i++){if(!m.plan)m.step();if(m.plan?.actorId==='soot'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}
   if(m.plan?.actorId!=='soot')throw Error('No Soot basic');m.paused=true;
   const entry=s.actors.get('soot'),rows=[];
   for(const reduced of [false,true])for(const ms of [200,233.333,266.667,300,333.333,350,400,439,500,559,600,799,200,300]){
    m.animationAt=ms;s.render({...s.view(),paused:true,fixedTime:10+ms/1000,reducedMotion:reduced},0);
    const d=entry.craftPose.drawing,p=d.point(d.set.manifest.baseline);
    const foot=s.screen(entry.actor.root.localToWorld(new T.Vector3(p.x,p.y,1)));
    const socket=s.socket('soot','vfxOrigin'),bolt=s.craftBasic,a=bolt.audit,lance=bolt.layers.find(l=>l.role==='travelling-lance').mesh;
    rows.push({reduced,ms,key:d.key,foot,socket,launch:{...a.launch},socketError:ms===200?Math.hypot(socket.x-a.launch.x,socket.y-a.launch.y):null,lanceVisible:lance.visible,lanceAlpha:lance.material.uniforms.uAlpha.value,vertices:Array.from(lance.geometry.attributes.position.array).filter((_,i)=>i%16===0)});
   }
   return{rows,plan:{actor:m.plan.actorId,duration:m.plan.duration,impact:m.plan.beats[2].start}};
  });cases.push({fixture:fixture.id,errors,...value});await page.close();
 }
}finally{await browser.close();}
await writeFile('reports/v4-art/REVIEW/A3/socket-probe.json',JSON.stringify({at:new Date().toISOString(),scope:'live production samples, not encoded-film acceptance',cases},null,2)+'\n');
console.log(JSON.stringify(cases.map(c=>({fixture:c.fixture,errors:c.errors,impact:c.plan.impact,maxSocketError:Math.max(...c.rows.map(r=>r.socketError??0)),launchVariation:Math.max(...c.rows.filter(r=>!r.reduced).map(r=>Math.hypot(r.launch.x-c.rows[0].launch.x,r.launch.y-c.rows[0].launch.y))),footDrift:Math.max(...c.rows.map(r=>Math.hypot(r.foot.x-c.rows[0].foot.x,r.foot.y-c.rows[0].foot.y))),visibleFlightSamples:c.rows.filter(r=>!r.reduced&&r.ms>200&&r.ms<350&&r.lanceVisible).length}))))
