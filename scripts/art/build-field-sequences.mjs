import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const basics={mochi:'slash',soot:'staff',clover:'throw',panko:'thrust',mallow:'staff',sorrel:'throw',biscuit:'slash',inkcap:'throw',cinnamon:'staff',brioche:'thrust',velvet:'slash',marigold:'staff'};
const motifs={mochi:['shield-pulse','rally-rays'],soot:['ember-orb','thread-snare'],clover:['vial-arc','leaf-patch'],panko:['shield-rush','crumb-fan'],mallow:['oven-ring','flame-column'],sorrel:['needle-fan','herb-spiral'],biscuit:['blade-cross','crumb-crown'],inkcap:['ink-pool','spore-cloud'],cinnamon:['tea-stream','steam-ring'],brioche:['ribbon-cross','sugar-orbit'],velvet:['crescent-cut','frost-cone'],marigold:['petal-bell','sun-rings']};
for(const [id,archetype] of Object.entries(basics)){
 const timelines=[];
 for(const n of [1,2,3]){
  const t=JSON.parse(await readFile(resolve(root,`assets/cardrpg-look/vfx-layered/${id}-${n}.json`),'utf8'));
  const basic=n===1,duration=basic?700:n===2?1300:1500,impact=basic?330:n===2?650:800,motif=basic?archetype:motifs[id][n-2];
  t.sequence={tier:basic?'basic':'active',duration,impact,
   camera:[{t:0,zoom:1,x:0,y:0,tilt:0},{t:200,zoom:basic?1:1.12,x:0,y:0,tilt:0},{t:impact,zoom:basic?1:1.04,x:0,y:0,tilt:0},{t:duration,zoom:1,x:0,y:0,tilt:0}],
   time:[{t:0,value:1},{t:impact,value:1}],dim:[{t:0,value:basic?0:.25},{t:impact,value:0}],
   casterAnim:[{t:0,name:basic?'attack':'skill'}],targetAnim:[{t:impact,name:'hurt'}],
   vfx:[{type:'painted-layer',source:t.id,anchor:'target',blend:'normal'},{type:'shader',source:motif,anchor:basic?'flight':'target',blend:'screen'},{type:'flipbook',source:'hit-spark',anchor:'target',blend:'add'},{type:'particles',source:motif,anchor:'target',blend:'add'}],
   postfx:[{t:0,bloom:0,aberration:0,vignette:.2},{t:impact,bloom:basic?.12:.3,aberration:0,vignette:.25},{t:duration,bloom:0,aberration:0,vignette:.2}],
   audio:[{t:0,cue:`skill.${id}.${n}.cast`},{t:impact,cue:`skill.${id}.${n}.impact`}],damage:[{t:impact,target:'resolved-targets',split:1}]};
  timelines.push(t);
 }
 await writeFile(resolve(root,`skills/${id}/field.json`),JSON.stringify(timelines,null,2)+'\n');
}
console.log('Prepared 12 basics in four archetypes and 24 distinct active sequences');
