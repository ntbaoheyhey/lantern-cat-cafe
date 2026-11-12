// Conditional drop study: real rule functions, assumed successful schedules.
// This does not turn browser saves into authoritative inventory or forecast demand.
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadRules, root} from '../cardrpg-sim/load.mjs';
import {currentSourceHashes} from './supply-snapshot.mjs';
const {load, vite} = await loadRules();
try {
  const {dropGear, GEAR_BY_ID, makeGear} = await load('packages/game-rules/src/cardrpg/depth/equipment.ts');
  const {createDepthAccount} = await load('packages/game-rules/src/cardrpg/depth/state.ts');
  const {setGameplayA6} = await load('packages/game-rules/src/cardrpg/depth/gameplay-a6.ts');
  const {generateMap} = await load('packages/game-rules/src/cardrpg/depth/run.ts');
  const {drawInvitationsV4} = await load('packages/game-rules/src/cardrpg/depth/gacha-v4.ts');
  const {deriveSeed} = await load('packages/game-rules/src/rng.ts');
  const count = 1000, weeks = 8;
  const schedules = [
    {type:'casual', activeDays:3, routes:1, elite:false},
    {type:'regular', activeDays:7, routes:2, elite:false},
    {type:'farmer', activeDays:7, routes:6, elite:true},
    {type:'bot', activeDays:7, routes:20, elite:true},
  ];
  const summarize = values => {
    const sorted = [...values].sort((a,b)=>a-b);
    return {mean:values.reduce((a,b)=>a+b,0)/values.length,p05:sorted[Math.floor(.05*(sorted.length-1))],p50:sorted[Math.floor(.5*(sorted.length-1))],p95:sorted[Math.floor(.95*(sorted.length-1))]};
  };
  const rows=[];
  for(const schedule of schedules){
    const samples=[];
    for(let seed=0;seed<count;seed++){
      const state=setGameplayA6(createDepthAccount(43113+seed),true);
      const totals={common:0,rare:0,epic:0,legendary:0,attempts:0,capped:0};
      for(let week=0;week<weeks;week++)for(let day=0;day<schedule.activeDays;day++){
        state.account.day=week*7+day+1;
        state.gear=[]; // Inventory room is an explicit condition, not a simulated salvage policy.
        for(let route=0;route<schedule.routes;route++){
          const routeSeed=deriveSeed(43113+seed,week*10000+day*100+route);
          const path=generateMap(routeSeed,3).filter(n=>n.lane===(schedule.elite&&[1,5].includes(n.depth)?1:0));
          for(const [step,node] of path.entries())if(['battle','elite','boss'].includes(node.kind)){
            totals.attempts++;
            const id=dropGear(state,node.kind,deriveSeed(routeSeed,step+999),3);
            if(id)totals[GEAR_BY_ID[id].rarity]++;else totals.capped++;
          }
        }
      }
      samples.push(Object.fromEntries(Object.entries(totals).map(([key,value])=>[key,value/weeks])));
    }
    rows.push({...schedule,seeds:count,weeks,weekly:Object.fromEntries(Object.keys(samples[0]).map(key=>[key,summarize(samples.map(s=>s[key]))])),
      epicPlus:summarize(samples.map(s=>s.epic+s.legendary)),rareTradableMaterials:0});
  }
  // Separate funded-invitation experiment: not additive to the drop-only default.
  const invitationSamples=[];
  for(let seed=0;seed<count;seed++){
    const state=setGameplayA6(createDepthAccount(50000+seed),true);
    state.account.currencies.stamps=2520;state.gear=[];
    const totals={common:0,rare:0,epic:0,legendary:0};
    for(let day=0;day<7;day++){
      state.account.daily.draws=0;
      for(const result of drawInvitationsV4(state,'equipment',deriveSeed(seed,day),6))totals[result.rarity]++;
    }
    invitationSamples.push(totals);
  }
  const invitations={draws:42,stamps:2520,condition:'All 7 days at the 360-stamp daily earning ceiling, all spent on 60-stamp equipment draws; no other stamp use. Selector redemptions excluded.',
    weekly:Object.fromEntries(['epic','legendary'].map(k=>[k,summarize(invitationSamples.map(s=>s[k]))]))};
  const full=setGameplayA6(createDepthAccount(712),true);
  full.gear=Array.from({length:240},()=>makeGear(full,'hearthloom-weapon-common',7));
  for(let n=0;n<7;n++)if(dropGear(full,'boss',deriveSeed(712,n),3)!==null)throw Error('Full shelf created sellable gear');
  if(full.account.inventory.stacks[`depth-drops-${full.account.day}`]!==6)throw Error('Drop cap drift');
  const sourceHashes=currentSourceHashes();
  const source='CHAIN conditional source study, 2026-11-12; tools/chain/supply-study.mjs; hashes in docs/chain/supply-study.json; not C2 telemetry';
  const byType=Object.fromEntries(rows.map(r=>[r.type,{rarePerActiveWeek:0,epicPerActiveWeek:r.weekly.epic.mean,legendaryPerActiveWeek:r.weekly.legendary.mean}]));
  const supply={rarePerActiveWeek:0,epicPerActiveWeek:byType.regular.epicPerActiveWeek,legendaryPerActiveWeek:byType.regular.legendaryPerActiveWeek,byType,source};
  writeFileSync(resolve(root,'docs/chain/supply-study.json'),JSON.stringify({snapshotVersion:1,supply,source,count,weeks,assumptions:'1000 independent seed cohorts per schedule, 8 weeks each, chapter3 unlocked, every scheduled encounter won, room cleared daily, no gear crafting/selector in drop totals. Days/routes are hypotheses; no combat outcomes or hours measured. Local day and seed are not secure server entitlements.',rows,invitations,fullShelf:'240 slots => zero new sellable gear; six attempted drops consume daily quota',sourceHashes},null,2)+'\n');
  writeFileSync(resolve(root,'docs/chain/source-supply.json'),JSON.stringify(supply,null,2)+'\n');
  const f=n=>n.toFixed(3);
  writeFileSync(resolve(root,'reports/chain/SUPPLY-STUDY.md'),`# Conditional equipment supply — 2026-11-12

This is a reproducible CHAIN measurement of existing pure drop functions, not C2 sign-off, live player telemetry or an authoritative mint receipt. No item stats or drop rates changed.

1000 seeds per schedule × 8 weeks. Chapter3 unlocked; every scheduled combat won; inventory room restored each day. Casual:3 days/1 easy route; regular:7 days/2 easy routes; farmer:7 days/6 elite routes; bot:7 days/20 elite routes. Failed encounters, retention, real play-hours and progression are not estimated here.

| Schedule | Epic/week mean | Legendary/week mean | Epic+ p05 / median / p95 | Drop attempts/week | Capped/week |
|---|---:|---:|---:|---:|---:|
${rows.map(r=>`| ${r.type} | ${f(r.weekly.epic.mean)} | ${f(r.weekly.legendary.mean)} | ${f(r.epicPlus.p05)} / ${f(r.epicPlus.p50)} / ${f(r.epicPlus.p95)} | ${f(r.weekly.attempts.mean)} | ${f(r.weekly.capped.mean)} |`).join('\n')}

The six-item daily cap is shared across normal/elite/boss drops. A normal encounter has5% Epic, an elite27% Epic+3% Legendary, a boss70% Epic+10% Legendary. Route order can consume the cap before a later boss. Twenty routes cannot bypass it. A full240-slot shelf gives no new tradable gear; drops become bound threads subject to their reward cap. This is source behavior, not a claim that every player wins these routes.

No recurring tradable rare material exists in these rules: mastery materials, boss seals/proof and selector marks stay bound. Star Thread remains one/account from the separate authenticated judge boss. Prior0.4 rare/0.08 Epic inputs were unsupported placeholders and must not be called C2 data.

Separate funded invitation stress:42 equipment pulls/week for2520 earned stamps gives ${f(invitations.weekly.epic.mean)} Epic and ${f(invitations.weekly.legendary.mean)} Legendary on average. This assumes every day's360-stamp ceiling and all stamps spent on gear. It is **not added** to default drop supply. Pity and missing-template selection use the real draw function. Crafting/24-mark selector can add more templates and need a joint soft-currency budget before inclusion; recipe accessibility proves rarity alone is not scarcity.

The source snapshot emits per-type rates in docs/chain/source-supply.json. A token model must still apply seal uptake, affordability, daily issuance caps and unsold stock; more dropped items do not create buyers or prove burn demand. Hashes, conditions and distributions are in docs/chain/supply-study.json. Never consume a client-provided study/save as a mint entitlement.
`);
  console.log(JSON.stringify({rows,invitations,source},null,2));
} finally {await vite.close();}
