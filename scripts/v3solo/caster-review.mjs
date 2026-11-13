/** Original caster poses, with plate camera/scale/translation removed. */
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '../v3a2/browser-fixture.mjs';
import {root,evidenceMeta} from '../v3a2/check-gates.mjs';
const label=process.argv[2]??'baseline';
if(!/^[a-zA-Z0-9-]+$/.test(label))throw Error('Invalid label');
const out=resolve(root,'reports/v3-solo/Q7',label+'-casters');await mkdir(out,{recursive:true});
const ids=(await readdir(resolve(root,'tools/cinematic-compositor/plates'))).filter(p=>p.endsWith('.json')).map(p=>p.slice(0,-5));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5990/@fs'+resolve(root,'tools/cinematic-compositor/index.html'));
 await page.waitForLoadState('networkidle');
 await page.waitForFunction(()=>window.compositor,null,{timeout:60000});
 await page.evaluate(async root=>{
  const {T}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/compositor-deps.ts');
  const {loadSpineActor}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/spine/assets.ts');
  const {retimedClipTime}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/spine/events.ts');
  const {preparePlateCaster}=await import('/@fs'+root+'/tools/cinematic-compositor/caster-rig.ts');
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(1280,720);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-640,640,720,0,.1,2000);camera.position.z=1000;
  window.__q7Caster={T,loadSpineActor,retimedClipTime,preparePlateCaster,renderer,scene,camera};
 },root);
 const rows=[];
 for(const id of ids){
  const spec=JSON.parse(await readFile(resolve(root,'tools/cinematic-compositor/plates',id+'.json'),'utf8'));
  const core=JSON.parse(await readFile(resolve(root,'art/units',spec.unit,'core.json'),'utf8'));
  const info=await page.evaluate(async({spec,core,label})=>{
   const q=window.__q7Caster;q.actor?.dispose();q.actor=await q.loadSpineActor(spec.unit);q.scene.add(q.actor.root);q.actor.setOrder(2);
   const motion=label==='baseline'?null:q.preparePlateCaster(q.actor);
   // Same authored clip and release retiming as the live plate. A fixed root
   // removes its entrance whip, camera pan, zoom, tilt and scale growth.
   q.actor.root.scale.setScalar(360/core.world.height);q.actor.root.position.set(0,80,0);q.actor.root.rotation.z=0;
   q.name=q.actor.clips.has('ultimate')?'ultimate':'ult';q.duration=q.actor.duration(q.name);
   const cues=q.actor.cues(q.name);q.release=cues.find(c=>c.name==='ult_release'&&!c.fallback)?.time??cues.find(c=>c.name==='hit'&&!c.fallback)?.time??q.duration*.55;
   q.spec=spec;return {source:q.actor.source,clip:q.name,duration:q.duration,release:q.release,motion};
  },{spec,core,label});
  const frames=[];
  for(const frame of [12,35,54]){
   const image=await page.evaluate(frame=>{
    const q=window.__q7Caster,actor=q.actor;if(actor.mesh)actor.mesh.proceduralTime=frame/30;
    const time=q.retimedClipTime(frame/(q.spec.frames-1),q.duration,q.release,54/(q.spec.frames-1));
    actor.sample(q.name,q.spec.id,time,0,q.camera,false);q.renderer.render(q.scene,q.camera);
    return {png:q.renderer.domElement.toDataURL('image/png'),time};
   },frame);
   const path=resolve(out,id+'-'+frame+'.png'),bytes=Buffer.from(image.png.split(',')[1],'base64');await writeFile(path,bytes);
   frames.push({frame,time:image.time,path:path.slice(root.length+1),sha256:createHash('sha256').update(bytes).digest('hex')});
  }
  rows.push({id,...info,frames});console.log(id,info.source);
 }
 const report={_meta:evidenceMeta(),method:'Exact plate clip and release mapping; original cutout actor on transparent canvas at fixed root, angle and360px semantic body height. No plate camera or glow. Translation-registered silhouette IoU removes remaining whole-actor travel.',rows,errors};
 await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2)+'\n');
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
