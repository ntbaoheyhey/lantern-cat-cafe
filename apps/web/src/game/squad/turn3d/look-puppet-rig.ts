/** Validated, renderer-independent contract for the original illustrated roster. */
export type PuppetLayer = {part:string; pivot:[number,number]; rect:[number,number,number,number]; atlasRect:[number,number,number,number]; depth:number};
export type PuppetRig = {version:1; id:string; role:string; boss:boolean; eyeStyle?:'lid'|'glow'; height:number; aspect:number; face:[number,number]; eyes:[number,number,number,number][]; atlas:string; atlasSize:[number,number]; layers:PuppetLayer[]; sockets:Record<string,[string,number,number]>};
const vector = (v:unknown,n:number):v is number[] => Array.isArray(v)&&v.length===n&&v.every(x=>typeof x==='number'&&Number.isFinite(x));
export function parsePuppetRig(value:unknown):PuppetRig {
  if(!value||typeof value!=='object')throw Error('Puppet rig must be an object');
  const r=value as PuppetRig;
  if(r.version!==1||!r.id||!r.role||!Number.isFinite(r.height)||r.height<=0||!Number.isFinite(r.aspect)||r.aspect<=0)throw Error('Invalid puppet identity/dimensions');
  if(!vector(r.face,2)||!vector(r.atlasSize,2)||r.atlasSize.some(n=>n<=0||n>(r.boss?1536:1024))||r.atlas!==`${r.id}.webp`)throw Error('Invalid puppet atlas/face');
  if(r.eyeStyle!==undefined&&r.eyeStyle!=='lid'&&r.eyeStyle!=='glow')throw Error('Invalid puppet eye style');
  if(!Array.isArray(r.eyes)||r.eyes.some(e=>!vector(e,4)||e[2]<=0||e[3]<=0))throw Error('Invalid puppet eyes');
  if(!Array.isArray(r.layers)||r.layers.length<3)throw Error('Puppet needs articulated parts');
  const names=new Set<string>();
  for(const l of r.layers){
    if(!l.part||names.has(l.part)||!vector(l.pivot,2)||!vector(l.rect,4)||!vector(l.atlasRect,4)||!Number.isFinite(l.depth))throw Error('Invalid/duplicate puppet layer');
    for(const box of [l.rect,l.atlasRect])if(box.some(n=>n<0||n>1)||box[2]<=0||box[3]<=0||box[0]+box[2]>1.00001||box[1]+box[3]>1.00001)throw Error('Puppet layer escapes its image');
    names.add(l.part);
  }
  if(!names.has('body')||!names.has('head'))throw Error('Puppet needs body and head');
  if(!r.sockets||Object.values(r.sockets).some(s=>!Array.isArray(s)||s.length!==3||!names.has(s[0])||!Number.isFinite(s[1])||!Number.isFinite(s[2])))throw Error('Invalid puppet socket');
  return r;
}

