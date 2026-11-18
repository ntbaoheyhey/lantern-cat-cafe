/** Source-free cloned-data experiment. Never writes a shipped rig or enrolls an actor. */
export function nativeLivingExperiment(original,options={}){
 const r=structuredClone(original),node=name=>r.nodes.findIndex(n=>n.name===name),head=node('head');delete r.face;
 const tracks=[],visibility=[],duration=10,w=Math.PI*2/duration;
 const smooth=n=>{const t=Math.max(0,Math.min(1,n));return t*t*t*(t*(t*6-15)+10);};
 const phase=t=>((t%10)+10)%10;
 const blink=t=>Math.max(...[0,1,2].map(i=>{const age=phase(t-1-i*10/3);return smooth(age/.18)*(1-smooth((age-.58)/.32));}));
 const add=(name,property,fn)=>{const n=node(name);if(n<0)return;const keys=Array.from({length:301},(_,i)=>({time:i/30,...fn(i===300?0:i/30)}));tracks.push({node:n,property,keys});};
 const round=n=>Math.round(n*1e8)/1e8;
 const rotate=(name,fn)=>add(name,'rotate',t=>({value:round(fn(t))}));
 const move=(name,fn)=>add(name,'translate',t=>{const [x,y]=fn(t);return{x:round(x),y:round(y)};});
 move('torso',t=>[.6*Math.sin(w*t+.2),2.4*Math.sin(3*w*t+.4)]);
 add('torso','scale',t=>({x:1,y:round(1+.006*Math.sin(3*w*t+.4))}));
 move('neck',t=>[(options.neckX??1.6)*Math.sin(w*t+.4),1.8*Math.sin(3*w*(t-.1)+.4)]);
 rotate('head',t=>1.6*Math.sin(w*t+.8)+.3*Math.sin(2*w*t-.3));
 add('head','scale',t=>({x:round(1-.008*(1-Math.cos(w*t+.4))),y:1}));
 rotate('ear_l',t=>1.6*Math.sin(3*w*(t-.045)+.4)+.9*Math.sin(2*w*t));
 rotate('ear_r',t=>-1.2*Math.sin(3*w*(t-.07)+.7)-.7*Math.sin(2*w*t));
 rotate('tail_1',t=>(options.tail??4.5)*Math.sin(w*(t-.12)) +2*Math.sin(3*w*(t-.12)));
 rotate('tail_2',t=>-3.5*Math.sin(w*(t-.24)) +2*Math.sin(3*w*(t-.2)));
 rotate('tail_3',t=>7*Math.sin(w*(t-.36)) +3*Math.sin(3*w*(t-.28)));
 rotate('arm_upper_l',t=>-.7*Math.sin(3*w*(t-.06)+.4));
 rotate('arm_upper_r',t=>.9*Math.sin(3*w*(t-.06)+.4));
 rotate('arm_lower_l',t=>Math.sin(3*w*(t-.12)+.4));
 rotate('arm_lower_r',t=>.8*Math.sin(3*w*(t-.12)+.4));
 rotate('weapon',t=>1.5*Math.sin(3*w*(t-.18)+.4)+Math.sin(w*t));
 for(const [partName,delay]of [['eye_l',0],['eye_r',.045],['mouth_neutral',0]]){
  const part=r.parts.find(p=>p.name===partName);if(!part)continue;
  const weights=part.vertices.flat();if(weights.some(v=>v.bone!==head))throw Error('Unexpected feature binding');
  const cx=weights.reduce((s,p)=>s+p.x,0)/weights.length,cy=weights.reduce((s,p)=>s+p.y,0)/weights.length,index=r.nodes.length,name='study_'+partName;
  r.nodes.push({name,parent:head,x:cx,y:cy,rotation:0,sx:1,sy:1});for(const v of weights){v.bone=index;v.x-=cx;v.y-=cy;}
  move(name,t=>[(partName==='mouth_neutral'?2.4:1.2)*Math.sin(w*t+.4),0]);
  if(partName.startsWith('eye')){
   add(name,'scale',t=>({x:1,y:round(1-.96*blink(t-delay))}));
   visibility.push({slot:part.slot,keys:Array.from({length:301},(_,i)=>{const t=i===300?0:i/30;return{time:i/30,name:blink(t-delay)>.995?partName+'_closed':partName};})});
  }
 }
 const clip={duration,tracks,visibility,events:[]};r.clips.idle=clip;r.clips['idle-phase2']=structuredClone(clip);
 return r;
}
