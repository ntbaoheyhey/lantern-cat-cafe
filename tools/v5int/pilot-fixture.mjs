/** Bundle unchanged presentation fixtures in Node; no development imports in the browser. */
import {createRequire} from 'node:module';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json'));
export async function loadPilotFixtures(){
 const temporary=await mkdtemp('/tmp/v5-cxi-pilot-'),entry=resolve(temporary,'entry.ts');
 try{
  const {build}=await import(req.resolve('vite'));
  await writeFile(entry,`export {pilotFixture} from '${root}/apps/web/src/game/cardrpg/vfx-layered/fixture.ts';\nexport {configureSequence} from '${root}/apps/web/src/game/cardrpg/battle-v3/sequence.ts';`);
  await build({root,configFile:false,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:temporary,minify:false,lib:{entry,formats:['es'],fileName:()=> 'fixture.mjs'}}});
  const modules=await import(pathToFileURL(resolve(temporary,'fixture.mjs')).href);
  return {...modules,close:()=>rm(temporary,{recursive:true,force:true})};
 }catch(error){await rm(temporary,{recursive:true,force:true});throw error;}
}
