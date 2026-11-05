// Source/asset isolation audit. No network, model calls or server changes.
import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const changed=execFileSync('git',['diff','--name-only','41a6aa3','HEAD'],{encoding:'utf8'}).trim().split('\n');
const protectedPaths=changed.filter(p=>/^(packages\/(chain|api-contract)|supabase\/migrations|apps\/web\/src\/(api|store)|packages\/game-rules\/src\/v2)\//.test(p));assert.deepEqual(protectedPaths,[]);
const server=changed.filter(p=>p.startsWith('supabase/'));assert(server.every(p=>p.endsWith('/deno.json')));
const flag=(await fs.readFile('packages/game-rules/src/config.ts','utf8')).match(/squadCombat:\s*false/)?.[0];assert(flag);
const sources=[];for(const path of ['apps/web/src/game/squad/turn3d','packages/game-rules/src/squad/turn'])for(const name of await fs.readdir(path))if(/\.(ts|tsx)$/.test(name)&&!name.includes('.test.'))sources.push({path:path+'/'+name,text:await fs.readFile(path+'/'+name,'utf8')});
const writes=sources.filter(s=>/localStorage|sessionStorage|indexedDB|supabase|fetch\(|\/api\//.test(s.text));assert.deepEqual(writes,[]);
const manifest=JSON.parse(await fs.readFile('docs/turn3d/ASSET-MANIFEST.json','utf8'));
const assets=[];for(const a of manifest.assets){const b=await fs.readFile(a.output);assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);assert(a.triangles<=a.triangleBudget);assets.push({id:a.id,bytes:b.length,sha256:a.sha256})}
const totalBytes=assets.reduce((s,a)=>s+a.bytes,0);const output={date:new Date().toISOString(),runtime:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),defaultOff:!!flag,protectedPaths,serverChanges:server,note:'Only generated Deno import-map additions; no server logic or deployment. GLTFLoader performs allowed local GETs when flag on; file demo uses embedded bytes. This source audit is complemented by runtime isolation.json.',sourceFiles:sources.length,storageOrAPIMatches:writes,originalModels:assets.length,totalBytes,assets};
await fs.writeFile('reports/turn3d/source-audit.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify({defaultOff:!!flag,sourceFiles:sources.length,originalModels:assets.length,totalBytes,protectedPaths}));
