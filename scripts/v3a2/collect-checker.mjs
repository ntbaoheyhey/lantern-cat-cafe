/** Refresh checker evidence using real tests and the same completed battle captures. */
import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {root,cards,checkCard,evidenceMeta,format} from './check-gates.mjs';
const out=resolve(root,'reports/v3-battle/a2/G0');await mkdir(out,{recursive:true});
const empty=resolve(root,'work/empty-v3a2-gates');await mkdir(empty,{recursive:true});
const bootstrap=Object.keys(cards).flatMap(id=>checkCard(id,{base:empty,data:null}));
await writeFile(resolve(out,'bootstrap.log'),bootstrap.map(format).join('\n')+'\n');
const tests=spawnSync(process.execPath,['--test','scripts/v3a2/check-gates.test.mjs'],{cwd:root,encoding:'utf8'});
await writeFile(resolve(out,'checker-tests.log'),tests.stdout+tests.stderr);
const captures=[];
for(const id of ['wave1','wave3','boss']){
  const source=resolve(root,`reports/v3-battle/a2/M1/capture/${id}/capture.json`),data=JSON.parse(await readFile(source,'utf8'));
  if(!data.parity||data.errors.length||data.fps!==30)throw Error(id+': capture failed');
  await copyFile(source,resolve(out,`capture-${id}.json`));captures.push(data);
}
const suite=JSON.parse(await readFile(resolve(out,'suite.json'),'utf8'));
const data={_meta:evidenceMeta(),bootstrap:{failed:bootstrap.filter(r=>!r.pass).length,total:bootstrap.length},checkerTestExit:tests.status,captureFixtures:captures.length,captureFps:Math.min(...captures.map(c=>c.fps)),suite};
await writeFile(resolve(out,'metrics.json'),JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify({bootstrap:data.bootstrap,checkerTestExit:tests.status,captureFixtures:captures.length,captureFps:data.captureFps}));
if(tests.status||data.bootstrap.failed!==data.bootstrap.total)process.exitCode=1;
