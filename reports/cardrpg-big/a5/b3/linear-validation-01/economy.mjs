// REFERENCE: GAMEPLAY-V4 section7. New-save progression through public commands; resumable native simulation.
import {loadRules} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out=process.env.BIG_META_OUT||'reports/cardrpg-big/a5/e2/economy',count=Number(process.env.BIG_META_ACCOUNTS||30),days=Number(process.env.BIG_META_DAYS||45);
await mkdir(out,{recursive:true});
const files=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg'],{encoding:'utf8'}).trim().split('\n');
const source=Object.fromEntries(await Promise.all([...new Set(files)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(process.env.BIG_RULES_ROOT+'/'+p)).digest('hex')])));
const checkpoint=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}'));if(checkpoint.source){assert.equal(checkpoint.count,count);assert.equal(checkpoint.days,days);}
const registration=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json','utf8'));
assert.deepEqual(registration.source,source,'Source must match the pre-run registration');
if(checkpoint.source)assert.deepEqual(checkpoint.source,source);
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts'),C=suite.rules,{playRun}=await suite.load('packages/game-rules/src/cardrpg/depth/run-bot.ts'),{firstInvitation}=await suite.load('packages/game-rules/src/cardrpg/depth/onboarding.ts'),vite=suite.vite;
const styles=[{id:'casual',routes:1,minutes:15},{id:'regular',routes:2,minutes:60},{id:'heavy',routes:6,minutes:60}],accounts=checkpoint.accounts??[],started=Date.now(),pause=new Error('checkpoint');
const accept=r=>{assert(r.ok,r.error);return r.state;},pulls=s=>Object.values(s.account.pity).reduce((n,p)=>n+p.totalPulls,0),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const save=async()=>writeFile(`${out}/partial.json`,JSON.stringify({source,count,days,accounts}));
try{
 for(const style of styles)for(let index=0;index<count;index++){
  let row=accounts.find(a=>a.style===style.id&&a.index===index);if(!row){let state=R.setGameplayV4(R.createDepthAccount(3001+index),true);state=accept(firstInvitation(state,4));row={style:style.id,index,days:[],state,firstLegendary:null,firstChosen:null,events:[],refusals:0};accounts.push(row);}
  for(let day=row.days.length+1;day<=days;day++){
   let s=row.state;const time=(day-1)*86400000+style.minutes*60000;s=accept(R.syncCalendarDay(s,time));
   const service=R.claimCafeShiftV4(s,time);if(service.ok)s=service.state;else row.refusals++;
   if(day===7){await mkdir(`${out}/day7`,{recursive:true});await writeFile(`${out}/day7/${style.id}-${index}.save`,R.exportSave(s));}
   if(day===1){const denied=R.claimCafeShiftV4(s,time);assert(!denied.ok);assert.deepEqual(denied.state,s);}
   for(let route=0;route<style.routes;route++){
    s=accept(R.startRun(s,Math.min(3,s.cleared.length+1),100000+index*7919+day*71+route,'campaign'));
    s=playRun(s,'auto');assert(s.run.complete);
    for(const goal of R.STAR_REWARDS_V4){const preview=R.starRewardPreviewV4(s,goal.id);if(!preview.reason){const before={...s.account.currencies};s=accept(R.claimStarRewardV4(s,goal.id));for(const [id,amount]of Object.entries(preview.reward))assert.equal(s.account.currencies[id]-before[id],amount);row.events.push({day,kind:'star-reward',id:goal.id,reward:preview.reward});assert(!R.claimStarRewardV4(s,goal.id).ok);}}
    while(s.v4.journey.pending.length)s=accept(R.acknowledgeDiscoveryV4(s,s.v4.journey.pending[0].sequence));
   }
   for(const q of C.QUESTS){const claim=R.metaCommand(s,{type:'claimQuest',questId:q.id});if(claim.ok)s=claim.state;else row.refusals++;}
   for(const m of R.MILESTONES_V4){const claim=R.claimMilestoneV4(s,m.id);if(claim.ok){s=claim.state;row.events.push({day,kind:'milestone',id:m.id});}}
   while(s.account.currencies.stamps>=150){const result=R.metaCommand(s,{type:'pull',bannerId:'standard',seed:index*9349+day*97+pulls(s)});if(!result.ok)break;s=result.state;if(!row.firstLegendary&&s.account.history.at(-1).rarity==='legendary')row.firstLegendary={day,pulls:pulls(s)-1};}
   if(R.selectorMarksV4(s)>=R.SELECTOR_COST_V4){const cat=C.CARDS.find(c=>!s.account.cards.some(o=>o.cardId===c.id))??C.CARDS[0];s=accept(R.chooseSelectorV4(s,'cat',cat.id));row.firstChosen??={day,pulls:pulls(s)-1,id:cat.id};}
   for(const id of s.team){let owned=s.account.cards.find(c=>c.cardId===id);if(owned.level<12)s=R.metaCommand(s,{type:'level',cardId:owned.id}).state;s=R.metaCommand(s,{type:'ascend',cardId:owned.id}).state;
    for(const slot of C.EQUIPMENT_SLOTS){const other=new Set(Object.entries(s.equipment).filter(([cat])=>cat!==id).flatMap(([,slots])=>Object.values(slots)));const best=s.gear.filter(g=>R.GEAR_BY_ID[g.templateId].slot===slot&&!other.has(g.id)).map(item=>({item,utility:R.itemUtilityV4(s,id,item)})).sort((a,b)=>b.utility-a.utility)[0]?.item;if(best)s=accept(R.equipGear(s,id,best.id));}
   }
   if(day===2||day===7){s=accept(R.saveLoadoutV4(s,0,'Evening crew'));s=accept(R.applyLoadoutV4(s,0));row.events.push({day,kind:'loadout'});}
   const crafted=R.craftGear(s,'bellsteel-relic-rare');if(crafted.ok){s=crafted.state;row.events.push({day,kind:'targeted-recipe',id:'bellsteel-relic-rare'});}
   for(const id of Object.values(s.equipment).flatMap(slots=>Object.values(slots)))s=R.enhanceGear(s,id).state;
   if(s.gear.length>210){const worn=new Set(Object.values(s.equipment).flatMap(slots=>Object.values(slots)));for(const gear of [...s.gear])if(!worn.has(gear.id)&&s.gear.length>180)s=accept(R.salvageGear(s,gear.id));}
   assert.deepEqual(R.importSave(R.exportSave(s)),s);for(const [id,cap]of Object.entries(R.depthCaps(s)))assert(s.account.daily.earned[id]<=cap);assert(s.account.daily.service<=2&&s.account.daily.draws<=30);
   const journal=R.journalV4(s);assert.equal(new Set(journal.claims).size,journal.claims.length);assert.equal(journal.rewardedRoutes,day*style.routes);
   if(day===7&&index===0&&style.id==='casual')await writeFile(`${out}/day7.save`,R.exportSave(s));
   if(!row.firstAnyLegendary){
    const cat=s.account.cards.find(c=>C.CARD_BY_ID[c.cardId].rarity==='legendary');
    const gear=s.gear.find(g=>R.GEAR_BY_ID[g.templateId].rarity==='legendary');
    if(cat||gear)row.firstAnyLegendary={day,catId:cat?.cardId,templateId:gear?.templateId,method:'All owned rewards at end of day, including route drops, paid invitations and selectors. No legendary salvage before first observation.'};
   }
   row.days.push({day,levels:s.team.map(id=>s.account.cards.find(c=>c.cardId===id).level),clear:[...s.cleared],cards:s.account.cards.length,gearTemplates:journal.gear.length,rewardedRoutes:journal.rewardedRoutes,claims:[...journal.claims],currencies:{...s.account.currencies},earned:{...s.account.daily.earned},paidPulls:pulls(s)-1,selectorMarks:R.selectorMarksV4(s),stars:R.starCountV4(s),starClaims:[...s.v4.journey.claims],discoveries:s.v4.journey.found.length,seals:s.seals,hash:hash(s)});row.state=s;
   if(Date.now()-started>110000){await save();process.exitCode=75;throw pause;}
  }
  console.log(JSON.stringify({style:style.id,index,day:row.days.length,clear:row.days.at(-1).clear,pulls:row.days.at(-1).paidPulls}));await save();
 }
 const average=xs=>xs.reduce((a,b)=>a+b,0)/xs.length;
 const totals=styles.map(style=>{const group=accounts.filter(a=>a.style===style.id);return {style:style.id,accounts:group.length,paidPulls:average(group.map(a=>a.days.at(-1).paidPulls)),earned:Object.fromEntries(Object.keys(R.DEPTH_CAPS).map(id=>[id,average(group.map(a=>a.days.reduce((n,d)=>n+d.earned[id],0)))])),firstLegendary:group.map(a=>a.firstLegendary),firstChosen:group.map(a=>a.firstChosen),legendaryCensored:group.filter(a=>!a.firstLegendary).length,chosenCensored:group.filter(a=>!a.firstChosen).length};});
 const ratios={paidPulls:totals[2].paidPulls/totals[0].paidPulls,...Object.fromEntries(Object.keys(R.DEPTH_CAPS).map(id=>[id,totals[2].earned[id]/totals[0].earned[id]]))};
 await writeFile(`${out}/progression.json`,JSON.stringify({method:`${count} accounts per casual/regular/heavy style, ${days} days. Actual time-based service, auto route, once-only capped star claims, quests, journal, draws, gear, presets and selector commands. Same account/route/pull seed formula and style budgets as B3. No currencies, levels, unlocks, or rewards injected. Synthetic increasing clock; no wall-time claim. Missing milestones are censored at day ${days}.`,source,styles,count,days,totals,ratios,accounts:accounts.map(({state,...row})=>row)},null,2));
 await writeFile(`${out}/day45.save`,R.exportSave(accounts[0].state));console.log(JSON.stringify({totals,ratios}));
}catch(error){if(error!==pause)throw error;}finally{await vite.close();}
