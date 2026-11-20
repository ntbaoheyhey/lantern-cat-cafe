// Q3B-X05: compare rest/root and transported face regions with posed mesh vertices.
// Original Soot only; no recorder changes or acceptance threshold changes.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/face-transport';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const {unitFace}=await import('/src/game/cardrpg/stage/core.ts');
   const entry=s.actors.get('soot'),actor=entry.actor,pose=entry.craftPose,mesh=pose.mesh,region=unitFace('soot',actor.bounds),v={...s.view(),fixedTime:10,paused:true};
   mesh.pose(0,'');const rest={...mesh.skeleton.findBone('head')},det=rest.a*rest.d-rest.b*rest.c;
   const local=p=>({x:(rest.d*(p.x-rest.worldX)-rest.b*(p.y-rest.worldY))/det,y:(-rest.c*(p.x-rest.worldX)+rest.a*(p.y-rest.worldY))/det});
   const points=[];
   for(const batch of pose.batches)for(let i=0;i<batch.setup.length;i+=3){const x=batch.setup[i],y=batch.setup[i+1];if(batch.parts[i/3].name==='head'&&x>=region.x&&x<=region.x+region.width&&y>=region.y&&y<=region.y+region.height)points.push({batch,i,setup:{x,y},local:local({x,y})});}
   if(points.length<4)throw Error('Face region has too few mesh samples');
   const corners=[{x:region.x,y:region.y},{x:region.x+region.width,y:region.y},{x:region.x,y:region.y+region.height},{x:region.x+region.width,y:region.y+region.height}];
   const project=p=>s.screen(actor.root.localToWorld(new T.Vector3(p.x,p.y,0)));
   const box=ps=>{const x=Math.min(...ps.map(p=>p.x)),y=Math.min(...ps.map(p=>p.y));return{x,y,width:Math.max(...ps.map(p=>p.x))-x,height:Math.max(...ps.map(p=>p.y))-y};};
   const contains=(b,p)=>p.x>=b.x-.001&&p.y>=b.y-.001&&p.x<=b.x+b.width+.001&&p.y<=b.y+b.height+.001;
   const rows=[],images={};
   for(const [clip,total,times]of [['attack',800,[0,150,225,250,350,400,425,530,650,800]],['ult',2200,[0,440,600,800,960,1100,1150,1175,1360,1720,2200]]])for(const ms of times){
    s.render({...v,model:{clip},modelProgress:ms/total},0);s.craft.hide();s.craftBasic.hide();
    const head=mesh.skeleton.findBone('head'),socket=actor.sockets.get('head'),bone=actor.boneRefs.get('head'),shift={x:socket.position.x-bone.worldX,y:socket.position.y-bone.worldY};
    const transport=p=>{const q=local(p);return{x:head.worldX+head.a*q.x+head.b*q.y+shift.x,y:head.worldY+head.c*q.x+head.d*q.y+shift.y};};
    const a=box(corners.map(project)),b=box(corners.map(p=>project(transport(p))));let oldMiss=0,newMiss=0,oldResidual=0,newResidual=0;
    for(const p of points){const positions=p.batch.geometry.attributes.position.array,actual=project({x:positions[p.i],y:positions[p.i+1]}),old=project(p.setup),now=project(transport(p.setup));oldMiss+=!contains(a,actual);newMiss+=!contains(b,actual);oldResidual=Math.max(oldResidual,Math.hypot(old.x-actual.x,old.y-actual.y));newResidual=Math.max(newResidual,Math.hypot(now.x-actual.x,now.y-actual.y));}
    rows.push({clip,ms,setupRect:a,transportedRect:b,samples:points.length,restMethod:{outside:oldMiss,maxResidualPx:oldResidual},transportedMethod:{outside:newMiss,maxResidualPx:newResidual}});
    if([225,350,600,1100,1360].includes(ms)){s.renderer.setRenderTarget(null);s.renderer.clear();s.renderer.render(s.scene,s.camera);images[clip+'-'+ms]=s.renderer.domElement.toDataURL();}
   }
   return{region,headRest:rest,rows,images,scope:'Calibrated face-region mesh samples, not texture-pixel mask or full Q2 acceptance.'};
  });
  for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${width}-${name}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;
  results.push({width,height,errors,...result});console.log(JSON.stringify({width,errors,samples:result.rows[0].samples,oldMax:Math.max(...result.rows.map(r=>r.restMethod.maxResidualPx)),newMax:Math.max(...result.rows.map(r=>r.transportedMethod.maxResidualPx)),oldOutside:Math.max(...result.rows.map(r=>r.restMethod.outside)),newOutside:Math.max(...result.rows.map(r=>r.transportedMethod.outside))}));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/face-transport-study.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
}finally{await browser.close();}
