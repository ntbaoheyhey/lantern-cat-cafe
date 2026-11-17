/** Typecheck the candidate in its real project without editing shared source. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {labelSearchSources,root,sourcePath} from './label-search-prototype.mjs';
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const source=labelSearchSources(),target=resolve(root,sourcePath),configPath=resolve(root,'apps/web/tsconfig.json');
assert.equal(readFileSync(target,'utf8'),source.original,'Shared source changed; recheck candidate');
const config=ts.readConfigFile(configPath,ts.sys.readFile);
assert(!config.error);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,resolve(root,'apps/web'),undefined,configPath);
assert.equal(parsed.errors.length,0);
const host=ts.createCompilerHost(parsed.options),getSourceFile=host.getSourceFile;
let transformed=0;
host.getSourceFile=(path,languageVersion,onError,shouldCreateNewSourceFile)=>{
 if(resolve(path)===target){transformed++;return ts.createSourceFile(path,source.pruned,languageVersion,true);}
 return getSourceFile(path,languageVersion,onError,shouldCreateNewSourceFile);
};
const program=ts.createProgram({rootNames:[...parsed.fileNames,resolve(root,'tools/v5vfx/label-search-contract.test.ts')],options:{...parsed.options,noEmit:true,paths:{...parsed.options.paths,vitest:[resolve(root,'apps/web/node_modules/vitest')]}},host});
const diagnostics=ts.getPreEmitDiagnostics(program);
assert.equal(transformed,1);
if(diagnostics.length)console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}).split('\n').slice(0,32).join('\n'));
const report={utc:new Date().toISOString(),config:configPath,sourcePath,originalSha256:source.originalSha256,candidateSha256:source.prunedSha256,transformed,files:program.getSourceFiles().length,diagnostics:diagnostics.length,pass:diagnostics.length===0,method:'Full apps/web semantic typecheck plus candidate contract test; compiler host substitutes only the exact label-layout module in memory. Shared application source remains unchanged.'};
writeFileSync(resolve(root,'reports/v5/CXV/V7-F-label-search-types.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));process.exitCode=diagnostics.length?1:0;
