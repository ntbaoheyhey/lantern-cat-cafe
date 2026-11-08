import {spawn} from 'node:child_process';
import {mkdir,open,readFile,writeFile,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const out='reports/cardrpg-big/a5/b3/reward-confirmation-01';
await mkdir(out,{recursive:true});
await writeFile(out+'/manifest.json',await readFile('/tmp/cardrpg-a5-b3-prep/reward-pilot-01/manifest.json'));
await writeFile(out+'/REGISTERED-METHOD.md',`# B3 reward candidate01 expanded TRAIN cohort
Registered ${new Date().toISOString()} before this expanded run. Preserve the completed5accounts/style pilot without edits. Same360stamp cap,24selector,13/24pity,+700bp and public-command policy. Expand to original A4 account seeds3001–3030,30accounts/style,45days; overlapping first5accounts are reused by exact checkpoint, not rerolled. No acceptance combat seeds. Record every outcome and censoring, firstLegendary/selector medians, byday7/14 rates and all heavy/casual currency and paid-draw ratios. This is candidate economy exploration on unchanged A4 combat; it cannot certify post-B1 progression or the first-two-boss-attempt gate. All required actual-command economy checks must later be remeasured on selected combat rules. No production mutation.110second slices/120second handoffs.
`);
try{await access(out+'/partial.json');}catch{const prior=JSON.parse(await readFile('reports/cardrpg-big/a5/b3/reward-pilot-01/partial.json','utf8'));prior.count=30;prior.reuse='Exact first5perstyle candidate01 state/receipts; no resampling';await writeFile(out+'/partial.json',JSON.stringify(prior));}
let code,slice=0;
await delay(120000);
do{const log=await open(out+`/slice-${++slice}.log`,'wx');try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 B3 candidate01 expanded TRAIN economy',process.execPath,'/tmp/cardrpg-a5-b3-prep/reward-pilot-runner.mjs'],{stdio:['ignore',log.fd,log.fd],env:{...process.env,BIG_META_OUT:out,BIG_META_ACCOUNTS:'30'}});p.on('error',reject);p.on('close',done);});}finally{await log.close();}console.log(JSON.stringify({slice,code}));if(code===75)await delay(120000);}while(code===75);process.exitCode=code;
