// Register fixed S8 startup observations before any browser profiling.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/skills-v5/s8/startup',candidate=process.argv[2];assert(candidate);
const baseline='/tmp/cardrpg-a5-p1-prep/main-dist',sha=b=>createHash('sha256').update(b).digest('hex');
const a=JSON.parse(await readFile(baseline+'/build-receipt.json','utf8')),b=JSON.parse(await readFile(candidate+'/build-receipt.json','utf8'));
assert.equal(a.head,'340f88b92405ceb6b5421b207307fdbb283b2ca3');
const currentMain=JSON.parse(await readFile('reports/cardrpg-big/skills-v5/s8/main-ref.json','utf8'));assert.equal(currentMain.sha,a.head);
for(const [dir,receipt]of [[baseline,a],[candidate,b]])for(const [path,c]of Object.entries(receipt.chunks))assert.equal(sha(await readFile(dir+'/'+path)),c.sha256,path);
const script='tools/cardrpg-big/a5-startup-check.mjs',registration={registeredAt:new Date().toISOString(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),baseline:{directory:baseline,head:a.head,receiptSha256:sha(await readFile(baseline+'/build-receipt.json')),currentMain},candidate:{directory:candidate,head:b.head,receiptSha256:sha(await readFile(candidate+'/build-receipt.json'))},script,scriptSha256:sha(await readFile(script)),configs:[[1280,1],[1280,4],[1440,1]],observations:3,order:[['baseline','candidate'],['candidate','baseline'],['baseline','candidate']],gates:{loadedJsDeltaAtMost:150000,taskMedianAndMaxNotWorse:true},method:'GitHub main ref observed as340f88b9; reuse its exact original build, with fresh profiles, disabled cache, real onboarding click plus5s, every requested JS chunk hash checked. Nine observations per build, no repeats or excluded outliers; native Metal, no desktop control.'};
await mkdir(out,{recursive:true});await writeFile(out+'/REGISTERED-METHOD.json',JSON.stringify(registration,null,2)+'\n',{flag:'wx'});
await writeFile(out+'/baseline-build.json',JSON.stringify(a,null,2));await writeFile(out+'/candidate-build.json',JSON.stringify(b,null,2));console.log(JSON.stringify({out,candidate:b.head,baseline:a.head}));
