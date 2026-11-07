// Merge phase-target captures only after verifying immutable artifact identity.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
const [out,...inputs]=process.argv.slice(2);
if(!out||inputs.length<2)throw Error('Provide output and at least two capture directories');
const receipts=await Promise.all(inputs.map(async p=>JSON.parse(await readFile(`${p}/captures.json`,'utf8'))));
if(new Set(receipts.map(r=>r.sha256)).size!==1)throw Error('Cannot merge different artifacts');
const rows=receipts.flatMap(r=>r.rows);
if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Duplicate target IDs');
await mkdir(`${out}/frames`,{recursive:true});await mkdir(`${out}/sheets`,{recursive:true});
await writeFile(`${out}/captures.json`,JSON.stringify({...receipts[0],rows,errors:receipts.flatMap(r=>r.errors)},null,2)+'\n');
const result=spawnSync('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-big/effect-report.py',out],{stdio:'inherit'});
process.exitCode=result.status??1;
