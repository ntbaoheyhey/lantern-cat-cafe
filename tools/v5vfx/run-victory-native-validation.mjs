import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');assert((await readFile(resolve(root,'apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx'),'utf8')).includes('const requestDraw='));
const parent=resolve(root,'work/v5/CXV/films/V7-F-victory-scheduling-native');assert(!existsSync(parent));await mkdir(parent,{recursive:true});
for(const stage of ['delivery','lifecycle']){
 const dir=resolve(parent,stage),env={...process.env,CXV_CAPTURE_OUT:dir,CXV_VICTORY_SCHEDULER:'native',CXV_VICTORY_MODES:'native',CXV_VICTORY_BUFFERED_BACKDROP:'1',CXV_MEASURE_OUT:resolve(root,'reports/v5/CXV/V7-F-victory-native-delivery.json'),CXV_SUMMARY_OUT:resolve(root,'reports/v5/CXV/V7-F-victory-native-lifecycle.json')};
 const capture=stage==='delivery'?'probe-image-delivery-decode.mjs':'experiment-victory-demand.mjs',measure=stage==='delivery'?'measure-image-delivery-decode.mjs':'measure-victory-demand.mjs';
 for(const [step,script] of [['capture',capture],['measure',measure]]){
  const result=spawnSync(process.execPath,[resolve(root,'tools/v5vfx',script)],{cwd:root,env,encoding:'utf8',timeout:180000,maxBuffer:2000000});await writeFile(resolve(parent,stage+'-'+step+'.log'),result.stdout+result.stderr);assert.equal(result.status,0,stage+' '+step+': '+result.stderr);
 }
 console.log(JSON.stringify({stage,ended:new Date().toISOString()}));
}
