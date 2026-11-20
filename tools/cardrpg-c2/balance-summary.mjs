/** Read frozen measurement outputs. Never treats the absence of a loss as a
 * zero-minute loss, and never replaces the five UI runs with simulated data. */
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {cohort,balanceTargets} from './compare.mjs';
const arg=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const result={};
for(const [kind,expected] of [['real',5],['sim',500]]){
 const dir=arg(kind);if(!dir)continue;
 const files=(await readdir(dir)).filter(f=>/^\d+\.json$/.test(f)).sort();
 const reports=await Promise.all(files.map(async file=>JSON.parse(await readFile(resolve(dir,file),'utf8'))));
 const summary=cohort(reports),errors=reports.flatMap(r=>(r.errors??[]).map(e=>({seed:r.seed,...e})));
 const targets=balanceTargets(summary,expected);
 result[kind]={summary,targets,errors,pass:targets.pass&&!errors.length};
 console.log(kind,JSON.stringify(summary));
 console.table(targets.rows.map(r=>({metric:r.metric,value:r.value,target:`${r.min}–${r.max}`,result:r.pass?'PASS':'MISS'})));
}
if(!Object.keys(result).length)throw Error('Use --real=<five-seed-directory> and/or --sim=<500-seed-directory>');
const out=arg('out');if(out)await writeFile(out,JSON.stringify(result,null,2)+'\n');
if(arg('require-pass','0')==='1'&&Object.values(result).some(r=>!r.pass))process.exitCode=1;
