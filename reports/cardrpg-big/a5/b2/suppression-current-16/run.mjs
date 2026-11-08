import { spawn } from 'node:child_process';
import { readFile, writeFile, open, readdir, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';
const out = 'reports/cardrpg-big/a5/b2/suppression-current-16';
const reg = JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));
const sha = data => createHash('sha256').update(data).digest('hex');
for (const [path, hash] of Object.entries(reg.savedInputs)) assert.equal(sha(await readFile(path)),hash,path);
const jobs = [['day7',out+'/cohort.mjs',{A5_DAY7_OUT:out+'/day7-checks'}],
  ...Object.keys(reg.scopes).map(scope => [scope,out+'/matrix.mjs',{
    BIG_BALANCE_SCOPE:scope,BIG_BALANCE_OUT:out+'/balance/'+scope,BIG_BALANCE_SAMPLE:'pilot',BIG_BALANCE_COUNT:'50'}])];
await mkdir(out+'/logs',{recursive:true});
const completed = JSON.parse(await readFile(out+'/completed.json','utf8').catch(error => {
  if (error.code === 'ENOENT') return '[]'; throw error;
}));
for (const [name, script, env] of jobs) {
  if (completed.includes(name)) continue;
  let code, slice = 1+Math.max(0,...(await readdir(out+'/logs')).map(file => Number(file.match(new RegExp('^'+name+'-(\\d+)\\.log$'))?.[1]??0)));
  do {
    for (const [path,hash] of Object.entries(reg.source)) assert.equal(sha(await readFile(reg.sourceRoot+'/'+path)),hash,path);
    for (const [path,hash] of Object.entries(reg.scripts)) assert.equal(sha(await readFile(path)),hash,path);
    const fd = await open(`${out}/logs/${name}-${slice++}.log`,'wx');
    try {
      code = await new Promise((done,reject) => {
        const child = spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 current Hush regression '+name,process.execPath,script],
          {env:{...process.env,BIG_RULES_ROOT:reg.sourceRoot,...env},stdio:['ignore',fd.fd,fd.fd]});
        child.on('error',reject); child.on('close',done);
      });
    } finally { await fd.close(); }
    console.log(JSON.stringify({name,slice:slice-1,code}));
    await delay(7000);
  } while (code === 75);
  if (code !== 0) { process.exitCode = code??1; break; }
  completed.push(name); await writeFile(out+'/completed.json',JSON.stringify(completed));
}
