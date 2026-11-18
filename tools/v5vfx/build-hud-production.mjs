/** Isolated production artifacts; only the baseline build reverses the guarded text assignment. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,readdir,unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {unusedPosters} from '../v5int/build-asset-exclusions.mjs';
export const root=resolve(import.meta.dirname,'../..'),appRoot=resolve(root,'apps/web');
export const require=createRequire(resolve(appRoot,'package.json'));
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function buildHudArtifacts(out){
 const hudPath='apps/web/src/game/cardrpg/battle-v3/BattleHud.tsx',hud=await readFile(resolve(root,hudPath),'utf8');
 const before=execFileSync('git',['show','0ac228aaa:'+hudPath],{cwd:root,encoding:'utf8'});
 const guarded="   if(total.current){\n    total.current.hidden=now>state.until||!state.amount;\n    const amount=total.current.querySelector('b')!,text=String(state.amount);\n    // Replacing an unchanged text node invalidates page styles every frame.\n    if(amount.textContent!==text)amount.textContent=text;\n   }";
 const original="   if(total.current){total.current.hidden=now>state.until||!state.amount;total.current.querySelector('b')!.textContent=String(state.amount);}";
 assert.equal(hud.split(guarded).length,2,'Guard block must occur exactly once');
 assert.equal(hud.replace(guarded,original),before,'Baseline may differ only by the measured text guard');
 return buildProductionComparison(out,{modulePath:hudPath,currentSource:hud,variants:{baseline:before,text:hud},metadata:{candidateHudSha256:hash(hud),baselineHudSha256:hash(before),baselineSource:'0ac228aaa:'+hudPath}});
}
export async function buildProductionComparison(out,{modulePath,currentSource,variants,metadata={}}){
 out=resolve(out);assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'),'Output must remain in owned ignored work');
 assert.equal(await readFile(resolve(root,modulePath),'utf8'),currentSource,'Source changed before comparison build');
 assert([1,2].includes(Object.keys(variants).length));assert(Object.keys(variants).every(mode=>/^[a-z]+$/.test(mode)));
 const {build,loadConfigFromFile}=await import(require.resolve('vite'));
 const report={...metadata,utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),configSha256:hash(await readFile(resolve(appRoot,'vite.config.ts'))),envDir:false,artifacts:[]};
 await mkdir(out,{recursive:true});
 for(const [mode,variantSource]of Object.entries(variants)){
  const dist=resolve(out,mode);assert(!existsSync(resolve(dist,'index.html')),'Preserve prior artifact;choose a fresh output directory');
  const loaded=await loadConfigFromFile({command:'build',mode:'production'},resolve(appRoot,'vite.config.ts'),appRoot,'error');
  assert(loaded,'Existing Vite config did not load');let transformed=0;
  const transformNeeded=variantSource!==currentSource;
  const comparisonPlugin={name:'cxv-comparison-module-only',enforce:'pre',transform(source,id){
   if(id.split('?')[0].replaceAll('\\','/')!==resolve(root,modulePath))return;
   assert.equal(source,currentSource,'Comparison transform must see the unmodified source before compilation');transformed++;
   return{code:variantSource,map:null};
  }};
  await build({...loaded.config,root:appRoot,configFile:false,envDir:false,mode:'production',logLevel:'error',plugins:transformNeeded?[comparisonPlugin,...loaded.config.plugins]:loaded.config.plugins,build:{...loaded.config.build,outDir:dist,emptyOutDir:true}});
  assert.equal(transformed,transformNeeded?1:0);
  // The shipping exclusion plugin intentionally skips custom outputs; mirror its generated-output trim here.
  for(const path of unusedPosters){assert(!path.includes('..'));try{await unlink(resolve(dist,path));}catch(e){if(e.code!=='ENOENT')throw e;}}
  const files=[];
  const walk=async dir=>{for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory())await walk(path);else{const bytes=await readFile(path);files.push({path:relative(dist,path),bytes:bytes.length,sha256:hash(bytes)});}}};
  await walk(dist);files.sort((a,b)=>a.path.localeCompare(b.path));
  report.artifacts.push({mode,dist,indexSha256:hash(await readFile(resolve(dist,'index.html'))),transformed,files});
  await writeFile(resolve(out,'build.json'),JSON.stringify(report,null,2));
  console.log(new Date().toISOString()+' built '+mode+' '+files.length+' files');
 }
 const [baseline,text]=report.artifacts;
 const media=artifact=>artifact.files.filter(f=>!/\.(?:js|html|map)$/.test(f.path));
 if(text)assert.deepEqual(media(baseline),media(text),'Non-script production assets must match exactly');
 report.staticAssetsExact=text?true:null;report.identityAfter=runtimeEvidence();assert.deepEqual(report.identityAfter,{runtimePatchSha256:report.runtimePatchSha256,runtimeUntrackedSha256:report.runtimeUntrackedSha256});
 report.ended=new Date().toISOString();await writeFile(resolve(out,'build.json'),JSON.stringify(report,null,2));
 return report;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await buildHudArtifacts(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-hud-production'));
