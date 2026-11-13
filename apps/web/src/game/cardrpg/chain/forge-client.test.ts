import {expect,it,vi} from 'vitest';
import {FORGE_COST,isForgeInput} from '@taskbar-hero/chain';
import {TRADE_RULES} from '@taskbar-hero/game-rules/cardrpg';
import {craftDesign} from './forge-client';
import {chainRuntime,type ChainConfig} from './runtime';
const nft='0x1111111111111111111111111111111111111111',token='0x2222222222222222222222222222222222222222';
const forge='0x3333333333333333333333333333333333333333',wallet='0x4444444444444444444444444444444444444444';
const config:ChainConfig={chainId:43113,rpcUrl:'http://127.0.0.1:5981',RelicNFT:nft,RelicMarket:nft,YarnToken:token,RelicForge:forge};
function fixture(overrides:Record<string,unknown>={}){
  const values:Record<string,unknown>={relicNFT:nft,yarn:token,COST:FORGE_COST,DESIGNS:3,hasDesign:false,isApprovedForAll:false,...overrides};
  const readContract=vi.fn(async({functionName}:{functionName:string})=>values[functionName]);
  const write=vi.fn(async()=>`0x${'a'.repeat(64)}` as `0x${string}`);
  const r={guard:vi.fn(async()=>{}),client:{readContract},write,holdings:vi.fn(async()=>[{id:20020n,amount:1n},{id:20723n,amount:1n}])};
  return {r:r as unknown as ReturnType<typeof chainRuntime>,write,readContract,holdings:r.holdings};
}
it('uses exactly the canonical Epic catalog, excluding Legendary and other assets',()=>{
  const ids=TRADE_RULES.filter(r=>r.tradable&&r.kind==='equipment'&&r.rarity==='epic').map(r=>BigInt(r.tokenId!));
  expect(ids).toHaveLength(32);
  const eligible=Array.from({length:22000},(_,i)=>BigInt(i)).filter(isForgeInput);
  expect(eligible.sort()).toEqual(ids.sort());
});
it.each([{COST:FORGE_COST+1n},{yarn:wallet},{relicNFT:wallet},{DESIGNS:4}])('rejects changed deployment quote before approvals: %o',async override=>{
  const f=fixture(override);
  await expect(craftDesign(f.r,config,wallet,0,20020n,20723n)).rejects.toThrow('Forge changed');
  expect(f.write).not.toHaveBeenCalled();
});
it('recovers a confirmed forge without approving or charging again',async()=>{
  const f=fixture({hasDesign:true});
  await expect(craftDesign(f.r,config,wallet,0,20020n,20723n)).resolves.toBeUndefined();
  expect(f.write).not.toHaveBeenCalled();
});
it('cannot select the same unit twice or forge items held by escrow',async()=>{
  const f=fixture();
  await expect(craftDesign(f.r,config,wallet,0,20020n,20020n)).rejects.toThrow('two Epics');
  f.holdings.mockResolvedValue([]);
  await expect(craftDesign(f.r,config,wallet,0,20020n,20723n)).rejects.toThrow('two Epics');
  expect(f.write).not.toHaveBeenCalled();
});
it('approves exact YARN then atomically forges the chosen owned units',async()=>{
  const f=fixture();await craftDesign(f.r,config,wallet,2,20020n,20723n);
  expect(f.write.mock.calls).toHaveLength(3);
  expect(f.write).toHaveBeenNthCalledWith(2,expect.objectContaining({functionName:'approve',args:[forge,FORGE_COST]}));
  expect(f.write).toHaveBeenNthCalledWith(3,expect.objectContaining({address:forge,functionName:'forge',args:[2,20020n,20723n]}));
});
