// Run once after art review and the source commit. No final L7 matrix here.
import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {withTimingLock} from './lock.mjs';
const run=(script,args=[],env={})=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[script,...args],{stdio:'inherit',env:{...process.env,...env}});
 child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${script}: ${code}`)));
});
const out='reports/cardrpg-look/validation/l6';await mkdir(out,{recursive:true});
await withTimingLock('LOOK L6 committed offline build',()=>run('tools/cardrpg-look/build.mjs'));
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
if(build.runtimeDirty)throw Error('Commit all runtime/source inputs before phase validation');
await run('tools/cardrpg-look/art-gallery.mjs');
await run('tools/cardrpg-look/art-browser-check.mjs');
for(const [width,height] of [[1024,600],[1280,720],[1440,900]])for(const dpr of [1,2]){
 await withTimingLock(`LOOK L6 portrait contract ${width}/DPR${dpr}`,()=>run('tools/cardrpg-look/art-runtime-check.mjs',[],{
  BIG_ARTIFACT:'docs/cardrpg-look/index.html',LOOK_PORTRAIT_SHA:build.sha256,
  LOOK_PORTRAIT_CONFIG:`${width},${height},${dpr}`,LOOK_PORTRAIT_OUT:`${out}/portraits-${width}-dpr${dpr}`
 }));
}
await run('tools/cardrpg-look/gates.mjs',['l6']);
await run('tools/cardrpg-look/phase-measure.mjs',['l6']);
await writeFile(`${out}/size-justification.json`,JSON.stringify({artifact:build.sha256,bytes:build.bytes,
 maximumAuthorizedBytes:32000000,originalTargetBytes:24000000,previousL4Bytes:23995962,
 reason:'Original12 full-resolution game-model portraits replace the partial3hero set; 48 skill miniatures and4 static rarity plates are separately supplied. Nine inherited models remain labelled. No runtime resolution was reduced to obscure image cost.',
 visualEvidence:['reports/cardrpg-look/rounds/art/before/portraits-dark.png',
  'reports/cardrpg-look/rounds/art/portraits/packed-round-2/portraits-dark.png',
  'reports/cardrpg-look/rounds/art/portraits/packed-round-3/portraits-dark.png',
  `${out}/art-browser/1280-dark.png`],assetClasses:build.assetClasses},null,2)+'\n');
await run('tools/cardrpg-look/l6-audit.mjs');
