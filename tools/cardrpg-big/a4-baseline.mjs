// REFERENCE: reports/cardrpg-big/memory/PROMPT-A4.md G0; fresh behavioral OFF receipt.
import { loadRules } from './a4-load.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const { load, vite, rules: legacy } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const { playRun } = await load('packages/game-rules/src/cardrpg/depth/run-bot.ts');
const { firstInvitation } = await load('packages/game-rules/src/cardrpg/depth/onboarding.ts');
const out = 'reports/cardrpg-big/a4/g0';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const check = process.argv.includes('--check');
const checkOut = process.env.BIG_OFF_OUT || 'reports/cardrpg-big/a4/off-current';
await mkdir(checkOut,{recursive:true});
const checkpointPath=check?`${checkOut}/off.partial.json`:`${out}/off.partial.json`;
const checkpoint=JSON.parse(await readFile(checkpointPath,'utf8').catch(()=>'{}'));
const {rows=[],saturation=[]}=checkpoint;
const started=Date.now(), checkpointExit=new Error('Checkpoint');
try {
  if(!process.argv.includes('--day7'))for (const level of [1,2,3,4,5,6,7,8,9,10,50]) for (const chapter of [1,2,3]) for (const rarity of ['none', ...legacy.RARITY_ORDER]) {
    if(rows.some(r=>r.level===level&&r.chapter===chapter&&r.rarity===rarity))continue;
    const runs = [];
    for (let seed = 1; seed <= 50; seed++) {
      const state = R.createDepthAccount(seed);
      state.cleared = [1,2]; state.gear = []; state.equipment = {};
      if (level === 50) {
        state.account.cards = legacy.CARDS.filter(c => c.rarity === 'legendary').map(c => ({id:c.id,cardId:c.id,level,stars:1,shards:0,soulbound:true}));
        state.team = state.account.cards.map(c => c.cardId);
        for (const id of state.team) {state.rows[id]=R.CAT_BY_ID[id].row;state.skills[id]=R.CAT_BY_ID[id].skills.slice(0,3).map(s=>s.id);}
        state.rows[state.team[0]]='front';
      }
      for (const card of state.account.cards) card.level = level;
      for (const [i,id] of state.team.entries()) if (rarity !== 'none') {
        const set=['hearthloom','moonwick','mossbrew'][i];
        state.equipment[id] = {};
        for (const [i,slot] of legacy.EQUIPMENT_SLOTS.entries()) {
          const item = R.makeGear(state, `${set}-${slot}-${rarity}`, seed+i*7919);
          state.gear.push(item); state.equipment[id][slot] = item.id;
        }
      }
      const begin = R.startRun(state, chapter, seed); assert(begin.ok, begin.error);
      const end = playRun(begin.state, 'auto');
      runs.push({ seed, won: end.run.won, hash: hash(end.run) });
    }
    saturation.push({level,chapter,rarity,count:runs.length,wins:runs.filter(r=>r.won).length});
    rows.push({level,chapter,rarity,runs});
    await writeFile(checkpointPath,JSON.stringify({rows,saturation}));
    console.log(JSON.stringify(saturation.at(-1)));
    if(Date.now()-started>2*60*1000){process.exitCode=75;throw checkpointExit;}
  }
  await mkdir(out,{recursive:true});
  const receipt = { method:'Actual auto routes, 50 paired seeds per cell; fixed chapters expose original saturation. Current A3 source. No timing fields.', sha256:hash(rows), rows };
  if (process.argv.includes('--check')) {
    const before = JSON.parse(await readFile(`${out}/off-behavior.json`,'utf8'));
    assert.equal(receipt.sha256,before.sha256,'OFF behavior differs from G0');
    await writeFile(`${checkOut}/checks.json`,JSON.stringify({offBehavior:'PASS',sha256:receipt.sha256,cells:rows.length,routes:rows.reduce((n,r)=>n+r.runs.length,0)},null,2));
    console.log(JSON.stringify({offBehavior:'PASS',sha256:receipt.sha256}));
  } else {
    if(!process.argv.includes('--day7'))await writeFile(`${out}/off-behavior.json`,JSON.stringify(receipt,null,2));
    if(!process.argv.includes('--day7'))await writeFile(`${out}/saturation.json`,JSON.stringify(saturation,null,2));
    let day7 = firstInvitation(R.createDepthAccount(3001),4).state;
    day7.tutorial=3;
    for(let day=1;day<=7;day++) {
      if(day>1)day7=R.metaCommand(day7,{type:'advanceLocalDay'}).state;
      day7=R.metaCommand(day7,{type:'service',minutes:10}).state;
      day7=playRun(R.startRun(day7,Math.min(3,day7.cleared.length+1),100000+day*71).state,'auto');
      for(const quest of legacy.QUESTS)day7=R.metaCommand(day7,{type:'claimQuest',questId:quest.id}).state;
      for(const id of day7.team)day7=R.metaCommand(day7,{type:'level',cardId:day7.account.cards.find(c=>c.cardId===id).id}).state;
    }
    await writeFile(`${out}/day7.save.txt`,R.exportSave(day7));
    console.log(JSON.stringify({sha256:receipt.sha256,saturation,day7:{day:day7.account.day,team:day7.account.cards,cleared:day7.cleared}}));
  }
} catch(error) { if(error!==checkpointExit)throw error; } finally { await vite.close(); }
