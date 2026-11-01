import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root='/Users/bao/.codex/worktrees/mega-base0-finish-mutants/taskbar-hero';
const out='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-COORDINATOR/mutations';
const web=resolve(root,'apps/web');
const overrides={CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_PORT_CLASSIC:'4400',E2E_PORT_V2:'4401',E2E_PORT_SERVER:'4402',E2E_PORT_API:'4403',E2E_VIEWPORT:'1280x720'};
const env={...process.env,...overrides};
const results=JSON.parse(readFileSync(resolve(out,'results.json'),'utf8'));
function git(args){return spawnSync('git',args,{cwd:root,encoding:'utf8'}).stdout;}
const head=git(['rev-parse','HEAD']).trim();
writeFileSync(resolve(out,'supplement-source-stamp.json'),JSON.stringify({head,root,pnpm:spawnSync('pnpm',['--version'],{encoding:'utf8'}).stdout.trim(),node:process.version,env:overrides,initialStatus:git(['status','--short']),base:'1fb25ed',ports:[4400,4401,4402,4403,4404],adaptations:'effects exact-source temporary sibling copy changes only const port 5198 to 4404; no import-resolution changes, retries, assertions or timeouts changed. Mutant source restored in finally. Frozen pnpm install used; no tracked dependency changes.'},null,2));
function save(){writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));writeFileSync(resolve(out,'handoff.md'),`# BASE0 mutation handoff\n\nHEAD ${head}; isolated worktree ${root}.\n\n${results.length} completed runs: ${results.filter(r=>r.kind==='mutant'&&r.status==='killed').length} killed, ${results.filter(r=>r.kind==='mutant'&&r.status==='survived').length} survived, ${results.filter(r=>r.status==='issue').length} issues. In progress until completed.json exists.\n\nEvidence: results.json, source-stamp.json, per-case .diff/.log/.json, integrated-source.diff. No product fixes, commits, pushes or remote writes.\n`);}
function pngs(dir){if(!existsSync(dir))return [];return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?pngs(resolve(dir,e.name)):e.name.endsWith('.png')?[resolve(dir,e.name)]:[]);}
function run(name,args,{cwd=web,extra={},kind='control',contract=null,expected=null}={}){
 if(!readFileSync(resolve(out,'../CONTROL.md'),'utf8').startsWith('ACTIVE:')) throw new Error('Coordinator card stopped');
 const effective={...env,...extra};
 const ports=spawnSync('lsof',['-nP','-iTCP:4400','-iTCP:4401','-iTCP:4402','-iTCP:4403','-iTCP:4404','-sTCP:LISTEN'],{encoding:'utf8'});
 if(ports.stdout.trim())throw new Error('Owned port collision before '+name+': '+ports.stdout);
 const meta={name,kind,head,cwd,args,env:{...overrides,...extra},start:new Date().toISOString(),portFreeCheckExit:ports.status};
 writeFileSync(resolve(out,name+'.json'),JSON.stringify(meta,null,2));
 console.log('START',name,meta.start);
 const r=spawnSync(args[0],args.slice(1),{cwd,env:effective,encoding:'utf8',maxBuffer:64*1024*1024});
 let log=(r.stdout??'')+(r.stderr??'');
 let contractExit=null,reason='';
 if(contract){try{reason=contract();contractExit=0;}catch(e){contractExit=1;reason=e.message;}}
 const testExit=r.status;const combinedExit=testExit===0?(contractExit??0):testExit;
 const expectedFailure=expected?expected.test(log):contractExit===1;
 const actualAssertionFailure = !r.signal && !r.error && ((testExit === 1 && expected && expectedFailure) || (testExit === 0 && contractExit === 1 && /SCREENSHOTS=0 wrote [1-9]|Viewport artifact contract: expected/.test(reason)));
 const status=kind==='control'?(combinedExit===0?'passed':'issue'):(combinedExit===0?'survived':actualAssertionFailure?'killed':'issue');
 const result={...meta,end:new Date().toISOString(),testExit,contractExit,combinedExit,status,reason,expectedFailurePattern:expected?.source??null,signal:r.signal,error:r.error?.message??null};
 writeFileSync(resolve(out,name+'.log'),'COMMAND '+JSON.stringify(args)+'\nCWD '+cwd+'\nENV '+JSON.stringify(meta.env)+'\nHEAD '+head+'\n'+log+`\nTEST_EXIT=${testExit}\nCONTRACT_EXIT=${contractExit}\nCOMBINED_EXIT=${combinedExit}\nCONTRACT_DETAIL=${reason}\n`);
 writeFileSync(resolve(out,name+'.json'),JSON.stringify(result,null,2));results.push(result);save();console.log('DONE',name,status,'test',testExit,'contract',contractExit);
 if(kind==='control' && status!=='passed') throw new Error('Control failed: '+name);
 return result;
}
function mutate(name,path,old,replacement,args,options={}){
 const file=resolve(root,path);const before=readFileSync(file,'utf8');if(before.split(old).length!==2)throw new Error(name+' exact source occurrence is not one');
 writeFileSync(file,before.replace(old,replacement));
 try{writeFileSync(resolve(out,name+'.diff'),git(['diff','--',path]));return run(name,args,{...options,kind:'mutant'});}finally{writeFileSync(file,before);writeFileSync(resolve(out,name+'-restored-status.txt'),git(['status','--short']));}
}
const clockTests=['pnpm','--filter','@taskbar-hero/supabase-tests','exec','vitest','run','src/fixture-clock.test.ts','src/forge.test.ts','v2/functions-forge.test.ts'];
run('control-clock-recovery-before',clockTests,{cwd:root});
mutate('claim-fixture-too-early','supabase/tests/v2/functions-forge.test.ts','clock = Math.max(clock, Math.ceil(before.lastClaimMicros / 1000) + 10_000);','clock = Math.max(clock, Math.floor(before.lastClaimMicros / 1000) + 9_999);',clockTests,{cwd:root,expected:/FAIL.*functions-forge.test.ts/});
run('control-clock-recovery-after',clockTests,{cwd:root});
const clean=git(['status','--short']);writeFileSync(resolve(out,'source-clean.txt'),clean||'CLEAN\n');
writeFileSync(resolve(out,'completed.json'),JSON.stringify({head,completed:new Date().toISOString(),clean:clean==='',runs:results.length,mutants:results.filter(r=>r.kind==='mutant').length,killed:results.filter(r=>r.kind==='mutant'&&r.status==='killed').length,survivors:results.filter(r=>r.status==='survived').map(r=>r.name),issues:results.filter(r=>r.status==='issue').map(r=>r.name),historicalSetupFailure:'Originalrunner exact-occurrence guard rejected ambiguous clock mutation before applying it; not a mutant outcome; recovered with statement-specific selector.'},null,2));save();
