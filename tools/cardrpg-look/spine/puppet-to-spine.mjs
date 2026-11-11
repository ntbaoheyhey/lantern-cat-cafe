/** Reuse accepted original puppet pixels and pivots as explicitly temporary Spine rigs. */
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, CONFIG, readSlots, validateDelivery } from './validate.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const {units}=await readSlots(),only=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(',');
const kebab=name=>name.replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase();
const receipts=[];
for(const unit of units.filter(u=>!only||only.includes(u.id))){
 const rig=JSON.parse(await readFile(resolve(ROOT,`assets/cardrpg-look/v3-puppets/${unit.id}.rig.json`),'utf8'));
 const left=Math.min(...rig.layers.map(l=>l.rect[0])),right=Math.max(...rig.layers.map(l=>l.rect[0]+l.rect[2])),top=Math.min(...rig.layers.map(l=>l.rect[1])),bottom=Math.max(...rig.layers.map(l=>l.rect[1]+l.rect[3]));
 const sy=unit.targetHeight/(bottom-top),sx=unit.maxWidth?Math.min(sy*rig.aspect,unit.maxWidth/(right-left)):sy*rig.aspect;
 const point=([x,y])=>[(x-(left+right)/2)*sx,(bottom-y)*sy];
 const body=rig.layers.find(l=>l.part==='body')??rig.layers[0],hip=point(body.pivot),face=point(rig.face??[.5,.25]);
 const bones=[{name:'root'},{name:'hip',parent:'root',x:hip[0],y:hip[1]},{name:'head',parent:'hip',x:face[0]-hip[0],y:face[1]-hip[1]}];
 const positions=new Map([['root',[0,0]],['hip',hip],['head',face]]),slots=[],attachments={};
 for(const layer of rig.layers){
  const part=kebab(layer.part),bone=part==='body'?'hip':part==='head'?'head':part,pivot=bone==='hip'?hip:bone==='head'?face:point(layer.pivot);
  if(!positions.has(bone)){bones.push({name:bone,parent:'hip',x:pivot[0]-hip[0],y:pivot[1]-hip[1]});positions.set(bone,pivot);}
  const [x,y,w,h]=layer.rect,center=point([x+w/2,y+h/2]);
  slots.push({name:part,bone,attachment:part});attachments[part]={[part]:{x:center[0]-pivot[0],y:center[1]-pivot[1],width:w*sx,height:h*sy}};
 }
 for(const [name,parent,x,y] of [
  ['hp-anchor','head',-face[0],unit.targetHeight+48-face[1]],['vfx-origin','hip',-hip[0],unit.targetHeight*.52-hip[1]],
 ])bones.push({name,parent,x,y});
 for(const [socket,legacy] of [['main-hand','mainHand'],['off-hand','offHand']]){
  const authored=rig.sockets?.[legacy];const parent=authored&&positions.has(kebab(authored[0]))?kebab(authored[0]):'hip';
  bones.push({name:socket,parent,x:authored?authored[1]*sx/(rig.height*rig.aspect):unit.targetHeight*.2,y:authored?authored[2]*sy/rig.height:0});
 }
 const skeleton={skeleton:{spine:CONFIG.runtimeVersion+'.00',x:-(right-left)*sx/2,y:0,width:(right-left)*sx,height:unit.targetHeight},bones,slots,skins:[{name:'default',attachments}],events:{hit:{},cast:{},'ult-start':{},'ult-end':{}},animations:{},laneC:{status:'placeholder',source:`assets/cardrpg-look/v3-puppets/${unit.id}.rig.json`,tool:'puppet-to-spine.mjs'}};
 for(const name of unit.animations){
  const spec=CONFIG.animations[name],duration=(spec.seconds[0]+spec.seconds[1])/2,t=f=>+(f*duration).toFixed(4),rotation=(amplitude)=>[{time:0,value:0},{time:t(.5),value:amplitude},{time:duration,value:0}];
  const tracks={root:{translate:[{time:0,x:0,y:0},{time:duration,x:0,y:0}]}};
  if(['idle','idle-phase2','victory'].includes(name)){
   tracks.hip={scale:[{time:0,x:1,y:1},{time:t(.5),x:.995,y:1.012},{time:duration,x:1,y:1}]};tracks.head={rotate:rotation(name==='victory'?4:1.4)};
   if(positions.has('tail'))tracks.tail={rotate:rotation(4)};
   for(const part of ['cape','scarf','wing-l','wing-r'])if(positions.has(part))tracks[part]={rotate:rotation(3)};
  }else if(name==='appear')tracks.root.translate=[{time:0,x:-80,y:0},{time:t(.7),x:4,y:0},{time:duration,x:0,y:0}];
  else if(name==='ko')tracks.hip={rotate:[{time:0,value:0},{time:t(.8),value:-68},{time:duration,value:-72}],translate:[{time:0},{time:duration,y:-unit.targetHeight*.25}]};
  else if(name==='hurt')tracks.hip={rotate:rotation(7),translate:[{time:0},{time:t(.25),x:-18},{time:duration}]};
  else {
   tracks.hip={rotate:[{time:0,value:0},{time:t(.24),value:3},{time:t(.55),value:-4},{time:duration,value:0}]};
   const hand=positions.has('arm-r')?'arm-r':positions.has('prop')?'prop':'head';tracks[hand]={rotate:[{time:0,value:0},{time:t(.25),value:-12},{time:t(.55),value:14},{time:duration,value:0}]};
   if(name==='attack')tracks.root.translate=[{time:0},{time:t(.25),x:-15},{time:t(.48),x:24},{time:duration}];
  }
  const clip={bones:tracks};if(Object.keys(spec.events).length)clip.events=Object.entries(spec.events).map(([name,f])=>({time:t(f),name}));skeleton.animations[name]=clip;
 }
 const folder=resolve(ROOT,unit.folder,'placeholder');await mkdir(folder,{recursive:true});
 const {data,info}=await sharp(resolve(ROOT,`assets/cardrpg-look/v3-puppets/${rig.atlas}`)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let p=0;p<data.length;p+=4)for(let c=0;c<3;c++)data[p+c]=Math.round(data[p+c]*data[p+3]/255);
 await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png({compressionLevel:9}).toFile(resolve(folder,unit.files.png));
 const atlas=[`${unit.id}.png`,`size: ${info.width},${info.height}`,'format: RGBA8888','filter: Linear,Linear','repeat: none','pma: true'];
 for(const layer of rig.layers){const [x,y,w,h]=layer.atlasRect;atlas.push(kebab(layer.part),`bounds: ${Math.round(x*info.width)},${Math.round(y*info.height)},${Math.round(w*info.width)},${Math.round(h*info.height)}`);}
 await writeFile(resolve(folder,unit.files.atlas),atlas.join('\n')+'\n');await writeFile(resolve(folder,unit.files.json),JSON.stringify(skeleton,null,2)+'\n');
 const checked=await validateDelivery(folder,unit);receipts.push({id:unit.id,verdict:checked.verdict,metrics:checked.metrics,issues:checked.issues});
 if(!checked.accepted)console.error(unit.id,checked.issues);
}
await mkdir(resolve(ROOT,'reports/cardrpg-c/spine'),{recursive:true});await writeFile(resolve(ROOT,'reports/cardrpg-c/spine/placeholder-validation.json'),JSON.stringify(receipts,null,2)+'\n');
console.log(JSON.stringify({units:receipts.length,accepted:receipts.filter(r=>r.verdict!=='FIX').length}));if(receipts.some(r=>r.verdict==='FIX'))process.exitCode=1;
