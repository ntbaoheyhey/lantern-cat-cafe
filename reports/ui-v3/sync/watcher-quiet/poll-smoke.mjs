import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync, statSync, writeFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/ui-v3/sync/watcher-quiet';
const stamp=path=>{try{return statSync(path).mtimeMs}catch{return 0}};
const heartbeat='reports/ui-v3/sync/heartbeat.json';
const failure='reports/ui-v3/sync/last-error.txt';
const before=stamp(heartbeat), priorFailure=stamp(failure);
const child=spawn(process.execPath,['tools/ui-v3/sync-watch.mjs'],{stdio:['ignore','pipe','pipe']});
let stdout='',stderr='';
child.stdout.on('data',bytes=>stdout+=bytes);
child.stderr.on('data',bytes=>stderr+=bytes);
const finished=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',(code,signal)=>resolve({code,signal}));});
try {
  const deadline=Date.now()+55000;
  while(stamp(heartbeat)===before&&stamp(failure)===priorFailure&&Date.now()<deadline&&child.exitCode===null) await delay(250);
  assert.equal(stamp(failure),priorFailure,'poll should not create an error receipt');
  assert.notEqual(stamp(heartbeat),before,'real watcher must finish one poll');
} finally {child.kill('SIGTERM');await finished;writeFileSync(out+'/after.log',stdout+stderr);}
assert.equal(stderr,'','expected missing historical report must stay quiet');
const receipt={status:'PASS',command:'node tools/ui-v3/sync-watch.mjs',stdoutBytes:Buffer.byteLength(stdout),stderrBytes:Buffer.byteLength(stderr),heartbeat:JSON.parse(readFileSync(heartbeat,'utf8')),note:'Stopped only the smoke child after its first successful live poll; no STOP-UI file was created.'};
writeFileSync(out+'/poll.json',JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
