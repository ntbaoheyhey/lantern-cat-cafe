/** S3 learning: compare existing guest/demo authorities, with no network writes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {createServer}=await import(require.resolve('vite'));
const loader=await createServer({root,configFile:false,envDir:false,publicDir:false,optimizeDeps:{noDiscovery:true,include:[]},resolve:{alias:{viem:resolve(require.resolve('viem'),'../..')}},server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom',logLevel:'silent'});
try{
 const {createEconomy,freshEconomy}=await loader.ssrLoadModule('/supabase/functions/_shared/economy-v3.ts');
 const {ECONOMY_V3:E}=await loader.ssrLoadModule('/packages/game-rules/src/cardrpg/economy-v3.ts');
 const {GEAR_BY_ID}=await loader.ssrLoadModule('/packages/game-rules/src/cardrpg/depth/equipment.ts');
 const unit=10n**18n,rows=[];
 for(const judge of [false,true]){
  let state=freshEconomy(),revision=0;const receipts=new Map();
  const wallet='0x0000000000000000000000000000000000000001',player='00000000-0000-4000-8000-000000000001';
  const store={read:async()=>({state,revision,createdAt:'2026-11-16T00:00:00Z',judge,campaign:null,wins:[]}),receipt:async(_p,_w,id)=>receipts.get(id)??null,
   commit:async v=>{state=v.state;const saved={hash:v.hash,state,revision:++revision};receipts.set(v.id,saved);return saved;}};
  // Only quest/state operations are exercised; signatures are not used or serialized.
  const chain=new Proxy({certify:async()=> '0x'}, {get:(o,k)=>k in o?o[k]:()=>{throw Error('Unexpected chain operation '+String(k));}});
  const economy=createEconomy({enabled:true,demo:true,store,chain,now:()=>Date.parse('2026-11-16T05:00:00Z')});
  const request={id:crypto.randomUUID(),command:{action:'quest'}};let reason=null;
  try{await economy(player,wallet,request);}catch(e){reason=e.message;}
  const before=state.gear.length;
  if(!reason){await economy(player,wallet,request);assert.equal(state.gear.length,before,'Retry must not grant twice');}
  const groups=Object.values(Object.groupBy(state.gear,g=>GEAR_BY_ID[g.template].setId));
  const sealCost=E.seal.reference.epic*E.seal.feeBp/10000,combined=sealCost+E.fusion.legendary.yarn;
  rows.push({method:judge?'Existing server-authorized Judge quest':'Ordinary fresh guest, no campaign win',questAccepted:reason===null,reason,gear:state.gear.length,maximumSameSetEpics:Math.max(0,...groups.map(g=>g.length)),spool:Number(BigInt(state.spool)/unit),bossSeals:state.bossSeals,starThread:state.stars,level:state.level,retryExtraGear:state.gear.length-before,testerYarn:20,sealCostYarn:sealCost,fusionCostYarn:E.fusion.legendary.yarn,combinedCostYarn:combined,shortfallBeforeTradeOrWithdraw:Math.max(0,combined-20),weeklyWithdrawalNetCap:E.spool.weeklyNetCap});
 }
 const report={at:new Date().toISOString(),method:'Real economy handler with disposable in-memory store and no RPC; authorization cases deliberately distinct',rows,limitations:['No browser timing or chain receipt measured.','Judge entitlement must be earned through the existing capped server pass; this experiment does not grant one.','A local battle reward cannot be imported as server-earned gear.','A second wallet needs real existing test YARN; no hidden balance grant is allowed.']};
 await mkdir(resolve(root,'reports/v4-ship/S3'),{recursive:true});await writeFile(resolve(root,'reports/v4-ship/S3/economy-path-probe.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await loader.close();}
