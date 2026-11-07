// Original display-referred16^3 grades; RGBA strip, R fastest, then B, then G.
import {writeFile} from 'node:fs/promises';
const clamp=x=>Math.min(1,Math.max(0,x));
const palettes=[{shadow:[-.006,.006,.010],light:[.009,.003,-.006],saturation:.97},{shadow:[-.004,.008,.004],light:[.006,.007,-.007],saturation:.95},{shadow:[.002,.002,.014],light:[.008,.002,.002],saturation:.96}];
const chapters=palettes.map(p=>{const data=[];for(let g=0;g<16;g++)for(let b=0;b<16;b++)for(let r=0;r<16;r++){
 const c=[r,g,b].map(v=>v/15),y=c[0]*.2126+c[1]*.7152+c[2]*.0722;
 for(let i=0;i<3;i++){const base=y+(c[i]-y)*p.saturation,contrast=.5+(base-.5)*1.025,shadow=(1-y)**2,light=y*y;data.push(Math.round(clamp(contrast+p.shadow[i]*shadow+p.light[i]*light)*255));}data.push(255);
}return data;});
await writeFile('apps/web/src/game/squad/turn3d/look-luts.json',JSON.stringify({method:'Original analytic split tone,16-cube RGBA strip256x16; script tools/cardrpg-look/author-lut.mjs',palettes,chapters})+'\n');
