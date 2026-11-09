import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {web,requireWeb} from '../../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});
try{
const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
const R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),C=await load('packages/game-rules/src/cardrpg/catalog.ts');
const crews={oven:['mallow','cinnamon','mochi'],thread:['velvet','biscuit','brioche'],night:['soot','marigold','inkcap'],tea:['clover','sorrel','panko']};
const enemies={pair:['button-guard','sock-skipper'],healer:['teacup-healer','kettle-knight'],wave:['spool-ram','needle-moth','sock-skipper'],boss:['yarn-giant']};
const rows=[];
for(const [crew,ids]of Object.entries(crews))for(const [encounter,foes]of Object.entries(enemies)){
 for(const seed of crew==='oven'&&encounter==='pair'?[1,7,26]:[1]){
 const setup={seed,chapter:1,gameplayV4:true,skillsV5:true,cats:ids.map(id=>({id,stats:{...C.CARD_BY_ID[id].baseStats},row:R.CAT_BY_ID[id].row,skills:R.CAT_BY_ID[id].skills.map(s=>s.id)})),enemies:foes};
 const battle=R.playBattle(R.createBattle(setup),'auto');const sha=createHash('sha256').update(JSON.stringify(battle)).digest('hex');
 const row={id:crew+'-'+encounter+'-'+seed,crew,encounter,seed,setup,sha256:sha,rounds:battle.round,result:battle.result,reactions:[...new Set(battle.v4.events.filter(e=>e.kind==='reaction').map(e=>e.reactionId))],shapes:[...new Set(battle.v4.events.filter(e=>e.kind==='multi-hit').map(e=>e.shape))]};rows.push(row);
 await writeFile(out+'/'+row.id+'.json.gz',gzipSync(JSON.stringify(battle)));
 }}
 await writeFile(out+'/registration.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(({setup,...r})=>r)));
 await writeFile('reports/cardrpg-look/skills-v5/full/LIVE-SEEDS.md','# Registered live seeds\nPublished A S5 source 6772eb343; base stats, no gear, automatic policy, chapter 1. Registered before browser coverage; no acceptance seeds.\n\n| Case | Seed | Rules digest |\n|---|---:|---|\n'+rows.map(r=>'| '+r.crew+'/'+r.encounter+' | '+r.seed+' | '+r.sha256+' |').join('\n')+'\n');
}finally{await vite.close()}
