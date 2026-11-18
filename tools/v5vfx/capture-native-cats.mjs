import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
const cats=(process.env.CXV_M_CATS??'sorrel,biscuit,inkcap,cinnamon,brioche,velvet,marigold').split(',');
const rows=[];
for(const cat of cats){
 const out=`work/v5/CXV/films/M-V2-${cat}-native-R1`;
 console.log(JSON.stringify({utc:new Date().toISOString(),cat,event:'capture-start'}));
 execFileSync('node',['tools/v5vfx/capture-native-living.mjs'],{env:{...process.env,CXV_M_CAT:cat,CXV_M_OUT:out},stdio:['ignore','inherit','inherit']});
 const report=JSON.parse(await readFile(`${out}/report.json`,'utf8'));
 rows.push({cat,out,pass:report.pass,completedUTC:report.completedUTC});
 await writeFile('work/v5/CXV/batch-m/native-seven-capture-progress.json',JSON.stringify(rows,null,2)+'\n');
 if(!report.pass)throw Error(`Native checks failed for ${cat}; inspect ${out}/report.json before continuing.`);
 execFileSync('python3',['tools/v5vfx/compare-panko-source.py',out],{stdio:['ignore','pipe','inherit']});
 console.log(JSON.stringify({utc:new Date().toISOString(),cat,event:'comparison-complete',pass:true}));
}
