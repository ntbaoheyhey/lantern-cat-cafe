// Temporary contract preview: resolve A's published snapshot without changing A-owned paths.
import {createRequire} from 'node:module';import {resolve} from 'node:path';
const require=createRequire(resolve('apps/web/package.json')),ts=require('typescript'),file=resolve('apps/web/tsconfig.json');
const config=ts.readConfigFile(file,ts.sys.readFile),parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,resolve('apps/web'));
if(process.env.CARDRPG_RULES)parsed.options.paths={...parsed.options.paths,'@taskbar-hero/game-rules/cardrpg':[process.env.CARDRPG_RULES+'/cardrpg/index.ts'],'@taskbar-hero/game-rules/src/*':[process.env.CARDRPG_RULES+'/*']};
process.chdir(resolve('apps/web'));
const program=ts.createProgram(parsed.fileNames,{...parsed.options,noEmit:true});const diagnostics=ts.getPreEmitDiagnostics(program);
console.log(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>process.cwd(),getNewLine:()=>"\n"}));process.exitCode=diagnostics.length?1:0;
