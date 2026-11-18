/** Full web typecheck without reading dotenv or emitting application files. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),require=createRequire(resolve(app,'package.json')),ts=require('typescript');
const config=ts.readConfigFile(resolve(app,'tsconfig.json'),ts.sys.readFile);assert(!config.error);const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,app,{noEmit:true},resolve(app,'tsconfig.json'));
const host=ts.createCompilerHost(parsed.options);host.getCurrentDirectory=()=>app;
const program=ts.createProgram(parsed.fileNames,parsed.options,host),diagnostics=ts.getPreEmitDiagnostics(program);
const report={utc:new Date().toISOString(),scope:'Full native web tsconfig,no emit,no dotenv',sceneSha256:hash(readFileSync(resolve(app,'src/game/cardrpg/spine/scene.ts'))),diagnostics:diagnostics.length,formatted:ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>app,getCanonicalFileName:p=>p,getNewLine:()=>"\n"}),pass:diagnostics.length===0};
const output=resolve(root,'reports/v5/CXV/V7-F-density-types.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,pass:report.pass,diagnostics:report.diagnostics}));if(diagnostics.length)process.exitCode=1;
