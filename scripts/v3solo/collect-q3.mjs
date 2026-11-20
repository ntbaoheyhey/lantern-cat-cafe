/** Count every enemy action from the same complete captures used by M1. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {checkSolo,fixtures,format} from './check-solo.mjs';
const root=resolve(import.meta.dirname,'../..');
const input=resolve(root,process.argv[2]??'reports/v3-battle/a2/M1/metrics.json');
const source=JSON.parse(readFileSync(input));
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const rows={};
for(const id of fixtures){
 const f=source.fixtures[id];
 if(!f?.completeActions||f.seconds<30||!f.parity||f.browserErrors.length)throw Error(`${id}: complete 30-second parity-passing capture required`);
 for(const artifact of [f.capture,f.video])if(hash(resolve(root,artifact.path))!==artifact.sha256)throw Error(`${id}: changed capture ${artifact.path}`);
 const actions=f.actions.filter(a=>a.side==='enemy');
 rows[id]={enemyActions:actions.length,movedEnemyActions:actions.filter(a=>a.peak>.06).length,minEnemyDisplacementFraction:Math.min(...actions.map(a=>a.peak)),actions,capture:f.capture,video:f.video};
}
const data={_meta:source._meta,method:'Every action_start/charge plan; maximum measured root displacement / viewport width over the complete action. Side from recorded initial cat IDs and createBattle foe-index-catalog identities; unknown actors rejected.',fixtures:rows};
const out=resolve(root,'reports/v3-solo/Q3');mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'metrics.json'),JSON.stringify(data,null,2)+'\n');
const gates=checkSolo('Q3',data),lines=gates.map(format);
lines.push(`TOTAL ${gates.filter(r=>r.pass).length} PASS / ${gates.filter(r=>!r.pass).length} FAIL / ${gates.length} gates`);
writeFileSync(resolve(out,'gates.log'),lines.join('\n')+'\n');
console.log(lines.join('\n'));process.exitCode=gates.every(r=>r.pass)?0:1;
