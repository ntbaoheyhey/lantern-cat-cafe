// Review packed textures on the same GLB geometry and fixed studio rig.
import {spawn} from 'node:child_process';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const [study,countText]=process.argv.slice(2);
const packing=JSON.parse(await readFile(`${study}/packing.json`));
assert.equal(packing.rows.length,Number(countText),'Wait until this packing batch completes');
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const row of packing.rows){
  assert.equal(hash(await readFile(row.input)),row.sourceSha256);
  assert.equal(hash(await readFile(row.preview)),row.previewSha256);
  const out=`${study}/studio/${row.owner}`;
  assert(!await access(`${out}/000.png`).then(()=>true,()=>false),'Preserve existing studio evidence');
  await withTimingLock(`LOOK compressed studio ${row.owner}`,()=>new Promise((resolve,reject)=>{
    const child=spawn('/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender',
      ['--background','--threads','4','--python-exit-code','1','--python','tools/cardrpg-look/blender/roster-render.py','--',
       '--source',row.preview,'--out',out,...(['yarn-giant','kettle-knight','pantry-crown'].includes(row.owner)?['--boss']:[])],
      {stdio:'inherit',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
    child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`Blender ${code}`)));
  }));
}
