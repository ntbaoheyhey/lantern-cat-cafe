import type { CardEffectLayer as Layer, CardEffectRecipe as Recipe } from './card-effect-data';
import type { CardEffectPrimitive as Primitive } from './card-effect-primitives';
// Each row keeps a whole cat. Motifs are procedural cafe objects, never rules.
// MX0 weakest-first batches: Soot/Velvet/Cinnamon; Sorrel/Inkcap/Brioche;
// Panko/Mallow/Clover; Marigold/Mochi/Biscuit.
interface Identity { color:string; accent:string; cores:readonly Primitive[]; ground:Primitive; sprite:number; soft:boolean; trail:Primitive; }
const identities:Record<string,Identity>={
 soot:{color:'#b179ae',accent:'#ffd291',cores:['ember','cup','wick','lantern','ink-stain'],ground:'ink-stain',sprite:0,soft:true,trail:'comet'},
 velvet:{color:'#bc8abd',accent:'#ffcfaa',cores:['needle','comet','wick','veil','bow'],ground:'crescent',sprite:0,soft:false,trail:'yarn-fan'},
 cinnamon:{color:'#e7a074',accent:'#ffe5a3',cores:['spice-star','cup','apron-cloth','serving-bell','sprout'],ground:'light-pool',sprite:5,soft:true,trail:'comet'},
 sorrel:{color:'#9abbd7',accent:'#e7e6ff',cores:['spoon','teapot','crescent','teapot','droplet'],ground:'crescent',sprite:3,soft:false,trail:'wave'},
 inkcap:{color:'#b08bd4',accent:'#efd5ee',cores:['knot','ink-cap','paper-cat','ink-cap','paper-cat'],ground:'ink-stain',sprite:2,soft:false,trail:'yarn-fan'},
 brioche:{color:'#d8b278',accent:'#fff2bf',cores:['night-bell','blanket','collar','constellation','button'],ground:'star',sprite:4,soft:true,trail:'comet'},
 panko:{color:'#d99868',accent:'#ffe3ad',cores:['pan','bread','tray','oven','handle'],ground:'knock-ring',sprite:5,soft:true,trail:'wave'},
 mallow:{color:'#ec9068',accent:'#ffd27a',cores:['whisk','flame','spice-star','flame','ember'],ground:'ink-stain',sprite:2,soft:true,trail:'comet'},
 clover:{color:'#8dceab',accent:'#f2e5a6',cores:['leaf','cup','wreath','greenhouse','sprout'],ground:'wreath',sprite:1,soft:false,trail:'wave'},
 marigold:{color:'#edb874',accent:'#fff1b2',cores:['seed-pod','flower-bell','shears','watering-can','flower-bell'],ground:'wreath',sprite:5,soft:false,trail:'wave'},
 mochi:{color:'#edbd73',accent:'#fff0be',cores:['door','lantern','apron','roof','window'],ground:'light-pool',sprite:4,soft:true,trail:'comet'},
 biscuit:{color:'#dda475',accent:'#ffecc0',cores:['roller','tray','crumb-crown','bread','roller'],ground:'seam',sprite:5,soft:true,trail:'yarn-fan'},
};
const l=(primitive:Primitive,motion:Layer['motion'],anchor:Layer['anchor'],o:Partial<Layer>={}):Layer=>({primitive,motion,anchor,start:.42,end:.9,count:1,size:.8,spread:.6,height:.25,turns:.2,offset:[0,0,0],aspect:[1,1,1],ground:false,accent:false,opacity:.85,...o});
/** Only called once during lookV2 preparation; legacy recipes remain immutable. */
export function fullRecipes(base:Record<string,Recipe>,cats:readonly string[]):Record<string,Recipe>{
 const result:Record<string,Recipe>={...base};
 for(const cat of cats){const identity=identities[cat];if(!identity)continue;
  for(let i=0;i<5;i++){const id=cat+'-'+(i===4?'passive':i+1),old=base[id];if(!old)continue;
   const ultimate=i===3,passive=i===4,core=identity.cores[i]!,target=ultimate||old.layers.some(layer=>layer.anchor==='all-targets')?'all-targets':'target',support=old.target==='friendly';
   const style=i===0?'hold':i===1?(support?'rise':'pour'):i===2?'cross':'hold';
   const particles=l(identity.soft?'soft-particle':'motif-particle','emit',target,{start:.49,end:.98,count:ultimate?18:12,size:ultimate?.34:.28,spread:ultimate?1.1:.65,height:.38,spriteRow:identity.sprite,accent:true,opacity:.92,emitter:{mode:'burst',life:.82,velocity:[.7,ultimate?1.3:.85,.5],gravity:-1.5,curl:.22,inherit:.18}});
   result[id]={...old,authored:true,color:identity.color,accent:identity.accent,layers:[
    l(core,'pulse','caster',{start:.08,end:.34,size:passive?.45:.55,height:.7,offset:[-.55,0,.12],opacity:.68}),
    l(identity.ground,'pulse','caster',{start:.12,end:.43,size:ultimate?1.25:.75,height:.035,ground:true,opacity:.44}),
    l(identity.trail,'projectile',target,{start:.30,end:.52,size:ultimate?1.05:.70,height:.55,aspect:[1.8,.7,1],opacity:.78}),
    l(core,style,target,{start:.48,end:ultimate?.90:.74,size:ultimate?1.40:1.12,height:ultimate?.6:.55,offset:[support?.65:0,0,.18],spread:i===2?.6:.25,count:i===2?2:1,turns:i===2?.3:0,opacity:.9}),
    l(identity.ground,'expand',target,{start:.51,end:1,size:ultimate?1.8:1.15,height:.045,ground:true,opacity:.5,accent:true}),
    particles,
    l('motif-particle','emit',target,{start:.64,end:1,count:ultimate?7:4,size:.12,height:.28,spriteRow:identity.soft?6:identity.sprite,accent:false,opacity:.6,emitter:{mode:'rate',life:.4,velocity:[.4,.55,.3],gravity:-.4,curl:.18,inherit:0}}),
   ]};
   const layers=result[id]!.layers;
   // Impact silhouettes sit on the landing: travel is a separate layer and
   // cannot still be half-way across the mat when the rules hit is shown.
   if(cat==='soot'&&i===0){layers[5]!.size=.39;layers[3]=l('spark','expand',target,{start:.49,end:.71,size:1.18,height:.55,offset:[.42,0,.32],accent:true,opacity:.94});layers[5]!.spriteRow=3;}
   if(cat==='soot'&&i===1){layers[3]!.offset=[.58,0,.15];layers.push(l('knock-ring','shrink',target,{start:.45,end:.67,size:1.1,height:.65,opacity:.76,accent:true}));}
   if(cat==='soot'&&i===2){layers[3]!.count=1;layers[3]!.motion='rise';layers[3]!.size=1.5;layers[3]!.offset=[.72,0,.38];layers[3]!.height=.7;layers[3]!.accent=true;layers[5]!.size=.38;layers[5]!.spriteRow=3;}
   if(cat==='velvet'&&i===0){layers[3]!.motion='cross';layers[3]!.count=3;layers[3]!.size=.9;layers[3]!.spread=.55;layers[3]!.accent=true;}
   if(cat==='velvet'&&i===1){layers[5]!.size=.36;layers[3]=l('wick','orbit',target,{start:.48,end:.78,count:3,size:.5,spread:.7,height:.5,opacity:.9,accent:true});layers[5]!.spriteRow=6;}
   if(cat==='velvet'&&i===2){layers[3]=l('flame','shrink',target,{start:.48,end:.72,size:1.2,height:.55,accent:true,opacity:.9});layers[5]!.primitive='soft-particle';layers[5]!.spriteRow=3;}
   if(cat==='cinnamon'&&i===2){layers[3]!.size=.62;layers[3]!.opacity=.66;layers[3]!.spread=.85;layers[3]!.offset=[0,0,.14];layers[5]!.spriteRow=1;}
   if(cat==='sorrel'&&i===0){layers[3]!.motion='cross';layers[3]!.count=1;layers[3]!.accent=true;layers.push(l('droplet','pour',target,{start:.50,end:.79,size:.62,height:.8,offset:[.4,0,.2],opacity:.86}));}
   if(cat==='sorrel'&&i===1){layers[3]!.motion='pour';layers[5]!.spriteRow=3;layers[3]!.offset=[.65,0,.1];}
   if(cat==='sorrel'&&i===2){layers[3]!.count=2;layers[3]!.motion='orbit';layers[3]!.spread=.72;layers[3]!.size=.76;}
   if(cat==='inkcap'&&i===0){layers[3]!.motion='cross';layers[3]!.count=3;layers[3]!.size=.72;layers[3]!.accent=true;}
   if(cat==='inkcap'&&i===1){layers[3]!.motion='rise';layers[3]!.size=1.05;layers[3]!.offset=[.48,0,.18];layers[3]!.accent=true;layers[5]!.spriteRow=2;layers[5]!.size=.46;}
   if(cat==='inkcap'&&i===2){layers[3]!.motion='rise';layers[3]!.count=1;layers[3]!.offset=[.85,0,.15];layers[3]!.size=.85;}
   if(cat==='brioche'&&i===0){layers[3]!.motion='pulse';layers[3]!.size=1.18;layers[3]!.offset=[.62,0,.18];layers[3]!.accent=true;}
   if(cat==='brioche'&&i===1){layers[3]!.opacity=.62;layers[3]!.size=.9;layers[3]!.offset=[.72,0,.15];}
   if(cat==='brioche'&&i===2){layers[3]!.motion='cross';layers[3]!.count=2;layers[3]!.spread=.6;layers[3]!.size=.8;layers[5]!.spriteRow=4;}
   if(cat==='panko'&&i===0){layers[3]!.motion='cross';layers[3]!.count=1;layers[3]!.size=1.1;layers[3]!.offset=[.38,0,.18];layers[5]!.spriteRow=5;}
   if(cat==='panko'&&i===1){layers[3]!.motion='rise';layers[3]!.opacity=.68;layers[3]!.offset=[.78,0,.38];layers[3]!.size=1.08;}
   if(cat==='panko'&&i===2){layers[3]!.motion='sweep';layers[3]!.count=1;layers[3]!.aspect=[1.3,.7,1];layers[3]!.size=1.05;}
   if(cat==='mallow'&&i===0){layers[3]!.motion='cross';layers[3]!.accent=true;layers[5]!.spriteRow=2;layers[5]!.size=.4;}
   if(cat==='mallow'&&i===1){layers[3]!.motion='sweep';layers[3]!.count=3;layers[3]!.size=.66;layers[3]!.spread=.8;layers[5]!.spriteRow=3;}
   if(cat==='mallow'&&i===2){layers[3]!.motion='shrink';layers[3]!.count=1;layers[3]!.size=1.2;layers[5]!.spriteRow=3;layers[5]!.size=.45;layers[5]!.primitive='soft-particle';}
   if(cat==='clover'&&i===0){layers[3]!.motion='cross';layers[3]!.count=3;layers[3]!.size=.62;layers[3]!.spread=.4;layers[5]!.size=.36;}
   if(cat==='clover'&&i===1){layers[3]!.motion='rise';layers[3]!.size=.8;layers[3]!.offset=[.65,0,.16];layers[5]!.primitive='soft-particle';layers[5]!.spriteRow=1;}
   if(cat==='clover'&&i===2){layers[3]!.motion='expand';layers[3]!.count=1;layers[3]!.size=.95;layers[3]!.opacity=.68;layers[4]!.size=.82;layers[4]!.opacity=.34;layers[5]!.spriteRow=1;}
   if(cat==='marigold'&&i===0){layers[3]!.motion='rise';layers[3]!.count=3;layers[3]!.size=.64;layers[3]!.spread=.65;layers[3]!.offset=[.42,0,.2];layers[3]!.accent=true;layers[5]!.spriteRow=7;}
   if(cat==='marigold'&&i===1){layers[3]!.motion='orbit';layers[3]!.size=.8;layers[3]!.spread=.55;layers[3]!.offset=[0,0,.15];layers[5]!.spriteRow=5;}
   if(cat==='marigold'&&i===2){layers[3]!.count=1;layers[3]!.size=1.2;layers[3]!.accent=true;layers[5]!.size=.36;layers[5]!.spriteRow=5;}
   if(cat==='mochi'&&i===0){layers[3]!.motion='shrink';layers[3]!.size=1.15;layers[3]!.offset=[.4,0,.15];layers[5]!.size=.36;}
   if(cat==='mochi'&&i===1){layers[3]!.motion='rise';layers[3]!.size=1.0;layers[3]!.offset=[.78,0,.28];layers[3]!.accent=true;}
   if(cat==='mochi'&&i===2){layers[3]!.count=2;layers[3]!.size=.75;layers[3]!.opacity=.64;layers[3]!.spread=.85;}
   if(cat==='biscuit'&&i===0){layers[3]!.motion='cross';layers[3]!.size=1.05;layers[3]!.accent=true;layers[5]!.spriteRow=0;}
   if(cat==='biscuit'&&i===1){layers[3]!.motion='sweep';layers[3]!.size=.9;layers[3]!.offset=[.5,0,.1];layers[5]!.spriteRow=5;}
   if(cat==='biscuit'&&i===2){layers[3]!.count=1;layers[3]!.motion='shrink';layers[3]!.size=1.25;layers[3]!.accent=true;layers[5]!.spriteRow=5;}
   if(passive){
    // Passive identities live beside the body; the old large footglow hid them.
    layers[3]!.size=.88;layers[3]!.offset=[.75,0,.35];layers[3]!.height=.62;
    layers[3]!.opacity=.88;layers[3]!.accent=true;layers[4]!.size=.65;layers[4]!.opacity=.18;
    layers[5]!.count=6;layers[5]!.size=.22;layers[5]!.spread=.45;
    if(cat==='soot'){layers[3]!.primitive='crescent';layers[3]!.motion='orbit';layers[3]!.count=2;layers[3]!.spread=.38;}
    if(cat==='cinnamon'){layers[3]!.primitive='spice-star';layers[3]!.motion='cross';layers[3]!.count=3;layers[3]!.size=.48;layers[3]!.spread=.5;}
    if(cat==='clover'){layers[3]!.primitive='leaf';layers[3]!.motion='rise';layers[3]!.count=2;layers[3]!.size=.72;layers[3]!.spread=.45;}
    if(cat==='sorrel'){layers[3]!.motion='pour';layers[3]!.height=1.0;layers[3]!.size=.7;}
    if(cat==='brioche'){layers[3]!.motion='orbit';layers[3]!.count=3;layers[3]!.size=.48;layers[3]!.spread=.42;}
   }
   // Signature cinematics retain sculpted silhouettes with individually timed motifs.
   if(ultimate){
    const layers=result[id]!.layers;
    // A short bright impact leaves room for the signature silhouette and afterglow.
    layers[4]!.opacity=.28;layers[4]!.size=1.35;
    layers[5]!.start=.50;layers[5]!.size=.38;
    if(cat==='mochi'){layers[3]!.size=1.16;layers[3]!.opacity=.72;layers[3]!.offset=[.42,0,.08];}
    if(cat==='mochi')layers.push(l('lantern','orbit',target,{start:.43,end:.98,count:3,size:.38,height:.52,spread:.82,opacity:.86,accent:true}));
    if(cat==='soot')layers.push(l('constellation','expand',target,{start:.46,end:.83,size:1.65,height:.65,opacity:.84,accent:true}));
    if(cat==='clover')layers[3]=l('greenhouse','rise',target,{start:.18,end:.99,size:1.24,height:.44,offset:[0,0,-.4],opacity:.88});
    if(cat==='panko'){layers[3]!.offset=[.82,0,.28];layers[3]!.size=1.22;}
    if(cat==='panko')layers.push(l('handle','cross',target,{start:.48,end:.75,count:2,size:.85,spread:.8,height:.4,opacity:.8,accent:true}));
    if(cat==='mallow')layers[3]=l('flame','sweep',target,{start:.38,end:.78,count:3,size:.92,height:.38,spread:1.05,opacity:.82});
    if(cat==='sorrel'){layers[3]!.size=.9;layers[3]!.opacity=.70;layers[3]!.offset=[.58,0,.14];}
    if(cat==='sorrel')layers.push(l('crescent','orbit',target,{start:.44,end:.95,count:2,size:.65,height:.48,spread:.82,opacity:.8,accent:true}));
    if(cat==='biscuit'){layers[3]!.size=.9;layers[3]!.opacity=.62;layers[3]!.offset=[.65,0,.2];}
    if(cat==='biscuit')layers.push(l('roller','sweep',target,{start:.5,end:.77,size:1.15,height:.3,spread:.9,opacity:.8}));
    if(cat==='inkcap')layers.push(l('paper-cat','rise',target,{start:.47,end:.9,count:2,size:.52,height:.35,spread:.8,opacity:.84,accent:true}));
    if(cat==='cinnamon'){layers[3]!.size=1.05;layers[3]!.opacity=.68;}
    if(cat==='cinnamon')layers.push(l('spice-star','orbit',target,{start:.46,end:.94,count:4,size:.48,height:.5,spread:.8,opacity:.85,accent:true}));
    if(cat==='brioche')layers.push(l('collar','cross',target,{start:.44,end:.86,count:2,size:.76,height:.3,spread:.65,opacity:.84,accent:true}));
    if(cat==='velvet')layers.push(l('needle','fall',target,{start:.46,end:.88,count:3,size:.75,height:1.1,spread:.8,opacity:.8,accent:true}));
    if(cat==='marigold'){layers[3]!.size=.84;layers[3]!.opacity=.64;layers[3]!.offset=[.68,0,.14];}
    if(cat==='marigold')layers.push(l('flower-bell','rise',target,{start:.48,end:.98,count:3,size:.44,height:.35,spread:.75,opacity:.83,accent:true}));
    // Put the signature beside/above the silhouette, not in its depth shadow.
    layers[5]!.start=.45;layers[5]!.size=.45;
    if(cat==='mochi'){layers[3]!.size=1.55;layers[3]!.height=1.0;layers[3]!.offset=[.25,0,.55];layers[3]!.opacity=.62;}
    if(cat==='soot'){layers[3]!.size=1.1;layers[3]!.height=.7;layers[3]!.offset=[.85,0,.60];layers[3]!.opacity=.72;layers[7]!.height=1.05;layers[7]!.size=1.85;layers[7]!.offset=[.55,0,.4];}
    if(cat==='panko'){layers[3]!.offset=[1.0,0,.58];layers[3]!.height=.4;layers[3]!.size=1.45;layers[3]!.opacity=.78;}
    if(cat==='biscuit'){layers[3]=l('roller','orbit',target,{start:.46,end:.85,count:2,size:.9,spread:.95,height:.5,offset:[.35,0,.4],opacity:.84,turns:.5});layers[7]!.primitive='bread';layers[7]!.size=.65;layers[7]!.opacity=.55;}
    if(cat==='inkcap'){layers[3]!.size=1.6;layers[3]!.height=1.05;layers[3]!.offset=[.50,0,.40];layers[3]!.opacity=.88;layers[7]!.height=.6;layers[7]!.spread=1.1;}
    if(cat==='cinnamon'){layers[3]!.offset=[.95,0,.55];layers[3]!.size=1.15;layers[3]!.height=.45;}
    if(cat==='brioche'){layers[3]!.motion='orbit';layers[3]!.height=.85;layers[3]!.spread=.95;layers[7]!.size=.58;layers[7]!.opacity=.62;}
    if(cat==='velvet'){layers[3]!.size=1.65;layers[3]!.height=.8;layers[3]!.offset=[.5,0,.4];layers[3]!.aspect=[1.2,1.25,1];layers[3]!.opacity=.66;layers[7]!.height=1.6;layers[7]!.spread=1.1;layers[7]!.aspect=[1,2.1,1];layers[7]!.size=.95;}
    if(cat==='marigold'){layers[4]!.primitive='petal';layers[4]!.count=4;layers[4]!.spread=.8;layers[4]!.size=.55;layers[3]!.offset=[.85,0,.4];}

   }
  }
 }
 return result;
}

