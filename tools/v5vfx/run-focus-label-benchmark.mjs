/** Sequential alternating 32s/rate ordinary play, no concurrent benchmark loads. */
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-focus-label-play');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),order:['off','on','on','off','off','on'],runs:[],pass:false};
for(const [index,mode]of report.order.entries()){
 const dir=resolve(out,`${index}-${mode}`),result=spawnSync(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{env:{...process.env,CXV_CAPTURE_OUT:dir,CXV_PENDING_BATCH:mode},encoding:'utf8',maxBuffer:4*1024*1024});
 await writeFile(resolve(out,`${index}-${mode}.log`),result.stdout+result.stderr);
 if(result.status!==0)throw Error(`Trial ${index} ${mode} failed: ${result.stderr.slice(-500)}`);
 const run=JSON.parse(await readFile(resolve(dir,'report.json'),'utf8'));report.runs.push({index,mode,path:resolve(dir,'report.json'),pass:run.pass});
 console.log(`${new Date().toISOString()} trial ${index} ${mode} pass=${run.pass}`);
 await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));
}
report.ended=new Date().toISOString();report.pass=report.runs.every(r=>r.pass);await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));
