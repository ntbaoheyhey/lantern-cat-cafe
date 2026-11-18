/** Existing focused behavior suites plus full semantic web check for the two notice files. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/notice-checks');assert(!existsSync(out));await mkdir(out,{recursive:true});
const json=resolve(out,'vitest.json'),log=await open(resolve(out,'vitest.log'),'w');let code;
try{code=await new Promise((done,reject)=>{const child=spawn(resolve(appRoot,'node_modules/.bin/vitest'),['run','--config',resolve(root,'tools/v5vfx/notice-vitest.config.mjs'),'--reporter=json','--outputFile',json],{cwd:root,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
assert.equal(code,0,'Focused behavior suites failed');const result=JSON.parse(await readFile(json));assert(result.success&&result.numFailedTests===0&&result.numPassedTests>0);
const ts=require('typescript'),config=ts.readConfigFile(resolve(appRoot,'tsconfig.json'),ts.sys.readFile);assert(!config.error);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,appRoot,{noEmit:true},resolve(appRoot,'tsconfig.json'));
const program=ts.createProgram(parsed.fileNames,parsed.options),diagnostics=ts.getPreEmitDiagnostics(program);
await writeFile(resolve(out,'typecheck.log'),ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>appRoot,getCanonicalFileName:p=>p,getNewLine:()=>"\n"}));
const files={};for(const p of ['apps/web/src/game/cardrpg/depth/Battle.tsx','apps/web/src/game/cardrpg/depth/depth.css'])files[p]=hash(await readFile(resolve(root,p)));
const report={utc:new Date().toISOString(),tests:result.numPassedTests,failedTests:result.numFailedTests,typeErrors:diagnostics.length,files,vitest:{path:json,sha256:hash(await readFile(json))},
 scope:'Existing scene context/density/loading/bounds, playback clock, battle scene loader and battle controls suites; full web tsconfig semantic check without emit or dotenv.',pass:result.success&&diagnostics.length===0};
await writeFile(resolve(root,'reports/v5/CXV/V7-F-battle-notice-checks.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));assert(report.pass);
