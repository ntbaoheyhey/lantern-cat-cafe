import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {web,requireWeb} from '../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
try{
 const R=await vite.ssrLoadModule('/@fs/'+process.cwd()+'/packages/game-rules/src/cardrpg/depth/index.ts');
 const rows=[];for(const seed of [7,17,71,1808,20261108]){
  const account=R.createDepthAccount(seed),battle=R.createBattle({seed,chapter:1,cats:R.battleCats(account),enemies:['button-guard','sock-skipper']});R.playBattle(battle,'auto');
  rows.push({seed,bytes:Buffer.byteLength(JSON.stringify(battle)),sha256:createHash('sha256').update(JSON.stringify(battle)).digest('hex'),logSha256:createHash('sha256').update(JSON.stringify(battle.log)).digest('hex'),result:battle.result});
 }
 const baseline='reports/cardrpg-look/b2/digests-v0.json',phase=process.argv[2]||'v0';await mkdir('reports/cardrpg-look/b2',{recursive:true});
 if(phase!=='v0'&&JSON.stringify(rows)!==JSON.stringify(JSON.parse(await readFile(baseline))))throw Error('Battle digest changed');
 await writeFile(`reports/cardrpg-look/b2/digests-${phase}.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify({phase,seeds:rows.length,match:true}));
}finally{await vite.close()}
