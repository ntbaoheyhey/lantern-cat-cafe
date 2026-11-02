import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const c='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GB-R1',w='/Users/bao/.codex/worktrees/mega-base0-grade-b-5db4949/scratch';
const env={...process.env,CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_PORT_CLASSIC:'4430',E2E_PORT_V2:'4431',E2E_PORT_SERVER:'4432',E2E_PORT_API:'4433',E2E_VIEWPORT:'1280x720',SCREENSHOT_DIR:c+'/artifact-output'};
delete env.REPORT_DIR;
function active(){if(!fs.readFileSync(c+'/CONTROL.md','utf8').startsWith('ACTIVE:'))throw Error('PAUSED');}
while(!fs.existsSync(c+'/RUNNER_DONE')){active();await new Promise(r=>setTimeout(r,5000));}
function reportTimes(){const result={};const walk=p=>{if(!fs.existsSync(p))return;for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+e.name;if(e.isDirectory())walk(f);else result[f]=fs.statSync(f).mtimeMs;}};for(const d of ['f3-art','n1-error-screens','g1-speed','g3-combat'])walk(w+'/reports/'+d);return result;}
function run(name,command,extra={},contract=false){const beforeTimes=contract?reportTimes():{};active();const start=new Date().toISOString();fs.writeFileSync(c+'/follow-current.json',JSON.stringify({name,command,start,pid:process.pid}));
 const f=fs.openSync(c+'/logs/'+name+'.log','w');const r=spawnSync(command,{cwd:w+'/apps/web',shell:'/bin/zsh',env:{...env,...extra},stdio:['ignore',f,f]});fs.closeSync(f);
 let contractExit=null;
 if(contract){const changes=spawnSync('git',['status','--porcelain','--','reports/f3-art','reports/n1-error-screens','reports/g1-speed','reports/g3-combat'],{cwd:w,encoding:'utf8'}).stdout;const shots=fs.existsSync(c+'/artifact-output')?fs.readdirSync(c+'/artifact-output'):[];
 const afterTimes=reportTimes(),touched=Object.keys(afterTimes).filter(p=>beforeTimes[p]!==afterTimes[p]);contractExit=changes.length||shots.length||touched.length?1:0;fs.writeFileSync(c+'/logs/'+name+'-contract.json',JSON.stringify({expectation:'No historical report mutations or screenshot writes with SCREENSHOTS=0',trackedOrUntrackedChanges:changes,screenshotFiles:shots,touchedHistoricalFiles:touched,exit:contractExit},null,2));
 if(shots.length)fs.renameSync(c+'/artifact-output',c+'/artifact-output-'+name);
 for(const line of changes.split('\n').filter(Boolean)){const path=line.slice(3);if(line.startsWith('??'))fs.rmSync(w+'/'+path,{recursive:true,force:true});else spawnSync('git',['restore','--',path],{cwd:w});}
 }
 fs.appendFileSync(c+'/follow-results.jsonl',JSON.stringify({name,command,start,end:new Date().toISOString(),exit:r.status,signal:r.signal,contractExit,viewport:extra.E2E_VIEWPORT||env.E2E_VIEWPORT})+'\n');return r.status;
}
const inherited='pnpm test:e2e e2e/ui/u2-hud.spec.ts e2e/ui/u3-layout.spec.ts e2e/ui/g2-shell.spec.ts e2e/layout/resize.spec.ts e2e/layout/resize-burst.spec.ts --workers=1';
for(const v of ['1280x720','1600x900'])run('inherited-'+v,inherited,{E2E_VIEWPORT:v});
run('audit-guest','node tools/.grade-audit.mjs '+c+'/audit-guest bossReadyStrong --strict');
run('audit-signed-in','node tools/.grade-audit.mjs '+c+'/audit-signed-in strong --signed-in --strict');
for(const v of ['1280x720','1600x900'])run('effects-'+v,'node tools/.grade-effects.mjs '+c+'/effects-'+v+' --viewport='+v);
const hud='pnpm test:e2e e2e/ui/baseline-hud.spec.ts --grep "shared HUD.*1280x720" --workers=1';
const artifact='pnpm test:e2e e2e/ui/f3-art.spec.ts e2e/v2/errors-notice.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts --grep "roster sheet|bake time|T1-T5|G1 demo|G3 stage frame" --workers=1';
if(run('hud-control-before',hud)!==0)throw Error('HUD control red');
if(run('artifact-control-before',artifact,{},true)!==0)throw Error('artifact control red');
const mutations=[
 ['hud-xp-width','apps/web/src/shell/shell.css','grid-template-columns: auto 160px auto;','grid-template-columns: auto 8px auto;',hud,false],
 ['hud-guidance-action','apps/web/src/shell/Hud.tsx','onClick={onHintAction ?? undefined}','onClick={undefined}',hud,false],
 ['f3-screenshot-optin','apps/web/e2e/ui/f3-art.spec.ts',"const writeScreenshots = process.env.SCREENSHOTS === '1';",'const writeScreenshots = true;',artifact,true],
 ['error-screenshot-optin','apps/web/e2e/v2/errors-notice.spec.ts',"if (process.env.SCREENSHOTS === '1')",'if (true)',artifact,true],
 ['f3-metrics-output','apps/web/e2e/ui/f3-art.spec.ts',"test.info().outputPath('bake-metrics.json')","resolve('../../reports/f3-art/bake-metrics.json')",artifact,true],
 ['g1-metrics-output','apps/web/e2e/ui/g1-perf.spec.ts',"test.info().outputPath('metrics.json')","path.resolve('../../reports/g1-speed/metrics.json')",artifact,true],
 ['g3-metrics-output','apps/web/e2e/ui/g3-combat.spec.ts',"test.info().outputPath('frame-metrics.json')","resolve('../../reports/g3-combat/frame-metrics.json')",artifact,true],
 ['effects-reached-help','apps/web/tools/.grade-effects.mjs','await nav.click();',"if (screen.id !== 'help') await nav.click();",'node tools/.grade-effects.mjs '+c+'/effects-mutant --viewport=1280x720',false]
];
for(const[name,file,from,to,cmd,contract]of mutations){active();const p=w+'/'+file,original=fs.readFileSync(p,'utf8');if(original.split(from).length-1!==1)throw Error('selector not unique '+name);
try{fs.writeFileSync(p,original.replace(from,to));fs.writeFileSync(c+'/mutations/'+name+'.diff',file.startsWith('apps/web/tools/.grade')?from+' -> '+to:spawnSync('git',['diff','--',file],{cwd:w,encoding:'utf8'}).stdout);run(name,cmd,{},contract);}finally{fs.writeFileSync(p,original);}}
run('hud-control-after',hud);run('artifact-control-after',artifact,{},true);run('effects-control-after','node tools/.grade-effects.mjs '+c+'/effects-control-after --viewport=1280x720');
fs.writeFileSync(c+'/scratch-final-status.txt',spawnSync('git',['status','--short'],{cwd:w,encoding:'utf8'}).stdout);fs.writeFileSync(c+'/FOLLOW_DONE',new Date().toISOString());
