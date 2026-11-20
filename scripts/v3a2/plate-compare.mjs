/** Private review only: reference pixels never enter application assets. */
import {readFile,readdir,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {root} from './check-gates.mjs';
import {compareSheet} from './compare-sheet.mjs';
const out=resolve(root,'reports/v3-battle/a2/V1'),ref=resolve(root,'reports/v3-battle/a2/ref/V1');await mkdir(ref,{recursive:true});
const source=(await readdir('/Users/bao/Downloads')).find(n=>n.includes('ua_e236yxNM'));
if(!source)throw Error('Reference video unavailable');
const times=[8.1,8.8,9.8];
for(let i=0;i<3;i++)execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(times[i]),'-i',resolve('/Users/bao/Downloads',source),'-frames:v','1','-vf','scale=1280:-2',resolve(ref,`ref-${i}.png`)]);
for(const file of (await readdir(resolve(root,'tools/cinematic-compositor/plates'))).filter(f=>f.endsWith('.json'))){
 const id=file.slice(0,-5),layers=[];
 for(const [i,frame] of [12,35,54].entries()){
  const temp=resolve(out,`${id}-compare-row-${i}.png`);
  await compareSheet(resolve(out,`${id}-encoded-${frame}.png`),resolve(ref,`ref-${i}.png`),temp,{label:`${id} · ${['entrance','build','climax'][i]} · encoded frame ${frame}`,height:360});
  layers.push({input:await readFile(temp),left:0,top:i*396});await rm(temp);
 }
 await sharp({create:{width:1280,height:1188,channels:3,background:'#181923'}}).composite(layers).png().toFile(resolve(out,'compare-'+id+'.png'));
}
console.log('13 sheets × 3 beat rows; reference V2 seconds8.1/8.8/9.8, measurement only.');
