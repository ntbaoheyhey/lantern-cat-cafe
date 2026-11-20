/** Full web/server/workspace verification, with durable receipts for SOLO. */
import {spawn,execFileSync} from 'node:child_process';
import {createWriteStream,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
if(!label||!/^[A-Za-z0-9-]+$/.test(label))throw Error('Supply a unique suite label');
const out=resolve(root,'reports/v3-shell/b2/tests'),resultPath=resolve(out,label+'-suite.json');mkdirSync(out,{recursive:true});
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
const sourcePaths=execFileSync('git',['diff','--name-only','HEAD','--','apps','packages','supabase','scripts','tools'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
const sources=sourcePaths.map(path=>({path,sha256:hash(resolve(root,path))}));
const results=[];
async function run(id,command){
 const path=resolve(out,label+'-'+id+'.log'),log=createWriteStream(path),started=new Date().toISOString();
 const child=spawn(command[0],command.slice(1),{cwd:root,stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);
 const code=await new Promise((yes,no)=>{child.on('error',no);child.on('close',yes);});
 await new Promise(yes=>log.end(yes));
 const row={id,command,exitCode:code,started,ended:new Date().toISOString(),log:{path:relative(root,path),sha256:hash(path)}};results.push(row);
 writeFileSync(resultPath,JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sources,results},null,2)+'\n');
 console.log(`${id}: ${code===0?'PASS':'FAIL'} exit${code}`);return code;
}
const codes=await Promise.all([run('types',['pnpm','-r','typecheck']),run('unit',['pnpm','test'])]);
for(const source of sources)if(hash(resolve(root,source.path))!==source.sha256)throw Error('Source changed during suite: '+source.path);
process.exitCode=codes.every(code=>code===0)?0:1;
