import {T} from '../../apps/web/src/game/cardrpg/battle-v3/compositor-deps';
import {loadSpineActor,type SpineActor} from '../../apps/web/src/game/cardrpg/spine/assets';
import '../../apps/web/node_modules/@fontsource/baloo-2/800.css';
/** Offline deterministic director. Every logged layer comes from a real draw call. */
const timelines=import.meta.glob('./plates/*.json',{eager:true,import:'default'}) as Record<string,any>;
const motifs=import.meta.glob('./motifs/*.png',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const art=import.meta.glob('../../assets/cardrpg-look/vfx-layered/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const cores=import.meta.glob('../../art/units/*/core.json',{eager:true,import:'default'}) as Record<string,any>;
const canvas=document.querySelector<HTMLCanvasElement>('#plate')!,c=canvas.getContext('2d')!;
const motifCanvas=document.createElement('canvas');motifCanvas.width=1280;motifCanvas.height=720;const mc=motifCanvas.getContext('2d')!;
const probe=document.createElement('canvas');probe.width=320;probe.height=180;const pc=probe.getContext('2d',{willReadFrequently:true})!;
const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
const scene=new T.Scene(),camera=new T.OrthographicCamera(-640,640,720,0,.1,2000);camera.position.z=1000;
let plate:any,actor:SpineActor,summon:HTMLImageElement,paint:HTMLImageElement,core:any;
let audit:{layers:Record<string,number>;particles:number;motifCoverage:number|null;casterCorePixels:number;camera:string};
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const ease=(v:number)=>1-(1-clamp(v))**3;
const random=(i:number)=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const loadImage=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return image;};
function layer(type:string,fn:()=>void){c.save();fn();c.restore();audit.layers[type]=(audit.layers[type]??0)+1;}
function star(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,points=4){ctx.beginPath();for(let j=0;j<points*2;j++){const a=j*Math.PI/points-Math.PI/2,rr=j%2?r*.22:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.fill();}
function ellipse(ctx:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,rotation=0){ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.stroke();}
function background(frame:number){
 const [bright,color,dark]=plate.signature.element.palette,t=frame/30,kind=plate.composition.background;
 layer('background',()=>{const g=c.createLinearGradient(kind==='rain'?0:1280,0,0,720);g.addColorStop(0,dark);g.addColorStop(.6,color);g.addColorStop(1,dark);c.fillStyle=g;c.fillRect(0,0,1280,720);});
 layer('animated-environment',()=>{
  if(kind==='sanctuary'||kind==='sunburst'){
   const cx=kind==='sanctuary'?650:1050,cy=kind==='sanctuary'?400:-60;
   for(let j=0;j<26;j++){const a=j*Math.PI/13+t*.08;c.fillStyle=j%3?bright:dark;c.globalAlpha=j%3?.28:.26;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*1800,cy+Math.sin(a)*1800);c.lineTo(cx+Math.cos(a+.09)*1800,cy+Math.sin(a+.09)*1800);c.fill();}
   if(kind==='sanctuary'){c.lineWidth=9;c.strokeStyle=bright;c.globalAlpha=.2;for(let j=0;j<9;j++){const x=j*190-120+(t*35)%190;c.beginPath();c.moveTo(x,720);c.lineTo(x,160);c.quadraticCurveTo(x+90,-80,x+180,160);c.lineTo(x+180,720);c.stroke();}}
  }else if(kind==='eclipse'){
   c.fillStyle='#100720';c.fillRect(0,0,1280,720);const g=c.createRadialGradient(900,200,40,900,200,740);g.addColorStop(0,color);g.addColorStop(.4,'#843b78');g.addColorStop(1,'#100720');c.fillStyle=g;c.fillRect(0,0,1280,720);
   c.fillStyle=dark;c.beginPath();c.arc(950-t*30,140,210,0,7);c.fill();c.strokeStyle=bright;c.lineWidth=12;c.globalAlpha=.5;ellipse(c,950-t*30,140,220,220);
   for(let j=0;j<36;j++){const x=(random(j)*1800-t*280+2400)%1800-200,y=random(j+70)*1100-200;c.lineWidth=12+random(j+25)*25;c.strokeStyle=j%2?color:bright;c.globalAlpha=.13;c.beginPath();c.moveTo(x,y);c.lineTo(x-500,y+500);c.stroke();}
  }else if(kind==='garden'){
   c.fillStyle='#082f29';c.fillRect(0,0,1280,720);for(let j=0;j<28;j++){const x=random(j)*1500-100+Math.sin(t+j)*30,y=random(j+40)*900-90,r=80+random(j+80)*180;c.fillStyle=j%3?color:bright;c.globalAlpha=.18+(j%4)*.05;c.beginPath();c.ellipse(x,y,r,r*.43,j*.8+t*.05,0,7);c.fill();}
  }else if(kind==='forge'){
   c.fillStyle='#2b1b16';c.fillRect(0,0,1280,720);for(let row=0;row<9;row++)for(let col=0;col<9;col++){const x=col*180-row%2*90+(t*130)%180-180,y=row*100-80;c.fillStyle=(row+col)%3===0?bright:color;c.globalAlpha=.1+row*.035;c.fillRect(x,y,168,88);}
   const g=c.createLinearGradient(0,720,0,300);g.addColorStop(0,'#fff3ce');g.addColorStop(1,'#ffcc6c00');c.globalAlpha=.6;c.fillStyle=g;c.fillRect(0,300,1280,420);
  }else if(kind==='flour'){
   c.fillStyle='#f5d8aa';c.fillRect(0,0,1280,720);c.translate(720,360);c.rotate(-.4-t*.05);for(let j=0;j<18;j++){const a=j*Math.PI/9;c.fillStyle=j%2?color:dark;c.globalAlpha=.34;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*1500,Math.sin(a)*1500);c.lineTo(Math.cos(a+.18)*1500,Math.sin(a+.18)*1500);c.fill();}
  }else if(kind==='hearth'){
   c.fillStyle='#361523';c.fillRect(0,0,1280,720);for(let j=0;j<26;j++){const x=j*63-140,y=670+Math.sin(j+t*3)*55,h=180+random(j)*560;c.fillStyle=j%3?color:bright;c.globalAlpha=.22+(j%4)*.1;c.beginPath();c.moveTo(x-70,y+140);c.quadraticCurveTo(x+80,y-h*.4,x+Math.sin(t+j)*65,y-h);c.quadraticCurveTo(x+200,y-h*.3,x+90,y+140);c.fill();}
  }else if(kind==='rain'){
   c.fillStyle='#bdd7bc';c.fillRect(0,0,1280,720);for(let j=0;j<30;j++){c.fillStyle=j%3?dark:color;c.globalAlpha=.14;c.beginPath();const x=j*71-280;c.moveTo(x,0);c.lineTo(x+30,0);c.lineTo(x-90+Math.sin(t)*40,720);c.lineTo(x-200,720);c.fill();}for(let j=0;j<8;j++){c.strokeStyle=bright;c.globalAlpha=.3;c.lineWidth=5;ellipse(c,300+j*160,600,100+Math.sin(t+j)*30,18);}
  }else if(kind==='ink'){
   c.fillStyle='#dcd0ef';c.fillRect(0,0,1280,720);for(let j=0;j<18;j++){c.fillStyle=j%3?dark:color;c.globalAlpha=.65;c.beginPath();c.ellipse(random(j)*1400-70+Math.sin(j+t)*60,random(j+70)*900-100,60+random(j+35)*280,80+random(j+90)*190,j+t*.13,0,7);c.fill();}
  }else if(kind==='steam'){
   c.fillStyle='#522d31';c.fillRect(0,0,1280,720);for(let j=0;j<14;j++){c.globalAlpha=.14;c.strokeStyle=j%2?bright:color;c.lineWidth=50+j%3*40;c.beginPath();for(let a=0;a<10;a+=.12){const r=40+a*50;c.lineTo(640+Math.cos(a+t*.3+j*.6)*r,360+Math.sin(a+t*.3+j*.6)*r*.6);}c.stroke();}
  }else if(kind==='silk'){
   c.fillStyle='#633c65';c.fillRect(0,0,1280,720);for(let j=0;j<14;j++){c.strokeStyle=j%2?bright:color;c.globalAlpha=.3;c.lineWidth=65;c.beginPath();for(let x=-100;x<1400;x+=15)c.lineTo(x,j*90-230+Math.sin(x/220+t*2+j*.3)*170);c.stroke();}
  }else if(kind==='lunar'){
   c.fillStyle='#071d3f';c.fillRect(0,0,1280,720);c.fillStyle='#d8eefa';c.beginPath();c.arc(940,245,280+Math.sin(t)*20,0,7);c.fill();c.fillStyle='#124069';c.beginPath();c.arc(1035,170,245,0,7);c.fill();for(let j=0;j<130;j++){c.fillStyle=bright;c.globalAlpha=.2+random(j)*.6;star(c,random(j)*1280,random(j+200)*720,2+random(j+15)*4);}
  }else{
   c.fillStyle='#39162c';c.fillRect(0,0,1280,720);for(let j=-12;j<24;j++){c.strokeStyle=j%2?color:bright;c.globalAlpha=.17;c.lineWidth=27;c.beginPath();c.moveTo(j*100+(t*60)%100,-100);c.lineTo(j*100+900+(t*60)%100,820);c.stroke();c.globalAlpha=.25;c.strokeStyle=dark;c.beginPath();c.moveTo(j*100+800-(t*50)%100,-100);c.lineTo(j*100-100-(t*50)%100,820);c.stroke();}
  }
 });
}
function lightShafts(frame:number){const [bright,color]=plate.signature.element.palette,build=smooth((frame-30)/24);layer('light-shafts',()=>{
 // Broad moving reflected light reaches both viewport edges at the release.
 for(const side of [-1,1]){const edge=side<0?0:1280,g=c.createLinearGradient(edge,0,edge-side*390,0);g.addColorStop(0,bright);g.addColorStop(.45,color+'99');g.addColorStop(1,color+'00');c.fillStyle=g;c.globalAlpha=build*.9;c.fillRect(side<0?0:890,0,390,720);}
 c.globalAlpha=build*.12;c.fillStyle=bright;for(let j=0;j<6;j++){const x=j*280-300+Math.sin(frame/20+plate.composition.seed)*90;c.beginPath();c.moveTo(x,0);c.lineTo(x+60,0);c.lineTo(x+460,720);c.lineTo(x+300,720);c.fill();}
});}
function speedLines(frame:number){const [bright,color]=plate.signature.element.palette,comp=plate.composition,t=frame/30;layer('speed-lines',()=>{const cx=comp.focus[0],cy=comp.focus[1];for(let j=0;j<86;j++){const a=j*2.399963+plate.composition.seed,r=270+((random(j)+t*.9)%1)*630,l=60+random(j+120)*200;c.strokeStyle=j%4?color:bright;c.globalAlpha=.08+smooth((frame-15)/26)*.25;c.lineWidth=1+random(j+45)*5;c.beginPath();c.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8);c.lineTo(cx+Math.cos(a)*(r+l),cy+Math.sin(a)*(r+l)*.8);c.stroke();}});}
function move(frame:number){const p=frame/67,build=smooth((frame-12)/35),cam=plate.composition.camera;let x=0,y=0,z=1,angle=0;
 switch(cam){case 'sanctuary-rise':y=90*(1-ease(p*3));z=1+p*.12;break;case 'meteor-dive':x=140*(1-p);y=-90*(1-p);angle=-.055*p;break;case 'garden-orbit':x=Math.sin(p*4)*70;y=Math.cos(p*4)*30;z=1+build*.08;break;case 'shield-charge':x=-190*(1-ease(p*3))+p*80;z=1+build*.17;break;case 'baker-whip':x=-210*(1-ease(p*4));angle=.06*(1-build);z=1+build*.08;break;case 'hearth-drop':y=-180*(1-ease(p*3));z=1+p*.18;break;case 'rain-pullback':z=1.2-p*.2;y=60*(1-p);break;case 'ink-spiral':angle=-.13+p*.21;z=1+p*.17;break;case 'steam-orbit':x=Math.sin(p*3)*90;angle=.025*Math.sin(p*4);break;case 'ribbon-sweep':x=160*Math.sin(p*2.7);y=Math.sin(p*4)*25;angle=-.045*Math.sin(p*3);break;case 'moon-reveal':z=1.23-p*.23;x=-p*75;break;case 'crane-ascent':y=120-p*180;z=1+p*.08;break;case 'whale-surge':x=190*(1-ease(p*2));y=-Math.sin(p*3)*65;z=1+p*.14;break;}
 return{x,y,z,angle};}
function paintedSummon(frame:number){const comp=plate.composition,build=ease((frame-6)/36),climax=smooth((frame-42)/15),m=move(frame),size=comp.motifSize*(.55+.45*build+.08*climax),w=size,h=size*summon.height/summon.width;
 mc.clearRect(0,0,1280,720);mc.save();mc.translate(comp.focus[0]+m.x,comp.focus[1]+m.y);mc.rotate(m.angle+Math.sin(frame/24)*comp.motifTilt);mc.scale(m.z,m.z);mc.globalAlpha=.18+.82*build;mc.drawImage(summon,-w/2,-h/2,w,h);mc.restore();
 layer('painted-motif',()=>{c.drawImage(motifCanvas,0,0);});
 if([12,35,54].includes(frame)){pc.clearRect(0,0,320,180);pc.drawImage(motifCanvas,0,0,320,180);const pixels=pc.getImageData(0,0,320,180).data;let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=48)n++;audit.motifCoverage=n/(320*180);}
}
function cast(frame:number){const comp=plate.composition,arrival=ease(frame/17),climax=smooth((frame-39)/18),m=move(frame);const height=comp.casterHeight*(.92+.08*arrival+climax*.06),scale=height/core.world.height;
 actor.root.scale.setScalar(scale);actor.root.position.set(comp.casterX-640+(1-arrival)*comp.casterEnter+m.x*.35,720-comp.casterFoot+Math.sin(frame/20)*12+m.y*.25,0);actor.root.rotation.z=comp.casterTilt*(1-climax);
 if(actor.mesh)actor.mesh.proceduralTime=frame/30;
 const name=actor.clips.has('ultimate')?'ultimate':'ult';actor.sample(name,plate.id,.05+frame/67*Math.min(1.1,actor.duration(name)*.8),0,camera,false);renderer.render(scene,camera);
 layer('caster',()=>{c.globalAlpha=1;c.shadowColor=plate.signature.element.palette[1];c.shadowBlur=25;c.drawImage(renderer.domElement,0,0);});audit.casterCorePixels=height;
}
function ground(frame:number){const [bright,color]=plate.signature.element.palette,comp=plate.composition,build=smooth((frame-10)/26);layer('ground-glyph',()=>{c.globalAlpha=build*.64;c.strokeStyle=bright;c.lineWidth=7;for(let j=0;j<4;j++)ellipse(c,comp.focus[0],640,160+j*95+Math.sin(frame/10)*20,20+j*16,-.03);c.strokeStyle=color;c.lineWidth=18;ellipse(c,comp.focus[0],642,590,85);});}
function originalLayer(frame:number){const l=plate.layers.find((l:any)=>l.type==='painted-layer');if(!l)return;const [sx,sy,sw,sh]=l.region;layer('painted-layer',()=>{c.globalCompositeOperation='screen';c.globalAlpha=.28+.32*smooth((frame-34)/20);const z=700+frame*4;c.drawImage(paint,sx,sy,sw,sh,plate.composition.focus[0]-z/2,360-z/2,z,z);});}
function particles(frame:number){const [bright,color]=plate.signature.element.palette,kind=plate.composition.particle,peak=smooth((frame-9)/31),count=Math.floor(110+370*peak),seed=plate.composition.seed;layer('particles',()=>{for(let j=0;j<count;j++){const r=random(j+seed),x=(random(j+11+seed)*1280+frame*(r-.5)*9+2560)%1280,y=(random(j+97+seed)*720-frame*(.6+r)*3+1440)%720,size=1.5+random(j+41)*5.5;c.save();c.translate(x,y);c.rotate(j+frame*.025);c.fillStyle=j%3?color:bright;c.globalAlpha=.35+random(j+73)*.6;if(kind==='petal'){c.beginPath();c.ellipse(0,0,size,size*2.6,0,0,7);c.fill();}else if(kind==='shard'){c.beginPath();c.moveTo(0,-size*2);c.lineTo(size,size);c.lineTo(-size*.6,size*.5);c.closePath();c.fill();}else if(kind==='thread'){c.strokeStyle=c.fillStyle;c.lineWidth=2;c.beginPath();c.moveTo(-size*2,0);c.quadraticCurveTo(0,-size*2,size*2,0);c.stroke();}else if(kind==='snow'){c.fillRect(-size,-size,size*2,size*2);}else star(c,0,0,size*1.5);c.restore();audit.particles++;}});}
function impact(frame:number){if(frame!==55)return;const [bright,color,dark]=plate.signature.element.palette,comp=plate.composition;layer('impact-frame',()=>{c.fillStyle=comp.impactDark?dark:bright;c.fillRect(0,0,1280,720);c.globalCompositeOperation=comp.impactDark?'screen':'multiply';c.globalAlpha=.9;c.drawImage(motifCanvas,0,0);c.globalCompositeOperation='source-over';c.strokeStyle=comp.impactDark?bright:dark;c.fillStyle=c.strokeStyle;c.lineWidth=18;const variant=comp.seed%5;if(variant===0){for(let j=0;j<9;j++)ellipse(c,comp.focus[0],comp.focus[1],100+j*90,30+j*50,j*.14);}else if(variant===1){for(let j=0;j<7;j++){c.beginPath();c.moveTo(-100+j*250,-50);c.lineTo(130+j*200,380);c.lineTo(j*250-150,780);c.stroke();}}else if(variant===2){c.translate(640,360);c.rotate(-.6);for(let j=-5;j<6;j++)c.fillRect(-900,j*100,1800,22+(j%2)*10);}else if(variant===3){for(let j=0;j<25;j++)star(c,random(j)*1280,random(j+50)*720,24+random(j+33)*60,5);}else{c.lineWidth=10;for(let j=0;j<14;j++){c.beginPath();c.moveTo(random(j)*1280,0);c.bezierCurveTo(random(j+7)*1280,250,random(j+14)*1280,500,random(j+21)*1280,720);c.stroke();}}});}
function flash(frame:number){if(frame<64)return;layer('closing-flash',()=>{c.globalAlpha=smooth((frame-63)/4);c.fillStyle=plate.composition.closingColor??plate.signature.element.palette[0];c.fillRect(0,0,1280,720);});}
async function load(id:string){
 plate=Object.values(timelines).find(p=>p.id===id);if(!plate?.composition)throw Error('Missing V2 plate '+id);
 actor?.dispose();const l=plate.layers.find((l:any)=>l.type==='painted-layer');const motif=Object.entries(motifs).find(([p])=>p.endsWith('/'+plate.unit+'.png'))?.[1];if(!motif)throw Error('Missing original motif '+plate.unit);
 [actor,summon,paint]=await Promise.all([loadSpineActor(plate.unit),loadImage(motif),loadImage(Object.entries(art).find(([p])=>p.endsWith('/'+l.source.split('/').at(-1)))![1]),document.fonts.ready]);scene.add(actor.root);actor.setOrder(2);core=Object.values(cores).find(p=>p.id===plate.unit);
 renderFrame(0);return{id:plate.id,frames:plate.frames,source:actor.source,beatFrames:[12,35,54]};
}
function renderFrame(value:number){const frame=Math.max(0,Math.min(plate.frames-1,Math.floor(value)));audit={layers:{},particles:0,motifCoverage:null,casterCorePixels:0,camera:plate.composition.camera};c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,1280,720);background(frame);lightShafts(frame);speedLines(frame);ground(frame);
 if(plate.composition.casterBehind){cast(frame);paintedSummon(frame);}else{paintedSummon(frame);cast(frame);}originalLayer(frame);particles(frame);impact(frame);flash(frame);
 return{frame,seconds:frame/30,...audit};}
Object.assign(window,{compositor:{load,renderFrame,ids:Object.values(timelines).map(p=>p.id)}});
