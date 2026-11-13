/** Remove only encoded packs with zero references; retain licensed source media. */
import {readFileSync,writeFileSync,unlinkSync,existsSync} from 'node:fs';
import {basename} from 'node:path';
const dir='apps/web/public/audio',m=JSON.parse(readFileSync(`${dir}/manifest.json`)),ledger=JSON.parse(readFileSync(`${dir}/LICENSES.json`));
const used=new Set();
function visit(v){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object'){if(v.pack)used.add(v.pack);Object.values(v).forEach(visit);}}
visit(m.cues);visit(m.designs);
const removed=[];
for(const [pack,urls] of Object.entries(m.packs))if(!used.has(pack)){
 for(const url of Object.values(urls)){const path=`${dir}/${basename(url)}`;if(existsSync(path))unlinkSync(path);ledger.files=ledger.files.filter(r=>r.path!==path);removed.push(path);}
 delete m.packs[pack];
}
writeFileSync(`${dir}/manifest.json`,JSON.stringify(m,null,2)+'\n');writeFileSync(`${dir}/LICENSES.json`,JSON.stringify(ledger,null,2)+'\n');console.log(JSON.stringify({removed}));
