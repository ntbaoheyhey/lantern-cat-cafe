/** Compare our encoded before/after frames; no external art or reference input. */
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
const out=resolve(root,'reports/v3-battle/a2/P1'),report=resolve(root,'reports/v3-battle/a2/V1');
for(const id of ['mochi','soot','clover','panko','brioche','yarn-giant']){
  const layers=[];
  for(const [i,frame] of [12,35,54].entries()){
    const before=resolve(out,`summon-before/${id}-${frame}.png`);
    const png=execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',resolve(root,`apps/web/public/cinematics/${id}-ult.webm`),'-vf',`select=eq(n\\,${frame}),scale=640:360`,'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],{maxBuffer:4*1024*1024});
    const label=Buffer.from(`<svg width="1280" height="30"><rect width="1280" height="30" fill="#201e29"/><text x="12" y="21" fill="white" font-family="sans-serif" font-size="16">${id} · frame ${frame} · before</text><text x="652" y="21" fill="white" font-family="sans-serif" font-size="16">after · articulated original painting</text></svg>`);
    layers.push({input:label,left:0,top:i*390},{input:await readFile(before),left:0,top:i*390+30},{input:png,left:640,top:i*390+30});
  }
  await sharp({create:{width:1280,height:1170,channels:3,background:'#201e29'}}).composite(layers).png().toFile(resolve(out,`compare-summon-${id}.png`));
}
const ids=['mochi','soot','clover','panko','biscuit','mallow','sorrel','inkcap','cinnamon','brioche','velvet','marigold','yarn-giant'],rows=[];
for(const id of ids){const log=JSON.parse(await readFile(resolve(report,id+'-ult-render.json'),'utf8'));rows.push({id,motion:log.frames[0].summonMotion.kind,peakLocalPixels:Math.max(...log.frames.map(f=>f.summonMotion.peakLocalPixels)),deterministic:log.deterministic,errors:log.errors,encoded:log.encoded});}
await writeFile(resolve(out,'summon-review.json'),JSON.stringify({_meta:evidenceMeta(),method:'Per-vertex motion before whole-image camera; reviewed encoded frames12/35/54, old version left/current version right.',rows},null,2)+'\n');
console.log('13 articulated plates; six encoded before/after comparison sheets.');
