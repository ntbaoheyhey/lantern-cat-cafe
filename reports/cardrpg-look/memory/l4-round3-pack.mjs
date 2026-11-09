// Continue the existing render, never launch a second Blender coordinator.
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
const pid=65141,source='tools/cardrpg-look/blender/flipbooks.py';
while(true){try{process.kill(pid,0)}catch(error){if(error.code==='ESRCH')break;throw error}await new Promise(resolve=>setTimeout(resolve,5000));}
const sha=createHash('sha256').update(await readFile(source)).digest('hex');
for(const family of ['smoke','steam','flame','sparkle','yarn-dust','ribbon'])for(let first=0;first<36;first+=6){
 const r=JSON.parse(await readFile(`assets/cardrpg-look/flipbooks/source/${family}/receipt-${String(first).padStart(3,'0')}.json`));
 if(r.round!==3||r.sourceSha256!==sha||r.rows.length!==6)throw Error(`Incomplete round3: ${family}/${first}`);
 for(const frame of r.rows)if(createHash('sha256').update(await readFile(frame.file)).digest('hex')!==frame.sha256)throw Error(`Changed frame ${frame.file}`);
}
const run=(command,args)=>new Promise((resolve,reject)=>{const child=spawn(command,args,{stdio:'inherit'});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${command}: ${code}`)))});
await run('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-look/pack-flipbooks.py','assets/cardrpg-look/flipbooks']);
const dest='reports/cardrpg-look/rounds/flipbooks/round-3';await mkdir(dest,{recursive:true});
await cp('assets/cardrpg-look/flipbooks',`${dest}/assets`,{recursive:true});await cp(source,`${dest}/flipbooks.py`);
await writeFile(`${dest}/packed.json`,JSON.stringify({at:new Date().toISOString(),sourceSha256:sha,reviewed:false},null,2)+'\n');
console.log('Round3 packed and preserved; source-art visual review is still required.');
