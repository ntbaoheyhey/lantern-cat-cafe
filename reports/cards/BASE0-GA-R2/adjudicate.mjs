import fs from 'node:fs';
const card='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GA-R2';
const read=f=>JSON.parse(fs.readFileSync(card+'/'+f));
const unit=read('mutations/unit-results.json'),browser=read('mutations/browser-results.json'),extra=read('mutations/extra-results.json');
const rows=[...unit.results.map(x=>({name:x.name,testExit:x.exit,contractExit:null,signal:x.signal,control:'control-'+x.group})),...browser.filter(x=>!x.name.startsWith('control-')).map(x=>({name:x.name,testExit:x.browserExit,contractExit:x.contractExit,signal:x.signal,control:x.name==='effects-reached-screen'?'control-effects':'control-browser'})),...extra.filter(x=>!x.name.startsWith('control-')).map(x=>({name:x.name,testExit:x.exit,contractExit:null,signal:x.signal,control:'control-extra'}))];
for(const row of rows){row.log=card+'/mutations/'+row.name+'.log';row.verdict=(row.testExit===1||row.contractExit===1)&&row.signal===null?'KILLED':'SURVIVED';const lines=fs.readFileSync(row.log,'utf8').split('\n');row.failureEvidence=lines.map((text,i)=>({line:i+1,text:text.slice(0,250)})).filter(x=>/AssertionError|TypeError:|Error: expect|Error: clock.pauseAt|Expected:|Received:|contractExit.*:1/.test(x.text)).slice(0,3);if(row.name==='hud-green-xp')row.explanation='Retained survivor: generic selector mutated unchanged rail status dot, not XP; actual XP separately tested by exact selector. Conservatively included in denominator.';}
const edge=read('mutations/edge-results.json');
const edgeLog=card+'/mutations/deno-real-explicit-edges.log';
rows.push({name:'deno-real-explicit-edges',testExit:edge.mutant.exit,contractExit:null,signal:edge.mutant.signal,control:'control-deno-real-edges',log:edgeLog,verdict:edge.mutant.exit===1?'KILLED':'SURVIVED',failureEvidence:fs.readFileSync(edgeLog,'utf8').split('\n').map((text,i)=>({line:i+1,text})).filter(x=>x.text.includes(' -> ./index')).slice(0,3)});
const killed=rows.filter(x=>x.verdict==='KILLED').length;
const result={head:'280ff4bed495fd28bd489eb5f2dcfd1910f21fc0',tried:rows.length,killed,survived:rows.length-killed,greenControlRuns:10,score:10*killed/rows.length,rows};
fs.writeFileSync(card+'/mutations/adjudication.json',JSON.stringify(result,null,2));console.log(JSON.stringify({tried:result.tried,killed,score:result.score}));
for(const row of rows.filter(x=>['hud-xp-color-exact-selector','smoke-hardcoded-width','configured-viewport-ignored','clock-interleaving','hud-shared-style','hud-guidance-action','hud-warning-container'].includes(x.name)))console.log(row.name+': '+JSON.stringify(row.failureEvidence));
