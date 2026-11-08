// REFERENCE: measured B3 candidate01 360-stamp cap / soft13+700bp / hard24.
import {describe,expect,it} from 'vitest';
import * as R from './index';
import {BANNERS} from '../catalog';
import {emptyPity,getBannerOdds} from '../gacha';
const fresh=()=>R.setGameplayV4(R.createDepthAccount(23),true);

describe('v4 early invitation progress',()=>{
 it('keeps base odds, starts the disclosed soft curve on draw13 and guarantees draw24',()=>{
  for(const banner of BANNERS){
   expect(R.invitationOddsV4(banner.id)).toEqual(getBannerOdds(banner,emptyPity()));
   expect(R.invitationOddsV4(banner.id,{...emptyPity(),sinceLegendary:11}).legendary).toBe(100);
   expect(R.invitationOddsV4(banner.id,{...emptyPity(),sinceLegendary:12}).legendary).toBe(800);
   expect(R.invitationOddsV4(banner.id,{...emptyPity(),sinceLegendary:23})).toEqual({common:0,rare:0,epic:0,legendary:10000});
  }
 });
 it('honours a THC12 counter beyond the new guarantee without deleting marks or balances',()=>{
  const s=fresh(),banner=BANNERS[0]!;s.v4!.selectorMarks=59;
  s.account.pity[banner.pityGroup]={sinceLegendary:59,totalPulls:59,featuredGuaranteed:false};
  const imported=R.importSave(R.exportSave(s));
  for(const enabled of [false,true]){
   const mode=R.setGameplayV4(imported,enabled);
   expect(mode.account.currencies).toEqual(s.account.currencies);
   expect(mode.account.pity).toEqual(s.account.pity);expect(mode.v4!.selectorMarks).toBe(59);
  }
  const drawn=R.metaCommand(imported,{type:'pull',bannerId:banner.id,seed:8});expect(drawn.ok).toBe(true);
  expect(drawn.state.account.history.at(-1)).toMatchObject({rarity:'legendary',pityBefore:59});
  expect(drawn.state.v4!.selectorMarks).toBe(60);expect(drawn.state.account.pity[banner.pityGroup]!.sinceLegendary).toBe(0);
 });
 it('uses the same conditional probabilities in exact pools and committed draws',()=>{
  for(const banner of BANNERS)for(const pity of [0,11,12,18,23,59]){
   const s=fresh();s.account.pity[banner.pityGroup]={...emptyPity(),sinceLegendary:pity};
   const pool=R.getDrawPoolV4(s,banner.id),odds=R.invitationOddsV4(banner.id,s.account.pity[banner.pityGroup]);
   expect(pool.reduce((n,r)=>n+r.probability,0)).toBeCloseTo(1,10);
   for(const rarity of ['common','rare','epic','legendary'] as const)expect(pool.filter(r=>r.rarity===rarity).reduce((n,r)=>n+r.probability,0)).toBeCloseTo(odds[rarity]/10000,10);
   const drawn=R.metaCommand(s,{type:'pull',bannerId:banner.id,seed:31});expect(drawn.ok).toBe(true);
   expect(drawn.state.account.history.at(-1)!.oddsBp).toEqual(odds);
  }
 });
 it('preserves the historical OFF odds before the old guarantee',()=>{
  const s=R.createDepthAccount(23),banner=BANNERS[0]!;
  s.account.pity[banner.pityGroup]={...emptyPity(),sinceLegendary:23};
  const drawn=R.metaCommand(s,{type:'pull',bannerId:banner.id,seed:31});expect(drawn.ok).toBe(true);
  expect(drawn.state.account.history.at(-1)!.oddsBp.legendary).toBe(100);
 });
});

describe('mode-aware earned allowance',()=>{
 it('offers truthful week goals without changing state or enabling them in OFF mode',()=>{
  const s=fresh(),before=structuredClone(s);
  for(let day=1;day<=8;day++){
   const view=R.firstWeekV4({...s,account:{...s.account,day}});
   expect(view?.goal.length).toBeGreaterThan(0);expect(view?.tomorrow).toContain('up to 360 stamps');
   expect(view?.tomorrow).toContain('Two cafe services return');
  }
  expect(s).toEqual(before);expect(R.firstWeekV4(R.setGameplayV4(s,false))).toBeNull();
  expect(R.LESSONS_V4.find(l=>l.id==='invite')?.text).toContain(`Save ${R.SELECTOR_COST_V4} marks`);
 });
 it('settles previewed partial stamps once at the v4 cap',()=>{
  const s=fresh();s.account.daily.earned.stamps=350;s.v4!.journal={cats:[],gear:[],sets:[],rewardedRoutes:10,claims:[]};
  expect(R.milestonePreviewV4(s,'ten-routes').reward.stamps).toBe(10);
  const r=R.claimMilestoneV4(s,'ten-routes');expect(r.ok).toBe(true);
  expect(r.state.account.currencies.stamps-s.account.currencies.stamps).toBe(10);
  expect(r.state.account.daily.earned.stamps).toBe(360);
  expect(R.claimMilestoneV4(r.state,'ten-routes')).toMatchObject({ok:false,state:r.state});
 });
 it('does not claw back stamps earned before switching OFF',()=>{
  const s=R.setGameplayV4(fresh(),false);s.account.daily.earned.stamps=340;
  const before=s.account.currencies.stamps,r=R.metaCommand(s,{type:'level',cardId:s.team[0]!});
  expect(r.ok).toBe(true);expect(r.state.account.currencies.stamps).toBe(before);expect(r.state.account.daily.earned.stamps).toBe(340);
  R.grantDepth(r.state,{stamps:40});expect(r.state.account.currencies.stamps).toBe(before);
 });
});
