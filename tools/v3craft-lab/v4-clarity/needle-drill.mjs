/** Compare90ms and150ms needle rank accents before production promotion. */
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('.'),lab='tools/v3craft-lab/v4-clarity',out=`${lab}/raw/needle-drills-r2`;
await mkdir(out,{recursive:true});
const units=[['needle-moth',1010,620],['mochi',360,620],['panko',600,620]];
const manifests=Object.fromEntries(await Promise.all(units.map(async([id])=>[id,JSON.parse(await readFile(`apps/web/public/units/${id}/poses/manifest.json`,'utf8'))])));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs${root}/${lab}/drill.html`);
 await page.evaluate(async({root,lab,units,manifests})=>{
  const T=await import(`/@fs${root}/apps/web/node_modules/three/build/three.module.js`);
  const {NeedleStitches:Candidate}=await import(`/@fs${root}/${lab}/needle-stitches-candidate.ts`);
  const {drawingAt}=await import('/src/game/rig/drawing-layer.ts');
  const W=1280,H=720,scene=new T.Scene(),camera=new T.OrthographicCamera(-W/2,W/2,H,0,-100,100);
  camera.position.z=10;
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
  const background=new T.Color('#302a34'),group=new T.Group();group.position.set(-W/2,H,0);group.scale.set(1,-1,1);group.renderOrder=10;scene.add(group);
  const floor=new T.Mesh(new T.PlaneGeometry(W,120),new T.MeshBasicMaterial({color:'#574538'}));floor.position.set(W/2,660,-2);group.add(floor);
  const load=async(url)=>{const im=new Image();im.src=url;await im.decode();const t=new T.Texture(im);t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;};
  const actors=[];
  for(const [id,x,y]of units){
   const m=manifests[id],scale=225/m.opaqueHeight,poses={};
   for(const key of id==='needle-moth'?['K0','K1','K2','K4','K5']:['K0']){
    const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:await load(`/units/${id}/poses/${m.poses[key].image}`),transparent:true,depthTest:false,depthWrite:false}));
    mesh.scale.set(m.canvas[0]*scale,-m.canvas[1]*scale,1);mesh.position.set(x+(m.canvas[0]/2-m.baseline[0])*scale,y+(m.canvas[1]/2-m.baseline[1])*scale,0);mesh.renderOrder=10;group.add(mesh);poses[key]=mesh;
   }
   actors.push({id,x,y,m,scale,poses});
  }
  const base={travel:150,spread:900,length:560,count:27,thickness:1.8,textureUrl:'/vfx/needle-moth/sewing-needle.webp',aspect:79/1024,tip:[0.0048828125,0.5949367088607594]};const effects={quick:new Candidate({...base,rankStagger:90}),spaced:new Candidate({...base,rankStagger:150})};
  for(const e of Object.values(effects)){await e.ready;scene.add(e.ground,e.rear,e.front);}
  window.clarityDrill={render(ms,variant,reduced=false){
   const key=drawingAt('ult',ms/1000),caster=actors[0],faces=[];
   for(const a of actors){
    const k=a===caster?key:'K0';for(const [p,mesh]of Object.entries(a.poses))mesh.visible=p===k;
    const f=a.m.poses[k].face;faces.push({x:a.x+(f[0]-a.m.baseline[0])*a.scale,y:a.y+(f[1]-a.m.baseline[1])*a.scale,width:f[2]*a.scale,height:f[3]*a.scale});
   }
   const socket=caster.m.poses[key].sockets.vfxOrigin,home={x:caster.x,y:caster.y};
   const source={x:caster.x+(socket[0]-caster.m.baseline[0])*caster.scale,y:caster.y+(socket[1]-caster.m.baseline[1])*caster.scale};
   for(const e of Object.values(effects))e.hide();const effect=effects[variant],feet=actors.slice(1).map(a=>({x:a.x,y:a.y}));
   effect.render({elapsed:ms,ultimate:true,width:W,height:H,worldWidth:W,worldHeight:H,source,home,casterFeet:home,targets:feet.map(p=>({x:p.x,y:p.y-100})),feet,faces,rearOrder:9,frontOrder:11,reducedMotion:reduced});
   group.visible=false;scene.background=null;renderer.setClearColor(0,0);renderer.render(scene,camera);
   const gl=renderer.getContext(),pixels=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
   let area=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)area++;
   const coverage=faces.map(f=>{let total=0,n=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){total++;if(pixels[((H-1-y)*W+x)*4+3]>=128)n++;}return total?n/total:0;});
   const fan=effect.fan.map((m,i)=>({i,visible:m.visible,x:m.position.x,y:m.position.y,alpha:m.material.uniforms.uAlpha.value}));
   group.visible=true;scene.background=background;renderer.render(scene,camera);
   return{ms,variant,reduced,key,areaFraction:area/(W*H),faceCoverage:coverage,fan,source,audit:structuredClone(effect.audit)};
  }};
 },{root,lab,units,manifests});
 const rows=[],times=[0,600,900,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500,1550,1600,1650,1700,1800,2199,2200];
 for(const variant of ['quick','spaced'])for(const ms of times){
  rows.push(await page.evaluate(({ms,variant})=>window.clarityDrill.render(ms,variant),{ms,variant}));
  if([1150,1250,1350,1450,1550,1650].includes(ms))await page.screenshot({path:`${out}/${variant}-${ms}.png`});
 }
 rows.push(await page.evaluate(()=>window.clarityDrill.render(1300,'spaced',true)));
 const variants=['quick','spaced'].map(variant=>({variant,peakArea:Math.max(...rows.filter(r=>r.variant===variant).map(r=>r.areaFraction)),maxFaceCoverage:Math.max(...rows.filter(r=>r.variant===variant).flatMap(r=>r.faceCoverage)),firstFanY:rows.filter(r=>r.variant===variant&&!r.reduced&&r.ms>=1100&&r.ms<=1400).map(r=>({ms:r.ms,y:r.fan[0].y}))}));
 await writeFile(`${lab}/needle-drill-r2.json`,JSON.stringify({at:new Date().toISOString(),errors,variants,rows,scope:'Isolated original assets and225px bodies; actual alpha readback; no production-film acceptance.'},null,2)+'\n');
 console.log(JSON.stringify({errors,variants}));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
