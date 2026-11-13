import {readdirSync,readFileSync,statSync} from 'node:fs';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');let errors=[];const walk=p=>readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(resolve(p,d.name)):[resolve(p,d.name)]);
for(const file of walk(root+'/apps/web/src').filter(f=>/\.(css|tsx|ts)$/.test(f)&&!f.endsWith('/typography.css')&&!f.includes('.test.'))){if(/font-family\s*:/.test(readFileSync(file,'utf8')))errors.push(file.replace(root+'/',''));}
const bytes=walk(root+'/apps/web/public/fonts').filter(f=>f.endsWith('.woff2')).reduce((s,p)=>s+statSync(p).size,0);if(bytes>400*1024)errors.push('Font payload exceeds 400 KB');console.log(JSON.stringify({bytes,errors},null,2));process.exitCode=errors.length?1:0;
