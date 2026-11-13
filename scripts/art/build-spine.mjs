/** Native cut-out compiler. The historical command name does not imply a Spine runtime. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';import {resolve,dirname} from 'node:path';import sharp from 'sharp';
import {importSkeleton} from './import-spine.mjs';import {templateClips} from './template-motion.mjs';
const root=resolve(import.meta.dirname,'../..'),contract=JSON.parse(await readFile(resolve(root,'art/rig-templates/cat.template.json'),'utf8'));
const enemyTemplates=JSON.parse(await readFile(resolve(root,'art/rig-templates/enemy.templates.json'),'utf8'));
const units=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/spine/slots.json'),'utf8')).units,designer=new Set(['mochi','soot','clover']);
const floating=new Set(['needle-moth','pollen-scout','rain-spool']),heavy=new Set(['spool-ram','practice-cushion','yarn-giant','pantry-crown']);
const staff=new Set(['mallow','sorrel','cinnamon','marigold']);
const clamp=n=>Math.max(0,Math.min(1,n)),smooth=n=>{const t=clamp(n);return t*t*(3-2*t);},mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const round=n=>Math.round(n*1e5)/1e5;
function worlds(nodes){return nodes.reduce((a,n)=>{const p=a[n.parent]??{x:0,y:0};a.push({x:n.x+p.x,y:n.y+p.y});return a;},[]);}
function atlasRegions(text){const map={};let name;for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line.includes(':'))name=line;else if(line.startsWith('bounds:'))map[name]=line.slice(7).split(',').map(Number);}return map;}
async function make(unit){
 if(designer.has(unit.id))return{id:unit.id,template:'designer-preserved',skipped:true,reason:'Retain approved artwork and authored animation; do not re-split or replace.'};
 const spec=unit.placeholder,source=JSON.parse(await readFile(resolve(root,spec.skeleton),'utf8')),atlas=await readFile(resolve(root,spec.atlas),'utf8'),old=importSkeleton(source,atlas,spec.scale),oldWorld=worlds(old.nodes),get=name=>oldWorld[old.nodes.findIndex(n=>n.name===name)];
 const dir=resolve(root,'art/units',unit.id),out=resolve(root,'apps/web/public/units',unit.id);await mkdir(dir,{recursive:true});await mkdir(out,{recursive:true});
 const pageNames=[];for(const [i,p] of old.pages.entries()){const name=`rig-page-${i}.png`;await copyFile(resolve(root,dirname(spec.atlas),p.name),resolve(out,name));pageNames.push(name);}
 let data,style,pivots={},bindings={};
 {
  const regions=atlasRegions(atlas),parts=[];
  for(const part of old.parts){
   const vs=part.vertices.map(v=>({x:v[0].x+oldWorld[v[0].bone].x,y:v[0].y+oldWorld[v[0].bone].y})),xs=vs.map(p=>p.x),ys=vs.map(p=>p.y),box={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
   const [left,top,width,height]=regions[part.name],pixels=await sharp(resolve(out,pageNames[part.page])).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();const mask=new Set();let sx=0,sy=0,count=0;
   for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2)if(pixels[(y*width+x)*4+3]>=32){const wx=box.x+x/width*box.w,wy=box.y+(1-y/height)*box.h,key=(Math.round(wx/2)+2048)*4096+Math.round(wy/2)+2048;mask.add(key);sx+=wx;sy+=wy;count++;}
   parts.push({part,box,mask,centroid:{x:sx/count,y:sy/count}});
  }
  const body=parts.find(p=>p.part.name==='body');
  for(const p of parts){let sx=0,sy=0,count=0;for(const key of p.mask)if(body.mask.has(key)){sx+=(Math.floor(key/4096)-2048)*2;sy+=(key%4096-2048)*2;count++;}const sourceBone=old.nodes[p.part.vertices[0][0].bone].name;const fallback=get(sourceBone)??p.centroid;
   pivots[p.part.name]={x:count?sx/count:fallback.x,y:count?sy/count:fallback.y,overlapPixels:count*4,method:count?'centroid of parent/child alpha overlap':'original approved pivot; connected weights'};
  }
  const h=old.bounds.height,hip=get('hip'),bodyTop={x:hip.x,y:hip.y+h*.12},head=pivots.head??{x:hip.x,y:h*.75};
  const points={root:{x:0,y:0},hip,torso:bodyTop,neck:head,head,eyes:head,mouth:head,'hp-anchor':get('hp-anchor'),'vfx-origin':get('vfx-origin'),'main-hand':get('main-hand'),'off-hand':get('off-hand')};
  for(const side of ['l','r']){
   const p=parts.find(p=>p.part.name===`arm-${side}`),joint=pivots[`arm-${side}`]??bodyTop,end=p?{x:p.centroid.x,y:p.centroid.y-h*.06}:joint;
   points[`shoulder_${side}`]=joint;points[`arm_upper_${side}`]=joint;points[`arm_lower_${side}`]=mix(joint,end,.55);points[`hand_${side}`]=end;
   points[`leg_${side}`]=pivots[`foot-${side}`]??get(`foot-${side}`)??hip;
   points[`wing_${side}`]=pivots[`wing-${side}`]??bodyTop;
   const headPart=parts.find(p=>p.part.name==='head');points[`ear_${side}`]={x:headPart.box.x+headPart.box.w*(side==='l'?.23:.77),y:headPart.box.y+headPart.box.h*.84};
  }
  const tail=parts.find(p=>p.part.name==='tail'),base=pivots.tail??hip,end=tail?{x:tail.box.x+tail.box.w*.2,y:tail.box.y+tail.box.h*.8}:base;
  for(let i=1;i<=3;i++)points[`tail_${i}`]=mix(base,end,(i-1)/3);
  points.weapon=points.hand_l;points['hp-anchor']??={x:0,y:h*1.1};points['vfx-origin']??=bodyTop;points['main-hand']??=points.hand_r;points['off-hand']??=points.hand_l;
  const nodes=[];for(const [name,parent] of contract.hierarchy){const p=points[name]??head,q=points[parent]??{x:0,y:0};nodes.push({name,parent:nodes.findIndex(n=>n.name===parent),x:round(p.x-q.x),y:round(p.y-q.y),rotation:0,sx:1,sy:1});}
  const nw=worlds(nodes),node=name=>nodes.findIndex(n=>n.name===name),native=[];
  const weight=(name,x,y,weight)=>{const index=node(name),p=nw[index];return{bone:index,x:round(x-p.x),y:round(y-p.y),weight:round(weight)};};
  for(const item of parts){const {part,box}=item,n=part.name==='head'?32:8,vertices=[],uv=[],triangles=[],oldUv=part.uv;
   const weights=(x,y)=>{
    let chain=['torso'],u=0;
    if(part.name==='body'){const t=smooth((y-hip.y+h*.15)/(h*.3));return[weight('hip',x,y,1-t),weight('torso',x,y,t)];}
    if(part.name==='head'){chain=['head'];const t=smooth((y-(box.y+box.h*.65))/(box.h*.25))*smooth(Math.abs(x-(box.x+box.w/2))/(box.w*.25));if(t>0)return[weight('head',x,y,1-t),weight(x<box.x+box.w/2?'ear_l':'ear_r',x,y,t)];}
    else if(part.name.startsWith('arm-')){const side=part.name.at(-1),joint=points[`arm_upper_${side}`],end=points[`hand_${side}`],dx=end.x-joint.x,dy=end.y-joint.y;u=staff.has(unit.id)&&side==='r'?smooth(Math.hypot(x-joint.x,y-joint.y)/(h*.16)):clamp(((x-joint.x)*dx+(y-joint.y)*dy)/Math.max(1,dx*dx+dy*dy));chain=['torso',`arm_upper_${side}`,`arm_lower_${side}`,`hand_${side}`];}
    else if(part.name==='tail'){const dx=end.x-base.x,dy=end.y-base.y;u=clamp(((x-base.x)*dx+(y-base.y)*dy)/Math.max(1,dx*dx+dy*dy));chain=['hip','tail_1','tail_2','tail_3'];}
    else if(part.name.startsWith('foot-'))chain=[`leg_${part.name.at(-1)}`];
    else if(part.name.startsWith('wing-')){chain=['torso',`wing_${part.name.at(-1)}`];u=smooth(Math.abs(x-pivots[part.name].x)/(box.w*.5));}
    if(chain.length===1)return[weight(chain[0],x,y,1)];const t=u*(chain.length-1),i=Math.min(chain.length-2,Math.floor(t)),f=t-i;return[weight(chain[i],x,y,1-f),weight(chain[i+1],x,y,f)];
   };
   for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){const u=x/n,v=y/n;vertices.push(weights(box.x+box.w*u,box.y+box.h*v));uv.push(oldUv[0]+(oldUv[2]-oldUv[0])*u,oldUv[1]+(oldUv[7]-oldUv[1])*v);if(x<n&&y<n){const a=y*(n+1)+x;triangles.push(a,a+1,a+n+2,a,a+n+2,a+n+1);}}
   native.push({...part,vertices,uv,triangles});
  }
  style={template:unit.kind==='cat'?'cat':floating.has(unit.id)?'floating-insect':heavy.has(unit.id)?'blob-heavy':'biped',amplitude:['marigold','cinnamon','velvet'].includes(unit.id)?.7:['brioche','sorrel','sock-skipper'].includes(unit.id)?1.3:heavy.has(unit.id)?.7:1,weaponArc:['mallow','sorrel','cinnamon','marigold'].includes(unit.id)?'staff':'sweep'};
  // Registry uses side/category rather than kind in some older exports.
  if(['panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'].includes(unit.id))style.template='cat';
  style={...enemyTemplates[style.template],...style};
  try{style={...style,...JSON.parse(await readFile(resolve(dir,'style.json'),'utf8'))};}catch(e){if(e.code!=='ENOENT')throw e;}
  data={...old,nodes,parts:native,clips:templateClips(nodes,style,contract)};
  if(style.template==='cat'){
   const portrait=JSON.parse(await readFile(resolve(dir,'portrait.json'),'utf8')),core=JSON.parse(await readFile(resolve(dir,'core.json'),'utf8')),r=portrait.region,eyeX=r.left+r.width/2,eyeY=r.top+r.height*.4,offset=r.width*.65*.17;
   const headIndex=node('head'),h=nw[headIndex],scale=.8*core.capture.actorScale;
   data.blink={part:'head',bone:headIndex,seed:[...unit.id].reduce((n,ch)=>n*31+ch.charCodeAt(0),0)>>>0,eyes:[-1,1].map(side=>({x:(eyeX+side*offset-320)/scale-h.x,y:(600-eyeY)/scale-h.y,rx:r.width*.65*.15/scale,ry:r.width*.065/scale}))};
  }
  for(const name of contract.parts){const source=name==='torso'||name==='cloth'?'body':name.startsWith('tail')?'tail':name.startsWith('leg')?'foot-'+name.at(-1):/arm|hand/.test(name)?'arm-'+name.at(-1):name==='weapon'?'arm-r':'head';bindings[name]={source,embedded:name!==source};}
 }
 data.pages=data.pages.map((p,i)=>({...p,name:pageNames[i]}));
 data.contract={version:1,template:style.template,designerPreserved:designer.has(unit.id),parts:bindings,embeddedFacialSlots:!old.parts.some(p=>/closed|eyelid/.test(p.name)),fps:30};
 await writeFile(resolve(dir,'style.json'),JSON.stringify(style,null,2)+'\n');await writeFile(resolve(dir,'pivots.json'),JSON.stringify(pivots,null,2)+'\n');await writeFile(resolve(dir,'parts.json'),JSON.stringify(bindings,null,2)+'\n');await writeFile(resolve(out,'rig.json'),JSON.stringify(data)+'\n');
 return{id:unit.id,template:style.template,nodes:data.nodes.length,parts:data.parts.length,vertices:data.parts.reduce((n,p)=>n+p.vertices.length,0),embeddedFacialSlots:data.contract.embeddedFacialSlots,designerPreserved:designer.has(unit.id)};
}
const requested=process.argv.slice(2),selected=requested.includes('--all')?units:units.filter(u=>requested.includes(u.id));if(!selected.length)throw Error('Usage: node scripts/art/build-spine.mjs <unitId> | --all');
const result=[];for(const u of selected)result.push(await make(u));await mkdir(resolve(root,'reports/v3-battle/A5'),{recursive:true});await writeFile(resolve(root,'reports/v3-battle/A5/build.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
