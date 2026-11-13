import template from '../../../../../art/rig-templates/cat.template.json';
import type {CutoutData} from './cutout';

/** Add sockets and event aliases without changing approved geometry or authored tracks. */
export function withRigContract(data:CutoutData):CutoutData {
 const aliases:Record<string,string[]>={neck:['head-pivot','head'],ear_l:['ear-l-outer','ear-l'],ear_r:['ear-r-outer','ear-r'],shoulder_l:['l-arm-upper','arm-l'],shoulder_r:['r-arm-upper','arm-r'],arm_upper_l:['l-arm-upper','arm-l'],arm_upper_r:['r-arm-upper','arm-r'],arm_lower_l:['l-arm-lower','arm-l'],arm_lower_r:['r-arm-lower','arm-r'],hand_l:['l-paw','arm-l'],hand_r:['r-paw','arm-r'],leg_l:['l-foot','foot-l'],leg_r:['r-foot','foot-r'],tail_1:['tail-1','tail'],tail_2:['tail-2','tail'],tail_3:['tail-3','tail']};
 for(const [name,parent] of template.hierarchy){
  if(!name||data.nodes.some(n=>n.name===name))continue;
  const source=data.nodes.findIndex(n=>(aliases[name]??[name.replaceAll('_','-')]).includes(n.name));
  data.nodes.push({name,parent:source>=0?source:data.nodes.findIndex(n=>n.name===parent),x:0,y:0,rotation:0,sx:1,sy:1});
 }
 for(const [canonical,legacy] of Object.entries({cast:'skill',ultimate:'ult',hit:'hurt',death:'ko',enter:'appear',stunned:'idle',frozen:'idle'})){
  if(!data.clips[canonical]&&data.clips[legacy])data.clips[canonical]=structuredClone(data.clips[legacy]);
 }
 if(data.clips.frozen)data.clips.frozen.tracks=[];
 for(const name of ['ult','ultimate','ko','death']){
  const clip=data.clips[name];if(!clip)continue;
  const event=name==='ult'||name==='ultimate'?'ult_release':'dust';
  if(!clip.events.some(e=>e.name===event))clip.events.push({name:event,time:clip.events.find(e=>e.name==='hit')?.time??clip.duration*(event==='dust'?.79:.55)});
 }
 return data;
}
