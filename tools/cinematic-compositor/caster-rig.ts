import {CutoutMesh} from '../../apps/web/src/game/rig/cutout';
import type {SpineActor} from '../../apps/web/src/game/cardrpg/spine/assets';
import {SPINE_CONFIG,type SpineSocket} from '../../apps/web/src/game/cardrpg/spine/config';
import {makeCasterClip} from './caster-motion.mjs';
/** Clone only pose data: field actors and their shared cached clips stay intact. */
export function preparePlateCaster(actor:SpineActor){
 const original=actor.mesh;if(!original)throw Error('Plate caster requires an articulated cutout');
 const name=actor.clips.has('ultimate')?'ultimate':'ult',cues=actor.cues(name),duration=actor.duration(name);
 const release=cues.find(q=>q.name==='ult_release'&&!q.fallback)?.time??cues.find(q=>q.name==='hit'&&!q.fallback)?.time??duration*.55;
 const motion=makeCasterClip(original.data,actor.unit.id,name,release);
 const textures=original.children.map((part:any)=>part.material.map);
 const mesh=new CutoutMesh({...original.data,clips:{...original.data.clips,[name]:motion.clip}},textures);
 mesh.proceduralTime=original.proceduralTime;mesh.zOffset=original.zOffset;
 original.dispose();actor.mesh=mesh;actor.root.add(mesh);
 actor.boneRefs.clear();
 for(const [socket,bone] of Object.entries(SPINE_CONFIG.sockets)){
  const ref=mesh.skeleton.findBone(bone);if(ref)actor.boneRefs.set(socket as SpineSocket,ref);
 }
 return {gesture:motion.gesture,joints:motion.joints};
}
