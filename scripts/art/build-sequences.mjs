import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
export const catalog={
 mochi:{element:{palette:['#ffe9a7','#e7ab52','#28243d'],grade:'lantern-gold'},camera:'push_in',motif:'shield-dome',target:'all-allies',soundKit:'lantern-brass'},
 soot:{element:{palette:['#ffc18e','#bc6aff','#170f30'],grade:'arcane-ember'},camera:'dutch_push',motif:'falling-meteors',target:'enemy-row',soundKit:'cinder-witch'},
 clover:{element:{palette:['#efffba','#70cf9c','#122f2b'],grade:'garden-alchemy'},camera:'orbit_parallax',motif:'petal-storm',target:'all-allies',soundKit:'glass-garden'},
 panko:{element:{palette:['#fff1d0','#d9a463','#33271f'],grade:'warm-toast'},camera:'whip_pan',motif:'shield-bash',target:'enemy-front',soundKit:'crumb-bronze'},
 mallow:{element:{palette:['#fff4b7','#ff864c','#3e2031'],grade:'hearth-flare'},camera:'drop_from_above',motif:'ground-eruption',target:'all-enemies',soundKit:'oven-roar'},
 sorrel:{element:{palette:['#defab9','#9db580','#213b36'],grade:'forest-mist'},camera:'pull_out_wide',motif:'needle-rain',target:'enemy-column',soundKit:'herbal-rain'},
 biscuit:{element:{palette:['#fff7c9','#e7b56b','#3d2525'],grade:'golden-bake'},camera:'whip_pan',motif:'slash-arcs',target:'single-enemy',soundKit:'baker-steel'},
 inkcap:{element:{palette:['#e0d1ff','#a176c2','#1d203f'],grade:'violet-ink'},camera:'dutch_push',motif:'ink-splash',target:'all-enemies',soundKit:'inkwell-pop'},
 cinnamon:{element:{palette:['#ffebac','#d98661','#3d2030'],grade:'spice-glow'},camera:'push_in',motif:'teapot-summon',target:'single-ally',soundKit:'cinnamon-steam'},
 brioche:{element:{palette:['#fff0dc','#e58cb3','#332139'],grade:'rose-sugar'},camera:'orbit_parallax',motif:'ribbon-vortex',target:'all-allies',soundKit:'sugar-chime'},
 velvet:{element:{palette:['#d5eeff','#77abd8','#162540'],grade:'moon-ice'},camera:'pull_out_wide',motif:'moon-beam',target:'enemy-row',soundKit:'velvet-bell'},
 marigold:{element:{palette:['#ffffc9','#eacb68','#313525'],grade:'sun-tea'},camera:'drop_from_above',motif:'paper-cranes',target:'all-allies',soundKit:'petal-harp'},
 'yarn-giant':{element:{palette:['#ffd8e0','#c565a5','#2e1b3b'],grade:'yarn-shadow'},camera:'pull_out_wide',motif:'yarn-whale',target:'all-enemies',soundKit:'wool-thunder'},
};
const all=process.argv.includes('--all'),ids=all?Object.keys(catalog):['mochi','soot','clover'];
for(const id of ids){
 const signature=catalog[id],skill=id==='yarn-giant'?'enemy:yarn-giant':id+'-4';
 const timeline=JSON.parse(await readFile(resolve(root,'assets/cardrpg-look/vfx-layered',skill.replaceAll(':','-')+'.json'),'utf8'));
 const dir=resolve(root,'skills',id);await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,'signature.json'),JSON.stringify(signature,null,2)+'\n');
 const camera={push_in:[1.12,0,0,0],whip_pan:[1.08,.05,0,0],dutch_push:[1.1,0,0,-.035],drop_from_above:[1.08,0,.035,0],orbit_parallax:[1.06,.025,.015,.015],pull_out_wide:[1,0,0,0]}[signature.camera];
 const sequence={tier:'ultimate',duration:3600,impact:3200,
  camera:[{t:0,zoom:1,x:0,y:0,tilt:0},{t:650,zoom:camera[0],x:camera[1],y:camera[2],tilt:camera[3]},{t:950,zoom:1,x:0,y:0,tilt:0},{t:3200,zoom:1,x:0,y:0,tilt:0},{t:3600,zoom:1,x:0,y:0,tilt:0}],
  time:[{t:0,value:.05},{t:650,value:.25},{t:950,value:1},{t:3200,value:0},{t:3300,value:1}],
  dim:[{t:0,value:.7},{t:650,value:.5},{t:950,value:0},{t:3200,value:0}],
  cutin:{start:150,end:650,portrait:'/units/'+id+'/portrait.webp',name:timeline.name},
  casterAnim:[{t:0,name:'ult'},{t:550,event:'ult_release'}],targetAnim:[{t:3200,name:'hurt'}],
  vfx:[{type:'painted-layer',source:skill,anchor:'target',blend:'add'},{type:'shader',source:signature.motif,anchor:'caster',blend:'screen'},{type:'particles',source:signature.element.grade,anchor:'target',blend:'add'}],
  postfx:[{t:0,bloom:.2,aberration:0,vignette:.65},{t:3200,bloom:1,shockwave:true,aberration:.006,vignette:.4},{t:3280,bloom:.2,aberration:0,vignette:.3},{t:3600,bloom:0,aberration:0,vignette:.2}],
  audio:[{t:0,cue:'ult.'+id+'.charge'},{t:150,cue:'voice.'+id+'.ult'},{t:950,cue:'ult.'+id+'.release'},{t:3200,cue:'ult.'+id+'.impact'},{t:3400,cue:'ult.'+id+'.tail'}],
  damage:[{t:3200,target:'resolved-targets',split:1}],plate:{id:id+'-ult',start:950,end:3200}};
 await writeFile(resolve(dir,'sequence.json'),JSON.stringify({...timeline,sequence},null,2)+'\n');
 const plate={version:1,id:id+'-ult',unit:id,title:timeline.name,width:1280,height:720,fps:30,frames:68,signature,
  layers:[{type:'background',start:0,end:68},{type:'speed-lines',start:0,end:68,mode:signature.camera==='whip_pan'?'linear':'radial'},
   {type:'caster',start:0,end:58,source:'/units/'+id+'/runtime.webp'},
   {type:'painted-layer',start:12,end:68,source:'/assets/cardrpg-look/vfx-layered/'+skill.replaceAll(':','-')+'.webp',region:timeline.layers.find(l=>l.name==='core-shape')?.region??timeline.layers[0].region},
   {type:'motif',start:8,end:68},{type:'particles',start:0,end:68,count:48},{type:'impact-frame',start:51,end:52},{type:'flash',start:64,end:68},{type:'grade',start:0,end:68}]};
 await writeFile(resolve(root,'tools/cinematic-compositor/plates',id+'-ult.json'),JSON.stringify(plate,null,2)+'\n');
}
console.log('Prepared '+ids.length+' distinct signatures, sequences and plate timelines');
