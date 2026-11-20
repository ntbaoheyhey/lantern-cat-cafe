// REFERENCE: display-precision50. Extend original current TRAIN prefixes, never rerun them.
import assert from 'node:assert/strict';
import {readFile,writeFile,open,mkdir,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const root='reports/cardrpg-big/a5/b1/display-precision-50',sha=b=>createHash('sha256').update(b).digest('hex');
const reg=JSON.parse(await readFile(root+'/REGISTERED-METHOD.json'));
assert.equal(reg.count,500);assert.equal(reg.prefixCount,50);assert.equal(reg.acceptanceSeedsUsed,false);
await mkdir(root+'/logs',{recursive:true});
const exists=async p=>{try{await readFile(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
assert(!await exists(root+'/complete.json'),'Original precision sample is already complete.');
for(const[p,h]of Object.entries(reg.inputs))assert.equal(sha(await readFile(p)),h,p);
const control=JSON.parse(await readFile(reg.control));
if(!await exists(root+'/balance/partial.json')){
 assert.equal(control.count,50);assert.equal(control.rows.length,384);assert.deepEqual(control.source,reg.combatSource);
 await mkdir(root+'/balance',{recursive:true});
 const rows=structuredClone(control.rows);
 for(const r of rows){assert(r.complete);assert.match(r.outcomes,/^[0-3]{50}$/);assert.equal(r.digest,sha(JSON.stringify(r.outcomes)));r.complete=false;delete r.digest;}
 await writeFile(root+'/balance/partial.json',JSON.stringify({source:reg.combatSource,sample:'train',count:500,scope:'equipped',rows}));
}
let code,slice=1+Math.max(0,...(await readdir(root+'/logs')).map(p=>Number(p.match(/^slice-(\d+)\.log$/)?.[1]??0)));
do{
 for(const[p,h]of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+p)),h,p);
 for(const[p,h]of Object.entries(reg.scripts))assert.equal(sha(await readFile(p)),h,p);
 const partial=JSON.parse(await readFile(root+'/balance/partial.json'));
 assert.equal(partial.rows.length,384);
 for(let i=0;i<384;i++){assert.equal(partial.rows[i].key,control.rows[i].key);assert.equal(partial.rows[i].outcomes.slice(0,50),control.rows[i].outcomes);}
 const log=root+'/logs/slice-'+slice+++'.log',fd=await open(log,'wx');
 try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 independent TRAIN precision50',process.execPath,root+'/matrix.mjs'],{env:{...process.env,BIG_RULES_ROOT:reg.sourceRoot,BIG_BALANCE_SAMPLE:'train',BIG_BALANCE_COUNT:'500',BIG_BALANCE_SCOPE:'equipped',BIG_BALANCE_OUT:root+'/balance'},stdio:['ignore',fd.fd,fd.fd]});child.on('error',reject);child.on('close',done);});}finally{await fd.close();}
 console.log(JSON.stringify({log,code}));assert(code===0||code===75);await delay(7000);
}while(code===75);
await writeFile(root+'/complete.json',JSON.stringify({complete:true,count:500,preservedPrefixCount:50,acceptanceSeedsUsed:false})+'\n');
