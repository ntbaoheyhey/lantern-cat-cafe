import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {web,requireWeb} from '../../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const sha=s=>createHash('sha256').update(s).digest('hex');
try{
 const load=p=>vite.ssrLoadModule('/@fs/'+process.cwd()+'/'+p);
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const {applyV5Presentation}=await load('apps/web/src/game/squad/turn3d/card-v5-events.ts');
 const {statusPresentation,statusImpactLabels}=await load('apps/web/src/game/squad/turn3d/card-status-beats.ts');
 const base=JSON.parse(await readFile('reports/cardrpg-look/skills-v5/digests-before.json'));
 const rows=[];
 for(const seed of [7,17,71,1808,20261108]){
  const run=look=>{
   globalThis.window={__LOOK_V2__:look};
   const account=R.createDepthAccount(seed),battle=R.createBattle({seed,chapter:1,cats:R.battleCats(account),enemies:['button-guard','sock-skipper']});
   R.playBattle(battle,'auto');return battle;
  };
  const off=run(false),on=run(true),offJSON=JSON.stringify(off),onJSON=JSON.stringify(on);
  assert.equal(onJSON,offJSON);assert.equal(sha(onJSON),base.find(r=>r.seed===seed).sha256);
  rows.push({seed,sha256:sha(onJSON),logSha256:sha(JSON.stringify(on.log)),bytes:Buffer.byteLength(onJSON),onOffExact:true,baseExact:true});
  await writeFile(`${out}/battle-${seed}.json.gz`,gzipSync(onJSON));
 }
 const cases=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));let plans=0;
 for(const {frame}of cases){if(!frame?.plan)continue;const original=JSON.stringify(frame);const p=applyV5Presentation(frame.plan,statusPresentation(frame.plan,frame.battle.log),frame.plan.v5);for(const id of frame.plan.targetIds)statusImpactLabels(frame.plan,id,p);assert.equal(JSON.stringify(frame),original);plans++;}
 await writeFile(out+'/parity.json',JSON.stringify({rows,plansUnmutated:plans,method:'Pure full rules runs under each presentation flag; byte-exact to retained V0 base; explicit adapter immutability on fixed resolved plans. Browser delivery/layout checked separately.'},null,2));console.log(JSON.stringify({seeds:rows.length,plans,pass:true}));
}finally{delete globalThis.window;await vite.close()}
