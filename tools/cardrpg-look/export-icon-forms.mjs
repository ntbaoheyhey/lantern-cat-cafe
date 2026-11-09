// L6 scratch authoring only. Export the original VFX forms, never an external icon set.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=process.cwd(),req=createRequire(resolve(root,'apps/web/package.json'));
const {build}=await import(req.resolve('vite'));
const compositions=JSON.parse(await readFile('tools/cardrpg-look/blender/icon-compositions.json'));
const result=await build({configFile:false,root:resolve(root,'apps/web'),envDir:false,publicDir:false,logLevel:'error',build:{write:false,minify:false,lib:{entry:resolve(root,'apps/web/src/game/squad/turn3d/card-effect-primitives.ts'),formats:['cjs']}}});
const chunks=(Array.isArray(result)?result:[result]).flatMap(output=>output.output).filter(output=>output.type==='chunk');
if(chunks.length!==1)throw Error(`Expected one self-contained geometry module, got ${chunks.length}`);
const module={exports:{}};new Function('module','exports','require',chunks[0].code)(module,module.exports,req);
const names=[...new Set(compositions.rows.flatMap(row=>[row.main,row.secondary]))];
const forms={};
for(const name of names){
 const indexed=module.exports.createCardPrimitive(name),g=indexed.index?indexed.toNonIndexed():indexed;
 forms[name]={positions:[...g.attributes.position.array],normals:[...g.attributes.normal.array]};
 g.dispose();if(g!==indexed)indexed.dispose();
}
const sourceFiles=['card-effect-primitives.ts','card-roster-primitives.ts','card-roster-batch2-primitives.ts','card-roster-batch3-primitives.ts'].map(name=>`apps/web/src/game/squad/turn3d/${name}`);
sourceFiles.push('tools/cardrpg-look/blender/icon-compositions.json');
const sourceHashes={};for(const path of sourceFiles)sourceHashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile('reports/cardrpg-look/rounds/art/sources/icon-forms.json',JSON.stringify({original:true,sourceHashes,forms})+'\n');
console.log(JSON.stringify({forms:names.length,icons:compositions.rows.length,status:'unrendered scratch geometry'}));
