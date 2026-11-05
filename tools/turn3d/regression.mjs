// Exactly comparable native screenshots; no image resizing or visual tolerance.
import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
const dir='reports/turn3d';
if(!process.argv.includes('--compare-only')){
 execFileSync(process.execPath,['tools/turn3d/capture.mjs'],{stdio:'inherit'});
 await fs.copyFile(dir+'/effect-captures.jsonl',dir+'/effect-captures-baseline.jsonl');
 execFileSync(process.execPath,['tools/turn3d/capture.mjs'],{stdio:'inherit'});
}
const read=async name=>(await fs.readFile(dir+'/'+name,'utf8')).trim().split('\n').map(s=>JSON.parse(s));
const a=await read('effect-captures-baseline.jsonl'),b=await read('effect-captures.jsonl');assert.equal(a.length,b.length);
const mismatches=a.flatMap((x,i)=>x.sha256===b[i].sha256?[]:[{id:x.id,beat:x.beat}]);
const result={frames:b.length,matches:b.length-mismatches.length,mismatches,exactRepeatEqual:JSON.parse(await fs.readFile(dir+'/effect-captures.json','utf8')).exactRepeatEqual,runtime:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Two fresh Chromium capture runs, fixed seed/time and pinned existing fonts; exact SHA256 equality without transformations or tolerance.'};
await fs.writeFile(dir+'/visual-regression.json',JSON.stringify(result,null,2)+'\n');assert.deepEqual(mismatches,[]);console.log(JSON.stringify(result));
