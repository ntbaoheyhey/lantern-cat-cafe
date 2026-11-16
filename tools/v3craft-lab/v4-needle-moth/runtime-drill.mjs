/** Compare original Needle art/effects before modifying the production scene. */
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.'),lab='tools/v3craft-lab/v4-needle-moth',out=`${lab}/raw/${process.env.ART_DRILL_ROUND||'runtime'}`;
const tuning={count:Number(process.env.ART_NEEDLE_COUNT??18),length:Number(process.env.ART_NEEDLE_LENGTH??520),spread:Number(process.env.ART_NEEDLE_SPREAD??850)};
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
 await page.evaluate(async({root,lab,manifest,targetManifest,fx,tuning})=>{
  const T=await import(`/@fs${root}/apps/web/node_modules/three/build/three.module.js`);
  const {NeedleStitches}=await import(`/@fs${root}/${lab}/needle-stitches.ts`);
  const W=1280,H=720,scene=new T.Scene(),camera=new T.OrthographicCamera(-W/2,W/2,H,0,-100,100);
  camera.position.z=10;const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
  const background=new T.Color('#302a34'),group=new T.Group();group.position.set(-W/2,H,0);group.scale.set(1,-1,1);group.renderOrder=10;scene.add(group);
  const floor=new T.Mesh(new T.PlaneGeometry(1280,120),new T.MeshBasicMaterial({color:'#574538'}));floor.position.set(640,660,-2);group.add(floor);
  const load=async(url)=>{const im=new Image();im.src=url;await im.decode();const tex=new T.Texture(im);tex.colorSpace=T.SRGBColorSpace;tex.needsUpdate=true;return tex;};
  const actorScale=225/manifest.opaqueHeight,targetScale=225/targetManifest.opaqueHeight;
  const home={x:925,y:620},targetHome={x:375,y:620};
  const poses={};for(const key of ['K0','K1','K2','K4']){
   const texture=await load(`/@fs${root}/${lab}/exported/${key}.webp`);
   const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false}));
   mesh.position.set(home.x+(manifest.canvas[0]/2-manifest.baseline[0])*actorScale,home.y+(manifest.canvas[1]/2-manifest.baseline[1])*actorScale,0);
   mesh.scale.set(manifest.canvas[0]*actorScale,-manifest.canvas[1]*actorScale,1);mesh.renderOrder=10;group.add(mesh);poses[key]=mesh;
  }
  const targetTex=await load('/units/panko/poses/K0.webp');
  const target=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:targetTex,transparent:true,depthTest:false,depthWrite:false}));
  target.position.set(targetHome.x+(targetManifest.canvas[0]/2-targetManifest.baseline[0])*targetScale,targetHome.y+(targetManifest.canvas[1]/2-targetManifest.baseline[1])*targetScale,0);
  target.scale.set(targetManifest.canvas[0]*targetScale,-targetManifest.canvas[1]*targetScale,1);target.renderOrder=10;group.add(target);
  const socket=(key)=>{const p=manifest.poses[key].sockets.vfxOrigin;return{x:home.x+(p[0]-manifest.baseline[0])*actorScale,y:home.y+(p[1]-manifest.baseline[1])*actorScale};};
  const face=(m,key,pos,scale)=>{const f=m.poses[key].face;return{x:pos.x+(f[0]-m.baseline[0])*scale,y:pos.y+(f[1]-m.baseline[1])*scale,width:f[2]*scale,height:f[3]*scale};};
  const effects={};for(const travel of [150,250]){const e=new NeedleStitches({travel,spread:tuning.spread+(travel===250?90:0),length:tuning.length,count:tuning.count,textureUrl:`/@fs${root}/${lab}/textures/sewing-needle.webp`,aspect:fx.dimensions[1]/fx.dimensions[0],tip:fx.tipUv});await e.ready;scene.add(e.ground,e.rear,e.front);effects[travel]=e;}
  window.drill={render(ms,ultimate,travel,hit=false){
   const key=hit?'K4':ultimate?(ms<50?'K0':ms<300?'K1':ms<2000?'K2':'K0'):(ms<50?'K0':ms<330?'K1':ms<500?'K2':'K0');
   for(const [k,m]of Object.entries(poses))m.visible=k===key;
   for(const e of Object.values(effects))e.hide();
   const effect=effects[travel],faces=[face(manifest,key,home,actorScale),face(targetManifest,'K0',targetHome,targetScale)];
   const t={x:targetHome.x,y:targetHome.y-100};
   effect.render({elapsed:ms,ultimate,width:W,height:H,worldWidth:W,worldHeight:H,source:socket(key),windupSource:socket('K1'),releaseSource:socket('K2'),layoutSource:home,targets:[t],feet:[targetHome],faces,rearOrder:9,frontOrder:11,reducedMotion:false});
   if(hit)effect.hide();
   // Read the rendered alpha, with only this effect visible, for area/face evidence.
   group.visible=false;scene.background=null;renderer.setClearColor(0,0);renderer.render(scene,camera);
   const gl=renderer.getContext(),pixels=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let area=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)area++;
   const faceCoverage=faces.map(f=>{let total=0,covered=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){total++;if(pixels[((H-1-y)*W+x)*4+3]>=128)covered++;}return total?covered/total:0;});
   group.visible=true;scene.background=background;renderer.render(scene,camera);scene.updateMatrixWorld(true);
   const head=effect.needle.localToWorld(new T.Vector3(fx.tipUv[0]-.5,.5-fx.tipUv[1],0)).project(camera);
   const visibleHead={x:(head.x*.5+.5)*W,y:(.5-head.y*.5)*H};
   return{ms,ultimate,travel,key,hit,home,areaFraction:area/(W*H),faceCoverage,audit:structuredClone(effect.audit),paintedHeadError:Math.hypot(visibleHead.x-effect.audit.head.x,visibleHead.y-effect.audit.head.y)};
  }};
 },{root,lab,manifest,targetManifest,fx,tuning});
 const rows=[];
 for(const travel of [150,250])for(const ultimate of [false,true]){
  const times=ultimate?[600,850,950,1050,1100,1250,1500,1900]:[50,100,200,250,300,350,450,800];
  for(const ms of times){const row=await page.evaluate(({ms,ultimate,travel})=>window.drill.render(ms,ultimate,travel),{ms,ultimate,travel});rows.push(row);await page.screenshot({path:`${out}/${travel}-${ultimate?'ultimate':'basic'}-${ms}.png`});}
 }
 rows.push(await page.evaluate(()=>window.drill.render(130,false,150,true)));
 await page.screenshot({path:`${out}/K4-130.png`});
 const result={at:new Date().toISOString(),tuning,errors,rows,scope:'Isolated own-art renderer; production role/film gates remain pending.'};
 await writeFile(`${lab}/drill.json`,JSON.stringify(result,null,2)+'\n');
 await writeFile(`${lab}/drill-${process.env.ART_DRILL_ROUND||'runtime'}.json`,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({errors,variants:[150,250].map(travel=>({travel,peakUltimate:Math.max(...rows.filter(r=>r.travel===travel&&r.ultimate).map(r=>r.areaFraction)),maxFaceCoverage:Math.max(...rows.filter(r=>r.travel===travel).flatMap(r=>r.faceCoverage)),paintedHeadError:Math.max(...rows.filter(r=>r.travel===travel&&r.audit.flight).map(r=>r.paintedHeadError))}))}));
}finally{await browser.close();}
