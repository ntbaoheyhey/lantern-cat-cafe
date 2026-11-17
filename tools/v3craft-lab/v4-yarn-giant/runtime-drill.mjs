/** Two boss-scale original-art drills before production integration. */
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.'),lab='tools/v3craft-lab/v4-yarn-giant',round=process.env.ART_DRILL_ROUND||'r1',out=`${lab}/raw/${round}`;
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(`${lab}/exported/manifest.json`,'utf8'));
const fx=JSON.parse(await readFile(`${lab}/fx-export.json`,'utf8'));
const targetManifest=JSON.parse(await readFile('apps/web/public/units/panko/poses/manifest.json','utf8'));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs${root}/${lab}/drill.html`);
 await page.evaluate(async({root,lab,manifest,targetManifest,fx})=>{
  const T=await import(`/@fs${root}/apps/web/node_modules/three/build/three.module.js`);
  const {YarnSurge}=await import(`/@fs${root}/${lab}/yarn-surge.ts`);
  const {drawingAt}=await import(`/@fs${root}/apps/web/src/game/rig/drawing-layer.ts`);
  const {meleeContact,meleeRoot}=await import(`/@fs${root}/apps/web/src/game/cardrpg/battle-v3/class-motion.ts`);
  const W=1280,H=720,scene=new T.Scene(),camera=new T.OrthographicCamera(-W/2,W/2,H,0,-100,100);
  camera.position.z=10;const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
  const background=new T.Color('#302a34'),group=new T.Group();group.position.set(-W/2,H,0);group.scale.set(1,-1,1);group.renderOrder=10;scene.add(group);
  const floor=new T.Mesh(new T.PlaneGeometry(W,120),new T.MeshBasicMaterial({color:'#574538'}));floor.position.set(W/2,660,-2);group.add(floor);
  const load=async(url)=>{const im=new Image();im.src=url;await im.decode();const tex=new T.Texture(im);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;return tex;};
  const actorScale=324/manifest.opaqueHeight,targetScale=225/targetManifest.opaqueHeight;
  const home={x:925,y:620,core:324},targetHome={x:300,y:620,core:225},poses={};
  for(const key of ['K0','K1','K2','K4','K5']){
   const texture=await load(`/@fs${root}/${lab}/exported/${key}.webp`);
   const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
   mesh.scale.set(manifest.canvas[0]*actorScale,-manifest.canvas[1]*actorScale,1);mesh.renderOrder=10;group.add(mesh);poses[key]=mesh;
  }
  const target=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:await load('/units/panko/poses/K0.webp'),transparent:true,depthTest:false,depthWrite:false}));
  target.position.set(targetHome.x+(targetManifest.canvas[0]/2-targetManifest.baseline[0])*targetScale,targetHome.y+(targetManifest.canvas[1]/2-targetManifest.baseline[1])*targetScale,0);
  target.scale.set(targetManifest.canvas[0]*targetScale,-targetManifest.canvas[1]*targetScale,1);target.renderOrder=10;group.add(target);
  const face=(m,key,pos,scale)=>{const f=m.poses[key].face;return{x:pos.x+(f[0]-m.baseline[0])*scale,y:pos.y+(f[1]-m.baseline[1])*scale,width:f[2]*scale,height:f[3]*scale};};
  const targetBounds=targetManifest.poses.K0.opaqueBounds;
  const targetLeft=targetHome.x+(targetBounds[0]-targetManifest.baseline[0])*targetScale,targetRight=targetHome.x+(targetBounds[2]-targetManifest.baseline[0])*targetScale;
  const reach=(manifest.baseline[0]-manifest.poses.K2.opaqueBounds[0])*actorScale;
  const contact=meleeContact(home,{...targetHome,x:(targetLeft+targetRight)/2},reach,(targetRight-targetLeft)/2,-1,8);
  const effects={};for(const [name,width]of [['compact',1040],['broad',1180]]){const e=new YarnSurge({width,height:width*.4,textureUrl:`/@fs${root}/${lab}/textures/braid-wave.webp`,tip:fx.tipUv});await e.ready;scene.add(e.ground,e.rear,e.front);effects[name]=e;}
  window.drill={render(ms,ultimate,variant,hit=false,reduced=false){
   const key=hit?'K4':!ultimate&&!reduced&&ms>=270&&ms<330?'K2':drawingAt(ultimate?'ult':'attack',ms/1000);
   const actionReach=(manifest.baseline[0]-manifest.poses[ultimate?'K5':'K2'].opaqueBounds[0])*actorScale;
   const actionContact=meleeContact(home,{...targetHome,x:(targetLeft+targetRight)/2},actionReach,(targetRight-targetLeft)/2,-1,8);
   const movement=hit?{x:0,y:0}:meleeRoot(ms,ultimate,home,actionContact,0,0),position={x:home.x+movement.x,y:home.y+movement.y};
   for(const [k,m]of Object.entries(poses)){m.visible=k===key;m.position.set(position.x+(manifest.canvas[0]/2-manifest.baseline[0])*actorScale,position.y+(manifest.canvas[1]/2-manifest.baseline[1])*actorScale,0);}
   const socket=manifest.poses[key].sockets.vfxOrigin,source={x:position.x+(socket[0]-manifest.baseline[0])*actorScale,y:position.y+(socket[1]-manifest.baseline[1])*actorScale};
   const faces=[face(manifest,key,position,actorScale),face(targetManifest,'K0',targetHome,targetScale)];
   for(const e of Object.values(effects))e.hide();const effect=effects[variant];
   effect.render({elapsed:ms,ultimate,width:W,height:H,worldWidth:W,worldHeight:H,source,layoutSource:home,home,casterFeet:position,targets:[{x:targetHome.x,y:targetHome.y-100}],feet:[targetHome],faces,rearOrder:9,frontOrder:11,reducedMotion:reduced});if(hit)effect.hide();
   group.visible=false;scene.background=null;renderer.setClearColor(0,0);renderer.render(scene,camera);
   const gl=renderer.getContext(),pixels=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let area=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)area++;
   const faceCoverage=faces.map(f=>{let total=0,covered=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){total++;if(pixels[((H-1-y)*W+x)*4+3]>=128)covered++;}return total?covered/total:0;});
   group.visible=true;scene.background=background;renderer.render(scene,camera);scene.updateMatrixWorld(true);
   const painted=effect.cut.localToWorld(new T.Vector3(fx.tipUv[0]-.5,.5-fx.tipUv[1],0)).project(camera);
   const tip={x:(painted.x*.5+.5)*W,y:(.5-painted.y*.5)*H},box=manifest.poses[key].opaqueBounds;
   return{ms,ultimate,variant,key,hit,reduced,home,position,contact:actionContact,approachPixels:Math.hypot(movement.x,movement.y),returnError:ms>=(ultimate?2200:800)?Math.hypot(movement.x,movement.y):null,
    contactGap:(key==='K2'||key==='K5')?position.x+(box[0]-manifest.baseline[0])*actorScale-targetRight:null,
    areaFraction:area/(W*H),faceCoverage,audit:structuredClone(effect.audit),paintedTipError:effect.cut.visible?Math.hypot(tip.x-source.x,tip.y-source.y):null};
  }};
 },{root,lab,manifest,targetManifest,fx});
 const rows=[];
 for(const variant of ['compact','broad'])for(const ultimate of [false,true]){
  const times=ultimate?[0,599,600,850,1000,1100,1250,1500,1900,2200]:[0,100,200,270,300,350,440,560,700,800];
  for(const ms of times){rows.push(await page.evaluate(({ms,ultimate,variant})=>window.drill.render(ms,ultimate,variant),{ms,ultimate,variant}));
   if((ultimate?[850,1100]:[200,350]).includes(ms))await page.screenshot({path:`${out}/${variant}-${ultimate?'ultimate':'basic'}-${ms}.png`});}
 }
 rows.push(await page.evaluate(()=>window.drill.render(1100,true,'broad',false,true)));
 rows.push(await page.evaluate(()=>window.drill.render(130,false,'broad',true)));
 await page.screenshot({path:`${out}/K4-130.png`});
 const result={at:new Date().toISOString(),round,errors,rows,scope:'Isolated own-art WebGL; boss324px/cat225px; basic200ms approach/350impact/800return; ultimate600–1000 approach/1100impact/2200return; actor group order10 protects bodies behind rear fan. Production film gates remain pending.'};
 await writeFile(`${lab}/drill-${round}.json`,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({errors,variants:['compact','broad'].map(variant=>({variant,peakUltimate:Math.max(...rows.filter(r=>r.variant===variant&&r.ultimate).map(r=>r.areaFraction)),maxFaceCoverage:Math.max(...rows.filter(r=>r.variant===variant).flatMap(r=>r.faceCoverage)),paintedTipError:Math.max(...rows.filter(r=>r.variant===variant&&r.paintedTipError!==null).map(r=>r.paintedTipError)),returnError:Math.max(...rows.filter(r=>r.variant===variant&&r.returnError!==null).map(r=>r.returnError))}))}));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
