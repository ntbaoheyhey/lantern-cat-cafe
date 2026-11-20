// D3 learning experiment, before renderer authoring. Q3-T22 and LEARN/Q3.md.
import {writeFileSync} from 'node:fs';
const origin=[980,228.29544025873926],gravity=[0,-480],drag=3.2;
let seed=15112028;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const particles=Array.from({length:32},(_,id)=>{const angle=-.65+random()*1.8,speed=420+random()*520;return{id,velocity:[Math.cos(angle)*speed,Math.sin(angle)*speed],life:.32+random()*.65};});
function exact(v,t,k=drag,p=origin){
 if(k===0)return {p:p.map((x,i)=>x+v[i]*t+.5*gravity[i]*t*t),v:v.map((x,i)=>x+gravity[i]*t)};
 const e=Math.exp(-k*t),f=-Math.expm1(-k*t)/k;
 return {p:p.map((x,i)=>x+v[i]*f+gravity[i]/k*(t-f)),v:v.map((x,i)=>x*e+gravity[i]/k*(1-e))};
}
function euler(v,time,hz){let p=[...origin],speed=[...v],t=0;while(t<time){const dt=Math.min(1/hz,time-t);speed=speed.map((x,i)=>x+(gravity[i]-drag*x)*dt);p=p.map((x,i)=>x+speed[i]*dt);t+=dt;}return{p,v:speed};}
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const samples=particles.flatMap(p=>Array.from({length:11},(_,n)=>{const age=p.life*n/10;const reference=exact(p.velocity,age);return{id:p.id,age,analytic:reference,undamped:exact(p.velocity,age,0),euler30:euler(p.velocity,age,30),euler60:euler(p.velocity,age,60),euler144:euler(p.velocity,age,144)};}));
const summary=['analytic','undamped','euler30','euler60','euler144'].map(method=>({method,samples:samples.length,maxPositionErrorPx:Math.max(...samples.map(s=>distance(s[method].p,s.analytic.p))),maxDistanceFromOriginPx:Math.max(...samples.map(s=>distance(s[method].p,origin))),outsideViewportSamples:samples.filter(s=>s[method].p[0]<0||s[method].p[0]>1280||s[method].p[1]<0||s[method].p[1]>720).length}));
let subdivisionError=0;for(const p of particles){const a=exact(p.velocity,p.life*.37);const b=exact(a.v,p.life*.63,drag,a.p);subdivisionError=Math.max(subdivisionError,distance(b.p,exact(p.velocity,p.life).p));}
const selected=[0,7,19].map(id=>({id,velocity:particles[id].velocity,samples:[0,.1,.2,.4,.6].map(t=>{const s=exact(particles[id].velocity,t);return{age:t,position:s.p,speed:Math.hypot(...s.v),lengthPx:3+Math.hypot(...s.v)*.035};})}));
const result={at:new Date().toISOString(),source:'Actual Q2 sentinel chest, equal seeded launch states, authored pixel gravity; numerical experiment only.',origin,gravity,drag,seed:15112028,summary,subdivisionErrorPx:subdivisionError,selected,particles};
writeFileSync('tools/v3craft-lab/q3/drag-study.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary,subdivisionErrorPx:subdivisionError,selected}));
