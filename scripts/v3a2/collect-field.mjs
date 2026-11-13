import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,evidenceMeta} from './check-gates.mjs';
import {compareSheet} from './compare-sheet.mjs';
const out=resolve(root,'reports/v3-battle/a2/F1'),base=resolve(root,'reports/v3-battle/a2');
const data=JSON.parse(await readFile(resolve(out,'metrics.json'),'utf8'));
data.suite=JSON.parse(await readFile(resolve(out,'suite.json'),'utf8'));
const check=spawnSync(process.execPath,['scripts/art/core-size-check.mjs'],{cwd:root,encoding:'utf8'});
await writeFile(resolve(out,'core-size.log'),check.stdout+check.stderr);data.coreSizeExit=check.status;
for(const [fixture,window,frame] of [['wave1','w01',75],['wave3','w03',60],['boss','w04',30]]){
 await compareSheet(resolve(out,fixture+'@1280x720.png'),resolve(base,`ref/${window}/frame-${String(frame).padStart(3,'0')}.jpg`),resolve(out,'compare-'+fixture+'.png'),{label:fixture==='boss'?'Boss scale / reference standard field (no verified boss source)':fixture+' formation / standard field'});
}
data._meta=evidenceMeta();await writeFile(resolve(out,'metrics.json'),JSON.stringify(data,null,2)+'\n');
console.log('F1: six alpha-mask captures, three comparisons, core normalization and suite collected.');
