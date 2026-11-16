/** Private fixed-state upload/filter experiment; never changes production settings. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';

const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-art/REVIEW/A10/scene-ready-transfer');
const report=resolve(out,'pma-filter-r1.json'),raw=resolve(out,'raw/pma-filter-r1');
if(existsSync(report))throw Error('Refusing to overwrite a prior experiment');
mkdirSync(raw,{recursive:true});
const hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const receipt={started:new Date().toISOString(),scope:'Two private GPU upload/filter drills on the same selected straight-alpha AVIFs. No runtime configuration is installed.',
 sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),scriptSha256:hash(import.meta.filename),
 runtimeSources:Object.fromEntries(['apps/web/src/game/cardrpg/spine/assets.ts','apps/web/src/game/cardrpg/spine/atlas-delivery.ts','apps/web/src/game/rig/atlas-color.ts','apps/web/src/game/cardrpg/spine/sampled-atlases.json'].map(p=>[p,hash(resolve(root,p))])),
 methods:['associated-mips','associated-linear'],results:[],complete:false,productionAcceptance:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture,{url:'http://127.0.0.1:5991',width,height});
  for(const method of receipt.methods){
   const state=await page.evaluate(async({method,root})=>{
    const T=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js');
    const {usePaintedAtlasColor}=await import('/src/game/rig/atlas-color.ts');
    const s=window.__depthScene,changed=[];
    for(const [id,actor]of s.actors)actor.actor.root.traverse(n=>{
     for(const material of Array.isArray(n.material)?n.material:[n.material]){
      const texture=material?.map;
      if(!texture?.image?.src?.includes('/units/sampled-delivery/'))continue;
      texture.premultiplyAlpha=true;
      texture.userData.atlasAlphaEncoding='premultiplied-upload-private-drill';
      texture.generateMipmaps=method==='associated-mips';
      texture.minFilter=method==='associated-mips'?T.LinearMipmapLinearFilter:T.LinearFilter;
      texture.magFilter=T.LinearFilter;texture.needsUpdate=true;
      usePaintedAtlasColor(material,true);material.needsUpdate=true;
      changed.push({id,asset:actor.asset,url:texture.image.src,premultiplyAlpha:texture.premultiplyAlpha,generateMipmaps:texture.generateMipmaps,minFilter:texture.minFilter,shaderKey:material.customProgramCacheKey()});
     }
    });
    cancelAnimationFrame(s.raf);s.render({...s.view(),fixedTime:10,paused:true},0);
    return{ready:s.ready,craft:!!s.craft,changed,actors:[...s.actors].map(([id,a])=>({id,asset:a.asset,feet:s.socket(id,'feet'),face:s.faceBounds(a)})),sizeAudit:s.sizeAudit()};
   },{method,root});
   const snapshot=resolve(raw,fixture.id+'-'+height+'-'+method+'.png');await page.screenshot({path:snapshot});
   receipt.results.push({fixture:fixture.id,width,height,method,state,errors:[...errors],snapshot:snapshot.slice(root.length+1),snapshotSha256:hash(snapshot)});
   writeFileSync(report,JSON.stringify(receipt,null,2)+'\n');
   console.log(fixture.id,height,method,'changed',state.changed.length,'errors',errors.length);
  }
  await page.close();
 }
}finally{await browser.close();}
receipt.complete=true;receipt.finished=new Date().toISOString();
receipt.pass=receipt.results.length===12&&receipt.results.every(r=>r.state.ready&&!r.state.craft&&r.errors.length===0&&r.state.changed.length>0&&r.state.changed.every(t=>t.premultiplyAlpha&&t.shaderKey==='painted-srgb-v2-pma'));
writeFileSync(report,JSON.stringify(receipt,null,2)+'\n');
if(!receipt.pass)process.exitCode=1;
