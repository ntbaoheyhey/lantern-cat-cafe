/** A3 own-content flight drill; alternate modules leave production immutable. */
import {writeFile,mkdir} from 'node:fs/promises';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const out='tools/v3craft-lab/v4-soot/raw';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview;
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  m.paused=false;
  for(let i=0;i<100;i++){if(!m.plan)m.step();if(m.plan?.actorId==='soot'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}
  if(m.plan?.actorId!=='soot')throw Error('Soot basic unavailable');
  m.paused=true;m.animationAt=200;s.render({...s.view(),paused:true,fixedTime:10.2},0);
  const source=s.socket('soot','vfxOrigin'),actor=s.actors.get('soot'),p=actor.craftPose.socketFor('K2','vfxOrigin');
  const release=s.screen(actor.actor.root.localToWorld(new T.Vector3(p.x,p.y,1)));
  const targetId=m.plan.events.find(e=>e.actorId==='soot'&&e.type==='damage')?.targetIds[0];
  const home=s.homes.get(targetId).point,target={x:home.x,y:home.y-home.core*.42};
  const orders=[...s.actors.values()].map(e=>e.actor.root.renderOrder);
  s.craftBasic.hide();s.craft.hide();s.effects.canvas.style.visibility='hidden';
  const rows=[],images={};
  for(const duration of [150,200]){
   const {StaffBolt}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-lab/v4-soot/bolt-'+duration+'.ts');
   const bolt=new StaffBolt();s.scene.add(bolt.rear,bolt.front,bolt.ground);
   for(const ms of [150,166.667,200,233.333,250,266.667,300,333.333,350,400,450]){
    bolt.render({elapsed:ms,width:s.width,height:s.height,worldWidth:s.worldWidth,worldHeight:1950,
     source,windupSource:source,releaseSource:release,targets:[target],feet:[home],
     faces:[...s.actors.values()].map(e=>s.faceBounds(e)),rearOrder:Math.min(...orders)-.5,frontOrder:Math.max(...orders)+1,reducedMotion:false});
    const lance=bolt.layers.find(l=>l.role==='travelling-lance').mesh;
    const vertices=lance.geometry.attributes.position.array;
    rows.push({duration,ms,alpha:lance.material.uniforms.uAlpha.value,head:[vertices[vertices.length-3],vertices[vertices.length-2]],tail:[vertices[0],vertices[1]],target,source});
    if([233.333,266.667,333.333].includes(ms)){
     s.renderer.setRenderTarget(null);s.renderer.clear();s.renderer.render(s.scene,s.camera);
     images[duration+'-'+ms]=s.renderer.domElement.toDataURL();
    }
   }
   bolt.dispose();
  }
  return{rows,images,source,release,target,targetId};
 });
 for(const [key,data]of Object.entries(result.images))await writeFile(`${out}/travel-${key}.png`,Buffer.from(data.split(',')[1],'base64'));
 delete result.images;
 await writeFile('tools/v3craft-lab/v4-soot/travel-drill.json',JSON.stringify({at:new Date().toISOString(),scope:'Isolated150/200ms effect drill on current own-art field; no film acceptance',errors,...result},null,2)+'\n');
 console.log(JSON.stringify({errors,source:result.source,target:result.target,samples:result.rows.length}));
}finally{await browser.close();}
