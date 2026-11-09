// Skills V5: registered 3 crews x 3 encounters x 20 TRAIN seeds, base stats/no gear.
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {build}=await import(require.resolve('vite'));
const tmp=await mkdtemp('/tmp/cardrpg-v5a-probe-');
const entry=resolve(tmp,'entry.ts');
await writeFile(entry,`export * as R from '${root}/packages/game-rules/src/cardrpg/depth/index.ts';\nexport * as L from '${root}/packages/game-rules/src/cardrpg/catalog.ts';`);
await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:tmp,minify:false,lib:{entry,formats:['es'],fileName:()=> 'rules.mjs'}}});
const {R,L}=await import(pathToFileURL(resolve(tmp,'rules.mjs')).href);
const flag=process.argv.includes('--v5'),v4=!process.argv.includes('--legacy');
const out=process.env.V5_PROBE_OUTPUT??'reports/cardrpg-big/skills-v5/s0/probe-baseline.json';
const crews=[['mochi','soot','clover'],['panko','mallow','cinnamon'],['biscuit','inkcap','sorrel']];
const encounters=[['button-guard','sock-skipper'],['teacup-healer','kettle-knight'],['yarn-giant']];
const rows=[],actionRows=[],skillUses={},statuses={party:{},enemy:{}},battleHash=createHash('sha256');
let damage=0,multiDamage=0,support=0,multiSupport=0,actions=0,rounds=0,reactions=0;
try{
 for(const crew of crews)for(const enemies of encounters)for(let seed=1;seed<=20;seed++){
  const setup={seed,chapter:1,gameplayV4:v4,...(flag?{skillsV5:true}:{}),cats:crew.map(id=>({id,stats:{...L.CARDS.find(c=>c.id===id).baseStats},skills:R.CAT_BY_ID[id].skills.map(s=>s.id),row:R.CAT_BY_ID[id].row})),enemies};
  const b=R.createBattle(setup);let steps=0;
  while(!b.result&&steps++<900){
   const actor=R.currentActor(b),offset=b.log.length;
   let choice;
   if(actor.side==='party'){choice=R.chooseAction(b,'auto');if(!R.act(b,choice))throw Error('Illegal choice');actions++;skillUses[choice.skillId]=(skillUses[choice.skillId]??0)+1;}
   else if(!R.enemyAct(b))throw Error('Enemy stalled');
   const logs=b.log.slice(offset),end=logs.findIndex(e=>e.kind==='action');
   const effects=end>=0?logs.slice(0,end):logs.slice(0,logs.findIndex(e=>e.kind==='enemy-action'));
   if(choice)actionRows.push({actor:actor.id,skillId:choice.skillId,events:effects.filter(e=>e.actorId===actor.id).map(e=>({kind:e.kind,amount:e.amount,target:e.targetId,side:b.actors.find(a=>a.id===e.targetId)?.side}))});
   for(const e of effects.filter(e=>e.kind==='status')){
    const target=b.actors.find(a=>a.id===e.targetId),id=R.STATUSES.find(s=>s.name===e.text)?.id??e.text;
    statuses[target.side][id]=(statuses[target.side][id]??0)+1;
   }
   reactions+=effects.filter(e=>e.kind==='detonate').length;
   if(choice){
    const foeTargets=new Set(effects.filter(e=>e.actorId===actor.id&&['damage','detonate'].includes(e.kind)&&b.actors.some(a=>a.id===e.targetId&&a.side==='enemy')).map(e=>e.targetId));
    const allyTargets=new Set(effects.filter(e=>e.actorId===actor.id&&['heal','shield'].includes(e.kind)&&b.actors.some(a=>a.id===e.targetId&&a.side==='party')).map(e=>e.targetId));
    if(foeTargets.size){damage++;if(foeTargets.size>1)multiDamage++;}
    if(allyTargets.size){support++;if(allyTargets.size>1)multiSupport++;}
   }
  }
  if(!b.result)throw Error('Action bound');rounds+=b.round;
  const serialized=JSON.stringify(b);battleHash.update(serialized+'\n');
  rows.push({crew,enemies,seed,result:b.result,rounds:b.round,actions:b.choices.length,sha256:createHash('sha256').update(serialized).digest('hex')});
 }
 const summary={mode:{gameplayV4:v4,skillsV5:flag},battles:rows.length,actions,damageActions:damage,multiDamageActions:multiDamage,multiFoeShare:100*multiDamage/damage,supportActions:support,multiSupportActions:multiSupport,multiAllyShare:100*multiSupport/support,roundsPerBattle:rounds/rows.length,detonationsPerBattle:reactions/rows.length,perSkill:Object.fromEntries(Object.entries(skillUses).sort((a,b)=>b[1]-a[1]).map(([id,count])=>[id,{count,share:100*count/actions}])),statusApplicationsByTargetSide:statuses,battleSha256:battleHash.digest('hex')};
 const supportDiagnostics=Object.fromEntries([['heal-shield',['heal','shield']],['positive-heal-shield',['heal','shield']],['all-support',['heal','shield','dispel','status','revive']]].map(([name,kinds])=>{const sizes=actionRows.map(a=>new Set(a.events.filter(e=>e.side==='party'&&kinds.includes(e.kind)&&(!name.startsWith('positive')||e.amount>0)).map(e=>e.target)).size).filter(n=>n>0);return [name,{actions:sizes.length,multi:sizes.filter(n=>n>1).length,share:100*sizes.filter(n=>n>1).length/sizes.length}];}));
 const result={supportDiagnostics,definition:'Per-action direct damage/detonate target IDs; support heal/shield target IDs, including zero amounts. Round-end events excluded after action marker. All four skills equipped, baseStats, no gear.',summary,rows,actionRows};
 result.simSha256=createHash('sha256').update(JSON.stringify(result)).digest('hex');
 await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
}finally{await rm(tmp,{recursive:true,force:true});}
