// Render actual model files in six-frame lock windows; no model service.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {withTimingLock} from './lock.mjs';
const owners=(process.env.LOOK_OWNERS||'panko,mallow,cinnamon').split(',');
const base=process.env.LOOK_TURNTABLE_OUT||'reports/cardrpg-look/turntables/l5';
const blender='/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender';
const script='tools/cardrpg-look/blender/roster-render.py';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sourceHash=hash(await readFile(script));
const run=(binary,args)=>new Promise((resolve,reject)=>{
 const child=spawn(binary,args,{stdio:'inherit',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 const timer=setTimeout(()=>child.kill('SIGTERM'),19*60*1000);
 child.once('error',e=>{clearTimeout(timer);reject(e)});
 child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error(`${binary}: ${code}`))});
});
for(const owner of owners){
 if(!/^[a-z-]+$/.test(owner))throw Error('Invalid owner');
 const source=`assets/cardrpg-look/models/${owner}.glb`,out=`${base}/${owner}`;
 const modelHash=hash(await readFile(source));
 if(await access(`${out}/frames/000.png`).then(()=>true,()=>false))throw Error(`Preserve existing frames: ${out}`);
 await mkdir(out,{recursive:true});
 for(let first=0;first<48;first+=6){
  if(hash(await readFile(script))!==sourceHash||hash(await readFile(source))!==modelHash)throw Error('Immutable turntable input changed');
  await withTimingLock(`LOOK L5 ${owner} turntable ${first}-${first+5}`,()=>run(blender,['--background','--threads','4','--python-exit-code','1','--python',script,'--','--source',source,'--out',`${out}/frames`,'--turntable','--first',String(first),'--count','6',...(['yarn-giant','kettle-knight','pantry-crown'].includes(owner)?['--boss']:[])]));
 }
 await run('ffmpeg',['-hide_banner','-loglevel','error','-n','-framerate','12','-i',`${out}/frames/%03d.png`,'-vf','format=yuv420p','-c:v','libx264','-crf','19',`${out}/turntable.mp4`]);
 await writeFile(`${out}/receipt.json`,JSON.stringify({owner,source,modelHash,script,sourceHash,frames:48,fps:12,videoSha256:hash(await readFile(`${out}/turntable.mp4`)),scope:'Actual exported model, studio rotation. Runtime animation review is separate.'},null,2)+'\n');
 console.log(JSON.stringify({owner,out,modelHash}));
}
