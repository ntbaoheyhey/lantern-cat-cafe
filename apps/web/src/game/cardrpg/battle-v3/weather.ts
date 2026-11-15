import type {SceneView} from '../../squad/turn3d/scene';
import type {Rect} from '../../squad/turn3d/label-layout';

type WeatherKind='embers'|'snow'|'fireflies'|'steam';
const CHAPTER_WEATHER:readonly (readonly WeatherKind[])[]=[['embers'],['fireflies'],['snow']];
const fract=(n:number)=>n-Math.floor(n);
const seed=(n:number)=>fract(Math.sin(n*127.1+311.7)*43758.5453);

/** Seeded, seekable ambience. Small cached sprites leave the painted bodies clear. */
export class BattleWeather {
 readonly canvas=document.createElement('canvas');
 readonly audit={chapter:1,kinds:[] as WeatherKind[],particles:0,spriteCount:4,reduced:false};
 private c:CanvasRenderingContext2D;
 private sprites=new Map<WeatherKind,HTMLCanvasElement>();
 constructor(host:HTMLElement){
  this.c=this.canvas.getContext('2d')!;this.canvas.dataset.battleWeather='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'1'});host.append(this.canvas);
  for(const kind of ['embers','snow','fireflies','steam'] as const){
   const sprite=document.createElement('canvas');sprite.width=sprite.height=64;const c=sprite.getContext('2d')!;
   const color=kind==='embers'?'255,164,74':kind==='snow'?'188,224,247':kind==='fireflies'?'211,255,126':'215,220,233';
   const g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,`rgba(${color},${kind==='steam'?.22:1})`);g.addColorStop(.18,`rgba(${color},.50)`);g.addColorStop(1,`rgba(${color},0)`);
   c.fillStyle=g;c.fillRect(0,0,64,64);
   if(kind==='snow'){c.strokeStyle='#eaf8ff';c.lineWidth=2;for(let i=0;i<3;i++){c.save();c.translate(32,32);c.rotate(i*Math.PI/3);c.beginPath();c.moveTo(-12,0);c.lineTo(12,0);c.stroke();c.restore();}}
   this.sprites.set(kind,sprite);
  }
 }
 render(view:SceneView,time:number,width:number,height:number,bodies:readonly Rect[]){
  const ratio=Math.min(devicePixelRatio||1,view.quality==='low'?1:1.5),w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const c=this.c;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);
  this.canvas.hidden=!view.formationC2||!!view.effectOnly;if(this.canvas.hidden)return;
  const chapter=Math.max(1,Math.min(3,view.chapter??1)),kinds=CHAPTER_WEATHER[chapter-1]!,low=view.quality==='low',t=view.reducedMotion?10:time;
  let particles=0;
  for(const [layer,kind] of kinds.entries()){
   const count=kind==='steam'?(low?3:7):(low?26:84),sprite=this.sprites.get(kind)!;
   for(let i=0;i<count;i++){
    const n=i+layer*137+chapter*599,a=seed(n),b=seed(n+41),speed=.025+seed(n+73)*.045;
    const progress=fract(b+t*(kind==='snow'?speed:-speed)),drift=Math.sin(t*(kind==='fireflies'?.85:.32)+a*13);
    const x=fract(a+t*.009+drift*.025)*width,y=height*(.08+.88*progress);
    const size=(kind==='steam'?110+seed(n+21)*90:kind==='embers'?5+seed(n+21)*9:kind==='snow'?6+seed(n+21)*8:8+seed(n+21)*10)*height/720;
    c.globalAlpha=(kind==='steam'?.13:kind==='snow'?.46:.65)*Math.sin(progress*Math.PI)*(kind==='fireflies'?.55+.45*Math.sin(t*1.9+a*23)**2:1);
    c.drawImage(sprite,x-size/2,y-size/2,size,kind==='steam'?size*.6:size);particles++;
   }
  }
  // Weather belongs to the room. Preserve faces, body paint and their HP bars.
  c.globalAlpha=1;c.globalCompositeOperation='destination-out';
  for(const b of bodies){const g=c.createRadialGradient(b.x+b.width/2,b.y+b.height/2,Math.max(b.width,b.height)*.36,b.x+b.width/2,b.y+b.height/2,Math.max(b.width,b.height)*.66);g.addColorStop(0,'#000');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(b.x-b.width*.4,b.y-b.height*.4,b.width*1.8,b.height*1.8);}
  c.globalCompositeOperation='source-over';
  Object.assign(this.audit,{chapter,kinds:[...kinds],particles,reduced:view.reducedMotion});
 }
 dispose(){this.canvas.remove();this.sprites.clear();}
}
