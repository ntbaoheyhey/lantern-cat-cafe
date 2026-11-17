/** Full semantic check of the preserved candidate without changing runtime source. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash,victoryModule} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const target=resolve(root,victoryModule),input=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production');
const built=JSON.parse(readFileSync(resolve(input,'build.json'))),candidate=readFileSync(resolve(input,'candidate-VictoryCrew.tsx'),'utf8');
assert.equal(hash(readFileSync(target)),built.baselineModuleSha256);assert.equal(hash(candidate),built.candidateModuleSha256);
const configPath=resolve(root,'apps/web/tsconfig.json'),config=ts.readConfigFile(configPath,ts.sys.readFile);assert(!config.error);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,resolve(root,'apps/web'),undefined,configPath);assert.equal(parsed.errors.length,0);
const host=ts.createCompilerHost(parsed.options),getSourceFile=host.getSourceFile;let transformed=0;
host.getSourceFile=(path,languageVersion,onError,shouldCreateNewSourceFile)=>{
 if(resolve(path)===target){transformed++;return ts.createSourceFile(path,candidate,languageVersion,true);}
 return getSourceFile(path,languageVersion,onError,shouldCreateNewSourceFile);
};
const program=ts.createProgram({rootNames:parsed.fileNames,options:{...parsed.options,noEmit:true},host});
const diagnostics=ts.getPreEmitDiagnostics(program);assert.equal(transformed,1);
if(diagnostics.length)console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:x=>x,getNewLine:()=> '\n'}).split('\n').slice(0,32).join('\n'));
const report={utc:new Date().toISOString(),config:configPath,module:victoryModule,baselineModuleSha256:built.baselineModuleSha256,candidateModuleSha256:hash(candidate),files:program.getSourceFiles().length,transformed,diagnostics:diagnostics.length,pass:diagnostics.length===0,method:'Full apps/web semantic TypeScript check; compiler host replaces only VictoryCrew with the exact preserved production candidate. No application file mutation.'};
writeFileSync(resolve(root,'reports/v5/CXV/V7-F-victory-demand-types.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=diagnostics.length?1:0;
