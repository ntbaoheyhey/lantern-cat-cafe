import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {gzipSync} from 'node:zlib';
const c='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GB-R1',base='/Users/bao/.codex/worktrees/mega-base0-grade-b-5db4949/';const env={...process.env,CI:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''};
const records=[];
for(const [label,dir]of [['main','main-baseline'],['candidate','scratch']]){
 const root=base+dir;
 for(const[name,command]of [['install','pnpm install --frozen-lockfile'],['build','pnpm build'],['classic','VITE_GAME_V2=0 pnpm --filter @taskbar-hero/web exec vite build --outDir dist/gb-classic'],['v2','VITE_GAME_V2=1 pnpm --filter @taskbar-hero/web exec vite build --outDir dist/gb-v2'],['links','node scripts/check-links.mjs --json'],['bundle-scan','node scripts/check-bundle.mjs']]){
 if(!fs.readFileSync(c+'/CONTROL.md','utf8').startsWith('ACTIVE:'))throw Error('PAUSED');
 const start=new Date().toISOString(),fd=fs.openSync(c+'/logs/'+label+'-'+name+'.log','w');const r=spawnSync(command,{cwd:root,env,shell:'/bin/zsh',stdio:['ignore',fd,fd]});fs.closeSync(fd);fs.appendFileSync(c+'/build-results.jsonl',JSON.stringify({label,name,command,cwd:root,start,end:new Date().toISOString(),exit:r.status,head:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim()})+'\n');
 }
 function sum(dir){return fs.readdirSync(dir,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?sum(dir+'/'+e.name):/\.(?:js|css)$/.test(e.name)?gzipSync(fs.readFileSync(dir+'/'+e.name)).length:0),0);}
 records.push({label,classic_gzip:sum(root+'/apps/web/dist/gb-classic'),v2_gzip:sum(root+'/apps/web/dist/gb-v2')});
}
fs.writeFileSync(c+'/bundle-comparison.json',JSON.stringify(records,null,2));fs.writeFileSync(c+'/BUILD_DONE',new Date().toISOString());
