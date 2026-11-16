/** Two own-art studies: ally sprig rise and ultimate canopy extent. */
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.'),lab='tools/v3craft-lab/v4-teacup-healer';
const round=process.env.ART_DRILL_ROUND||'r1',out=`${lab}/raw/${round}`;
await mkdir(out,{recursive:true});
const manifest=JSON.parse(await readFile(`${lab}/exported/manifest.json`,'utf8'));
const allyManifest=JSON.parse(await readFile('apps/web/public/units/binding-thread/poses/manifest.json','utf8'));
const enemyManifest=JSON.parse(await readFile('apps/web/public/units/panko/poses/manifest.json','utf8'));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs${root}/${lab}/drill.html`);
 await page.evaluate(async({root,lab,manifest,allyManifest,enemyManifest})=>{
  const T=await import(`/@fs${root}/apps/web/node_modules/three/build/three.module.js`);
  const {TeaBlossoms}=await import(`/@fs${root}/${lab}/tea-blossoms.ts`);
  const W=1280,H=720,scene=new T.Scene();
  const camera=new T.OrthographicCamera(-W/2,W/2,H,0,-100,100);camera.position.z=10;
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
  document.body.append(renderer.domElement);
  const background=new T.Color('#302a34'),group=new T.Group();
  group.position.set(-W/2,H,0);group.scale.set(1,-1,1);group.renderOrder=10;scene.add(group);
  const floor=new T.Mesh(new T.PlaneGeometry(W,120),new T.MeshBasicMaterial({color:'#574538'}));
  floor.position.set(W/2,660,-2);group.add(floor);
  const load=async(url)=>{const im=new Image();im.src=url;await im.decode();const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
  const home={x:1010,y:620},allyHome={x:720,y:620},enemyHome={x:260,y:620};
  const scale=225/manifest.opaqueHeight,allyScale=225/allyManifest.opaqueHeight,enemyScale=225/enemyManifest.opaqueHeight;
  const actor=async(m,key,pos,s,url)=>{
   const tex=await load(url),mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:tex,transparent:true,depthTest:false,depthWrite:false}));
   mesh.position.set(pos.x+(m.canvas[0]/2-m.baseline[0])*s,pos.y+(m.canvas[1]/2-m.baseline[1])*s,0);
   mesh.scale.set(m.canvas[0]*s,-m.canvas[1]*s,1);mesh.renderOrder=10;group.add(mesh);return mesh;
  };
  const poses={};for(const key of ['K0','K1','K2','K4'])poses[key]=await actor(manifest,key,home,scale,`/@fs${root}/${lab}/exported/${key}.webp`);
  await actor(allyManifest,'K0',allyHome,allyScale,'/units/binding-thread/poses/K0.webp');
  await actor(enemyManifest,'K0',enemyHome,enemyScale,'/units/panko/poses/K0.webp');
  const socket=key=>{const p=manifest.poses[key].sockets.vfxOrigin;return{x:home.x+(p[0]-manifest.baseline[0])*scale,y:home.y+(p[1]-manifest.baseline[1])*scale};};
  const face=(m,key,pos,s)=>{const f=m.poses[key].face;return{x:pos.x+(f[0]-m.baseline[0])*s,y:pos.y+(f[1]-m.baseline[1])*s,width:f[2]*s,height:f[3]*s};};
  const variants={compact:{rise:60,canopyWidth:880,canopyHeight:440},broad:{rise:120,canopyWidth:1100,canopyHeight:550},selected:{rise:60,canopyWidth:920,canopyHeight:610}};
  const effects={};for(const [name,tuning]of Object.entries(variants)){
   const e=new TeaBlossoms({...tuning,textureRoot:`/@fs${root}/${lab}/exported`});await e.ready;scene.add(e.ground,e.rear,e.front);effects[name]=e;
  }
  window.drill={render(ms,ultimate,variant,reducedMotion=false){
   const key=ultimate?(ms<50?'K0':ms<300?'K1':ms<2000?'K2':'K0'):(ms<50?'K0':ms<330?'K1':ms<500?'K2':'K0');
   for(const[k,m]of Object.entries(poses))m.visible=k===key;
   for(const e of Object.values(effects))e.hide();
   const effect=effects[variant],source=socket(key),feet=ultimate?[allyHome,home]:[allyHome];
   const faces=[face(manifest,key,home,scale),face(allyManifest,'K0',allyHome,allyScale),face(enemyManifest,'K0',enemyHome,enemyScale)];
   effect.render({elapsed:ms,ultimate,width:W,height:H,worldWidth:W,worldHeight:H,source,home,casterFeet:home,
    layoutSource:home,targets:feet.map(p=>({x:p.x,y:p.y-100})),feet,faces,rearOrder:9,frontOrder:11,reducedMotion});
   group.visible=false;scene.background=null;renderer.setClearColor(0,0);renderer.render(scene,camera);
   const gl=renderer.getContext(),pixels=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let area=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)area++;
   const faceCoverage=faces.map(f=>{let total=0,covered=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){total++;if(pixels[((H-1-y)*W+x)*4+3]>=128)covered++;}return total?covered/total:0;});
   group.visible=true;scene.background=background;renderer.render(scene,camera);scene.updateMatrixWorld(true);
   const tip=effect.glint.localToWorld(new T.Vector3(.42732919254658386-.5,.5-.998046875,0)).project(camera);
   const tipScreen={x:(tip.x*.5+.5)*W,y:(.5-tip.y*.5)*H};
   return{ms,ultimate,variant,reducedMotion,key,home,allyHome,enemyHome,areaFraction:area/(W*H),faceCoverage,
    paintedSocketError:effect.glint.visible?Math.hypot(tipScreen.x-source.x,tipScreen.y-source.y):null,
    audit:structuredClone(effect.audit),recipientIds:ultimate?['allied-binding','caster']:['allied-binding']};
  }};
 },{root,lab,manifest,allyManifest,enemyManifest});
 const rows=[];
 for(const variant of ['compact','broad','selected'])for(const ultimate of [false,true]){
  const times=ultimate?[600,850,1000,1100,1250,1500,1900,2200]:[50,200,300,350,450,600,700,800];
  for(const ms of times){rows.push(await page.evaluate(p=>window.drill.render(p.ms,p.ultimate,p.variant),{ms,ultimate,variant}));await page.screenshot({path:`${out}/${variant}-${ultimate?'ultimate':'basic'}-${ms}.png`});}
 }
 rows.push(await page.evaluate(()=>window.drill.render(1250,true,'broad',true)));
 await writeFile(`${lab}/drill-${round}.json`,JSON.stringify({at:new Date().toISOString(),errors,rows,scope:'Own-art lab only; routing and film acceptance require production evidence.'},null,2)+'\n');
 console.log(JSON.stringify({errors,variants:['compact','broad','selected'].map(variant=>({variant,
  peakUltimate:Math.max(...rows.filter(r=>r.variant===variant&&r.ultimate).map(r=>r.areaFraction)),
  maxFaceCoverage:Math.max(...rows.filter(r=>r.variant===variant).flatMap(r=>r.faceCoverage)),
  maxSocketError:Math.max(...rows.filter(r=>r.variant===variant&&r.paintedSocketError!==null).map(r=>r.paintedSocketError))}))}));
}finally{await browser.close();}
