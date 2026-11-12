import {readFile,readdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),all=[];
for(const id of await readdir(resolve(root,'skills'))){try{all.push({id,sig:JSON.parse(await readFile(resolve(root,'skills',id,'signature.json'),'utf8'))});}catch(e){if(e.code!=='ENOENT')throw e;}}
const fields=['element','camera','motif','target','soundKit'],pairs=[];
for(const a of all){if(fields.some(f=>!a.sig[f]))throw Error('Incomplete signature '+a.id);for(const b of all)if(a.id<b.id){const common=fields.filter(f=>JSON.stringify(a.sig[f])===JSON.stringify(b.sig[f]));if(common.length>=3)throw Error(a.id+' / '+b.id+' collide: '+common.join(', '));pairs.push({a:a.id,b:b.id,common});}}
console.log('PASS '+all.length+' signatures; maximum shared fields '+Math.max(0,...pairs.map(p=>p.common.length)));
