/** Alternate scheduler overrides, each with both trace-confirmed image paths. */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-F-victory-delivery-matrix');assert(!existsSync(out));await mkdir(out,{recursive:true});
const results=[];
for(const [index,mode] of ['baseline','demand','demand','baseline'].entries()){
 const name=String(index+1)+'-'+mode,dir=resolve(out,name),env={...process.env,CXV_VICTORY_SCHEDULER:mode,CXV_CAPTURE_OUT:dir,CXV_MEASURE_OUT:resolve(out,name+'-measured.json')};
 const capture=spawnSync(process.execPath,[resolve(root,'tools/v5vfx/probe-image-delivery-decode.mjs')],{cwd:root,env,encoding:'utf8',timeout:180000,maxBuffer:2000000});await writeFile(resolve(out,name+'.log'),capture.stdout+capture.stderr);assert.equal(capture.status,0,name+' capture: '+capture.stderr);
 const measured=spawnSync(process.execPath,[resolve(root,'tools/v5vfx/measure-image-delivery-decode.mjs')],{cwd:root,env,encoding:'utf8',timeout:60000,maxBuffer:2000000});await writeFile(resolve(out,name+'-measure.log'),measured.stdout+measured.stderr);assert.equal(measured.status,0,name+' measure: '+measured.stderr);
 results.push({name,mode,dir,measured:env.CXV_MEASURE_OUT});await writeFile(resolve(out,'runs.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({name,completed:new Date().toISOString(),measured:env.CXV_MEASURE_OUT}));
}
