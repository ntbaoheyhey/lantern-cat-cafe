// REFERENCE: NFT-VALUE-SPEC. Race/cap/replay and paired no-combat-power simulation.
import {loadRules} from './load.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out=process.env.V5_EDITIONS_OUT;assert(out);const registration=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json','utf8'));await mkdir(out,{recursive:true});
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),{Rng}=await load('packages/game-rules/src/rng.ts');
const digest=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),now=Date.UTC(2026,10,8),take=r=>{assert(r.ok,r.error);return r.state;};
const races=[],pairs=[],cp=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}')),start=Date.now(),pause=new Error('checkpoint');
const files=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg'],{encoding:'utf8'}).trim().split('\n');
files.push('packages/game-rules/src/rng.ts');
const source=Object.fromEntries(await Promise.all([...new Set(files)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
assert.deepEqual(registration.source,source);if(cp.source)assert.deepEqual(cp.source,source,'Source changed during edition acceptance');
if(cp.pairs)pairs.push(...cp.pairs);if(cp.races)races.push(...cp.races);
try{
 for(let seed=registration.offset+races.length+1;seed<=registration.offset+500;seed++){
  const random=new Rng(seed),accounts=Array.from({length:8},(_,i)=>`account-${i}`).sort(()=>random.int(0,1)?1:-1);
  let ledger=R.createIssuanceLedger(`race-${seed}`,now,{lifetime:{'moon-collar':2397,'golden-maneki':0},seasonal:{'moon-collar':397,'golden-maneki':0},reservations:[]}),accepted=0,stale=0,capped=0;
  for(const accountId of accounts){
   const context={accountId,now,effort:[1,2,3].map(day=>({id:`${accountId}:${day}`,day,source:'boss-day'})),chapterOne:true,allMasteries:false,towerBest:0};
   const cmd={kind:'reserve',edition:'moon-collar',accountId,commandId:accountId,expectedRevision:0};let r=R.applyIssuance(ledger,cmd,context);
   if(!r.ok){stale++;r=R.applyIssuance(ledger,{...cmd,expectedRevision:ledger.revision},context);}
   if(r.ok){ledger=r.ledger;accepted++;}else capped++;
  }
  assert.equal(accepted,3);assert.equal(capped,5);assert.equal(ledger.lifetimeIssued['moon-collar'],2400);assert.equal(ledger.seasonIssued['2026-11']['moon-collar'],400);
  const replay=R.replayIssuance(ledger.genesis,ledger.events);assert.deepEqual(replay,ledger);races.push({seed,accepted,stale,capped,digest:digest(ledger)});
 }
 for(let seed=registration.offset+1;seed<=registration.offset+500;seed++)for(const chapter of [1,2,3]){
  if(pairs.some(p=>p.seed===seed&&p.chapter===chapter))continue;
  let s=(registration.skillsV5?R.setSkillsV5:R.setGameplayV4)(R.createDepthAccount(seed),true);s.account.cards.forEach(c=>c.level=6);s.seals=30;s.cleared=[1,2,3];s.masteries=[1,2,3];for(let day=1;day<=30;day++)s.account.inventory.stacks[`depth-seal-${day}`]=1;
  const catStats=R.battleCats(s),setup={seed,chapter,cats:catStats,enemies:[R.CHAPTERS[chapter-1].boss],gameplayV4:true,...(registration.skillsV5?{skillsV5:true}:{})};
  const baseline=R.playBattle(R.createBattle(setup),'auto'),hash=digest(baseline),accountId=R.localEditionAccount(s);
  const issue=(state,kind,payload,time)=>take(R.issueEditionV4(state,{kind,accountId,commandId:`test-${state.v4.issuance?.revision??0}`,expectedRevision:state.v4.issuance?.revision??0,...payload},time));
  s=issue(s,'reserve',{edition:'moon-collar'},now);
  const moon=s;s=issue(s,'reserve',{edition:'golden-maneki'},now+86400000);const both=s;
  s=issue(s,'advance-season',{},Date.UTC(2026,11,8));s=issue(s,'reserve',{edition:'moon-collar'},Date.UTC(2026,11,8));
  s=issue(s,'fuse',{reservationIds:['moon-collar:1','moon-collar:2']},Date.UTC(2026,11,8));
  for(const variant of [moon,both,s]){assert.deepEqual(R.battleCats(variant),catStats);assert.equal(digest(R.playBattle(R.createBattle({...setup,cats:R.battleCats(variant)}),'auto')),hash);}
  if(seed===1)assert.deepEqual(R.importSave(R.exportSave(s)),s);
  pairs.push({seed,chapter,outcome:baseline.result,hash,variants:3,gainPp:0});
  if(Date.now()-start>110000){await writeFile(`${out}/partial.json`,JSON.stringify({source,races,pairs}));process.exitCode=75;throw pause;}
 }
 await writeFile(`${out}/results.json`,JSON.stringify({source,method:'500 fixed seeded race orders for last three production lifetime/season slots; 500 paired combat seeds per chapter across Moon, both editions, and fused badge. Controlled effort/level fixtures; no progression claim.',races,pairs,gate:'PASS',maxPairedGainPp:0,encounters:pairs.length*4},null,2));console.log(JSON.stringify({races:races.length,pairedSeeds:pairs.length,encounters:pairs.length*4,maxPairedGainPp:0}));
}catch(e){if(e!==pause)throw e;}finally{await vite.close();}
