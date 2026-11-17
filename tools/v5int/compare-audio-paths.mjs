/** Expand transport packages before comparing the actual cold preload boundary. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
const [beforePath,afterPath,outputPath]=process.argv.slice(2);assert(beforePath&&afterPath);
assert.notEqual(resolve(beforePath),resolve(afterPath),'Compare distinct baseline and candidate captures');
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const [before,after,groups]=await Promise.all([read(resolve(beforePath)),read(resolve(afterPath)),read(resolve('apps/web/src/audio/packed-audio-index.json'))]);
const byUrl=new Map(groups.map(group=>[group.url,group.paths]));
const expand=row=>[...new Set(row.transfer.resources.flatMap(resource=>{
 if(resource.path.startsWith('/audio-delivery/')){assert(byUrl.has(resource.path),'Unknown package '+resource.path);return byUrl.get(resource.path);}
 return resource.path.startsWith('/audio/')?[resource.path]:[];
}))].sort();
const rows=after.rows.map(row=>{
 const previous=before.rows.find(value=>value.fixture===row.fixture);assert(previous);
 const original=expand(previous),current=expand(row);
 return{fixture:row.fixture,originalCount:original.length,currentCount:current.length,missing:original.filter(path=>!current.includes(path)),extra:current.filter(path=>!original.includes(path))};
});
const report={utc:new Date().toISOString(),before:{path:resolve(beforePath),source:before.sourceCommit,indexSha256:before.indexSha256},after:{path:resolve(afterPath),source:after.sourceCommit,indexSha256:after.indexSha256},method:'Expand each requested package into every encoded member, then compare complete audio path sets including original manifest requests.',rows,pass:rows.length===before.rows.length&&rows.every(row=>!row.missing.length&&!row.extra.length)};
const out=outputPath?resolve(outputPath):resolve(dirname(afterPath),'audio-path-equivalence.json');await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,...report}));assert(report.pass);
