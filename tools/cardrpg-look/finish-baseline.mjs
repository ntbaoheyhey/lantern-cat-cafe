import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {withTimingLock} from './lock.mjs';
const root='reports/cardrpg-look/baseline';
let receipt;
while(true){receipt=JSON.parse(await readFile(`${root}/captures.json`,'utf8'));if(receipt.endedAt)break;await new Promise(r=>setTimeout(r,10000));}
const ready=JSON.parse(await readFile(`${root}/hub-ready/captures.json`,'utf8'));
await mkdir(`${root}/attempts/hub-loading`,{recursive:true});
for(const row of ready.rows){
 const original=receipt.rows.find(r=>r.file===row.file);
 await rename(`${root}/${row.file}`,`${root}/attempts/hub-loading/${row.file}`);
 await rename(`${root}/hub-ready/${row.file}`,`${root}/${row.file}`);
 await writeFile(`${root}/attempts/hub-loading/${row.file}.json`,JSON.stringify(original,null,2));
 receipt.rows[receipt.rows.indexOf(original)]=row;
}
receipt.corrections=['Hub captures replaced only after waiting for __depthPreviewScene.ready; first loading-state attempts retained.'];
await writeFile(`${root}/captures.json`,JSON.stringify(receipt,null,2));
await withTimingLock('LOOK baseline image metrics',()=>new Promise((resolve,reject)=>{const child=spawn('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-look/metrics/images.py',root],{stdio:'inherit'});child.on('error',reject);child.on('close',c=>c===0?resolve():reject(Error(`metrics ${c}`)))}));
console.log(JSON.stringify({captures:receipt.rows.length,errors:receipt.rows.reduce((n,r)=>n+r.errors.length,0),artifact:receipt.sha256,bytes:(await stat('docs/cardrpg3/index.html')).size}));
