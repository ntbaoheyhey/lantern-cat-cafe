import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const card='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GA-R2',root='/Users/bao/.codex/worktrees/mega-base0-ga-r2-mutants-280ff4b/taskbar-hero',out=card+'/mutations';
const env={...process.env,CI:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',SCREENSHOTS:'0',E2E_VIEWPORT:'1280x720',E2E_PORT_CLASSIC:'4420',E2E_PORT_V2:'4421',E2E_PORT_SERVER:'4422',E2E_PORT_API:'4423'};
function control(){if(!fs.readFileSync(card+'/CONTROL.md','utf8').startsWith('ACTIVE'))throw new Error('Stopped')}
while(!fs.existsSync(card+'/SUPPLEMENTAL-DONE')){control();await new Promise(r=>setTimeout(r,2000));}
const e2e=(spec,grep)=>`pnpm test:e2e ${spec} --workers=1 -g '${grep}'`;
const hud=e2e('e2e/ui/baseline-hud.spec.ts','shared HUD keeps XP and every status chip visible at 1280x720$');
const gated=e2e('e2e/ui/baseline-hud.spec.ts','shared HUD keeps XP and every status chip visible at 1280x720 when gated');
const clock=e2e('e2e/server/fixture-clock.spec.ts','server fixture freezes');
const f3=e2e('e2e/ui/f3-art.spec.ts','F3 chapter 1 roster sheet');
const bake=e2e('e2e/ui/f3-art.spec.ts','F3 canvas bake time');
const error=e2e('e2e/v2/errors-notice.spec.ts','T1-T5');
const g1=e2e('e2e/ui/g1-perf.spec.ts','G1 demo action feedback');
const g3=e2e('e2e/ui/g3-combat.spec.ts','G3 stage frame p95');
const allSpecs='e2e/ui/baseline-hud.spec.ts e2e/server/fixture-clock.spec.ts e2e/ui/f3-art.spec.ts e2e/v2/errors-notice.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts';
const all=e2e(allSpecs,'shared HUD keeps XP and every status chip visible at 1280x720|server fixture freezes|F3 chapter 1 roster sheet|F3 canvas bake time|T1-T5|G1 demo action feedback|G3 stage frame p95');
const results=[];
function files(dir){return fs.existsSync(dir)?fs.readdirSync(dir,{recursive:true}).map(f=>path.join(dir,f)).filter(f=>fs.statSync(f).isFile()):[];}
function run(name,command,extra={}){
 control();const artifacts=root+'/.grade-local/artifacts/'+name;fs.mkdirSync(artifacts,{recursive:true});
 const runtime=JSON.parse(fs.readFileSync(card+'/runtime.json'));Object.assign(runtime,{step:name,pid:process.pid,scratch:root,updated_at:new Date().toISOString()});fs.writeFileSync(card+'/runtime.json',JSON.stringify(runtime,null,2));
 const row={name,command,cwd:root+'/apps/web',head:'280ff4bed495fd28bd489eb5f2dcfd1910f21fc0',started:new Date().toISOString()};const fd=fs.openSync(out+'/'+name+'.log','wx');fs.writeSync(fd,JSON.stringify(row)+'\n');
 const r=spawnSync(command,{cwd:row.cwd,shell:'/bin/bash',env:{...env,SCREENSHOT_DIR:artifacts,...extra},stdio:['ignore',fd,fd]});
 Object.assign(row,{browserExit:r.status,signal:r.signal,artifacts:files(artifacts).map(f=>({name:path.relative(artifacts,f),bytes:fs.statSync(f).size})),finished:new Date().toISOString()});
 row.contractExit=extra.SCREENSHOTS==='1' ? (row.artifacts.length>0&&row.artifacts.filter(f=>f.name.endsWith('.png')).every(f=>f.bytes<204800)?0:1) : row.artifacts.length?1:0;
 fs.writeSync(fd,'\n'+JSON.stringify(row)+'\n');fs.closeSync(fd);results.push(row);fs.writeFileSync(out+'/browser-results.json',JSON.stringify(results,null,2));console.log(name+': browser '+r.status+', contract '+row.contractExit);return row;
}
const baseline=run('control-browser',all);if(baseline.browserExit!==0||baseline.contractExit!==0)throw new Error('Red green control');
const mutants=[
 ['hud-shared-style',hud,'apps/web/src/shell/Hud.tsx',"import '../layout/hud/hud.css';",''],
 ['hud-green-xp',hud,'apps/web/src/shell/shell.css','background: var(--good, #6be08a);','background: var(--accent, #6be08a);'],
 ['hud-guidance-action',hud,'apps/web/src/shell/Hud.tsx','onClick={onHintAction ?? undefined}','onClick={undefined}'],
 ['hud-warning-container',gated,'apps/web/src/shell/shell.css',':has(.hud-power-hint)',':has(.missing-power-hint)'],
 ['clock-interleaving',clock,'apps/web/e2e/support/server-fixture.ts','await page.clock.install({ time: new Date(0) });\n  await page.clock.pauseAt(new Date());','await page.clock.install();\n  await page.clock.pauseAt(await page.evaluate(() => Date.now()));'],
 ['f3-opt-in',f3,'apps/web/e2e/ui/f3-art.spec.ts',"const writeScreenshots = process.env.SCREENSHOTS === '1';",'const writeScreenshots = true;'],
 ['error-opt-in',error,'apps/web/e2e/v2/errors-notice.spec.ts',"if (process.env.SCREENSHOTS === '1')",'if (true)'],
 ['f3-metrics-routing',bake,'apps/web/e2e/ui/f3-art.spec.ts',"test.info().outputPath('bake-metrics.json')","resolve(process.env.SCREENSHOT_DIR!, 'bake-metrics.json')"],
 ['g1-metrics-routing',g1,'apps/web/e2e/ui/g1-perf.spec.ts',"test.info().outputPath('metrics.json')","path.resolve(process.env.SCREENSHOT_DIR!, 'metrics.json')"],
 ['g3-metrics-routing',g3,'apps/web/e2e/ui/g3-combat.spec.ts',"test.info().outputPath('frame-metrics.json')","resolve(process.env.SCREENSHOT_DIR!, 'frame-metrics.json')"]
];
for(const [name,command,file,from,to] of mutants){const target=root+'/'+file,original=fs.readFileSync(target,'utf8');if(!original.includes(from))throw new Error('Missing mutation '+name);try{fs.writeFileSync(target,original.replace(from,to));fs.writeFileSync(out+'/'+name+'.diff',spawnSync('git',['diff','--',file],{cwd:root,encoding:'utf8'}).stdout);run(name,command);}finally{fs.writeFileSync(target,original);}}
const opt=run('control-explicit-artifacts',e2e(allSpecs,'F3 chapter 1 roster sheet|F3 canvas bake time|T1-T5|G1 demo action feedback|G3 stage frame p95'),{SCREENSHOTS:'1',REPORT_DIR:root+'/.grade-local/explicit-metrics'});
opt.metrics=files(root+'/.grade-local/explicit-metrics').map(f=>path.basename(f));fs.writeFileSync(out+'/browser-results.json',JSON.stringify(results,null,2));
const effectSource=fs.readFileSync(root+'/apps/web/tools/effects-test.mjs','utf8').replace('const port = 5198,','const port = 4424,');const effectTool=root+'/apps/web/tools/.ga-r2-effects.mjs';fs.writeFileSync(effectTool,effectSource);
const effectCmd=`node tools/.ga-r2-effects.mjs ${root}/.grade-local/effect-control --viewport=1280x720`;
const effectControl=run('control-effects',effectCmd);if(effectControl.browserExit!==0)throw new Error('Red effects control');
const rail=root+'/apps/web/src/shell/Rail.tsx',source=fs.readFileSync(rail,'utf8');const from='onClick={() => onSelectScreen(id)}';if(!source.includes(from))throw new Error('No rail handler');
try{fs.writeFileSync(rail,source.replace(from,"onClick={() => { if (id !== 'help') onSelectScreen(id); }}"));fs.writeFileSync(out+'/effects-reached-screen.diff',spawnSync('git',['diff','--','apps/web/src/shell/Rail.tsx'],{cwd:root,encoding:'utf8'}).stdout);run('effects-reached-screen',effectCmd.replace('effect-control','effect-mutant'));}finally{fs.writeFileSync(rail,source);fs.unlinkSync(effectTool);}
fs.writeFileSync(out+'/browser-clean-status.txt',spawnSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).stdout);
fs.writeFileSync(card+'/MUTATIONS-DONE',new Date().toISOString());
