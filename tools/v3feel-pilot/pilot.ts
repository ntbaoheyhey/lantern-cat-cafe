// Isolated QR craft study: shares the production cut-out player, never the battle router.
import * as T from '../../apps/web/node_modules/three/build/three.module.js';
import {loadSpineActor,type SpineActor} from '../../apps/web/src/game/cardrpg/spine/assets';
import {authorPilotPoses,clamp,smooth,timing,poseClock} from './pose';
import {LanternEffects,makeCanvas,recipe,type Kind} from './recipe';
import {PilotSound,cues} from './sound';

const canvas=document.querySelector<HTMLCanvasElement>('#stage')!;canvas.width=1280;canvas.height=720;
const ctx=canvas.getContext('2d')!;
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene(),camera=new T.OrthographicCamera(0,1280,720,0,-100,100);camera.position.z=10;
const load=async(url:string)=>{const img=new Image();img.src=url;await img.decode();return img;};
const [caster,target,backdrop,paint]=await Promise.all([
 loadSpineActor('soot','placeholder'),loadSpineActor('button-guard'),
 load('/@fs/Users/bao/taskbar-hero-cardrpg-a6/assets/cardrpg-look/stage/painted-cafe-c11-v1.webp'),
 load('/@fs/Users/bao/taskbar-hero-cardrpg-a6/assets/cardrpg-look/vfx-layered/soot-4.webp'),
]);
authorPilotPoses(caster);authorPilotPoses(target);
const actors=[caster,target],canvases=actors.map(()=>makeCanvas()),scales=actors.map(a=>240/a.bounds.height),floor=555;
actors.forEach((a,i)=>{scene.add(a.root);a.root.scale.setScalar(scales[i]);a.setOrder(0);a.root.traverse(o=>{if(o instanceof T.Mesh)o.material.color?.set('#fff6f0');});});
const effect=new LanternEffects(paint),rim=makeCanvas(),sound=new PilotSound();
export const actions=[{at:2000,kind:'basic' as const},{at:4500,kind:'ultimate' as const},{at:8500,kind:'hit' as const},{at:10800,kind:'death' as const}];
let last:any=null;
function paintActor(a:SpineActor,i:number,t:number,kind:Kind|null,elapsed:number,hitElapsed:number,deathElapsed:number){
 const pose=i===0&&kind?'feel-'+kind:'feel-idle';
 const idleClock=i===0&&kind?t-elapsed+poseClock(elapsed,kind):hitElapsed>=0&&hitElapsed<timing.hold?t-hitElapsed:t;
 const at=i===0&&kind?poseClock(elapsed,kind)/1000:((idleClock/1000+i*.89)%4);
 a.mesh!.proceduralTime=idleClock/1000+i*.89;a.sample(pose,pose,at,0,camera,false);
 let recoil=0,squash=0;
 if(hitElapsed>=0&&hitElapsed<650){const h=hitElapsed<timing.hold?0:hitElapsed-timing.hold;recoil=hitElapsed<timing.hold?15:15*(1-smooth(h/550));squash=hitElapsed<timing.hold?.07:.07*(1-smooth(h/350));}
 a.root.scale.set(scales[i]*(1+squash)*(i?-1:1),scales[i]*(1-squash),scales[i]);
 // Correct the foot anchor after articulating, not the image rectangle size.
 const bounds=a.framingBounds();a.root.position.set((i?1010:245)+(i?recoil:-recoil),720-floor-bounds.y*a.root.scale.y,0);
 actors.forEach(x=>x.root.visible=x===a);renderer.render(scene,camera);
 const c=canvases[i],g=c.getContext('2d')!;g.clearRect(0,0,1280,720);g.drawImage(renderer.domElement,0,0);
 const alpha=i===1&&deathElapsed>=0?1-smooth(deathElapsed/900):1;
 const flash=hitElapsed>=0&&hitElapsed<1000/30*2;
 if(flash){g.globalCompositeOperation='source-atop';const light=g.createLinearGradient(0,430,0,490);light.addColorStop(0,'#fff3cb00');light.addColorStop(.4,'#fff3cb90');light.addColorStop(1,'#fff3cbb0');g.fillStyle=light;g.fillRect(0,430,1280,160);g.globalCompositeOperation='source-over';}
 return {bounds:{x:a.root.position.x+(i?bounds.x+bounds.width:bounds.x)*a.root.scale.x,y:floor-bounds.height*a.root.scale.y,width:bounds.width*Math.abs(a.root.scale.x),height:bounds.height*a.root.scale.y},alpha,flash,recoil,pose,poseTime:at,root:a.root.position.toArray()};
}
function draw(time:number){
 const t=Math.max(0,time),action=actions.find(a=>['basic','ultimate'].includes(a.kind)&&t>=a.at&&t<a.at+timing[a.kind as Kind].duration);
 const kind=(action?.kind??null) as Kind|null,elapsed=action?t-action.at:0,hit=kind?elapsed-timing[kind].impact:-1;
 const casterHit=t>=8500?t-8500:-1,death=t>=10800?t-10800:-1;
 const states=actors.map((a,i)=>paintActor(a,i,t,kind,elapsed,i?hit:casterHit,i?death:-1));
 const hand=caster.socket('mainHand',new T.Vector3());const source={x:hand.x,y:720-hand.y};
 // Strike the painted near surface, rather than the center of the bounding rectangle.
 const strip=canvases[1].getContext('2d')!.getImageData(750,461,400,8).data;
 let near=1100;for(let x=0;x<400;x++){let occupied=0;for(let y=0;y<8;y++)if(strip[(y*400+x)*4+3]>128)occupied++;if(occupied>=4){near=750+x-states[1].recoil;break;}}
 const recipient={x:near,y:465};effect.draw(kind,elapsed,source,recipient);
 ctx.clearRect(0,0,1280,720);ctx.drawImage(backdrop,0,0,1280,720);ctx.fillStyle='#29344930';ctx.fillRect(0,0,1280,720);
 const focus=kind==='ultimate'?smooth(elapsed/67)*(1-smooth((elapsed-500)/100)):0;
 if(focus>0){ctx.fillStyle=`rgba(0,0,0,${.55*focus})`;ctx.fillRect(0,0,1280,720);}
 states.forEach((s,i)=>{ctx.save();ctx.globalAlpha=s.alpha*(i&&focus?1-.55*focus:1);const g=ctx.createRadialGradient(i?1010:245,floor,0,i?1010:245,floor,86);g.addColorStop(0,'#130e2088');g.addColorStop(1,'#130e2000');ctx.fillStyle=g;ctx.save();ctx.translate(0,floor);ctx.scale(1,.19);ctx.translate(0,-floor);ctx.fillRect((i?1010:245)-90,floor-90,180,180);ctx.restore();ctx.restore();});
 ctx.drawImage(effect.union,0,0);
 states.forEach((s,i)=>{
  ctx.save();ctx.globalAlpha=s.alpha;
  if(kind&&(i===0||hit>=0&&hit<450)){
   const g=rim.getContext('2d')!;g.clearRect(0,0,1280,720);g.drawImage(canvases[i],0,0);g.globalCompositeOperation='source-in';g.fillStyle='#ffc77b';g.fillRect(0,0,1280,720);g.globalCompositeOperation='source-over';
   ctx.globalAlpha*=.55;ctx.filter='blur(3px)';ctx.drawImage(rim,0,0);ctx.filter='none';ctx.globalAlpha=s.alpha;
  }
  if(i&&focus)ctx.filter=`brightness(${1-.55*focus})`;ctx.drawImage(canvases[i],0,0);ctx.restore();
 });
 if(death>=0&&death<1300){
  const p=clamp(death/1300);for(let n=0;n<48;n++){
   const x=925+n*37%160,y=350+n*51%185,s=12+n%3*5;ctx.save();ctx.globalAlpha=Math.sin(p*Math.PI)*.95;ctx.translate(x+(35+100*p)*Math.sin(n*1.7),y-140*p);ctx.rotate(p*(n%5-2));ctx.drawImage(canvases[1],x,y,s,s,-s/2,-s/2,s,s);ctx.restore();
  }
 }
 const banner=kind==='ultimate'&&elapsed<600;
 if(banner){
  ctx.save();ctx.globalAlpha=focus;ctx.fillStyle='#2b2039e8';ctx.strokeStyle='#d0a268';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(305,280,326,58,12);ctx.fill();ctx.stroke();ctx.font='600 25px Georgia';ctx.fillStyle='#ffe3a4';ctx.fillText(recipe.name,325,317);ctx.restore();
 }
 ctx.fillStyle='#251d2be6';ctx.fillRect(0,640,1280,80);ctx.fillStyle='#f8e5c6';ctx.font='600 24px Georgia';ctx.fillText('Soot · lantern study',38,677);ctx.font='16px system-ui';ctx.fillStyle='#d5c5b9';ctx.fillText('Basic 0.80 s   /   Ultimate 2.20 s',38,703);
 ctx.textAlign='right';ctx.fillStyle='#e0c795';ctx.font='15px system-ui';ctx.fillText(kind?kind==='ultimate'?'LANTERN REQUIEM':'LANTERN SPARK':death>=0?'DISSOLVE':casterHit>=0?'RECOIL':'IDLE',1238,683);ctx.textAlign='left';
 // Study-only frame watermark: makes video-frame time independently recoverable
 // from pixels instead of assuming a CDP metadata timestamp equals draw time.
 for(let bit=0;bit<16;bit++){ctx.fillStyle=(Math.round(t)>>bit)&1?'#fff':'#000';ctx.fillRect(1150+bit*4,710,4,4);}
 last={t,kind,elapsed,states,source,target:recipient,focusBrightness:1-.55*focus,banner,camera:camera.projectionMatrix.toArray()};return last;
}
let running=false,epoch=0,raf=0;const trace:any[]=[];
async function play(seconds=30){await sound.prepare();await sound.context!.resume();sound.stop();sound.events=[];trace.length=0;running=true;epoch=performance.now();const audioZero=sound.context!.currentTime;for(let cycle=0;cycle<seconds/15;cycle++)sound.play(audioZero+cycle*15,cycle);function loop(){const t=performance.now()-epoch;draw(t%15000);trace.push({t,...last,elapsedWall:t,audioTime:sound.context!.currentTime-audioZero});if(running&&t<seconds*1000)raf=requestAnimationFrame(loop);}cancelAnimationFrame(raf);loop();return {epoch,wall:Date.now()/1000,audioZero};}
document.querySelector('#play')!.addEventListener('click',()=>play());
(window as any).__pilot={ready:true,canvas,draw,play,trace,stop(){running=false;cancelAnimationFrame(raf);sound.stop();},prepare:()=>sound.prepare(),recipe,actions,cues,canvases,effect,sound,telemetry:()=>last,frame:()=>canvas.toDataURL('image/png'),masks:()=>Object.fromEntries([...effect.layers].map(([name,c])=>[name,c.toDataURL('image/png')]))};
draw(0);
