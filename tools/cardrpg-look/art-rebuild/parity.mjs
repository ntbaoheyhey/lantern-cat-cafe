import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {web,requireWeb} from '../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const out=process.env.ART_OUT;await mkdir(out,{recursive:true});
const hash=s=>createHash('sha256').update(s).digest('hex');
try{
 const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {applyV5Presentation}=await load('apps/web/src/game/squad/turn3d/card-v5-events.ts');
 const {statusPresentation,statusImpactLabels}=await load('apps/web/src/game/squad/turn3d/card-status-beats.ts');
 const base=JSON.parse(await readFile('reports/cardrpg-look/skills-v5/digests-before.json'));
 const variants=[{look:false,art:'v2'},{look:true,art:'v2'},{look:true,art:'v3',pipeline:'sculpt'},{look:true,art:'v3',pipeline:'painted'},{look:true,art:'v3',pipeline:'generated'}];
 const rows=[];
 for(const seed of [7,17,71,1808,20261108]){
  const runs=variants.map(({look,art,pipeline})=>{
   globalThis.window={__LOOK_V2__:look,__LOOK_ART__:art,__LOOK_ART_PIPELINE__:pipeline};
   const account=R.createDepthAccount(seed),battle=R.createBattle({seed,chapter:1,cats:R.battleCats(account),enemies:['button-guard','sock-skipper']});R.playBattle(battle,'auto');return JSON.stringify(battle);
  });
  for(const json of runs)assert.equal(json,runs[0]);assert.equal(hash(runs[0]),base.find(r=>r.seed===seed).sha256);
  rows.push({seed,sha256:hash(runs[0]),bytes:Buffer.byteLength(runs[0]),allVariantsExact:true,baseExact:true});
 }
 const cases=JSON.parse(gunzipSync(await readFile('reports/cardrpg-look/skills-v5/full/m4/live-pilot/live-cases/cases.json.gz')));let plans=0;
 for(const variant of variants)for(const row of cases){if(!row.frame?.plan)continue;globalThis.window={__LOOK_V2__:variant.look,__LOOK_ART__:variant.art,__LOOK_ART_PIPELINE__:variant.pipeline};const {frame}=row,original=JSON.stringify(frame);const p=applyV5Presentation(frame.plan,statusPresentation(frame.plan,frame.battle.log),frame.plan.v5);for(const id of frame.plan.targetIds)statusImpactLabels(frame.plan,id,p);assert.equal(JSON.stringify(frame),original);plans++;}
 await writeFile(out+'/parity.json',JSON.stringify({variants,rows,plansUnmutated:plans,method:'Five full B rules seeds exact to retained V0 base across OFF/v2/sculpt/painted/generated. Registered live P-shot resolved plans checked for adapter immutability across five modes; full A live simulation belongs to integration source and is not claimed repeated here.'},null,2)+'\n');console.log(JSON.stringify({seeds:rows.length,variants:variants.length,plans,pass:true}));
}finally{delete globalThis.window;await vite.close()}