/** Chapter-one enemy silhouettes keep their authored geometry and timing. */
export function fullEnemyRecipes(base:Record<string,Recipe>):Record<string,Recipe>{
 const result={...base};
 const ids=['button-guard','sock-skipper','spool-ram','needle-moth','teacup-healer','kettle-knight','yarn-giant'];
 for(const owner of ids)for(const suffix of ['',':basic']){
  const id='enemy:'+owner+suffix,old=base[id];if(!old)continue;
  const basic=!!suffix,threads=owner==='sock-skipper'||owner==='needle-moth'||owner==='yarn-giant';
  const target=old.layers.some(layer=>layer.anchor==='all-targets')?'all-targets':'target';
  const layers=old.layers.map(layer=>({...layer,offset:[...layer.offset] as [number,number,number]}));
  // Hostile plum/red vocabulary; enemy healing keeps its helpful pale mint core.
  result[id]={...old,authored:true,color:owner==='teacup-healer'?'#a9bdb3':'#b96f88',accent:owner==='kettle-knight'?'#f4a577':'#edbac4',layers};
  layers.push(l(threads?'motif-particle':'soft-particle','emit',target,{start:.50,end:.96,count:basic?7:12,size:basic?.25:.33,height:.35,spriteRow:threads?0:owner==='kettle-knight'?2:5,opacity:.82,emitter:{mode:'burst',life:.75,velocity:[.65,.9,.5],gravity:-1.2,curl:.17,inherit:.1}}));
  if(!layers.some(layer=>layer.ground))layers.push(l('seam','expand',target,{start:.52,end:.96,size:1.05,height:.04,ground:true,opacity:.35}));
  if(!basic&&owner==='spool-ram'){
   layers[0]={...layers[0]!,start:.04,end:.50,size:1.05,accent:true};
   layers.push(l('knock-ring','pulse','caster',{start:.05,end:.5,size:1.3,height:.05,ground:true,opacity:.55}));
  }
  if(owner==='yarn-giant')layers.push(l('yarn-fan','sweep',target,{start:.43,end:.79,size:basic?.85:1.5,height:.2,spread:basic?.6:1.25,opacity:.65,accent:true}));
  if(owner==='sock-skipper')layers.push(l('seam','cross',target,{start:.51,end:.76,count:2,size:.7,height:.45,spread:.4,opacity:.86}));
  if(owner==='kettle-knight')layers.push(l('flame','rise',target,{start:.53,end:.82,count:2,size:.46,height:.15,spread:.65,opacity:.65}));
 }
 return result;
}
