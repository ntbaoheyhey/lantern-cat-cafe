/** Compare installed, source, production and served notices; not an entitlement audit. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2],buildPath=process.argv[3];
assert(/^\d+$/.test(attempt)&&buildPath,'Specify an unused attempt and production build report');
const output=resolve(root,`reports/v4-ship/S11/repo-notice-check-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),build=JSON.parse(readFileSync(resolve(root,buildPath))),path='licenses/spine-runtimes-4.2.120.txt';
const recorded=readFileSync(resolve(root,'docs',path)),expected=hash(recorded);
const rows=[];
for(const name of ['spine-core','spine-threejs']){
 const base=resolve(root,'apps/web/node_modules/@esotericsoftware',name),metadata=JSON.parse(readFileSync(resolve(base,'package.json'))),sha256=hash(readFileSync(resolve(base,'LICENSE')));
 rows.push({surface:'installed',name,version:metadata.version,sha256,pass:metadata.version==='4.2.120'&&sha256===expected});
}
for(const [surface,base] of [['source','apps/web/public'],['production',build.output]]){
 const file=resolve(root,base,path),sha256=existsSync(file)?hash(readFileSync(file)):null;rows.push({surface,path:relative(root,file),sha256,pass:sha256===expected});
}
const index=await fetch('http://127.0.0.1:5998'),indexIdentity=index.ok&&hash(Buffer.from(await index.arrayBuffer()))===build.indexSha256;
const response=await fetch('http://127.0.0.1:5998/'+path),bytes=Buffer.from(await response.arrayBuffer()),contentType=response.headers.get('content-type'),sha256=hash(bytes);
rows.push({surface:'http',path:'/'+path,status:response.status,contentType,bytes:bytes.length,sha256,pass:response.ok&&contentType?.startsWith('text/plain')&&sha256===expected});
const report={at:new Date().toISOString(),buildEvidence:buildPath,sourceCommit:build.sourceCommit,indexIdentity,noticeSha256:expected,rows,packagedNoticePass:indexIdentity&&rows.every(r=>r.pass),entitlementVerified:false,overallRepoGatePass:false,scope:'Exact installed4.2.120notice is retained in the built distribution and served without HTML fallback. This does not establish editor entitlement, historical ownership or all repository gates.'};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),packagedNoticePass:report.packagedNoticePass,rows:rows.length}));if(!report.packagedNoticePass)process.exitCode=1;
