/** Exact lossless copies stay in ignored study output until renderer and load gates pass. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const input=resolve('work/v5/CXV/films/V7-F-offline-number-atlas-r2/report.json'),out=resolve('work/v5/CXV/films/V7-F-offline-number-atlas-webp');
assert(!existsSync(resolve(out,'manifest.json')));await mkdir(out,{recursive:true});
const bytes=await readFile(input),source=JSON.parse(bytes);assert(source.pass&&source.sourceKind==='canvas');
const report={utc:new Date().toISOString(),source:source.source,runtimePatchSha256:source.runtimePatchSha256,exportManifest:input,exportManifestSha256:hash(bytes),font:source.font,fontSha256:source.fontSha256,numberSourceSha256:source.numberSourceSha256,encoder:execFileSync('cwebp',['-version'],{encoding:'utf8'}).trim(),options:['-lossless','-exact','-m','6'],assets:[]};
for(const row of source.assets){
 assert.equal(hash(await readFile(row.path)),row.sha256);const path=resolve(out,row.color.slice(1)+'.webp');
 execFileSync('cwebp',[...report.options,row.path,'-o',path],{stdio:'ignore'});const data=await readFile(path);
 report.assets.push({...row,pngPath:row.path,pngBytes:row.bytes,pngSha256:row.sha256,path,bytes:data.length,sha256:hash(data)});
}
await writeFile(resolve(out,'manifest.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({out,pngBytes:report.assets.reduce((n,a)=>n+a.pngBytes,0),webpBytes:report.assets.reduce((n,a)=>n+a.bytes,0),assets:report.assets.map(({color,bytes})=>({color,bytes}))}));
