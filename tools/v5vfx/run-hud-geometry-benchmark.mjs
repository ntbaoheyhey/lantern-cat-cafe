/** Sequential actual-play trials; source overrides are experiments, not acceptance. */
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-hud-geometry');
await mkdir(out,{recursive:true});
const order=(process.env.CXV_HUD_ORDER??'baseline,cache-diagnostic,text,hidden,stable').split(',');
const report={utc:new Date().toISOString(),order,runs:[],pass:false};
for(const [index,mode]of order.entries()){
 const dir=resolve(out,index+'-'+mode);
 const result=spawnSync(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{env:{...process.env,CXV_CAPTURE_OUT:dir,CXV_HUD_MODE:mode,CXV_FOCUS_PROFILE:'1'},encoding:'utf8',maxBuffer:4*1024*1024});
 await writeFile(resolve(out,index+'-'+mode+'.log'),result.stdout+result.stderr);
 if(result.status!==0)throw Error('HUD trial '+index+' '+mode+' failed: '+result.stderr.slice(-1000));
 const trial=JSON.parse(await readFile(resolve(dir,'report.json'),'utf8'));
 report.runs.push({index,mode,path:resolve(dir,'report.json'),pass:trial.pass});
 await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));
 console.log(new Date().toISOString()+' trial '+index+' '+mode+' pass='+trial.pass);
}
report.ended=new Date().toISOString();report.pass=report.runs.every(r=>r.pass);
await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));
