// Each render yields the shared timing window before the next asset.
import { spawn } from 'node:child_process';
import { withTimingLock } from './lock.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire('/Users/bao/tools/cardrpg-look/npm/package.json');
const sharp = require('sharp');
const owners = process.argv.slice(2);
const rows = [];
await mkdir('assets/cardrpg-look/portraits', {recursive:true});
for (const cat of owners) {
  for (const turntable of process.env.LOOK_RENDER_MODE === 'portrait' ? [false] : [false, true]) {
    await withTimingLock(`LOOK ${cat} ${turntable ? 'turntable' : 'portrait'}`, () => new Promise((resolve, reject) => {
      const child = spawn('/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender', ['--background', '--threads', '4', '--python', 'tools/cardrpg-look/blender/render.py', '--', '--cat', cat, ...(turntable ? ['--turntable'] : [])], {stdio:'inherit'});
      child.on('error', reject); child.on('close', code => code === 0 ? resolve() : reject(Error(`Render ${cat}: ${code}`)));
    }));
    if (!turntable) for (const [suffix, width] of [['1x',256],['2x',512]]) {
      const path = `assets/cardrpg-look/portraits/${cat}-${suffix}.webp`;
      await sharp(`assets/cardrpg-look/portraits/source/${cat}.png`).resize(width,width*1.25,{kernel:'lanczos3'}).webp({quality:92,alphaQuality:100,effort:6}).toFile(path);
      rows.push({cat,scale:suffix,path,width,height:width*1.25});
    }
  }
  await new Promise((resolve, reject) => {
    const child = spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','12','-i',`reports/cardrpg-look/turntables/${cat}/frames/%03d.png`,'-vf','format=yuv420p','-c:v','libx264','-crf','19',`reports/cardrpg-look/turntables/${cat}/turntable.mp4`],{stdio:'inherit'});
    child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(`Video ${cat}: ${code}`)));
  });
  await writeFile(`assets/cardrpg-look/portraits/${cat}-packing.json`,JSON.stringify(rows.filter(r=>r.cat===cat),null,2)+'\n');
}
