/** Proposed one-source flight phases made only from bounded published samples. */
export function rangedFlightDesigns(manifest,impactPatch,method='palette-phases'){
 const designs=structuredClone(impactPatch.designs);
 for(const element of ['ember','heavy','shadow','tide','ice']){
  const base=manifest.designs[`kit.${element}.impact`];
  const launchKey=element==='ember'?'kit.heavy.charge':element==='heavy'?'kit.magic.release':element==='ice'?'kit.ice.charge':`kit.${element}.release`;
  const launch=structuredClone(manifest.designs[launchKey].layers[0]);
  launch.role='launch';launch.offsetMs=0;launch.gainDb=-13;launch.eq=element==='tide'?'flat':'high-pass-80';
  launch.variants=launch.variants.map(v=>({...v,duration:Math.min(v.duration,.04),variantId:v.variantId+'/ranged-launch-40ms'}));
  const travelKey=method==='common-travel'?'kit.magic.release':element==='ice'?'kit.holy.release':element==='tide'?'kit.tide.release':'kit.magic.release';
  const travel=structuredClone(manifest.designs[travelKey].layers.find(l=>l.role==='foley'));
  travel.role='travel';travel.offsetMs=0;travel.gainDb=-15;travel.eq='high-pass-80';
  travel.variants=travel.variants.map(v=>{if(v.duration<.06)throw Error('Published sample is too short');return {...v,start:v.start+.035,duration:.025,variantId:v.variantId+'/ranged-travel-35-60ms'};});
  const pitchRange=element==='ice'&&method==='palette-pitch'?[1.34,1.42]:base.pitchRange;
  for(const [phase,layer]of [['release',launch],['travel',travel]])designs[`kit.ranged-${element}.${phase}`]={bus:'sfx',layers:[layer],pitchRange,gainRange:[-1,1],cooldownMs:0,priority:50};
  if(element==='ice'&&method==='palette-pitch')designs['kit.ranged-ice.impact'].pitchRange=pitchRange;
 }
 return designs;
}
