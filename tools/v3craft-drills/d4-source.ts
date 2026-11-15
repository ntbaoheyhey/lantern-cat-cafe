// Offline original-painted source, never registered by battle.
// T11/T12/T19 and Q3-X13 selected broad coherent weights before this was authored.
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x);};
const lamps=[
 {x:(150/512-.5)*500,y:(.5-241/512)*500,amplitude:.32*.65,delay:0},
 {x:(270/512-.5)*500,y:0,amplitude:.22*.65,delay:55},
 {x:(361/512-.5)*500,y:(.5-220/512)*500,amplitude:.27*.65,delay:110},
];
export function d4SourceTime(ms:number,revision:number){
 ms=Math.max(0,Math.min(1000,ms));
 if(revision<2)return ms*2;
 if(ms<=240)return 430*smooth(ms/240);
 if(ms<=350)return 430+45*smooth((ms-240)/110);
 return 475+1525*smooth((ms-350)/650);
}
function sourceBirthTime(sourceMs:number,revision:number){
 if(revision<2)return sourceMs/2;
 let lo=0,hi=1000;
 for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(d4SourceTime(mid,revision)<sourceMs)lo=mid;else hi=mid;}
 return(lo+hi)/2;
}
export function lampPoint(x:number,y:number,ms:number):[number,number]{
 let dx=0,dy=0,total=0;
 for(const lamp of lamps){
  const age=Math.max(0,ms-lamp.delay);
  const weight=Math.exp(-Math.pow((x-lamp.x)/78,2))*smooth((lamp.y+12-y)/45);
  const angle=lamp.amplitude*Math.sin(age/800*Math.PI*2)*Math.exp(-age/900)*smooth(age/120)*(1-smooth((ms-750)/250));
  const px=x-lamp.x,py=y-lamp.y;
  dx+=weight*(Math.cos(angle)*px-Math.sin(angle)*py-px);
  dy+=weight*(Math.sin(angle)*px+Math.cos(angle)*py-py);total+=weight;
 }
 return[x+dx/Math.max(1,total),y+dy/Math.max(1,total)];
}
export function prepareD4Source(T:any,paint:any,revision:number){
 const mesh=paint.root.children.find((child:any)=>child.material===paint.material);
 if(revision>=1){mesh.geometry.dispose();mesh.geometry=new T.PlaneGeometry(500,500,40,40);}
 const positions=mesh.geometry.attributes.position,rest=positions.array.slice();
 const fragmentBirths=paint.fragments.map((fragment:any)=>sourceBirthTime(fragment.birth,revision));
 function draw(ageMs:number){
  paint.draw(d4SourceTime(ageMs,revision));
  if(revision>=1){
   for(let i=0;i<positions.count;i++){
    const point=lampPoint(rest[i*3],rest[i*3+1],ageMs);positions.setXY(i,point[0],point[1]);
   }
   positions.needsUpdate=true;
   // Released chips inherit their birthplace, not ongoing surface motion.
   for(const [index,fragment] of paint.fragments.entries()){
    const local=[fragment.x-800,fragment.y-355],birth=lampPoint(local[0]!,local[1]!,fragmentBirths[index]);
    fragment.piece.position.x+=birth[0]-local[0]!;fragment.piece.position.y+=birth[1]-local[1]!;
   }
  }
 }
 return{draw,lamps,mesh,sourceTime:(ageMs:number)=>d4SourceTime(ageMs,revision),recipe:revision===0?'D1 r2 fixed source':revision===1?'broad-coherent-three-lamp-swing':'three-lamp-swing-readable-shape-timing',revision};
}
