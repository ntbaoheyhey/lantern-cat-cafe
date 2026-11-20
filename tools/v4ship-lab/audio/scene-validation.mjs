/** Bind actual before/after shipping journeys and preserve every remaining gate. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/scene-audio-validation-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const verify=row=>{const bytes=readFileSync(resolve(root,row.path));assert.equal(hash(bytes),row.sha256,row.path);return bytes;};
const groups={before:[],after:[]};
for(const [name,numbers] of [['before',[1,2]],['after',[3,4]]])for(const [i,number] of numbers.entries()){
 const path=`reports/v4-ship/S11/scene-journey-${number}.json`,r=read(path),raw=JSON.parse(gunzipSync(verify(r.events)));
 for(const item of r.harness)verify(item);verify(r.capture);
 assert.equal(r.viewport.width,i===0?1280:1440);assert(r.journeyPass&&r.rollback&&r.receiptVerification.pass);
 assert.equal(r.receiptVerification.receiptCount,18);assert(r.audio.primaryControlsPass&&r.audio.everyReceiptChimePass&&r.audio.sourceBudgetPass&&r.impact.observedImpactCoveragePass);
 assert.equal(r.impact.causallyPlayedContacts,124);assert(r.rehearsal.transfer.valid&&r.rehearsal.gates.noDevelopmentPath);
 const clover=raw.impact.plans.filter(p=>p.owner==='clover'&&p.expectsAction);
 for(const p of clover){
  const events=raw.impact.events.filter(e=>e.plan===p.sequence),contacts=events.filter(e=>e.role==='impact'),starts=raw.starts.filter(s=>contacts.some(e=>e.requests.includes(s.request))&&!s.loop);
  assert.equal(contacts.length,1);assert.equal(contacts[0].cue,'heal.medium');assert.equal(starts.length,1);assert(/maximize_(001|003|005|006):/.test(starts[0].variantId));
  assert(!events.some(e=>['movement','release','tail'].includes(e.role)));
 }
 assert.equal(clover.length,16);
 const first=r.impact.rows.filter((row,index,rows)=>index===0||row.scene!==rows[index-1].scene);
 groups[name].push({evidence:signed(path),events:r.events,capture:r.capture,viewport:r.viewport,sourceCommit:r.sourceCommit,
  verifiedReceipts:r.receiptVerification.receiptCount,causalContacts:r.impact.causallyPlayedContacts,healerContacts:clover.length,
  correctBattleBeds:r.sceneAudio.correctBattleBeds,battleBeds:r.sceneAudio.battles,firstContactsPredecoded:r.sceneAudio.firstContactsPredecoded,
  firstContacts:first.map(row=>({scene:row.scene,sourceCallMs:row.sourceCallAfterSubmissionMs,estimatedOnsetMs:row.estimatedAudioAfterSubmissionMs,within33ms:row.within33msEstimate})),
  allContactOnset:{maximumMs:Math.max(...r.impact.rows.map(row=>row.estimatedAudioAfterSubmissionMs)),over33ms:r.impact.rows.filter(row=>!row.within33msEstimate).length},
  mix:r.mix,mixGates:r.mixGates,duck:r.sceneAudio.duck,voiceInterruptions:r.sceneAudio.voiceInterruptions,
  maximumStartsPer100ms:r.audio.maxStartsPer100ms,sceneReadyBytes:r.rehearsal.transfer.conservativeTransferBytes,transferPass:r.rehearsal.gates.transfer,boss:r.rehearsal.boss});
}
assert(groups.before.every(r=>!r.correctBattleBeds&&!r.firstContactsPredecoded));
assert(groups.after.every(r=>r.correctBattleBeds&&r.firstContactsPredecoded),'The scene fix must have actual playback and decoded first contacts');
const changed=execFileSync('git',['diff','--name-only',groups.before[0].sourceCommit,groups.after[0].sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim().split('\n').sort();
assert.deepEqual(changed,['apps/web/src/game/cardrpg/shell/DemoJourney.audio.test.tsx','apps/web/src/game/cardrpg/shell/DemoJourney.tsx']);
assert.equal(execFileSync('git',['diff','--name-only',groups.after[0].sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim(),'');
const regPath='reports/v4-ship/S11/scene-audio-regression-1/check.json',reg=read(regPath);assert(reg.complete&&reg.rows.every(r=>r.exitCode===(r.name==='web'?1:0)));
const regressions=['healer-endurance-regression-1','scene-audio-regression-1'].map(name=>{
 const path=`reports/v4-ship/S11/${name}/log.jsonl.gz`,rows=gunzipSync(readFileSync(resolve(root,path))).toString().split('\n').filter(Boolean).map(JSON.parse),web=rows.filter(r=>r.name==='web').map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'');
 return {...signed(path),failures:web.split('\n').filter(l=>l.includes(' FAIL ')).map(l=>l.trim()),counts:web.split('\n').filter(l=>/^\s*(Test Files|Tests)\s/.test(l)).map(l=>l.trim())};
});assert.equal(regressions[0].failures.length,7);assert.deepEqual(regressions[0].failures,regressions[1].failures);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-cold-contact.md',harness:signed(relative(root,import.meta.filename)),changed,groups,
 sceneFixImplemented:true,actualBothViewportJourneysVerified:true,regression:{check:signed(regPath),logs:regressions,sameSevenArtFailures:true,gRegPass:false,officialClassParityPass:false},
 physicalOnsetVerified:false,humanListeningVerified:false,completeWeaponCoveragePass:false,overallAudioGatePass:false,
 limits:['These four actual journeys contain different random takes; loudness differences are observations, not an isolated controlled mixing experiment.','Rendered contact and output timestamps estimate audiovisual onset. No physical audio/display loopback or human listening result is inferred.','Only two post-fix journeys are recorded here; this does not replace the ten required S8 rehearsals. The initial-transfer gate remains separate.','The unchanged healer endurance is fixture evidence. It does not prove a continuous 30-minute SHIP journey with its corrected scene transitions.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),sceneFixImplemented:true,after:groups.after.map(r=>({viewport:r.viewport,mix:r.mix,first:r.firstContacts[0],sceneReadyBytes:r.sceneReadyBytes})),overallAudioGatePass:false}));
