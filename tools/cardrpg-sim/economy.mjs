import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadRules, root } from './load.mjs';
const { rules: R, load, vite } = await loadRules();
const E = await load('packages/game-rules/src/squad/turn/engine.ts');
const { choosePolicyLoot } = await load('packages/game-rules/src/squad/gear/run.ts');
const { deriveSeed } = await load('packages/game-rules/src/rng.ts');
const cohort = Number(process.env.CARDRPG_PLAYERS || 30);
const drawsEnabled = process.env.CARDRPG_NO_DRAWS !== '1';
const styles = [{id:'casual', minutes:10, battles:1, service:10, policy:'auto'}, {id:'regular',minutes:30,battles:3,service:20,policy:'active'}, {id:'heavy',minutes:120,battles:6,service:20,policy:'active'}];
const keys = R.CURRENCY_IDS, totals = () => Object.fromEntries(keys.map(k=>[k,0]));
const runs = [];
function fight(b, policy) {
  E.beginRun(b);
  while(!b.result && b.turn < 650) {
    if(b.run.stage==='loot'){E.chooseLoot(b,choosePolicyLoot(b,policy));continue;}
    if(b.run.stage==='rest'){E.autoEquipGear(b);E.continueRun(b);continue;}
    E.startTurn(b);
    if(b.phase==='choose'){const c=E.getAutoAction(b,policy);if(!c||!E.chooseAction(b,c))throw Error('Illegal policy');E.resolveAction(b);}
    E.endTurn(b);
  }
  if(!b.result)throw Error('Incomplete simulation battle');
  return b;
}
for(const style of styles)for(let player=1;player<=cohort;player++){
  let s=R.createStarterAccount(deriveSeed(20261105,player)), firstLegendary=null, firstSet=null, pulls=0, wins=0, losses=0;
  const earned=totals(),spent=totals(),days=[]; let xpEarned=0;
  function take(r,required=true){if(!r.ok){if(required)throw Error(r.error.message);return false;}
    for(const k of keys){const d=r.state.currencies[k]-s.currencies[k]; if(d>=0)earned[k]+=d;else spent[k]-=d;}
    xpEarned+=r.state.accountXp-s.accountXp;s=r.state;return r;
  }
  function claim(){for(const q of R.QUESTS)if(!s.quests[q.id].claimed&&s.quests[q.id].progress>=q.target)take(R.claimQuest(s,q.id));}
  for(let day=1;day<=30;day++){
    if(day>1)take(R.advanceLocalDay(s));
    take(R.claimCafeService(s,style.service)); claim();
    // Taskbar service accrues alongside a battle or ordinary desktop work; not extra active minutes.
    for(let n=0;n<style.battles;n++){
      const started=take(R.startBattle(s,deriveSeed(s.seed,day*10+n)));
      const battle=fight(started.value.battle,style.policy);take(R.finishBattle(s,battle));
      if(battle.result.winner==='party')wins++;else losses++;claim();
    }
    while(drawsEnabled && s.currencies.stamps>=R.CARD_RPG_CONFIG.drawCost){
      const r=take(R.pull('standard',s,deriveSeed(s.seed,day*100+pulls)),false);if(!r)break;
      pulls++;if(!firstLegendary&&r.value[0].rarity==='legendary')firstLegendary=day;
    }
    // Predictable set-first policy: four rare pieces for Soot, then the other two cats.
    for(const [cat,set] of [['soot','moonwick'],['mochi','hearthloom'],['clover','mossbrew']]){
      for(const slot of ['weapon','charm','relic','outfit']){
        const id=s.loadouts[cat][slot],equipped=s.inventory.items.find(i=>i.id===id);
        if(equipped&&R.RARITY_ORDER.indexOf(R.ITEM_BY_ID[equipped.itemId].rarity)>=1)continue;
        const r=take(R.forge(s,`sew-${set}-${slot}`),false);if(r)take(R.equip(s,cat,r.value));
      }
    }
    if(!firstSet&&['soot','mochi','clover'].some(c=>R.activeSets(s,c).some(set=>set.pieces===4)&&Object.values(s.loadouts[c]).every(id=>R.ITEM_BY_ID[s.inventory.items.find(i=>i.id===id).itemId].rarity!=='common')))firstSet=day;
    // Salvage unused battle/starter pieces. Recycling recovers material, never fish or stamps.
    for(const i of [...s.inventory.items])if(!R.equippedBy(s,i.id))take(R.salvage(s,i.id),false);
    // Reserve a visible deterministic goal after the first rare set. The old trial spent
    // every fish on upgrades first and never actually saved for its advertised design goal.
    const savingDesign = firstSet && !s.designClaims.includes('golden-maneki');
    if(savingDesign)take(R.forge(s,'design-golden-maneki'),false);
    const reserve = savingDesign ? R.CARD_RPG_CONFIG.recipes.legendaryDesign.fish : 0;
    for(const c of ['soot','mochi','clover']){
      const id=s.loadouts[c].weapon;
      const upgrade=R.previewEnhance(s,id);
      if(s.inventory.items.find(i=>i.id===id).enhancement<4 && upgrade.ok && s.currencies.fish-(upgrade.value.cost.fish??0)>=reserve)take(R.enhance(s,id),false);
      const level=R.previewLevel(s,c);
      if(s.cards.find(x=>x.id===c).level<12 && level.ok && s.currencies.fish-(level.value.cost.fish??0)>=reserve)take(R.levelCard(s,c),false);
      const ascend=R.previewAscend(s,c);
      if(ascend.ok && s.currencies.fish-(ascend.value.cost.fish??0)>=reserve)take(R.ascendCard(s,c),false);
    }
    claim();
    if(s.designClaims.includes('golden-maneki')){
      take(R.forge(s,'design-moon-collar'),false);
      // Essence and threads have useful repeatable sinks after the two design milestones.
      if(s.designClaims.includes('moon-collar')){
        take(R.forge(s,'cafe-ribbon'),false);
        for(const [cat,set] of [['soot','moonwick'],['mochi','hearthloom'],['clover','mossbrew']])for(const slot of R.EQUIPMENT_SLOTS){
          const current=s.inventory.items.find(i=>i.id===s.loadouts[cat][slot]);
          if(R.ITEM_BY_ID[current.itemId].rarity==='rare'){
            const r=take(R.forge(s,`tailor-${set}-${slot}`),false);if(r)take(R.equip(s,cat,r.value));
          }
        }
      }
    }
    // Prepare only what tomorrow's run can carry; preserve the effort recipe's material reserve.
    const threadReserve = s.designClaims.includes('golden-maneki') ? 120 : 300;
    for(let n=0;n<style.service/10;n++)if(s.currencies.threads>=threadReserve+50 && (s.inventory.stacks['milk-tonic']??0)<2){
      take(R.forge(s,'mend-pantry-key'),false);take(R.forge(s,'pantry-tonic'),false);
    }
    days.push({day,currencies:{...s.currencies},earned:{...earned},spent:{...spent},xp:s.accountXp,pulls,collection:R.collectionProgress(s).percent,wins,losses,designs:[...s.designClaims]});
    if(keys.some(k=>s.currencies[k]<0)||s.daily.xpEarned>R.CARD_RPG_CONFIG.dailyXpCap)throw Error('Economy invariant failed');
  }
  runs.push({style:style.id,player,minutes:style.minutes,earned,spent,xpEarned,pulls,wins,losses,firstLegendary,firstSet,collection:R.collectionProgress(s).percent,balances:s.currencies,designs:s.designClaims,days,legendaryCount:s.cards.filter(c=>R.CARD_BY_ID[c.cardId].rarity==='legendary').length,stateHash:createHash('sha256').update(JSON.stringify(s)).digest('hex')});
  if(player===cohort)console.log(`Finished ${style.id}: ${cohort} real 30-day accounts`);
}
function mean(xs){return xs.reduce((n,x)=>n+x,0)/xs.length;}
function median(xs){xs=[...xs].sort((a,b)=>a-b);return xs.length?xs[Math.floor(xs.length/2)]:null;}
const summary=styles.map(style=>{
  const a=runs.filter(r=>r.style===style.id);
  return {style:style.id,players:cohort,minutesPerDay:style.minutes,battleAttemptsPerDay:style.battles,pullsPerWeek:mean(a.map(r=>r.pulls))/30*7,pulls30:mean(a.map(r=>r.pulls)),firstLegendaryMedianDay:median(a.map(r=>r.firstLegendary).filter(Boolean)),legendaryByDay30:a.filter(r=>r.firstLegendary).length/cohort,firstRareFourPieceMedianDay:median(a.map(r=>r.firstSet).filter(Boolean)),collectionPercent30:mean(a.map(r=>r.collection)),wins:mean(a.map(r=>r.wins)),losses:mean(a.map(r=>r.losses)),xp30:mean(a.map(r=>r.xpEarned)),earned:Object.fromEntries(keys.map(k=>[k,mean(a.map(r=>r.earned[k]))])),spent:Object.fromEntries(keys.map(k=>[k,mean(a.map(r=>r.spent[k]))])),balances:Object.fromEntries(keys.map(k=>[k,mean(a.map(r=>r.balances[k]))])),legendaryCards30:mean(a.map(r=>r.legendaryCount)),legendaryDesignBy30:a.filter(r=>r.designs.includes('golden-maneki')).length/cohort};
});
const ratios=Object.fromEntries([...keys,'xp','pulls'].map(k=>[k,k==='xp'?summary[2].xp30/summary[0].xp30:k==='pulls'?summary[2].pulls30/summary[0].pulls30:summary[2].earned[k]/summary[0].earned[k]]));
const weeklyRatios=Array.from({length:4},(_,week)=>Object.fromEntries([...keys,'xp','pulls'].map(k=>{
  const byStyle=styles.map(style=>mean(runs.filter(r=>r.style===style.id).map(r=>{const end=r.days[week*7+6],start=week?r.days[week*7-1]:null;return k==='xp'?end.xp-(start?.xp??0):k==='pulls'?end.pulls-(start?.pulls??0):end.earned[k]-(start?.earned[k]??0);})));return [k,byStyle[0]?byStyle[2]/byStyle[0]:null];
})));
const output={version:R.CONTRACT_VERSION,seedBase:20261105,cohort,days:30,drawsEnabled,method:'Actual battle engine, actual commands, rare-set-first then saving for deterministic design before upgrades; patron supplies use excess material; service concurrent with desktop activity. Minutes are scenario labels, not human timing measurements.',summary,heavyToCasual:ratios,weeklyHeavyToCasual:weeklyRatios,runs};
mkdirSync(resolve(root,'docs/design/cardrpg/evidence'),{recursive:true});
writeFileSync(resolve(root,`docs/design/cardrpg/evidence/economy-${process.env.CARDRPG_TRIAL||'initial'}.json`),JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({summary,ratios,weeklyRatios},null,2));await vite.close();
