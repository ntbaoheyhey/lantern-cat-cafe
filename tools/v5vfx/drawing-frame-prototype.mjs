/** Serialized into the diagnostic browser; no application edits. */
export function installDrawingFramePrototype({extended=false}={}){
 const drawings=[...window.__depthScene.actors.values()].flatMap(e=>e.craftPose?.drawing?[e.craftPose.drawing]:[]);
 const original=drawings[0].point,source=String(original);
 const begin=source.search(/const resting\s*=/),end=source.search(/const frame\s*=\s*m\.poses\[key\]/);
 if(begin<0||end<=begin)throw Error('Drawing frame prototype anchors changed');
 const block=source.slice(begin,end),body=block.replace(/let lift\s*=/,'lift =');
 if(body===block)throw Error('Drawing lift declaration changed');
 const derived=extended?`cache.leanPixels=height*lean;cache.liftPixels=height*lift;
  cache.head=motion.look*m.opaqueHeight*.008;cache.turn=motion.turn*.004;cache.weight=.009*motion.weight;cache.nod=m.opaqueHeight*.006*motion.nod;
  cache.earX=motion.ear*2.3+motion.hair*.5;cache.earFlat=motion.earFlatten*m.poses[key].face[3]*.12;cache.earY=motion.ear*1.6;
  cache.accessoryX=motion.accessory*1.4;cache.accessoryY=motion.accessory*2-motion.handLift*m.opaqueHeight*.008;
  cache.smear=clip==='attack'&&!reduced&&ms>=270&&ms<330?.12*Math.sin((ms-270)/60*Math.PI):0;`:'';
 const replacement=`let lift,lean;const cache=${extended?'weights?this.__cxvFrame:this.__cxvSeekFrame':'this.__cxvFrame'};
  if(weights&&cache.valid){lift=cache.lift;lean=cache.lean;}else{
   ${body}
   ${extended?'':'if(weights)'}{cache.lift=lift;cache.lean=lean;${derived}cache.valid=true;}
  }\n`;
 let tail=source.slice(end);
 if(extended){
  const patterns=[
   [/height\s*\*\s*lean/g,'leanPixels'],[/height\s*\*\s*lift/g,'liftPixels'],
   [/motion.look\s*\*\s*m.opaqueHeight\s*\*\s*0?\.008/g,'head'],[/motion.turn\s*\*\s*0?\.004/g,'turn'],[/0?\.009\s*\*\s*motion.weight/g,'weight'],[/m.opaqueHeight\s*\*\s*0?\.006\s*\*\s*motion.nod/g,'nod'],
   [/motion.ear\s*\*\s*2\.3\s*\+\s*motion.hair\s*\*\s*0?\.5/g,'earX'],[/motion.earFlatten\s*\*\s*fh\s*\*\s*0?\.12/g,'earFlat'],[/motion.ear\s*\*\s*1\.6/g,'earY'],
   [/motion.accessory\s*\*\s*1\.4/g,'accessoryX'],[/motion.accessory\s*\*\s*2\s*-\s*motion.handLift\s*\*\s*m.opaqueHeight\s*\*\s*0?\.008/g,'accessoryY'],
   [/0?\.12\s*\*\s*Math.sin\(\(ms\s*-\s*270\)\s*\/\s*60\s*\*\s*Math.PI\)/g,'smear'],
  ];
  for(const [pattern,key]of patterns){if(!pattern.test(tail))throw Error('Derived frame anchor missing: '+key);pattern.lastIndex=0;tail=tail.replace(pattern,`cache.${key}`);}
 }
 const candidate=source.slice(0,begin)+replacement+tail;
 const compile=text=>new Function('smooth','NO_OVERLAP','return ({'+text+'}).point;')(t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);},[]);
 const implementations=[compile(source),compile(candidate)];
 const controller={active:0,restores:[],candidate};
 for(const d of drawings){
  const sample=d.sample;d.__cxvFrame={valid:false,lift:0,lean:0};d.__cxvSeekFrame={valid:false,lift:0,lean:0};
  d.sample=function(...args){this.__cxvFrame.valid=false;return sample.apply(this,args);};
  d.point=function(...args){return implementations[controller.active].apply(this,args);};
  controller.restores.push(()=>{d.point=original;d.sample=sample;delete d.__cxvFrame;delete d.__cxvSeekFrame;});
 }
 window.__cxvDrawingFrame=controller;
 return {drawings:drawings.length,valuesPerDrawing:extended?14:2,extended,method:'Tool-only sample invariants, invalidated before every sample. Weighted mesh path only; arbitrary points and explicit seeks keep the original arithmetic. Shared point dispatch in both modes; no per-vertex storage or per-frame allocation.'};
}