export type PuppetMotion = 'idle'|'attack'|'cast'|'hurt'|'ultimate'|'victory'|'defeat'|'boss-idle';
export function puppetMotion(clip:string,acting=false,ultimate=false,boss=false):PuppetMotion {
  if(/^(KO|defeat|death)$/i.test(clip))return 'defeat';
  if(/hit|hurt|stagger/.test(clip))return 'hurt';
  if(/victory|celebrate|heal-receive/.test(clip))return 'victory';
  if(ultimate||/ultimate|special|-4$/.test(clip))return 'ultimate';
  if(/cast|telegraph|-[23]$/.test(clip))return 'cast';
  if(acting||/attack|skill|:basic$|-1$/.test(clip))return 'attack';
  return boss?'boss-idle':'idle';
}
export const puppetPhase = (id:string) => [...id].reduce((n,c)=>(n*31+c.charCodeAt(0))%997,17)/997*Math.PI*2;
const smooth=(t:number)=>t*t*(3-2*t);
const ramp=(t:number,a:number,b:number)=>smooth(Math.max(0,Math.min(1,(t-a)/(b-a))));
function authoredGesture(motion:PuppetMotion,t:number) {
  const anticipation=-.38*ramp(t,0,.22);
  const strike=anticipation+1.52*ramp(t,.22,.52)-1.28*ramp(t,.52,.80)+.14*ramp(t,.80,1);
  const magic=ramp(t,0,.20)-1.23*ramp(t,.43,.66)+.23*ramp(t,.66,1);
  return motion==='attack'?strike:magic;
}
// Individual prop/body gestures use the same action clock and delayed recovery.
// Unlisted rigs retain their accepted shared motion.
const sootGesture={prop:.265,offhand:.15,head:.035,lean:.032,tailFollow:.085,clothFollow:.035,lag:.06};
// Left-facing horns dip into the strike; front legs brace instead of swinging.
const spoolRamGesture={prop:.085,offhand:.07,head:-.075,lean:-.05,tailFollow:.095,clothFollow:0,lag:.065};
/** Counter-transform a planted local foot contact while the body leans/breathes. */
export function plantedPuppetPivot(rest:readonly number[],contact:readonly number[],rotation:number,lean:number,scale:readonly number[]):[number,number] {
  const x=rest[0]!+contact[0]!,y=rest[1]!+contact[1]!;
  const c=Math.cos(lean),s=Math.sin(lean),cr=Math.cos(rotation),sr=Math.sin(rotation);
  return [(c*x+s*y)/scale[0]!-(cr*contact[0]!-sr*contact[1]!),(-s*x+c*y)/scale[1]!-(sr*contact[0]!+cr*contact[1]!)];
}
export function puppetPose(motion:PuppetMotion,time:number,progress:number,reduced:boolean,phase=0,id='') {
  const t=Math.max(0,Math.min(1,progress));
  const active=motion==='attack'||motion==='cast'||motion==='ultimate';
  // A held raised-prop silhouette before the ultimate release, then overshoot.
  const magic=ramp(t,0,.20)-1.23*ramp(t,.43,.66)+.23*ramp(t,.66,1);
  const gesture=reduced?0:active?authoredGesture(motion,t):0;
  const profile=id==='soot'?sootGesture:id==='spool-ram'?spoolRamGesture:undefined;
  const follow=reduced||!active||!profile?0:authoredGesture(motion,Math.max(0,t-profile.lag))*(1-ramp(t,.93,1));
  const hit=motion==='hurt'?Math.sin(t*Math.PI):0;
  const clock=time+phase;
  const breathe=reduced?0:Math.sin(clock*2.25)*(motion==='boss-idle'?.014:.009);
  const blinkAt=(clock%(4.1+phase*.17));
  const blink=reduced?1:1-.98*Math.exp(-Math.pow((blinkAt-3.85)/.065,2));
  return {gesture,breathe,plant:id==='spool-ram'&&active&&!reduced,hit:reduced?0:hit,flash:reduced?0:motion==='hurt'?.45*(1-ramp(t,0,.24)):0,
    head:reduced?0:motion==='hurt'?-.045*hit:motion==='defeat'?-.12:active?-(profile?.head??.025)*gesture-.012*follow:Math.sin(clock*1.15)*.013,
    tail:reduced?0:Math.sin(clock*1.45)*.065-(profile?.tailFollow??0)*follow,
    cloth:reduced?0:Math.sin(clock*1.45)*.065*.3-(profile?.clothFollow??0)*follow,
    wing:reduced?0:Math.sin(clock*1.55)*.055+gesture*.08,
    prop:reduced?0:active?-(profile?.prop??.20)*gesture:motion==='victory'?-.17:Math.sin(clock*1.8)*.017,
    offhand:reduced?0:active?(profile?.offhand??.12)*gesture:motion==='victory'?.14:-Math.sin(clock*1.8)*.012,
    lean:reduced?0:motion==='defeat'?-.18:motion==='hurt'?-.045*hit:active?-(profile?.lean??.025)*gesture:Math.sin(clock*.9)*.005,
    eyeOpen:motion==='defeat'?0:blink*(motion==='hurt'?.50:motion==='victory'?.72:1),
    glow:motion==='ultimate'||motion==='cast'?Math.max(0,magic)*.16:motion==='boss-idle'?.035+(reduced?0:.02*Math.sin(clock*2)):0,
    collapse:motion==='defeat'?.12:0};
}
