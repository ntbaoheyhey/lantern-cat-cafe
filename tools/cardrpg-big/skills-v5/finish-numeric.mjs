// Aggregate only completed receipts. No simulation, gate alteration or sample selection.
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.argv[2];assert(root);
for(const scope of ['metrics','equipped','teams','sets','tiers','pieces','elites','economy','day7','editions'])assert(await readFile(`${root}/${scope}/results.json`),scope);
const metric=JSON.parse(await readFile(root+'/metrics/REGISTERED-METHOD.json','utf8'));if(metric.designMetrics)process.stdout.write(execFileSync(process.execPath,['tools/cardrpg-big/skills-v5/design-report.mjs',root],{encoding:'utf8'}));
for(const [script,args] of [['summarize',[root]],['economy-summary',[root+'/economy']],['numeric-gates',[root]],['audit-numeric',[root]]]){
 process.stdout.write(execFileSync(process.execPath,[`tools/cardrpg-big/skills-v5/${script}.mjs`,...args],{encoding:'utf8'}));
}
