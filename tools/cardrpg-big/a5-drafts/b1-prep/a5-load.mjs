// REFERENCE: A5 train experiments; unchanged production sources, optional read-only raw HP observer.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
export async function loadRules({probe=false}={}) {
 const root=process.cwd(),sourceRoot=process.env.BIG_RULES_ROOT||root;
 const require=createRequire(resolve(root,'apps/web/package.json'));
 const dir=await mkdtemp('/tmp/cardrpg-a5-rules-'),entry=resolve(dir,'entry.ts');
 const paths={legacy:'packages/game-rules/src/cardrpg/index.ts',depth:'packages/game-rules/src/cardrpg/depth/index.ts',bot:'packages/game-rules/src/cardrpg/depth/run-bot.ts',onboarding:'packages/game-rules/src/cardrpg/depth/onboarding.ts',rng:'packages/game-rules/src/rng.ts'};
 await writeFile(entry,Object.entries(paths).map(([key,path])=>`export * as ${key} from '${resolve(sourceRoot,path)}';`).join('\n'));
 const {build}=await import(require.resolve('vite'));let transformed=0;
 try {
  await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',
   plugins:probe?[{name:'a5-read-only-hp-observer',transform(source,id){
    if(id!==resolve(sourceRoot,'packages/game-rules/src/cardrpg/depth/battle.ts'))return;
    const needle='const actual = Math.min(target.hp, Math.max(0, Math.round(amount)));';
    assert.equal(source.split(needle).length,2);transformed++;
    return source.replace(needle,'globalThis.__a5HpProbe?.(b, source, target, amount, kind); '+needle);
   }}]:[],
   build:{outDir:dir,emptyOutDir:false,minify:false,lib:{entry,formats:['es'],fileName:()=> 'rules.mjs'}}});
  assert.equal(transformed,probe?1:0);
  const bundle=await import(pathToFileURL(resolve(dir,'rules.mjs')).href);
  return {...bundle,close:()=>rm(dir,{recursive:true,force:true})};
 } catch(error){await rm(dir,{recursive:true,force:true});throw error;}
}
