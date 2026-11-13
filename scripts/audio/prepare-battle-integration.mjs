/** Temporary review checkout only. Branches remain separate until dated sync. */
import {execFileSync,spawn} from 'node:child_process';
import {mkdirSync,symlinkSync,existsSync,writeFileSync,readFileSync,readdirSync,lstatSync,unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),a='/Users/bao/taskbar-hero-cardrpg-a6';
const out=resolve(root,'work/v3solo-integration');mkdirSync(out,{recursive:true});
const head=cwd=>execFileSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'}).trim();
const aHead=head(a),bHead=head(root);
async function extract(cwd,commit,paths){
 const archive=spawn('git',['archive',commit,...paths],{cwd,stdio:['ignore','pipe','inherit']});
 const tar=spawn('tar',['-xf','-','-C',out],{stdio:['pipe','ignore','inherit']});archive.stdout.pipe(tar.stdin);
 await Promise.all([archive,tar].map(p=>new Promise((yes,no)=>{p.on('error',no);p.on('exit',c=>c===0?yes():no(Error('archive exit '+c)));})));
}
const base=['apps/web','packages','tools','scripts','tsconfig.base.json','pnpm-workspace.yaml','package.json'];
const overlay=['apps/web/src/game/cardrpg/battle-v3','apps/web/src/game/cardrpg/spine','apps/web/src/game/cardrpg/stage','apps/web/src/game/cardrpg/vfx-layered','apps/web/src/game/rig','apps/web/src/game/cardrpg/depth/model.ts','apps/web/src/game/cardrpg/depth/Battle.tsx','apps/web/src/game/cardrpg/depth/CompanionCard.tsx','apps/web/src/game/cardrpg/ui-v3/BattleHudV3.tsx','apps/web/src/game/cardrpg/ui-v3/ResultA6.tsx','apps/web/src/game/cardrpg/contracts/audio-cues.ts','apps/web/public/art','apps/web/public/cinematics','apps/web/public/units','skills','tools/cinematic-compositor'];
overlay.push('scripts/art');
await extract(root,bHead,base);await extract(a,aHead,overlay);
for(const [name,from] of [['assets',resolve(a,'assets')],['art',resolve(a,'art')],['reports',resolve(root,'reports')]])if(!existsSync(resolve(out,name)))symlinkSync(from,resolve(out,name),'dir');
for(const path of ['node_modules',...['game-rules','api-contract','chain','auth'].map(p=>'packages/'+p+'/node_modules')]){
 const from=resolve(root,path),to=resolve(out,path);if(existsSync(from)&&!existsSync(to))symlinkSync(from,to,'dir');
}
// Union installed dependencies in the temporary directory, never mutate either lane.
const deps=resolve(out,'apps/web/node_modules');if(existsSync(deps)&&lstatSync(deps).isSymbolicLink())unlinkSync(deps);mkdirSync(deps,{recursive:true});
for(const lane of [root,a])for(const name of readdirSync(resolve(lane,'apps/web/node_modules'))){
 if(name.startsWith('.'))continue;
 if(name.startsWith('@')){mkdirSync(resolve(deps,name),{recursive:true});for(const child of readdirSync(resolve(lane,'apps/web/node_modules',name))){const to=resolve(deps,name,child);if(!existsSync(to))symlinkSync(resolve(lane,'apps/web/node_modules',name,child),to,'dir');}}
 else if(!existsSync(resolve(deps,name)))symlinkSync(resolve(lane,'apps/web/node_modules',name),resolve(deps,name),'dir');
}
const signatures=['apps/web/src/game/cardrpg/depth/model.ts','apps/web/src/game/cardrpg/battle-v3/voice-windows.ts','apps/web/src/audio/engine.ts','apps/web/src/audio/voice-callouts.json','apps/web/public/audio/manifest.json'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(out,path))).digest('hex')}));
writeFileSync(resolve(out,'apps/web/vite.solo.config.mts'),`import base from './vite.config';\nexport default {...base,resolve:{...base.resolve,dedupe:['three','react','react-dom']},server:{fs:{allow:${JSON.stringify([out,root,a])}}}};\n`);
const record={generatedAt:new Date().toISOString(),aHead,bHead,out,base,overlay,signatures,method:'Committed B runtime with A-owned battle paths overlaid in an untracked checkout under B. No branch merge or source edit.'};
mkdirSync(resolve(root,'reports/v3-shell/b2/q2'),{recursive:true});
writeFileSync(resolve(root,'reports/v3-shell/b2/q2/integration.json'),JSON.stringify(record,null,2)+'\n');
console.log(JSON.stringify({aHead,bHead,out}));
