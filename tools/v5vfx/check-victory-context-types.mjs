/** Full web semantic check of the exact prototype or native outcome source. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash,victoryModule} from './victory-demand-source.mjs';
import {victoryContextSource} from './victory-context-source.mjs';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),require=createRequire(resolve(app,'package.json')),ts=require('typescript');
const target=resolve(root,victoryModule),original=readFileSync(target,'utf8'),prototype=process.env.CXV_CONTEXT_TEST==='1',source=prototype?(process.env.CXV_CONTEXT_CANDIDATE?readFileSync(resolve(process.env.CXV_CONTEXT_CANDIDATE),'utf8'):victoryContextSource(original)):original;
const config=ts.readConfigFile(resolve(app,'tsconfig.json'),ts.sys.readFile);assert(!config.error);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,app,{noEmit:true},resolve(app,'tsconfig.json'));
const host=ts.createCompilerHost(parsed.options),getSourceFile=host.getSourceFile;host.getCurrentDirectory=()=>app;
if(prototype)host.getSourceFile=(path,languageVersion,onError,create)=>resolve(path)===target?ts.createSourceFile(path,source,languageVersion,true):getSourceFile(path,languageVersion,onError,create);
const program=ts.createProgram(parsed.fileNames,parsed.options,host),diagnostics=ts.getPreEmitDiagnostics(program);
const report={utc:new Date().toISOString(),scope:'Full web tsconfig,no emit,no dotenv',prototype,victorySha256:hash(source),diagnostics:diagnostics.length,formatted:ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>app,getCanonicalFileName:p=>p,getNewLine:()=>"\n"}),pass:diagnostics.length===0};
const output=resolve(process.env.CXV_CONTEXT_TYPES_REPORT??resolve(root,'reports/v5/CXV/V7-E-victory-context-'+(prototype?'prototype-':'')+'types.json'));assert(output.startsWith(resolve(root,'reports/v5/CXV')+'/'));writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,pass:report.pass,diagnostics:report.diagnostics}));if(diagnostics.length){console.error(report.formatted.split('\n').slice(0,30).join('\n'));process.exitCode=1;}
