// Six or fewer actual images per shared timing-lock window; no model service.
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {withTimingLock} from './lock.mjs';
const [kind,roundText='2',selection='all']=process.argv.slice(2);
if(!['icons','portraits','frames'].includes(kind))throw Error('Use icons, portraits or frames, then round and optional selection');
const round=Number(roundText);
if(!Number.isInteger(round)||round<1)throw Error('Round must be a positive integer');
const run=args=>new Promise((resolve,reject)=>{
 const child=spawn('/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender',['--background','--threads','4','--python',`tools/cardrpg-look/blender/art-${kind}.py`,'--','--round',String(round),...args],{stdio:'inherit'});
 const timer=setTimeout(()=>child.kill('SIGTERM'),19*60*1000);
 child.once('error',error=>{clearTimeout(timer);reject(error)});
 child.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error(`Art ${kind}: ${code}`))});
});
if(kind==='icons'){
 const [first,last]=selection==='all'?[0,48]:selection.split(':').map(Number);
 if(!Number.isInteger(first)||!Number.isInteger(last)||first<0||last>48||last<=first)throw Error('Icon range must be first:last within 0:48');
 for(let start=first;start<last;start+=6)await withTimingLock(`LOOK L6 R${round} icons ${start}-${Math.min(last,start+6)-1}`,()=>run(['--first',String(start),'--count',String(Math.min(6,last-start))]));
}else if(kind==='portraits'){
 const compositions=JSON.parse(await readFile('tools/cardrpg-look/blender/icon-compositions.json'));
 const owners=selection==='all'?[...new Set(compositions.rows.map(row=>row.id.split('-')[0]))]:selection.split(',');
 for(let first=0;first<owners.length;first+=3){
  const group=owners.slice(first,first+3).join(',');
  await withTimingLock(`LOOK L6 R${round} portraits ${group}`,()=>run(['--owners',group]));
 }
}else await withTimingLock(`LOOK L6 R${round} four rarity plates`,()=>run([]));
