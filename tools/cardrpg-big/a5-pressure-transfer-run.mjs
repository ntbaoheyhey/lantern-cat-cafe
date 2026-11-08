// REFERENCE: pressure-transfer27. One native coordinator; both arms registered before any sample.
import {spawn} from 'node:child_process';
import {open,readFile,writeFile,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/a5/b1/pressure-transfer-27';
async function call(args,env,log){const fd=await open(log,'wx');try{const code=await new Promise((done,reject)=>{const c=spawn(process.execPath,args,{env:{...process.env,...env},stdio:['ignore',fd.fd,fd.fd]});c.once('error',reject);c.once('close',done);});assert.equal(code,0,log);}finally{await fd.close();}}
for(const name of ['transfer15','transfer30']){
 const dest=root+'/'+name,reg=JSON.parse(await readFile(dest+'/REGISTERED-METHOD.json'));
 await call(['tools/cardrpg-big/with-timing-lock.mjs','A5 pressure transfer27 semantic '+name,process.execPath,'tools/cardrpg-big/a5-pressure-transfer-probe.mjs',name],{BIG_RULES_ROOT:reg.sourceRoot},dest+'/pressure-semantics-attempt1.log');
 await delay(7000);
 const probe=(await readFile('tools/cardrpg-big/a5-committed-pattern-probe.mjs','utf8')).replace("const root='reports/cardrpg-big/a5/b1/committed-pattern-26',variant=process.argv[2];",`const root='${dest}',variant='candidate';`).replace("from './a4-load.mjs'","from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs'");
 const script=`/tmp/cardrpg-a5-pressure-transfer-27/${name}/semantic.mjs`;await writeFile(script,probe);
 await call(['tools/cardrpg-big/with-timing-lock.mjs','A5 pressure transfer27 compatibility '+name,process.execPath,script],{BIG_RULES_ROOT:reg.sourceRoot},dest+'/compatibility-attempt1.log');
 await delay(7000);
}
for(const name of ['transfer15','transfer30']){
 await call([root+'/'+name+'/run.mjs'],{},root+'/'+name+'/coordinator-attempt1.log');
 console.log(name+' registered matrix/cohort complete');
}
