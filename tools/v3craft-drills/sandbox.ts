// Isolated authoring scene. No battle imports register or route these drill effects.
import * as T from '../../apps/web/node_modules/three/build/three.module.js';
import {loadSpineActor} from '../../apps/web/src/game/cardrpg/spine/assets';
import {opaqueWorldBounds} from '../../apps/web/src/game/cardrpg/stage/opaque-pose-bounds';
import {createD1} from './d1';
import {createD2} from './d2';
import {createD3} from './d3';
import {createD4} from './d4';
import {createD5} from './d5';
import {createD6} from './d6';
import {createD7} from './d7';
import {createD8} from './d8';
const W=1280,H=720,canvas=document.querySelector<HTMLCanvasElement>('#stage')!;
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
renderer.setSize(W,H);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor('#242336',1);
const scene=new T.Scene(),camera=new T.OrthographicCamera(0,W,H,0,-100,100);camera.position.z=10;
const texture=async(path:string)=>{const t=await new T.TextureLoader().loadAsync(path);t.colorSpace=T.SRGBColorSpace;return t;};
const root='/@fs/Users/bao/taskbar-hero-cardrpg-a6/';
const backdrop=await texture(root+'assets/cardrpg-look/stage/painted-cafe-c11-v1.webp');
const bg=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({map:backdrop,depthTest:false,depthWrite:false}));bg.position.set(W/2,H/2,0);bg.renderOrder=-100;scene.add(bg);
const actor=await loadSpineActor('soot');actor.sample('idle','idle',0,0,camera,false);
actor.root.scale.setScalar(.27*H/actor.bounds.height);actor.root.position.set(310,0,0);actor.root.updateMatrixWorld(true);
const b=opaqueWorldBounds(actor.root)!;
// Translate the actual bottom of the posed opacity box to the cafe floor.
actor.root.position.y+=H-552-b.y;actor.root.updateMatrixWorld(true);actor.setOrder(10);scene.add(actor.root);
const params=new URLSearchParams(location.search),revision=Number(params.get('revision')??0);
const id=params.get('drill')??'D1';
let recipient:any=null;
if(id==='D2'||id==='D3'||id==='D6'){
 recipient=await loadSpineActor('crumb-sentinel');recipient.sample('idle','idle',0,0,camera,false);
 recipient.root.scale.setScalar(.27*H/recipient.bounds.height);recipient.root.position.set(980,0,0);recipient.root.updateMatrixWorld(true);
 const recipientBounds=opaqueWorldBounds(recipient.root)!;recipient.root.position.y+=H-552-recipientBounds.y;
 recipient.root.updateMatrixWorld(true);recipient.setOrder(10);scene.add(recipient.root);
}
const anchors=recipient?{
 source:actor.socket('mainHand',new T.Vector3()).toArray().slice(0,2),
 target:recipient.socket('chest',new T.Vector3()).toArray().slice(0,2),
}:null;
const drill=id==='D8'?await createD8(T,revision,{renderer,scene,camera,actor}):id==='D7'?await createD7(T,revision,{renderer,scene,camera,actor}):id==='D6'?await createD6(T,revision,{renderer,scene,camera,actor,recipient}):id==='D5'?await createD5(T,revision,{renderer,scene,camera,actor}):id==='D4'?await createD4(T,texture,root,revision):id==='D3'?await createD3(T,revision,anchors!):id==='D2'?await createD2(T,revision,anchors!):await createD1(T,texture,root,revision);scene.add(drill.root);
if('prepare' in drill)await drill.prepare(renderer,scene,camera);
let running=false,raf=0,last=0,trace:any[]=[];
function draw(ms:number){last=Math.max(0,Math.min(2000,ms));drill.draw(last);renderer.render(scene,camera);document.querySelector('#time')!.textContent=Math.round(last)+' ms';(document.querySelector('#seek') as HTMLInputElement).value=String(last);return {ms:last,...drill.state(),actorSource:actor.source,camera:camera.projectionMatrix.toArray()};}
function stop(){running=false;cancelAnimationFrame(raf);}
function play(){stop();running=true;trace=[];const start=performance.now();const loop=()=>{const t=performance.now()-start;const state=draw(t);trace.push(state);if(t<2000&&running)raf=requestAnimationFrame(loop);else running=false;};loop();}
document.querySelector('#play')!.addEventListener('click',play);document.querySelector('#seek')!.addEventListener('input',e=>{stop();draw(Number((e.target as HTMLInputElement).value));});
document.querySelector('#name')!.textContent=`${id} / ${id==='D8'?'ground contact and local light':id==='D7'?'squash, stretch and overlap':id==='D6'?'planted preparation and contact':id==='D5'?'colour and readable paint':id==='D4'?'offline flipbook':id==='D3'?'dragged sparks':id==='D2'?'curved flow':'erosion'} / r${revision}`;
(window as any).__drill={ready:true,canvas,draw,play,stop,get trace(){return trace;},renderer,scene,camera,actor,recipient,drill};draw(0);
