/** Original plate-only choreography, expressed on each cutout's real pivots. */
export const casterGestures={
 biscuit:{name:'rolling-pin-swing',left:[-22,32],right:[12,-18],tail:[-8,14]},
 brioche:{name:'moon-bowl-offering',left:[18,-26],right:[-14,30],tail:[-12,15]},
 cinnamon:{name:'steam-pour',left:[-20,30],right:[17,-28],tail:[-10,18]},
 clover:{name:'teapot-arc',left:[-16,28],right:[12,-25],tail:[-10,15]},
 inkcap:{name:'brush-flourish',left:[-28,38],right:[18,-20],tail:[-12,20]},
 mallow:{name:'hearth-opening',left:[20,-28],right:[-20,32],tail:[-12,16]},
 marigold:{name:'staff-summon',left:[-24,34],right:[16,-24],tail:[-10,17]},
 mochi:{name:'shield-lift',left:[-18,24],right:[15,-30],tail:[-8,16]},
 panko:{name:'hammer-strike',left:[-28,38],right:[16,-24],tail:[-10,16]},
 soot:{name:'lantern-sweep',left:[-20,26],right:[12,-32],tail:[-14,18]},
 sorrel:{name:'water-offering',left:[18,-28],right:[-16,30],tail:[-10,15]},
 velvet:{name:'ribbon-fan',left:[-24,32],right:[18,-30],tail:[-14,20]},
 'yarn-giant':{name:'whale-command',left:[-25,64],right:[25,-64],tail:[0,0]},
};
const aliases={left:['arm_upper_l','l-arm-upper','arm-l'],right:['arm_upper_r','r-arm-upper','arm-r'],tail:['tail_1','tail-1','tail'],body:['torso','hip'],head:['head-pivot','neck','head']};
export function makeCasterClip(data,id,name,release){
 const base=data.clips[name],profile=casterGestures[id];
 if(!base||!profile)throw Error('Missing plate caster clip '+id);
 // The common rig contract adds aliases after PSD import. Those socket-only
 // bones do not drive pixels; select an actual ancestor of weighted artwork.
 const influences=new Set();
 for(const part of data.parts)for(const vertex of part.vertices)for(const weight of vertex){
  let node=weight.bone;while(node>=0&&!influences.has(node)){influences.add(node);node=data.nodes[node].parent;}
 }
 // Match frame12 and54 of the68-frame plate, using the same authored release
 // retiming as the compositor. No new clock, root translation or scale track.
 const before=frame=>frame/54*release,after=frame=>release+(frame-54)/13*(base.duration-release);
 const joints=[],tracks=[];
 for(const [part,values] of Object.entries({...profile,body:[-3,5],head:[2,-4]})){
  if(!aliases[part]||values.every(v=>v===0))continue;
  const node=aliases[part].map(n=>data.nodes.findIndex(b=>b.name===n)).find(i=>i>=0&&influences.has(i));
  if(node===undefined)continue;
  joints.push(data.nodes[node].name);
  tracks.push({node,property:'rotate',keys:[
   {time:0,value:0,curve:[.2,0,.4,1]},
   {time:before(12),value:values[0],curve:[.35,0,.65,1]},
   {time:before(35),value:values[0]*.65,curve:[.15,0,.2,1]},
   {time:release,value:values[1],curve:[.2,0,.5,1]},
   {time:after(60),value:values[1]*.35,curve:[.2,0,.6,1]},
   {time:base.duration,value:0},
  ]});
 }
 if(!joints.some(n=>aliases.left.includes(n))||!joints.some(n=>aliases.right.includes(n)))throw Error('Plate needs both articulated arms: '+id);
 return {clip:{...base,tracks:[...base.tracks,...tracks]},gesture:profile.name,joints};
}
