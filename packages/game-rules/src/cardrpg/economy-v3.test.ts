import {describe,expect,it} from 'vitest';
import {ECONOMY_V3 as E,enhancementQuote,withdrawalQuote,tradability,qualityBucket,weeklyStarThreadGrant} from './economy-v3';
import * as R from './depth/index';
import {emptyPity} from './gacha';
import {economySinkQuote,ECONOMY_SINK_IDS} from './economy-sinks-v3';
const fresh=()=>{const s=R.setFormationC2(R.setGameplayA6(R.setGameplayV4(R.createDepthAccount(43113,0),true),true));s.economyV3=true;return s;};
describe('economy v3',()=>{
 it('pauses new Star Thread at the bank cap without erasing legacy balances',()=>{
  expect(weeklyStarThreadGrant(0)).toBe(E.rewards.weeklyStarThread);
  expect(weeklyStarThreadGrant(E.rewards.starThreadBankCap-1)).toBe(1);
  expect(weeklyStarThreadGrant(E.rewards.starThreadBankCap)).toBe(0);
  expect(weeklyStarThreadGrant(E.rewards.starThreadBankCap+50)).toBe(0);
  expect(()=>weeklyStarThreadGrant(-1)).toThrow('balance');
 });
 it('uses published Bell-only probabilities, pity and selectors',()=>{const s=fresh();for(const [id,kind] of [['standard','cat'],['equipment','gear']] as const){const b=R.invitationBannerV4(id,s);expect(Object.keys(b.cost)).toEqual(['stamps']);expect(R.invitationOddsV4(id,emptyPity(),s)).toEqual(E[kind].odds);expect(R.invitationOddsV4(id,{...emptyPity(),sinceLegendary:E[kind].soft-1},s).legendary).toBe(E[kind].odds.legendary+600);expect(R.invitationOddsV4(id,{...emptyPity(),sinceLegendary:E[kind].hard-1},s).legendary).toBe(10000);}expect(R.selectorCostV4(s,'cat','panko')).toBe(120);});
 it('preserves the featured guarantee on the next Legendary',()=>{const s=fresh(),b=R.invitationBannerV4('featured',s);s.account.currencies.stamps=10000;s.account.pity[b.pityGroup]={sinceLegendary:69,totalPulls:69,featuredGuaranteed:true};const results=R.drawInvitationsV4(s,'featured',1234,1);expect(results[0]!.cardId).toBe(b.featuredCardId);expect(s.account.pity[b.pityGroup]!.featuredGuaranteed).toBe(false);});
 it('keeps failed enhancement levels, increases Blessing and eventually guarantees success',()=>{const start=fresh();let failures=0;for(let seed=1;seed<80;seed++){const s=JSON.parse(JSON.stringify(start)) as typeof start;s.account.seed=seed;s.account.currencies.stamps=100000;const g=s.gear[0]!;g.enhancement=9;const r=R.enhanceGear(s,g.id);expect(r.ok).toBe(true);if(r.state.gear[0]!.enhancement===9){failures++;expect(r.state.gear[0]!.blessingBp).toBe(1000);}}expect(failures).toBeGreaterThan(15);expect(enhancementQuote(9,6000).chanceBp).toBe(10000);});
 it('requires only bound Bells for every v3 enhancement attempt',()=>{
  const s=fresh(),item=s.gear[0]!;item.enhancement=9;
  s.account.currencies={fish:100000,threads:100000,essence:100000,stamps:0};
  const quote=R.enhancementPreview(item,s);
  expect(quote.cost.fish).toBe(0);expect(quote.cost.threads).toBe(0);expect(quote.cost.stamps).toBeGreaterThan(0);
  expect(R.enhanceGear(s,item.id).ok).toBe(false);
  s.account.currencies.stamps=quote.cost.stamps;
  const before={...s.account.currencies},result=R.enhanceGear(s,item.id);
  expect(result.ok).toBe(true);expect(result.state.account.currencies).toEqual({...before,stamps:0});
 });
 it('offers half drops for eligible wins seven through eighteen, then no gear',()=>{const s=fresh(),key=`depth-drops-${s.account.day}`;s.account.inventory.stacks[key]=5;expect(R.gearDropPreview(s,'battle',1).chanceBp).toBe(3000);s.account.inventory.stacks[key]=6;expect(R.gearDropPreview(s,'battle',1).chanceBp).toBe(1500);s.account.inventory.stacks[key]=18;expect(R.gearDropPreview(s,'battle',1).chanceBp).toBe(0);expect(R.gearDropPreview(fresh(),'firstBoss',1).base.legendary).toBe(300);});
 it('fuses bound inputs without charging YARN or rolling a paid outcome',()=>{const s=fresh();s.gear=[];s.equipment={};for(let n=0;n<4;n++)s.gear.push(R.makeGear(s,'hearthloom-weapon-common',n));const ids=s.gear.map(x=>x.id),r=R.fuseBoundV3(s,ids);expect(r.ok).toBe(true);expect(r.state.gear).toHaveLength(1);expect(r.state.gear[0]!.templateId).toBe('hearthloom-weapon-rare');expect(R.fuseBoundV3(s,[ids[0]!,ids[0]!,ids[1]!,ids[2]!]).ok).toBe(false);});
 it('extends paid-output protection to every studio recipe without selling invitations or rerolls',()=>{
  const inventory={gear:[{id:'owned',template:'hearthloom-weapon-epic',quality:0}],styles:[]};
  for(const id of ECONOMY_SINK_IDS){
   const quote=economySinkQuote(id,inventory,'owned',E.season.epoch);
   expect(quote.successBp).toBe(10000);
   expect(['bells','stamps','rolls','seed','attempts'].filter(key=>key in quote)).toEqual([]);
   expect(quote.quality!==undefined||quote.style!==undefined).toBe(true);
   expect(economySinkQuote(id,inventory,'owned',E.season.epoch)).toEqual(quote);
  }
 });
 it('prices guaranteed Legendary tailoring in live v3 rules and consumes distinct earned proofs',()=>{
  const s=fresh(),cost=E.tailoring.legendary,id='hearthloom-weapon-legendary';
  s.account.chapter=3;s.cleared=[1,2,3];s.materials=cost.materials;s.seals=cost.seals;
  s.account.currencies={fish:cost.fish,threads:cost.threads,essence:cost.essence,stamps:0};s.v4!.legacySealCount=0;
  for(let n=1;n<cost.seals;n++)s.account.inventory.stacks[`depth-seal-${n}`]=1;
  expect(R.craftGear(s,id).ok).toBe(false);
  s.account.inventory.stacks[`depth-seal-${cost.seals}`]=1;
  const before=R.exportSave(s),quote=R.tailoredGearPreview(s,id);expect(R.exportSave(s)).toBe(before);
  const made=R.craftGear(s,id);expect(made.ok).toBe(true);expect(made.state.gear.at(-1)).toEqual(quote);
  expect(made.state.v4!.spentEffortIds).toHaveLength(cost.seals);
  expect(made.state.account.currencies).toEqual({fish:0,threads:0,essence:0,stamps:0});
  expect(made.state.materials).toBe(0);expect(made.state.seals).toBe(0);
 });
 it('publishes exact withdraw, quality and bound-currency rules',()=>{expect(withdrawalQuote(16n*10n**18n)).toEqual({gross:16n*10n**18n,net:136n*10n**17n,retained:24n*10n**17n,burned:0n});expect(qualityBucket(3999).name).toBe('Worn');expect(qualityBucket(4000).offset).toBe(1000);expect(qualityBucket(8500).offset).toBe(2000);for(const k of ['cat','shards','fish','thread','bell','boss-seal','key'])expect(tradability(k)).toBe('bound');expect(tradability('gear','epic')).toBe('sealable');});
});
