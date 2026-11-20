// REFERENCE: A5 B1 emergency-policy35. Source-bound deterministic pilot probes.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from './a4-load.mjs';
const out='reports/cardrpg-big/a5/b1/emergency-policy-35', arm=process.argv[2];
assert(['candidate','observed'].includes(arm));
globalThis.__a5EmergencyStats={replies:0,healthy:0,threatened:0,changed:0,prevented:0,unchangedThreat:0};
const method=JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`));
const parent=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/fatal-choices-32/REGISTERED-METHOD.json'));
const source=arm==='candidate'?method:JSON.parse(await readFile(`${out}/OBSERVER.json`));
assert.equal(process.env.BIG_RULES_ROOT,source.sourceRoot);
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const [p,h] of Object.entries(source.source))assert.equal(sha(await readFile(source.sourceRoot+'/'+p)),h,p);
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const rows=[],off=[],prefixes=[];
try {
  const diagnostic=JSON.parse(await readFile('reports/cardrpg-big/a5/b1/fatal-choices-32/results.json'));
  for(const input of parent.inputs){
    const saved=JSON.parse(await readFile(input.path)),b=R.createBattle(saved.before.initial);
    const start=performance.now();let checked=0;
    while(!b.result){
      if(R.currentActor(b)?.side==='enemy')assert(R.enemyAct(b));
      else {
        const before=JSON.stringify(b),choice=R.chooseAction(b,'auto');
        assert.deepEqual(R.chooseAction(b,'auto'),choice);assert.equal(JSON.stringify(b),before);
        assert(R.legalChoices(b).some(c=>JSON.stringify(c)===JSON.stringify(choice)));
        assert(R.act(b,choice));checked++;
      }
    }
    assert.deepEqual(R.replayBattle(b.initial,b.choices),b);
    rows.push({key:saved.key,seed:saved.seed,won:b.result==='party',rounds:b.round,checked,probeMs:performance.now()-start,battle:b});
    const original=R.createBattle(saved.before.initial),example=diagnostic.examples.find(e=>e.key===saved.key);
    let cursor=0;
    while(cursor<=Math.max(...example.decisions.map(d=>d.index))&&!original.result){
      if(R.currentActor(original)?.side==='enemy')assert(R.enemyAct(original));
      else {
        const decision=example.decisions.find(d=>d.index===cursor);
        if(decision){
          assert.equal(sha(JSON.stringify(original)),decision.initialDigest);
          const before=JSON.stringify(original),choice=R.chooseAction(original,'auto');
          assert.equal(JSON.stringify(original),before);
          const matched=decision.alternatives.find(a=>JSON.stringify(a.choice)===JSON.stringify(choice));assert(matched);
          prefixes.push({key:saved.key,index:cursor,chosen:choice,selected:matched.selected,
            firstVictimSurvivesRound:matched.firstVictimSurvivesRound,wonWithOriginalFollowup:matched.won});
        }
        assert(R.act(original,saved.before.choices[cursor++]));
      }
    }
  }
  for(const seed of [1,2,3,4,5])for(const chapter of [1,2,3])for(const team of [
    ['mochi','soot','clover'],['inkcap','sorrel','brioche'],['mallow','biscuit','cinnamon']]){
    const state=R.createDepthAccount(seed);state.team=team;
    state.account.cards=team.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));
    for(const id of team){state.rows[id]=R.CAT_BY_ID[id].row;state.skills[id]=R.defaultSkills(state,id);}
    const battle=R.playBattle(R.createBattle({seed,chapter,cats:R.battleCats(state),enemies:[R.CHAPTERS[chapter-1].boss]}),'auto');
    assert.deepEqual(R.replayBattle(battle.initial,battle.choices),battle);
    off.push({seed,chapter,team,sha256:sha(JSON.stringify(battle))});
  }
}finally{await vite.close();}
await writeFile(`${out}/${arm}-probe.json`,JSON.stringify({arm,source:source.source,rows,off,prefixes,stats:globalThis.__a5EmergencyStats},null,2));
console.log(JSON.stringify({arm,fullReplays:rows.length,off:off.length,prefixes:prefixes.length,
  immutableLegalChoices:rows.reduce((n,r)=>n+r.checked,0),wins:rows.filter(r=>r.won).length}));
