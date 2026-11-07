import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
const root='/Users/bao/.codex/worktrees/mega-base0-resume-mutants/taskbar-hero';
const out='/Users/bao/.codex/worktrees/mega-deno0/taskbar-hero/reports/scorecard/base0/resume-mutations-e68eee0';
const web=resolve(root,'apps/web');
const overrides={CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_PORT_CLASSIC:'4610',E2E_PORT_V2:'4611',E2E_PORT_SERVER:'4612',E2E_PORT_API:'4613',E2E_VIEWPORT:'1280x720'};
const env={...process.env,...overrides};
const results=[];
function git(args){return spawnSync('git',args,{cwd:root,encoding:'utf8'}).stdout;}
const head=git(['rev-parse','HEAD']).trim();
writeFileSync(resolve(out,'source-stamp.json'),JSON.stringify({head,root,pnpm:spawnSync('pnpm',['--version'],{encoding:'utf8'}).stdout.trim(),node:process.version,env:overrides,initialStatus:git(['status','--short']),base:'1fb25ed',ports:[4610,4611,4612,4613,4619],adaptations:'effects exact-source temporary sibling copy changes only const port 5198 to 4619; no import-resolution changes, retries, assertions or timeouts changed. Mutant source restored in finally. Frozen pnpm install used; no tracked dependency changes.'},null,2));
function save(){writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2));writeFileSync(resolve(out,'handoff.md'),`# BASE0 mutation handoff\n\nHEAD ${head}; isolated worktree ${root}.\n\n${results.length} completed runs: ${results.filter(r=>r.kind==='mutant'&&r.status==='killed').length} killed, ${results.filter(r=>r.kind==='mutant'&&r.status==='survived').length} survived, ${results.filter(r=>r.status==='issue').length} issues. In progress until completed.json exists.\n\nEvidence: results.json, source-stamp.json, per-case .diff/.log/.json, integrated-source.diff. No product fixes, commits, pushes or remote writes.\n`);}
function pngs(dir){if(!existsSync(dir))return [];return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?pngs(resolve(dir,e.name)):e.name.endsWith('.png')?[resolve(dir,e.name)]:[]);}
function run(name,args,{cwd=web,extra={},kind='control',contract=null,expected=null}={}){
 const effective={...env,...extra};
 const ports=spawnSync('lsof',['-nP','-iTCP:4610','-iTCP:4611','-iTCP:4612','-iTCP:4613','-iTCP:4619','-sTCP:LISTEN'],{encoding:'utf8'});
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
 const status=kind==='control'?(combinedExit===0?'passed':'issue'):(combinedExit===0?'survived':expectedFailure?'killed':'issue');
 const result={...meta,end:new Date().toISOString(),testExit,contractExit,combinedExit,status,reason,expectedFailurePattern:expected?.source??null,signal:r.signal,error:r.error?.message??null};
 writeFileSync(resolve(out,name+'.log'),'COMMAND '+JSON.stringify(args)+'\nCWD '+cwd+'\nENV '+JSON.stringify(meta.env)+'\nHEAD '+head+'\n'+log+`\nTEST_EXIT=${testExit}\nCONTRACT_EXIT=${contractExit}\nCOMBINED_EXIT=${combinedExit}\nCONTRACT_DETAIL=${reason}\n`);
 writeFileSync(resolve(out,name+'.json'),JSON.stringify(result,null,2));results.push(result);save();console.log('DONE',name,status,'test',testExit,'contract',contractExit);
 return result;
}
function mutate(name,path,old,replacement,args,options={}){
 const file=resolve(root,path);const before=readFileSync(file,'utf8');if(before.split(old).length!==2)throw new Error(name+' exact source occurrence is not one');
 writeFileSync(file,before.replace(old,replacement));
 try{writeFileSync(resolve(out,name+'.diff'),git(['diff','--',path]));return run(name,args,{...options,kind:'mutant'});}finally{writeFileSync(file,before);writeFileSync(resolve(out,name+'-restored-status.txt'),git(['status','--short']));}
}
const deno=['node','--test','scripts/gen-deno-json.test.mjs'];
run('control-deno-before',deno,{cwd:root});
const gen='scripts/gen-deno-json.mjs';
for(const [name,old,replacement] of [
 ['deno-omit-explicit-index',"entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')","entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && entry.name !== 'index.ts'"],
 ['deno-omit-directory',"if (existsSync(join(full, 'index.ts'))) out[spec(full)] = `${spec(full)}/index.ts`;",''],
 ['deno-include-test'," && !entry.name.endsWith('.test.ts')",''],
 ['deno-include-fixture',"        if (entry.name.startsWith('__')) continue;",''],
 ['deno-omit-ordinary',"entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')","entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && entry.name === 'index.ts'"],
 ['deno-auth-game',"name.startsWith('auth-') ? auth : game",'game'],
 ['deno-include-shared',"entry.isDirectory() && !entry.name.startsWith('_')",'entry.isDirectory()'],
 ['deno-include-nonfunction',"    .filter((name) => existsSync(join(functionsDir, name, 'index.ts')))\n",'']
])mutate(name,gen,old,replacement,deno,{cwd:root,expected:/not ok \d+ -/});
run('control-deno-after',deno,{cwd:root});
const units=['pnpm','exec','vitest','run','src/game/stage/StageScene.test.ts'];
run('control-scene-before',units);
mutate('scene-before-ready','apps/web/src/game/stage/StageScene.ts','    if (!this.sys.isActive()) return;\n','',units,{expected:/FAIL.*StageScene.test.ts[\s\S]*defers a resize before scene boot/});
run('control-scene-after',units);
const play=(...args)=>['pnpm','test:e2e','--workers=1',...args];
const hud=play('e2e/ui/baseline-hud.spec.ts','--project=stage-layout','--grep','shared HUD');
run('control-hud-before',hud);
const hudOpt={expected:/Error: expect\([\s\S]*baseline-hud.spec.ts/};
mutate('hud-missing-styles','apps/web/src/shell/Hud.tsx',"import '../layout/hud/hud.css';\n",'',hud,hudOpt);
mutate('hud-action-unreadable','apps/web/src/shell/shell.css','  .shell-context .v2-hint-btn {','  .shell-context .v2-hint-btn {\n    font-size: 0;',hud,hudOpt);
mutate('hud-action-inert','apps/web/src/shell/Hud.tsx','onClick={onHintAction ?? undefined}','onClick={undefined}',hud,hudOpt);
mutate('hud-xp-too-narrow','apps/web/src/shell/shell.css','grid-template-columns: auto 160px auto;','grid-template-columns: auto 16px auto;',hud,hudOpt);
mutate('hud-xp-zero','apps/web/src/shell/Hud.tsx','xp={state.cat.xp}','xp={0}',hud,hudOpt);
mutate('hud-gated-ancestor-clipping','apps/web/src/shell/shell.css','.shell-hud.v2-topbar:has(.hud-power-hint) {\n  height: auto;\n  min-height: calc(var(--hud-h, 56px) + var(--sp-5, 24px));\n  max-height: none;\n}','',play('e2e/ui/baseline-hud.spec.ts','--project=stage-layout','--grep','when gated'),hudOpt);
run('control-hud-after',hud);
for(const [name,path,old,replacement,args] of [
 ['f3-writes-without-optin','apps/web/e2e/ui/f3-art.spec.ts',"const writeScreenshots = process.env.SCREENSHOTS === '1';",'const writeScreenshots = true;',play('e2e/ui/f3-art.spec.ts','--project=stage-layout','--grep','F3 stage chapter 1 1280x720')],
 ['errors-writes-without-optin','apps/web/e2e/v2/errors-notice.spec.ts',"if (process.env.SCREENSHOTS === '1') {",'if (true) {',play('e2e/v2/errors-notice.spec.ts','--project=v2-server','--grep','T1-T5')]
]){
 const artifactDir=resolve(out,name+'-artifacts');
 const contract=()=>{const files=pngs(artifactDir);if(files.length)throw new Error('SCREENSHOTS=0 wrote '+files.length+' PNG(s): '+files.join(', '));return 'SCREENSHOTS=0 wrote no PNG files';};
 run('control-'+name,args,{extra:{SCREENSHOT_DIR:artifactDir},contract});
 mutate(name,path,old,replacement,args,{extra:{SCREENSHOT_DIR:artifactDir},contract});
}
// The temporary sibling keeps package and manifest resolution identical; only the port is adapted.
const fx='apps/web/tools/effects-test.mjs';
function effects(name,mutation){
 const source=readFileSync(resolve(root,fx),'utf8');
 if(mutation){const [old,replacement]=mutation;if(source.split(old).length!==2)throw new Error('effects mutation exact source mismatch');writeFileSync(resolve(root,fx),source.replace(old,replacement));}
 const copy=resolve(root,'apps/web/tools/.resume-effects-4619.mjs');
 try{
  writeFileSync(resolve(out,name+'.diff'),git(['diff','--',fx]));
  const current=readFileSync(resolve(root,fx),'utf8');if(current.split('const port = 5198,').length!==2)throw new Error('effects port mismatch');
  writeFileSync(copy,current.replace('const port = 5198,','const port = 4619,'));
  const syntax=spawnSync('node',['--check',copy],{encoding:'utf8'});writeFileSync(resolve(out,name+'-syntax.log'),syntax.stdout+syntax.stderr+'\nEXIT='+syntax.status);if(syntax.status!==0)throw new Error('syntax failure');
  const artifacts=resolve(out,name+'-artifacts');
  const contract=()=>{const png=resolve(artifacts,'combat-end.png');if(!existsSync(png))throw new Error('Missing combat-end.png');const bytes=readFileSync(png);const size=[bytes.readUInt32BE(16),bytes.readUInt32BE(20)];if(size[0]!==1600||size[1]!==900)throw new Error('Viewport artifact contract: expected 1600x900, actual '+size.join('x'));return 'combat-end.png is 1600x900';};
  return run(name,['node',copy,artifacts,'--viewport=1600x900'],{extra:{SCREENSHOTS:'1'},kind:mutation?'mutant':'control',contract,expected:name==='effects-ignores-viewport'?null:/FAIL  \[coverage\]|Error: expect\(locator\).toHaveAttribute/});
 }finally{writeFileSync(resolve(root,fx),source);if(existsSync(copy))unlinkSync(copy);writeFileSync(resolve(out,name+'-restored-status.txt'),git(['status','--short']));}
}
effects('control-effects-before');
effects('effects-ignores-viewport',['size = viewport','size = { width: 1280, height: 720 }']);
effects('effects-omits-help',['for (const screen of manifest.screens) {','for (const screen of manifest.screens.slice(0, -1)) {']);
effects('effects-help-inert',["      await nav.click();","      if (screen.id !== 'help') await nav.click();"]);
effects('control-effects-after');
const clean=git(['status','--short']);writeFileSync(resolve(out,'source-clean.txt'),clean||'CLEAN\n');
writeFileSync(resolve(out,'completed.json'),JSON.stringify({head,completed:new Date().toISOString(),clean:clean==='',runs:results.length,mutants:results.filter(r=>r.kind==='mutant').length,killed:results.filter(r=>r.kind==='mutant'&&r.status==='killed').length,survivors:results.filter(r=>r.status==='survived').map(r=>r.name),issues:results.filter(r=>r.status==='issue').map(r=>r.name)},null,2));save();
