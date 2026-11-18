/** Typecheck either the in-memory focus read-order prototype or native web source. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
import {focusPath,reuseFocusReads} from './focus-read-source.mjs';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),require=createRequire(resolve(app,'package.json')),ts=require('typescript');
const target=resolve(root,focusPath),original=readFileSync(target,'utf8'),prototype=process.env.CXV_NATIVE_FOCUS_READ!=='1',candidate=prototype?reuseFocusReads(original):original;
const config=ts.readConfigFile(resolve(app,'tsconfig.json'),ts.sys.readFile);assert(!config.error);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,app,{noEmit:true},resolve(app,'tsconfig.json')); 
const host=ts.createCompilerHost(parsed.options),read=host.readFile;host.readFile=path=>resolve(path)===target?candidate:read(path);
host.getCurrentDirectory=()=>app;
const program=ts.createProgram(parsed.fileNames,parsed.options,host),diagnostics=ts.getPreEmitDiagnostics(program),formatted=ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>app,getCanonicalFileName:p=>p,getNewLine:()=>"\n"});
const report={utc:new Date().toISOString(),mode:prototype?'prototype':'native',scope:'Full web tsconfig, no emit; prototype replaces only identified-focus content in compiler memory.',sourceSha256:hash(original),checkedSha256:hash(candidate),diagnostics:diagnostics.length,formatted,pass:diagnostics.length===0};
const output=resolve(root,'reports/v5/CXV/V7-F-focus-read-types-'+report.mode+'.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,pass:report.pass,diagnostics:report.diagnostics}));if(diagnostics.length){console.error(formatted);process.exitCode=1;}
