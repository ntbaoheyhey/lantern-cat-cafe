import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const runs=[];
for(const [name,root] of [['before','/tmp/cardrpg-a4-p6/preview'],['after','/tmp/cardrpg-a4-p6/fast-preview']]){
 process.env.BIG_RULES_ROOT=root;
 const {loadRules}=await import(`file:///Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs?clone=${name}`),{load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const initial=R.setGameplayV4(R.createDepthAccount(11),true);initial.account.cards.forEach(c=>c.level=6);
 const setups=[];for(const enabled of [false,true])for(const chapter of [1,2,3])for(let seed=1;seed<=100;seed++)setups.push({seed,chapter,cats:R.battleCats(initial),enemies:[R.CHAPTERS[chapter-1].boss],gameplayV4:enabled,challengeLevel:6});
 const start=performance.now(),cpu=process.cpuUsage(),out=[];
 for(const setup of setups){const b=R.createBattle(setup);if(R.currentActor(b)?.side==='party'){const saved=JSON.stringify(b);R.chooseAction(b,'auto');assert.equal(JSON.stringify(b),saved,'Choosing must not mutate the committed battle');}R.playBattle(b,'auto');out.push(b);}
 runs.push({name,elapsed:performance.now()-start,cpu:process.cpuUsage(cpu),out});await vite.close();
}
assert.deepEqual(runs[0].out,runs[1].out,'Full actions/events/actors/rewards must match');
await writeFile('/tmp/cardrpg-a4-p6/clone-benchmark.json',JSON.stringify({battles:600,modes:['OFF','ON'],exact:true,runs:runs.map(({out,...r})=>r)},null,2));console.log(runs.map(({out,...r})=>r));
