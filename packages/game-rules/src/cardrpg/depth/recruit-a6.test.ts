import {expect,it} from 'vitest';
import * as R from './index';
import {firstInvitation} from './onboarding';
const ready=()=>R.setGameplayA6(R.createDepthAccount(11,0),true);
it('charges the displayed A6 earned-stamp price while OFF keeps its exact price',()=>{
 const on=ready(),off=R.setGameplayV4(R.createDepthAccount(11,0),true);
 for(const s of [on,off]){
  const price=R.invitationBannerV4('standard',s).cost.stamps!;
  expect(price).toBe(s.gameplayA6?60:150);
  const r=R.metaCommand(s,{type:'pull',bannerId:'standard',seed:4});expect(r.ok).toBe(true);
  expect(r.state.account.currencies.stamps).toBe(s.account.currencies.stamps-price);
  const free=firstInvitation(s,4);expect(free.ok).toBe(true);expect(free.state.account.currencies.stamps).toBe(s.account.currencies.stamps);
  expect(R.selectorMarksV4(free.state)).toBe(0);
 }
});
it('keeps batches atomic, published odds/pity correct, and existing draw caps unchanged',()=>{
 const s=ready();s.account.currencies.stamps=599;
 const poor=R.metaCommand(s,{type:'pull',bannerId:'standard',seed:2,count:10});expect(poor.ok).toBe(false);expect(poor.state).toBe(s);
 s.account.currencies.stamps=600;s.account.daily.draws=25;
 expect(R.metaCommand(s,{type:'pull',bannerId:'standard',seed:2,count:10}).ok).toBe(false);
 s.account.daily.draws=0;s.account.pity['cats-standard']={sinceLegendary:23,totalPulls:23,featuredGuaranteed:false};
 expect(R.invitationOddsV4('standard',s.account.pity['cats-standard']).legendary).toBe(10000);
 const r=R.metaCommand(s,{type:'pull',bannerId:'standard',seed:2});expect(r.ok).toBe(true);
 expect(r.state.account.history.at(-1)?.rarity).toBe('legendary');expect(r.state.account.pity['cats-standard']?.sinceLegendary).toBe(0);
 expect(R.getDrawPoolV4(r.state,'standard').reduce((sum,x)=>sum+x.probability,0)).toBeCloseTo(1,10);
 expect(r.state.account.history.at(-1)).toMatchObject({soulbound:true,tradeable:false});
});
