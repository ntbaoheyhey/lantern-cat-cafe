/** Lossless file roundtrip is necessary before considering baked number assets. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-offline-number-atlas-r1');
assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const colors=['#55eb9b','#83ddff','#c1bfd1','#ff903e','#ffc86a','#c9adf3','#ffe0a2','#ffad55'];
const sourceKind=process.env.CXV_ATLAS_SOURCE??'image';assert(['image','canvas'].includes(sourceKind));
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:hash(await readFile(new URL(import.meta.url))),numberSourceSha256:hash(await readFile('apps/web/src/game/cardrpg/battle-v3/numbers.ts')),fontSha256:hash(await readFile('apps/web/public/fonts/baloo-2-latin-800-normal.woff2')),viewport:{width:1280,height:720},method:'Export actual loaded-font runtime atlases to PNG, then decode in a fresh browser context and compare original canvas versus decoded image using unchanged runtime text drawing at fractional positions, several heights/alpha values and1x/2x canvas scale. Study only; no production assets or loader change.',assets:[],runs:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
report.sourceKind=sourceKind;
await writeFile(resolve(out,'experiment-offline-number-atlas.mjs'),await readFile(new URL(import.meta.url)));
try{
 if(process.env.CXV_ATLAS_INPUT){
  const path=resolve(process.env.CXV_ATLAS_INPUT),bytes=await readFile(path),manifest=JSON.parse(bytes);
  assert.equal(manifest.numberSourceSha256,report.numberSourceSha256);assert.equal(manifest.fontSha256,report.fontSha256);
  report.inputManifest={path,sha256:hash(bytes)};report.font=manifest.font;report.assets=manifest.assets;report.exportErrors=[];report.exportBlocked=[];
  for(const row of report.assets)assert.equal(hash(await readFile(row.path)),row.sha256);
 }else{
 const exported=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});
 report.exportUrl=exported.page.url();report.indexSha256=hash(await (await exported.page.request.get('http://127.0.0.1:6310/')).body());
 const data=await exported.page.evaluate(async colors=>{
  const {BattleNumbers}=await import('/src/game/cardrpg/battle-v3/numbers.ts');
  const host=document.querySelector('canvas[data-puppet-numbers]').parentElement,n=new BattleNumbers(host);n.canvas.hidden=true;
  await document.fonts.load('800 96px "Baloo 2"',n.chars);await document.fonts.ready;
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const assets=[];
  for(const color of colors){const a=n.atlas(color),pixels=a.canvas.getContext('2d').getImageData(0,0,a.canvas.width,a.canvas.height).data;
   const blob=await new Promise(done=>a.canvas.toBlob(done,'image/png'));if(!blob)throw Error('PNG export failed');
   const dataUrl=await new Promise(done=>{const reader=new FileReader();reader.onload=()=>done(reader.result);reader.readAsDataURL(blob);});
   assets.push({color,width:a.canvas.width,height:a.canvas.height,glyphs:[...a.glyphs],digitHeight:a.digitHeight,rgbaSha256:await hash(pixels),dataUrl});
  }
  const font=getComputedStyle(host).getPropertyValue('--font-num').trim(),fonts=[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status}));n.dispose();return{assets,font,fonts};
 },colors);
 report.font=data.font;report.fonts=data.fonts;report.exportErrors=exported.errors;report.exportBlocked=exported.blockedRequests;
 for(const {dataUrl,...row}of data.assets){const bytes=Buffer.from(dataUrl.split(',')[1],'base64'),path=resolve(out,row.color.slice(1)+'.png');await writeFile(path,bytes);report.assets.push({...row,path,bytes:bytes.length,sha256:hash(bytes)});}
 await exported.page.close();
 }
 for(const row of report.assets)row.studyUrl='/__cxv_number_atlas__/'+row.path.split('/').at(-1);
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false,setupPage:async p=>{
  await p.route('**/__cxv_number_atlas__/*',async route=>{const path=new URL(route.request().url()).pathname,row=report.assets.find(a=>a.studyUrl===path);assert(row);await route.fulfill({status:200,contentType:row.path.endsWith('.webp')?'image/webp':'image/png',body:await readFile(row.path)});});
 }});
 report.roundtripUrl=page.url();
 report.measurement=await page.evaluate(async ({assets,sourceKind})=>{
  const {BattleNumbers}=await import('/src/game/cardrpg/battle-v3/numbers.ts'),host=document.querySelector('canvas[data-puppet-numbers]').parentElement;
  const n=new BattleNumbers(host);n.canvas.hidden=true;await document.fonts.load('800 96px "Baloo 2"',n.chars);await document.fonts.ready;
  const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  const delta=(a,b)=>{let changed=0,max=0,alphaChanged=0;for(let i=0;i<a.length;i+=4){let hit=false;for(let k=0;k<4;k++){const d=Math.abs(a[i+k]-b[i+k]);max=Math.max(max,d);if(d)hit=true;}if(hit)changed++;if(a[i+3]!==b[i+3])alphaChanged++;}return{changedPixels:changed,maxDelta:max,alphaChanged,exact:changed===0};};
  const atlases=[],cases=[],canvas=document.createElement('canvas'),c=canvas.getContext('2d',{willReadFrequently:true}),original=n.atlas;
  for(const asset of assets){
   const baseline=original.call(n,asset.color),image=new Image(),start=performance.now();image.src=asset.studyUrl;await image.decode();const decodeElapsedMs=performance.now()-start;
   let source=image,canvasRestoreElapsedMs=0;
   if(sourceKind==='canvas'){const start=performance.now();source=document.createElement('canvas');source.width=asset.width;source.height=asset.height;source.getContext('2d',{willReadFrequently:true}).drawImage(image,0,0);canvasRestoreElapsedMs=performance.now()-start;}
   const baked={canvas:source,glyphs:new Map(asset.glyphs),digitHeight:asset.digitHeight};
   canvas.width=asset.width;canvas.height=asset.height;c.drawImage(image,0,0);const decoded=c.getImageData(0,0,canvas.width,canvas.height).data,live=baseline.canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   atlases.push({color:asset.color,decodeElapsedMs,canvasRestoreElapsedMs,metricsExact:JSON.stringify([...baseline.glyphs])===JSON.stringify(asset.glyphs)&&baseline.digitHeight===asset.digitHeight,freshBaselineSha256:await hash(live),exportedSha256:asset.rgbaSha256,decodedSha256:await hash(decoded),...delta(live,decoded)});
   for(const ratio of [1,2])for(const height of [14,28,36,46,56.12])for(const fraction of [0,.37])for(const alpha of [1,.52]){
    canvas.width=640*ratio;canvas.height=128*ratio;const pixels=[];
    for(const atlas of [baseline,baked]){c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,640,128);c.fillStyle='#352b45';c.fillRect(0,0,640,128);c.globalAlpha=alpha;n.c=c;n.atlas=()=>atlas;n.text('−128+64◇52×',320+fraction,64+fraction,height,asset.color);c.globalAlpha=1;pixels.push(c.getImageData(0,0,canvas.width,canvas.height).data);}
    cases.push({color:asset.color,ratio,height,fraction,alpha,...delta(...pixels)});
   }
   n.atlas=original;
  }
  n.dispose();return{atlases,cases};
 },{assets:report.assets.map(({path,bytes,sha256,...row})=>row),sourceKind});
 report.errors=errors;report.blockedRequests=blockedRequests;await page.close();
 report.pass=!report.exportErrors.length&&!errors.length&&report.measurement.atlases.every(r=>r.exact&&r.metricsExact&&r.freshBaselineSha256===r.exportedSha256)&&report.measurement.cases.every(r=>r.exact);
 report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,bytes:report.assets.reduce((n,a)=>n+a.bytes,0),atlases:report.measurement.atlases,cases:report.measurement.cases.length,failedCases:report.measurement.cases.filter(r=>!r.exact).slice(0,8),errors}));
}finally{await browser.close();}
