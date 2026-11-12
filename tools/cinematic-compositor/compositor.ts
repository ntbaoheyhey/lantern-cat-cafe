import {T,BatchedRenderer,ParticleSystem,ConstantValue,ConstantColor,SphereEmitter,RenderMode} from '../../apps/web/src/game/cardrpg/battle-v3/compositor-deps';
import '../../apps/web/node_modules/@fontsource/baloo-2/800.css';
const timelines=import.meta.glob('./plates/*.json',{eager:true,import:'default'});
const art=import.meta.glob('../../assets/cardrpg-look/vfx-layered/*.webp',{eager:true,query:'?url',import:'default'});
const canvas=document.querySelector<HTMLCanvasElement>('#plate')!,c=canvas.getContext('2d')!;
const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.setPixelRatio(1);
const scene=new T.Scene(),camera=new T.OrthographicCamera(-640,640,360,-360,.1,2000);camera.position.z=1000;
const shader=new T.ShaderMaterial({depthTest:false,uniforms:{clock:{value:0},light:{value:new T.Color()},dark:{value:new T.Color()},linear:{value:0}},vertexShader:'varying vec2 uvp; void main(){uvp=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 uvp;uniform float clock,linear;uniform vec3 light,dark;
void main(){vec2 p=(uvp-.5)*vec2(1.7778,1.);float r=length(p),a=atan(p.y,p.x);float rays=pow(abs(sin(a*37.+sin(a*11.)*3.)),28.);float flow=pow(abs(sin(r*16.-clock*18.)),8.);float stripe=pow(abs(sin(p.y*110.+clock*8.)),25.);float beam=mix(rays*flow,stripe,linear)*smoothstep(.18,.85,r);vec3 color=mix(dark,light,.09+beam*.28+exp(-r*3.)*.13);gl_FragColor=vec4(color,1.);}`});
scene.add(new T.Mesh(new T.PlaneGeometry(1280,720),shader));
const batch=new BatchedRenderer();scene.add(batch);
const material=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65,blending:T.AdditiveBlending,depthTest:false});
const particles=new ParticleSystem({duration:2.3,looping:false,shape:new SphereEmitter({radius:180}),startLife:new ConstantValue(1.5),startSpeed:new ConstantValue(120),startSize:new ConstantValue(3),startColor:new ConstantColor(new T.Vector4(1,.9,.65,.65)),emissionOverTime:new ConstantValue(28),material,renderMode:RenderMode.BillBoard,worldSpace:true});
batch.addSystem(particles);scene.add(particles.emitter);
let plate:any,unit:HTMLImageElement,paint:HTMLImageElement;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const random=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const loadImage=async(src:string)=>{const i=new Image();i.src=src;await i.decode();return i;};
function star(x:number,y:number,r:number,points=4){c.beginPath();for(let j=0;j<points*2;j++){const a=j*Math.PI/points-Math.PI/2,rr=j%2?r*.25:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();}
function ellipse(x:number,y:number,rx:number,ry:number,rotation=0){c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.stroke();}
function motif(frame:number,p:number){
 const motif=plate.signature.motif,[bright,color]=plate.signature.element.palette;
 const build=smooth((frame-8)/28),burst=smooth((frame-43)/10),cx=850,cy=375;
 c.save();c.strokeStyle=bright;c.fillStyle=color;c.lineWidth=5;c.shadowColor=color;c.shadowBlur=18;c.globalAlpha=build;
 if(motif==='shield-bash'){
  c.save();c.translate(cx-200*(1-build)+burst*90,cy);c.rotate(-.12);c.fillStyle=color+'dd';c.lineWidth=12;
  c.beginPath();c.roundRect(-145,-210,290,400,32);c.fill();c.stroke();c.lineWidth=5;c.strokeRect(-110,-165,220,310);
  for(let j=0;j<5;j++){c.beginPath();c.moveTo(-80,-110+j*48);c.lineTo(80,-110+j*48);c.stroke();}
  c.fillStyle=bright;star(0,65,46,5);c.restore();
  for(let j=0;j<11;j++){const y=80+j*55;c.strokeStyle=j%2?bright:color;c.lineWidth=6+j%3*4;c.beginPath();c.moveTo(430-burst*130,y);c.lineTo(650-build*80,y);c.stroke();}
 }else if(motif==='shield-dome'){
  const r=170+burst*80;c.lineWidth=7;ellipse(cx,cy,r,r*1.08);c.lineWidth=2;ellipse(cx,cy,r+22,r*1.08+24);ellipse(cx,cy+150,r*1.2,38);
  c.fillStyle=color+'36';c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
  for(let j=0;j<12;j++){const a=j*Math.PI/6+frame*.008,x=cx+Math.cos(a)*(r+25),y=cy+Math.sin(a)*(r+25);c.fillStyle=bright;star(x,y,9,4);}
  c.fillStyle=bright;c.beginPath();c.moveTo(cx,cy-90);c.lineTo(cx+62,cy-53);c.lineTo(cx+45,cy+34);c.lineTo(cx,cy+84);c.lineTo(cx-45,cy+34);c.lineTo(cx-62,cy-53);c.closePath();c.stroke();
 }else if(motif==='falling-meteors'){
  c.rotate(-.07);for(let j=0;j<7;j++){const u=((p*1.9+j*.17)%1),x=620+j*91-u*140,y=-180+u*980;
   const g=c.createLinearGradient(x+80,y-200,x,y);g.addColorStop(0,'#bd6aff00');g.addColorStop(1,'#ffc18e');c.strokeStyle=g;c.lineWidth=16+j%3*7;c.beginPath();c.moveTo(x+100,y-230);c.lineTo(x,y);c.stroke();c.fillStyle=bright;star(x,y,25+j%3*8,4);}
  c.strokeStyle=color;c.lineWidth=3;ellipse(870,500,260*burst+30,70);ellipse(870,500,190*burst+30,45);
 }else if(motif==='petal-storm'){
  c.lineWidth=4;ellipse(cx,cy+180,255*build,48);c.strokeStyle=color;
  c.beginPath();c.moveTo(cx-190,cy+170);c.lineTo(cx-190,cy-120);c.lineTo(cx,cy-260);c.lineTo(cx+190,cy-120);c.lineTo(cx+190,cy+170);c.stroke();
  for(let j=-2;j<=2;j++){c.beginPath();c.moveTo(cx+j*70,cy+160);c.lineTo(cx+j*70,cy-150+Math.abs(j)*40);c.stroke();}
  for(let j=0;j<22;j++){const a=j*2.4+p*5,r=80+random(j)*195,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.85;c.save();c.translate(x,y);c.rotate(a);c.fillStyle=j%3?color:bright;c.beginPath();c.ellipse(0,0,8+burst*7,24,0,0,7);c.fill();c.restore();}
 }else if(motif==='slash-arcs'){
  c.lineWidth=23;for(let j=0;j<3;j++){c.beginPath();c.ellipse(cx,cy,180+j*50,80+j*35,-.7,-2.4+burst*.4,.3+burst);c.stroke();}
 }else if(motif==='ground-eruption'){
  for(let j=0;j<9;j++){const x=570+j*67,h=(180+random(j)*300)*build;c.fillStyle=j%2?bright:color;c.beginPath();c.moveTo(x-38,650);c.lineTo(x+20,650-h);c.lineTo(x+45,650);c.fill();}ellipse(cx,620,330,45);
 }else if(motif==='needle-rain'){
  for(let j=0;j<35;j++){const x=550+random(j)*670,y=((random(j+30)+p*1.8)%1)*850-100;c.strokeStyle=j%3?color:bright;c.lineWidth=4;c.beginPath();c.moveTo(x+40,y-90);c.lineTo(x,y);c.stroke();}
 }else if(motif==='ink-splash'){
  for(let j=0;j<17;j++){const a=j*2.4,r=(40+random(j)*240)*burst;c.fillStyle=j%3?color:bright;c.beginPath();c.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8,15+random(j+12)*64*build,0,7);c.fill();}
 }else if(motif==='teapot-summon'){
  c.fillStyle=color+'99';c.beginPath();c.ellipse(cx,cy+40,155*build,105*build,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(cx+145,cy+20);c.quadraticCurveTo(cx+270,cy+10,cx+230,cy-125);c.quadraticCurveTo(cx+180,cy-50,cx+115,cy-20);c.stroke();ellipse(cx-170,cy+10,65,80);ellipse(cx,cy-70,70,20);c.beginPath();c.moveTo(cx-40,cy-95);c.bezierCurveTo(cx-130,cy-210,cx+110,cy-240,cx+25,cy-320);c.stroke();
 }else if(motif==='ribbon-vortex'){
  c.lineWidth=15;for(let j=0;j<4;j++){c.strokeStyle=j%2?bright:color;c.beginPath();for(let a=0;a<11;a+=.06){const r=a*25*build;c.lineTo(cx+Math.cos(a+p*5+j)*r,cy+Math.sin(a+p*5+j)*r*.65);}c.stroke();}
 }else if(motif==='moon-beam'){
  const g=c.createLinearGradient(600,0,1000,0);g.addColorStop(0,color+'00');g.addColorStop(.5,bright);g.addColorStop(1,color+'00');c.fillStyle=g;c.fillRect(600,0,400,720);c.strokeStyle=color;c.lineWidth=14;ellipse(800,cy,160+burst*100,160+burst*100);
 }else if(motif==='paper-cranes'){
  for(let j=0;j<11;j++){c.save();c.translate(600+random(j)*560,60+random(j+20)*580);c.rotate(Math.sin(p*8+j)*.3);c.scale(.6+random(j),.6+random(j));c.fillStyle=j%3?bright:color;c.beginPath();c.moveTo(-60,-40);c.lineTo(0,10);c.lineTo(62,-55);c.lineTo(28,25);c.lineTo(0,32);c.lineTo(-30,20);c.closePath();c.fill();c.restore();}
 }else if(motif==='yarn-whale'){
  c.fillStyle=color+'dd';c.beginPath();c.ellipse(cx-10,cy+20,235*build,125*build,-.15,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(cx+185,cy+25);c.lineTo(cx+340,cy-145);c.lineTo(cx+290,cy+15);c.lineTo(cx+370,cy+100);c.lineTo(cx+180,cy+70);c.fill();c.stroke();c.fillStyle=bright;c.beginPath();c.arc(cx-150,cy-10,12,0,7);c.fill();for(let j=0;j<7;j++)ellipse(cx-50+j*20,cy+20,180-j*13,110-j*5,-.15);
 }
 c.restore();
}
async function load(id:string){
 plate=Object.values(timelines).find((p:any)=>p.id===id);if(!plate)throw Error('Unknown plate '+id);
 const painted=plate.layers.find((l:any)=>l.type==='painted-layer');
 [unit,paint]=await Promise.all([loadImage('/units/'+plate.unit+'/runtime.webp'),loadImage(Object.entries(art).find(([p])=>p.endsWith('/'+painted.source.split('/').at(-1)))![1] as string),document.fonts.ready]);
 shader.uniforms.light.value.set(plate.signature.element.palette[1]);shader.uniforms.dark.value.set(plate.signature.element.palette[2]);shader.uniforms.linear.value=plate.signature.camera==='whip_pan'?1:0;
 renderFrame(0);return {id:plate.id,frames:plate.frames};
}
function renderFrame(frame:number){
 frame=Math.max(0,Math.min(plate.frames-1,Math.floor(frame)));const p=frame/(plate.frames-1),[bright,color,dark]=plate.signature.element.palette;
 shader.uniforms.clock.value=frame/30;
 let seed=117;const previous=Math.random;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 try{particles.restart();for(let i=0;i<=frame;i++)batch.update(1/30);}finally{Math.random=previous;}
 renderer.render(scene,camera);c.clearRect(0,0,1280,720);c.drawImage(renderer.domElement,0,0);
 const cam=plate.signature.camera,build=smooth(frame/18),out=smooth((frame-55)/13),scale=1+build*.12;
 c.save();if(cam==='dutch_push'){c.translate(640,360);c.rotate(-.04*p);c.translate(-640,-360);}if(cam==='whip_pan')c.translate((1-build)*-350,0);if(cam==='drop_from_above')c.translate(0,(1-build)*-200);
 // A large rim-lit silhouette resolves into the approved original caster art.
 c.globalAlpha=(.35+build*.65)*(1-out*.6);c.shadowColor=color;c.shadowBlur=40;
 const x=cam==='orbit_parallax'?70+Math.sin(p*3)*50:40-p*30,y=-15-p*20,size=790*scale;
 c.drawImage(unit,x,y,size,size);c.shadowBlur=0;
 c.globalCompositeOperation='screen';c.globalAlpha=.28*build;const layer=plate.layers.find((l:any)=>l.type==='painted-layer'),[sx,sy,sw,sh]=layer.region;c.drawImage(paint,sx,sy,sw,sh,640,130,510,510);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 motif(frame,p);c.restore();
 // Sparse hand-authored glints supplement quarks without texture noise.
 for(let j=0;j<18;j++){const x=(random(j)*1280+p*80)%1280,y=(random(j+80)*720-p*120+720)%720;c.globalAlpha=.25+random(j+9)*.55;c.fillStyle=bright;star(x,y,2+random(j+7)*5);}c.globalAlpha=1;
 const wash=c.createLinearGradient(0,480,0,720);wash.addColorStop(0,dark+'00');wash.addColorStop(1,dark+'ed');c.fillStyle=wash;c.fillRect(0,480,1280,240);
 c.textAlign='right';c.fillStyle=bright;c.font='800 22px "Baloo 2"';c.fillText(plate.unit.toUpperCase()+'  /  ULTIMATE',1200,600);c.font='800 51px "Baloo 2"';c.lineWidth=5;c.strokeStyle=dark;c.strokeText(plate.title.toUpperCase(),1200,660);c.fillText(plate.title.toUpperCase(),1200,660);
 if(frame===51){c.save();c.globalCompositeOperation='difference';c.fillStyle='#fff';c.fillRect(0,0,1280,720);c.restore();c.strokeStyle='#111';c.lineWidth=6;for(let j=0;j<12;j++){const a=j*Math.PI/6;c.beginPath();c.moveTo(850,350);c.lineTo(850+Math.cos(a)*180,350+Math.sin(a)*180);c.lineTo(850+Math.cos(a+.08)*700,350+Math.sin(a+.08)*700);c.stroke();}}
 if(frame>=65){c.globalAlpha=(frame-64)/4*.6;c.fillStyle=bright;c.fillRect(0,0,1280,720);c.globalAlpha=1;}
 return {frame,seconds:frame/30};
}
Object.assign(window,{compositor:{load,renderFrame,ids:Object.values(timelines).map((p:any)=>p.id)}});
