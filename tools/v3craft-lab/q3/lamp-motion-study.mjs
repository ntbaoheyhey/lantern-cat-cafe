// Throwaway numeric method comparison on original lantern paint landmarks.
import {writeFileSync} from 'node:fs';
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const anchors=[{name:'left',x:(150/512-.5)*500,y:(.5-241/512)*500,centre:[150,299],width:60,amplitude:.32,delay:0},
 {name:'centre',x:(270/512-.5)*500,y:0,centre:[270,335],width:64,amplitude:-.22,delay:55},
 {name:'right',x:(361/512-.5)*500,y:(.5-220/512)*500,centre:[361,283],width:49,amplitude:.27,delay:110}];
function pose(x,y,ms,method){
 if(method==='rigid')return[x+13*Math.sin(ms/1000*Math.PI*2),y];
 let dx=0,dy=0,total=0;
 for(const a of anchors){const broad=method==='weighted-broad-coherent',age=Math.max(0,ms-a.delay),w=Math.exp(-Math.pow((x-a.x)/(broad?78:a.width),broad?2:4))*smooth((a.y+12-y)/45),angle=(broad?Math.abs(a.amplitude)*.65:a.amplitude)*Math.sin(age/800*Math.PI*2)*Math.exp(-age/900)*smooth(age/120)*(1-smooth((ms-750)/250));
  const px=x-a.x,py=y-a.y;dx+=w*(Math.cos(angle)*px-Math.sin(angle)*py-px);dy+=w*(Math.sin(angle)*px+Math.cos(angle)*py-py);total+=w;}
 return[x+dx/Math.max(1,total),y+dy/Math.max(1,total)];
}
const results=[];
for(const method of ['rigid','weighted-narrow-opposed','weighted-broad-coherent']){
 const trajectories=anchors.map(a=>({name:a.name,sourceCentre:a.centre,points:[]}));let crownMax=0,minSignedAreaRatio=Infinity,folded=0;
 for(let i=0;i<=30;i++){
  const ms=i/30*1000,crown=pose(0,100,ms,method);crownMax=Math.max(crownMax,Math.hypot(crown[0],crown[1]-100));
  anchors.forEach((a,j)=>{const rest=[(a.centre[0]/512-.5)*500,(.5-a.centre[1]/512)*500],point=pose(...rest,ms,method);trajectories[j].points.push({ms,point,displacement:Math.hypot(point[0]-rest[0],point[1]-rest[1])});});
  const area=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(let y=0;y<40;y++)for(let x=0;x<40;x++){
   const a=[-250+x*12.5,-250+y*12.5],b=[a[0]+12.5,a[1]],c=[a[0],a[1]+12.5],d=[a[0]+12.5,a[1]+12.5];
   for(const triangle of [[a,b,c],[b,d,c]]){const ratio=area(...triangle.map(v=>pose(...v,ms,method)))/156.25;minSignedAreaRatio=Math.min(minSignedAreaRatio,ratio);if(ratio<=0)folded++;}
  }
 }
 results.push({method,crownMaxDisplacementPx:crownMax,minSignedAreaRatio,foldedTriangles:folded,trajectories:trajectories.map(t=>({...t,maxDisplacementPx:Math.max(...t.points.map(v=>v.displacement))}))});
}
writeFileSync('tools/v3craft-lab/q3/lamp-motion-study.json',JSON.stringify({at:new Date().toISOString(),anchors,mesh:[40,40],samples:31,results},null,2)+'\n');
console.log(JSON.stringify(results.map(({trajectories,...r})=>({...r,lamps:trajectories.map(({name,maxDisplacementPx})=>({name,maxDisplacementPx}))}))));
