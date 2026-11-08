import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';
const base='/tmp/cardrpg-a5-b3-prep/validation-01',manifest=JSON.parse(await readFile(base+'/manifest.json','utf8'));
const transforms={};for(const [file,row]of Object.entries(manifest.transforms)){assert.equal(createHash('sha256').update(await readFile(row.file)).digest('hex'),row.sha256);transforms[file]=row.file;}
const suite=await loadRules({transforms}),R=suite.depth,C=suite.legacy,checks=[];
const fresh=()=>R.setGameplayV4(R.createDepthAccount(23),true);
try{
 for(const banner of C.BANNERS){
  assert.deepEqual(R.invitationOddsV4(banner.id),C.getBannerOdds(banner,C.emptyPity()));
  assert.equal(R.invitationOddsV4(banner.id,{...C.emptyPity(),sinceLegendary:11}).legendary,100);
  assert.equal(R.invitationOddsV4(banner.id,{...C.emptyPity(),sinceLegendary:12}).legendary,800);
  for(const sinceLegendary of [23,59])assert.deepEqual(R.invitationOddsV4(banner.id,{...C.emptyPity(),sinceLegendary}),{common:0,rare:0,epic:0,legendary:10000});
  for(const pity of [0,11,12,18,23,59]){
   const s=fresh();s.account.pity[banner.pityGroup]={...C.emptyPity(),sinceLegendary:pity};
   const pool=R.getDrawPoolV4(s,banner.id),odds=R.invitationOddsV4(banner.id,s.account.pity[banner.pityGroup]);
   assert(Math.abs(pool.reduce((n,r)=>n+r.probability,0)-1)<1e-10);
   for(const rarity of ['common','rare','epic','legendary'])assert(Math.abs(pool.filter(r=>r.rarity===rarity).reduce((n,r)=>n+r.probability,0)-odds[rarity]/10000)<1e-10);
   const drawn=R.metaCommand(s,{type:'pull',bannerId:banner.id,seed:31});assert(drawn.ok,drawn.error);assert.deepEqual(drawn.state.account.history.at(-1).oddsBp,odds);
  }
 }
 checks.push('both banners: base/soft13/hard24/legacy59, exact pools and committed odds');
 const s=fresh();s.account.daily.earned.stamps=350;s.v4.journal={cats:[],gear:[],sets:[],rewardedRoutes:10,claims:[]};
 assert.equal(R.milestonePreviewV4(s,'ten-routes').reward.stamps,10);
 const claimed=R.claimMilestoneV4(s,'ten-routes');assert(claimed.ok,claimed.error);assert.equal(claimed.state.account.currencies.stamps-s.account.currencies.stamps,10);assert.equal(claimed.state.account.daily.earned.stamps,360);
 const again=R.claimMilestoneV4(claimed.state,'ten-routes');assert.equal(again.ok,false);assert.deepEqual(again.state,claimed.state);
 checks.push('partial cap preview equals one-time settlement');
 const off=R.setGameplayV4(fresh(),false);off.account.daily.earned.stamps=340;
 const level=R.metaCommand(off,{type:'level',cardId:off.team[0]});assert(level.ok,level.error);assert.equal(level.state.account.currencies.stamps,off.account.currencies.stamps);assert.equal(level.state.account.daily.earned.stamps,340);
 R.grantDepth(level.state,{stamps:40});assert.equal(level.state.account.currencies.stamps,off.account.currencies.stamps);
 checks.push('mode toggle never claws back earned stamps or grants over OFF cap');
 const banner=C.BANNERS[0],old=fresh();old.v4.selectorMarks=59;old.account.pity[banner.pityGroup]={sinceLegendary:59,totalPulls:59,featuredGuaranteed:false};
 const code=R.exportSave(old);assert(code.startsWith('THC12.'));const migrated=R.importSave(code);
 for(const mode of [false,true]){const loaded=R.setGameplayV4(migrated,mode);assert.deepEqual(loaded.account.currencies,old.account.currencies);assert.deepEqual(loaded.account.pity,old.account.pity);assert.equal(loaded.v4.selectorMarks,59);}
 const drawn=R.metaCommand(migrated,{type:'pull',bannerId:banner.id,seed:8});assert(drawn.ok,drawn.error);assert.equal(drawn.state.account.history.at(-1).rarity,'legendary');assert.equal(drawn.state.v4.selectorMarks,60);
 const legacy=R.createDepthAccount(23);assert(R.exportSave(legacy).startsWith('THC7.'));assert.deepEqual(R.importSave(R.exportSave(legacy)),legacy);
 legacy.account.pity[banner.pityGroup]={...C.emptyPity(),sinceLegendary:23};const historical=R.metaCommand(legacy,{type:'pull',bannerId:banner.id,seed:31});assert(historical.ok,historical.error);assert.equal(historical.state.account.history.at(-1).oddsBp.legendary,100);
 checks.push('THC7/THC12 round-trip, both modes preserve credits, historical OFF odds unchanged');
 await writeFile(base+'/checks.json',JSON.stringify({manifest,checks,status:'PASS; isolated rule checks, no cohort or acceptance claim'},null,2));console.log(JSON.stringify(checks));
} finally {await suite.close();}
