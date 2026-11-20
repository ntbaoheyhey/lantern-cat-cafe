/** Bind final measurements to the same runtime; keep unverified gates false. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {decodedDuration} from './duration.mjs';
import {assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),base=resolve(root,'reports/v4-ship/S5');
const output=resolve(base,process.argv[2]??'final-check-1.json');
if(existsSync(output))throw Error('Preserve previous final check');
const read=name=>JSON.parse(readFileSync(resolve(base,name))),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const verify=item=>{const bytes=readFileSync(resolve(root,item.path));if(hash(bytes)!==item.sha256)throw Error('Changed evidence: '+item.path);return bytes;};
const coverage=read('coverage-1/check.json'),endurance=read('endurance-1/check.json');
const validations=[read('coverage-1/validation.json'),read('endurance-1/validation.json')];
const speech=read('coverage-1/intelligibility.json'),ui=read('ui-duration-2.json'),settings=read('settings-2/UI-AUDIO-SETTINGS.json');
for(const report of [coverage,endurance,ui,settings]){
 assertUnchanged(root,report.signature);
 if(JSON.stringify(report.signature)!==JSON.stringify(coverage.signature))throw Error('Mixed production runtimes');
}
for(const report of [coverage,endurance])for(const row of report.rows){verify(row.capture);verify(row.events);}
const frozen=JSON.parse(verify(speech.captureReport));
if(JSON.stringify(frozen.signature)!==JSON.stringify(coverage.signature))throw Error('Recognition runtime differs');
for(const row of speech.rows)verify(row.crop);
if(hash(gunzipSync(verify(settings.bundledLog)))!==settings.sha256)throw Error('Changed settings log');
const durationRows=endurance.rows.map(row=>{
 return {scene:row.name,wallSeconds:row.actualSeconds,...decodedDuration(resolve(root,row.capture.path)),restarts:row.restarts};
});
const measured=validations.flatMap(v=>v.rows),all=key=>validations.every(v=>v.gates[key]===true);
const gates={
 continuous30Minutes:endurance.rows.length===1&&durationRows.every(r=>r.wallSeconds>=1800&&r.encodedSeconds>=1800&&r.timestampSpanSeconds>=1800&&r.restarts>0),
 representativeScenes:['wave1','wave3','boss','home','bag','forge'].every(name=>measured.some(r=>r.name===name)),
 loudness:all('loudness'),truePeak:all('truePeak'),loudnessRange:all('loudnessRange'),
 sourceBudget:all('sourceBudget'),duckDepth:all('duckDepth'),duckRecovery:all('duckRecovery'),zeroErrors:all('zeroErrors'),
 estimatedOnset:measured.every(r=>r.estimatedOnsetPass===true),
 uiDuration:ui.pass===true&&ui.rows.length===34,
 persistedMix:settings.passed===true&&settings.tests===15,
 primaryButtonAudioCoverage:false,
 everyReceiptChime:false,
 weaponImpactCoverage:false,
 intelligibilityProxy:speech.measured===12&&speech.exact>=10&&speech.rows.every(r=>!r.interrupted),
 humanListening:speech.humanListeningPass===true,
 physicalAudibleOnset:validations.every(v=>v.physicalAudibleOnsetVerified===true)
};
const regression=read('regression-3/check.json');
const report={at:new Date().toISOString(),runtimeSignature:coverage.signature,gates,overallAudioGatePass:Object.values(gates).every(Boolean),
 regression:{commandsPassed:regression.commandsPassed,officialClassParityGate:regression.officialClassParityGate,rows:regression.rows},
 durationRows,sceneMeasurements:measured,recognition:{measured:speech.measured,exact:speech.exact,humanListeningPass:speech.humanListeningPass},
 evidence:['coverage-1/check.json','coverage-1/validation.json','endurance-1/check.json','endurance-1/validation.json','coverage-1/intelligibility.json','ui-duration-2.json','settings-2/UI-AUDIO-SETTINGS.json','regression-3/check.json'].map(name=>{const path=resolve(base,name);return {path:relative(root,path),sha256:hash(readFileSync(path))};}),
 note:'Scene coverage is separate from the uninterrupted boss recording. Device timestamps and ASR are proxies; never promote them to physical timing or human listening. Cue duration cases do not prove primary-button or receipt-chime coverage across a complete journey. The weapon/visual-event mapping also needs its own complete runtime evidence. Open gates carry to S11.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({gates,overallAudioGatePass:report.overallAudioGatePass,durationRows}));
if(!report.overallAudioGatePass)process.exitCode=1;
