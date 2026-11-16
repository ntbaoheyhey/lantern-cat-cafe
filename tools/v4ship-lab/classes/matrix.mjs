/** S2b research only: production modules are transformed in memory, never edited.
 * The unmodified control must reproduce the three committed browser fixture hashes/times.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..');
const require=createRequire(resolve(root,'apps/web/package.json'));
const {build}=await import(require.resolve('vite'));
const fixtureConfig=JSON.parse(await readFile(resolve(root,'scripts/v3a2/fixtures.json'),'utf8'));
const prior=JSON.parse(await readFile(resolve(root,'reports/v4-ship/S0/parity.json'),'utf8'));
const samples=Number(process.env.V4_CLASS_SAMPLES??30),sessions=Number(process.env.V4_CLASS_SESSIONS??30);
const firstSeed=Number(process.env.V4_CLASS_FIRST_SEED??1),heals=(process.env.V4_CLASS_HEALS??'35,65').split(',').map(Number);
assert(Number.isInteger(firstSeed)&&firstSeed>0&&heals.every(n=>Number.isInteger(n)&&n>0&&n<=100));
const only=process.env.V4_CLASS_VARIANT;
const production=process.env.V4_CLASS_PRODUCTION==='1';
const balance=process.env.V4_CLASS_BALANCE??'none';
const sessionMethod=process.env.V4_CLASS_SESSION_METHOD??'a6-legacy';
const enemyPressure=Number(process.env.V4_CLASS_ENEMY_PRESSURE??1);
assert(Number.isFinite(enemyPressure)&&enemyPressure>=1&&enemyPressure<=1.1);
assert(['a6-legacy','c2-current'].includes(sessionMethod));
assert(['none','boss-half','boss-45pct','offense-double','ultimate-triple'].includes(balance));
const out=resolve(root,process.env.V4_CLASS_OUTPUT??'reports/v4-ship/S2b/matrix.json');
const variants=[{id:'control',policy:'ratio',heal:0},...['ratio','missing','front'].flatMap(policy=>heals.map(heal=>({id:`${policy}-${heal}`,policy,heal})))].filter(v=>!only||v.id===only);
assert(variants.length,'Unknown variant');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const quantile=(xs,q)=>{const s=[...xs].sort((a,b)=>a-b);if(!s.length)return null;const pos=(s.length-1)*q;return s[Math.floor(pos)]+(s[Math.ceil(pos)]-s[Math.floor(pos)])*(pos%1);};
function replaceOnce(source,from,to,file){assert.equal(source.split(from).length,2,`Expected one transform anchor in ${file}`);return source.replace(from,to);}
function selector(policy){return `function selectHealerPatientS2b(actors:Actor[]) { const living=actors.filter(a=>a.hp>0); const wounded=living.filter(a=>a.hp<a.maxHp); const pool=wounded.length?wounded:living; return [...pool].sort((a,c)=>${policy==='missing'?'(c.maxHp-c.hp)-(a.maxHp-a.hp)':policy==='front'?"Number(c.row==='front')-Number(a.row==='front') || a.hp/a.maxHp-c.hp/c.maxHp":'a.hp/a.maxHp-c.hp/c.maxHp'} || a.id.localeCompare(c.id))[0]!; }\n`;}
function variantPlugin(v){return {name:'v4ship-isolated-healer-study',enforce:'pre',transform(source,id){
 if(production||v.id==='control')return null;
 const file=id.split('?')[0].replace(root+'/','');let code=source;
 if(file==='packages/game-rules/src/cardrpg/depth/catalog.ts')code+=`\n// Isolated research variant ${v.id}.\nfor(const cat of CATS.filter(c=>c.role==='healer'))for(const skill of cat.skills){
 if(skill.id.endsWith('-1'))Object.assign(skill,{type:'support',target:'ally',breakPower:0,effects:[{kind:'heal',power:${v.heal}}]});
 if(skill.id==='marigold-3')Object.assign(skill,{type:'support',target:'ally',breakPower:0,effects:[{kind:'cleanse'},{kind:'shield',power:45}]});
 skill.effects=skill.effects.filter(e=>['heal','cleanse','shield','revive','transfer'].includes(e.kind)||e.kind==='rally'&&['cozy','steep','glaze','shelter','link','sprout','decoy'].includes(e.status??''));
}\n${balance.startsWith('boss-')?`ENEMY_BY_ID['yarn-giant'].hp=Math.round(ENEMY_BY_ID['yarn-giant'].hp*${balance==='boss-half'?.5:.45});`:''}\n`;
 if(file==='packages/game-rules/src/cardrpg/depth/skills-v5/kits.ts')code=replaceOnce(code,"const patch=patches[original.id]??{};",`const patch:Patch=['clover','cinnamon','marigold'].includes(original.catId)?{shape:original.target==='allies'?'team':original.target==='fallen'?'fallen':'weakest',effects:original.effects}:patches[original.id]??{};`,file);
 if(file==='packages/game-rules/src/cardrpg/depth/gameplay-a6.ts'&&enemyPressure!==1)code=replaceOnce(code,"actor.attack * (b.chapter === 1 ? .65 : .85)",`actor.attack * (b.chapter === 1 ? .65 : .85) * ${enemyPressure}`,file);
 if(file==='packages/game-rules/src/cardrpg/depth/skills-v5/kits.ts'&&['offense-double','ultimate-triple'].includes(balance))code=replaceOnce(code,'skill.description=describeSkillV5(skill);',`if(!['clover','cinnamon','marigold'].includes(original.catId)${balance==='ultimate-triple'?"&&original.type==='ultimate'":''})for(const effect of skill.effects)if(['hit','execute','detonate'].includes(effect.kind)&&effect.power!==undefined)effect.power*=${balance==='ultimate-triple'?3:2};\n  skill.description=describeSkillV5(skill);`,file);
 if(file==='packages/game-rules/src/cardrpg/depth/skills-v5/shapes.ts'){
  code+=selector(v.policy);
  code=replaceOnce(code,"case 'weakest': return one(weakestV5(allies));","case 'weakest': return one(actor.role==='healer'?selectHealerPatientS2b(allies):weakestV5(allies));",file);
  code=replaceOnce(code,"case 'ally-splash': {const patient=weakestV5(allies);","case 'ally-splash': {const patient=actor.role==='healer'?selectHealerPatientS2b(allies):weakestV5(allies);",file);
 }
 if(file==='packages/game-rules/src/cardrpg/depth/battle.ts'){
  code+=selector(v.policy);
  code=replaceOnce(code,'const target=weakestV5(allies);return target?[target]:[];','const target=actor.role===\'healer\'?selectHealerPatientS2b(allies):weakestV5(allies);return target?[target]:[];',file);
  code=replaceOnce(code,'  if (impaired) {',`  if (spec.role==='healer') {\n    if(impaired||quiet)creditSuppression();\n    else {const patient=selectHealerPatientS2b(living(b,'enemy'));if(patient)heal(b,actor,patient,signature?65:${v.heal});}\n  }\n  else if (impaired) {`,file);
  code=replaceOnce(code,"function damage(b: Battle, source: Actor, target: Actor, power: number, pressure: number, cover = false, shape: ShapeV5 = 'single') {","function damage(b: Battle, source: Actor, target: Actor, power: number, pressure: number, cover = false, shape: ShapeV5 = 'single') {\n  if(source.role==='healer')return;",file);
  code=replaceOnce(code,'function loseHp(b: Battle, source: Actor, target: Actor, amount: number, kind: string) {',"function loseHp(b: Battle, source: Actor, target: Actor, amount: number, kind: string) {\n  if(source.role==='healer'&&source.side!==target.side)return;",file);
 }
 return code===source?null:{code,map:null};
}};}
async function fixture(bundle,fixture,seed){
 const {R,Model}=bundle;
 const m=new Model.DepthModel(true,true,true,true,true);
 m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(seed),true));m.state.tutorial=4;
 Object.assign(m.state.settings,{speed:1,quality:'high',reducedMotion:false});
 for(const card of m.state.account.cards){card.level=6;m.state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(s=>s.id);}
 const b=R.createBattle({seed,chapter:fixture.chapter,cats:R.battleCats(m.state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});b.v4.committed=true;
 Object.assign(m,{tutorialBattle:b,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:false,sceneStarted:true,screen:'map',sceneReady:true,playbackFrameAt:undefined});
 let elapsed=0,actions=0;
 for(let i=0;i<2000&&!b.result;i++){
  m.step();assert(m.plan,'No scheduled legal action');actions++;
  while(m.plan){const p=m.plan;for(let j=0;j<2000&&m.plan===p;j++){elapsed+=1000/30;m.tick(1000/30,elapsed);}assert.notEqual(m.plan,p,'Action failed to settle');}
 }
 assert(b.result,'Battle failed to settle');
 const expected=R.playBattle(R.createBattle(b.initial),'auto');assert.deepEqual(b,expected);
 const party=b.actors.filter(a=>a.side==='party'),healers=new Set(b.actors.filter(a=>a.role==='healer').map(a=>a.id));
 return {fixture:fixture.id,seed,result:b.result,durationSeconds:elapsed/1000,actions,rounds:b.round,winHp:party.reduce((s,a)=>s+a.hp,0)/party.reduce((s,a)=>s+a.maxHp,0),healing:b.log.filter(e=>healers.has(e.actorId)&&e.kind==='heal').reduce((s,e)=>s+e.amount,0),healerDamage:b.log.filter(e=>healers.has(e.actorId)&&['damage','dot','detonate','reflect','reaction-damage'].includes(e.kind)).reduce((s,e)=>s+e.amount,0),hash:hash(b)};
}
const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),labSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),production,balance,enemyPressure,sessionMethod,purpose:'isolated learning matrix; not a parity replacement or runtime funnel gate',firstSeed,samples,sessions,variants:[]};
await mkdir(resolve(out,'..'),{recursive:true});
for(const variant of variants){
 const temp=await mkdtemp('/tmp/v4ship-class-study-');const began=performance.now();
 try{
  const entry=resolve(temp,'entry.ts');const paths={R:'packages/game-rules/src/cardrpg/depth/index.ts',C:'packages/game-rules/src/cardrpg/index.ts',onboarding:'packages/game-rules/src/cardrpg/depth/onboarding.ts',presentation:'apps/web/src/game/cardrpg/depth/card-action-plan.ts',pacing:'apps/web/src/game/cardrpg/depth/pacing-a6.ts',Model:'apps/web/src/game/cardrpg/depth/model.ts'};
  await writeFile(entry,Object.entries(paths).map(([name,file])=>`export * as ${name} from ${JSON.stringify(resolve(root,file))};`).join('\n'));
  await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',plugins:[variantPlugin(variant)],build:{emptyOutDir:false,outDir:temp,minify:false,lib:{entry,formats:['es'],fileName:()=> 'rules.mjs'}}});
  const url=pathToFileURL(resolve(temp,'rules.mjs')).href,bundle=await import(url);const rows=[];
  for(const f of fixtureConfig.fixtures)for(const seed of [...new Set([...Array.from({length:samples},(_,i)=>i+firstSeed),71])])rows.push(await fixture(bundle,f,seed));
  if(!production&&variant.id==='control')for(const row of rows.filter(r=>r.seed===71)){const baseline=prior.rows.find(r=>r.fixture===row.fixture);assert.equal(row.hash,baseline.hash,`Control hash ${row.fixture}`);assert(Math.abs(row.durationSeconds*1000-baseline.durationMs)<1,`Control scheduler ${row.fixture}`);}
  let progression=[];
  if(sessions&&sessionMethod==='a6-legacy'){
   const original=await readFile(resolve(root,'tools/cardrpg-a6/sim.mjs'),'utf8');const helper=original.slice(0,original.indexOf('if (!isMainThread)')).replace("const root = resolve(import.meta.dirname, '../..');",`const root = ${JSON.stringify(root)};`);
   assert(helper.includes('async function simulation('));await writeFile(resolve(temp,'session.mjs'),helper+'\nexport {simulation};\n');
   const {simulation}=await import(pathToFileURL(resolve(temp,'session.mjs')).href);const sim=await simulation(url,'a6');progression=await sim.job({kind:'session',first:firstSeed,count:sessions});
  }else if(sessions){
   const original=await readFile(resolve(root,'tools/cardrpg-c2/sim.mjs'),'utf8');let helper=original.slice(0,original.indexOf('const reports=[];'));
   helper=helper.replace("'./runtime.mjs'",JSON.stringify(pathToFileURL(resolve(root,'tools/cardrpg-c2/runtime.mjs')).href)).replace("'./policy.mjs'",JSON.stringify(pathToFileURL(resolve(root,'tools/cardrpg-c2/policy.mjs')).href));
   helper=replaceOnce(helper,"await mkdir(out,{recursive:true});",'', 'c2 session');
   helper=replaceOnce(helper,"const {R,DepthModel}=await loadRuntime(resolve(out,'runtime'));",`const {R,Model:{DepthModel}}=await import(${JSON.stringify(url)});`, 'c2 session');
   helper=replaceOnce(helper,'m.state=freshAccount(R,seed,0);','m.state=freshAccount(R,seed,0);m.state.economyV3=true;', 'c2 session');
   await writeFile(resolve(temp,'session-current.mjs'),helper);const {simulate}=await import(pathToFileURL(resolve(temp,'session-current.mjs')).href);
   for(let seed=firstSeed;seed<firstSeed+sessions;seed++){
    const result=simulate(seed);assert.equal(result.summary.activeSeconds,1800);assert.equal(result.final.team.length,4);
    const losses=result.encounters.filter(e=>!e.tutorial&&e.result==='enemy');
    progression.push({seed,lossExamples:losses.map(e=>({at:e.endedAt,chapter:e.chapter,node:e.node,boss:e.boss,enemies:e.initial.enemies,playbackSeconds:e.playbackSeconds,rounds:e.rounds})),losses30:losses.length,battles:result.encounters.length,summary:result.summary});
   }
  }
  const firstLoss=progression.filter(r=>r.lossExamples.length).map(r=>r.lossExamples[0].at/60);
  const sortedLosses=progression.map(r=>r.lossExamples[0]?.at??Infinity).sort((a,b)=>a-b),middle=Math.floor(sortedLosses.length/2);
  const cohortMedianSeconds=sortedLosses.length%2?sortedLosses[middle]:(sortedLosses[middle-1]+sortedLosses[middle])/2;
  const value={...variant,elapsedSeconds:(performance.now()-began)/1000,fixtures:rows,summary:fixtureConfig.fixtures.map(f=>{const subset=rows.filter(r=>r.fixture===f.id&&r.seed>=firstSeed&&r.seed<firstSeed+samples);return {fixture:f.id,wins:subset.filter(r=>r.result==='party').length,count:subset.length,medianSeconds:quantile(subset.map(r=>r.durationSeconds),.5),p90Seconds:quantile(subset.map(r=>r.durationSeconds),.9),medianWinHp:quantile(subset.filter(r=>r.result==='party').map(r=>r.winHp),.5),healerDamage:subset.reduce((s,r)=>s+r.healerDamage,0)};}),progression:{count:progression.length,firstLossMedianMinutes:quantile(firstLoss,.5),cohortFirstLossMedianMinutes:Number.isFinite(cohortMedianSeconds)?cohortMedianSeconds/60:null,noLoss:progression.length-firstLoss.length,rows:progression.map(r=>({seed:r.seed,firstLossSeconds:r.lossExamples[0]?.at??null,firstLossEncounter:r.lossExamples[0]??null,losses30:r.losses30,battles:r.battles,...(r.summary?{summary:r.summary}:{})}))}};
  report.variants.push(value);await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({variant:variant.id,elapsedSeconds:value.elapsedSeconds,fixtures:value.summary,progression:{count:value.progression.count,firstLossMedianMinutes:value.progression.firstLossMedianMinutes,noLoss:value.progression.noLoss}}));
 }finally{await rm(temp,{recursive:true,force:true});}
}
