/** Reference videos are decoded only into ignored private measurement storage. */
import {readFile,readdir,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {root} from './check-gates.mjs';
const annotations=JSON.parse(await readFile(resolve(root,'scripts/v3a2/ref-annotations.json'),'utf8'));
const dir=resolve(root,'reports/v3-battle/a2/ref');await mkdir(dir,{recursive:true});
const source=(await readdir('/Users/bao/Downloads')).find(n=>n.includes('ua_e236yxNM'));
if(!source)throw Error('Main reference missing; record a fallback explicitly.');
const run=(bin,args)=>new Promise((resolve,reject)=>{const p=spawn(bin,args,{cwd:root,stdio:['ignore','ignore','pipe']});let error='';p.stderr.on('data',d=>error+=d);p.on('error',reject);p.on('close',code=>code?reject(Error(error.slice(-2000))):resolve());});
if(process.argv.includes('--decode')){
 for(const window of annotations.windows){
  const folder=resolve(dir,window.id);await mkdir(folder,{recursive:true});
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(window.start),'-i',resolve('/Users/bao/Downloads',source),'-t',String(window.seconds),'-vf','fps=10,scale=1280:-2','-q:v','3',resolve(folder,'frame-%03d.jpg')]);
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(window.start),'-i',resolve('/Users/bao/Downloads',source),'-t',String(window.seconds),'-vn','-ac','1','-ar','16000',resolve(folder,'measurement.wav')]);
  console.log(`${window.id}: ${window.start}s, 100 frames and temporary audio`);
 }
} else {
 await run(resolve(root,'tools/.venv/bin/python'),['scripts/v3a2/ref_metrics.py']);
 console.log('REF-METRICS.json written from decoded pixels, audio and explicit annotations.');
}
