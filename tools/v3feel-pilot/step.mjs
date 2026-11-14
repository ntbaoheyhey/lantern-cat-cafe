// Wall-clock revision timings. Reused work is explicitly recorded, never estimated as measured.
import {readFileSync,writeFileSync} from 'node:fs';
const path=new URL('../../reports/v3-feel/CRAFT/pilot-3-times.json',import.meta.url);
const data=JSON.parse(readFileSync(path,'utf8')),now=new Date().toISOString();
const last=data.steps.at(-1);
if(last&&!last.ended){last.ended=now;last.seconds=(Date.parse(now)-Date.parse(last.started))/1000;}
if(process.argv[2]&&process.argv[2]!=='end')data.steps.push({step:process.argv[2],started:now,note:process.argv.slice(3).join(' ')});
data.updatedAt=now;writeFileSync(path,JSON.stringify(data,null,2)+'\n');
console.log(JSON.stringify(data.steps.at(-1)));
