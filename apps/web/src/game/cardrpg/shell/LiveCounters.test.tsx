import {cleanup,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {ECONOMY_V3 as E,v3Season} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {readCounters,clearCounterCache} from './LiveCounters';
import {PublishedOdds} from './ShellPages';

const fixture=vi.hoisted(()=>({
 config:{chainId:43113,rpcUrl:'http://127.0.0.1:8546',RelicNFT:'0x1111111111111111111111111111111111111111',YarnToken:'0x2222222222222222222222222222222222222222',SeasonRewards:'0x3333333333333333333333333333333333333333'},
 client:{getChainId:vi.fn(),getBlockNumber:vi.fn(),readContract:vi.fn(),getLogs:vi.fn(),multicall:vi.fn()},
}));
vi.mock('../chain/runtime',()=>({loadChainConfig:async()=>fixture.config,publicChain:()=>fixture.client}));
beforeEach(()=>{
 localStorage.clear();clearCounterCache();vi.resetAllMocks();vi.stubEnv('VITE_V3_START_BLOCK','');vi.stubEnv('VITE_CHAIN_STATS_URL','');
 fixture.client.multicall.mockImplementation(async({contracts})=>contracts.map(()=>false));fixture.client.getLogs.mockResolvedValue([]);fixture.client.getChainId.mockResolvedValue(43113);fixture.client.getBlockNumber.mockResolvedValue(100n);
 fixture.client.readContract.mockImplementation(async({functionName})=>({totalSupply:(1_000_000_000n-20n)*10n**18n,currentSeason:0n,emittedInSeason:40n*10n**18n,burnedInSeason:20n*10n**18n})[functionName as 'currentSeason']);
});
afterEach(()=>{cleanup();vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('verified live economy counters',()=>{
 it('uses one block and actual contract claims, without counting retained Spool as burned',async()=>{
  const result=await readCounters({force:true});
  expect(result).toMatchObject({burned:'20',emitted:'40',seasonBurned:'20',burnEmission:'0.50',rewardSeason:0});
  expect(result.deeds).toBe(0);expect(result.fused).toBeUndefined();
  expect(fixture.client.readContract.mock.calls.every(([args])=>args.blockNumber===100n)).toBe(true);
 });
 it('refuses another chain and does not invent counts before an activation block',async()=>{
  fixture.client.getChainId.mockResolvedValueOnce(1);await expect(readCounters({force:true})).rejects.toThrow('Wrong network');
  vi.stubEnv('VITE_V3_START_BLOCK','101');expect((await readCounters({force:true})).transactions).toBeUndefined();
 });
 it('keeps verified RPC data when the optional indexer is offline',async()=>{
  vi.stubEnv('VITE_CHAIN_STATS_URL','/chain-stats.json');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  expect(await readCounters({force:true})).toMatchObject({burned:'20',emitted:'40'});
 });
 it('accepts only fresh, matching-chain edition data within its fixed supply',async()=>{
  vi.stubEnv('VITE_CHAIN_STATS_URL','/chain-stats.json');
  const stats={chainId:43113,relicNFT:fixture.config.RelicNFT,indexedAt:Date.now(),deeds:4,fused:2,transactions:8,edition:{season:v3Season().number,supply:E.season.editionSupply,minted:3}};
  const fetcher=vi.fn().mockImplementation(async()=>({ok:true,json:async()=>stats}));vi.stubGlobal('fetch',fetcher);
  expect(await readCounters({force:true})).toMatchObject({deeds:4,fused:2,transactions:8,editionMinted:3});
  stats.edition.minted=601;expect((await readCounters({force:true})).editionMinted).toBeUndefined();
  stats.indexedAt-=120001;expect(await readCounters({force:true})).toMatchObject({fused:2,stale:{fused:true}});
 });
 it('renders the published banner odds and pity from the same rules used for draws',()=>{
  render(<PublishedOdds/>);
  const rows=within(screen.getByRole('table',{name:'Published gacha odds'})).getAllByRole('row').slice(1);
  for(const [i,kind] of (['cat','gear'] as const).entries())expect(within(rows[i]!).getAllByRole('cell').map(cell=>cell.textContent)).toEqual([...Object.values(E[kind].odds).map(bp=>`${bp/100}%`),String(E[kind].soft),String(E[kind].hard)]);
 });
});

 it('pages every requested block in windows of at most 100 and deduplicates receipts',async()=>{
  vi.stubEnv('VITE_V3_START_BLOCK','0');fixture.client.getBlockNumber.mockResolvedValue(250n);
  fixture.client.getLogs.mockResolvedValue([{transactionHash:'0xabc',removed:false},{transactionHash:'0xabc',removed:false}]);
  const result=await readCounters({force:true});expect(result.transactions).toBe(1);
  expect(fixture.client.getLogs.mock.calls.map(([a])=>[a.fromBlock,a.toBlock])).toEqual([[0n,99n],[100n,199n],[200n,250n]]);
  expect(result.transactionRange).toEqual({from:'0',to:'250',complete:true});
 });
 it('does not present a partial log scan or incomplete Deed enumeration as zero',async()=>{
  vi.stubEnv('VITE_V3_START_BLOCK','0');fixture.client.getBlockNumber.mockResolvedValue(250n);
  fixture.client.getLogs.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('offline'));
  fixture.client.multicall.mockResolvedValueOnce(Array(49).fill(false));
  const result=await readCounters({force:true});expect(result.transactions).toBeUndefined();expect(result.deeds).toBeUndefined();expect(result.burned).toBe('20');
  expect(result.reasons?.deeds).toMatch(/unavailable/);
 });
 it('counts every Deed ID exactly once at one block, including later batches',async()=>{
  fixture.client.multicall.mockImplementation(async({contracts})=>contracts.map((c:{args:[bigint]})=>[30001n,31001n,33000n].includes(c.args[0])));
  expect((await readCounters({force:true})).deeds).toBe(3);
  const ids=fixture.client.multicall.mock.calls.flatMap(([call])=>call.contracts.map((c:{args:[bigint]})=>c.args[0]));
  expect(ids).toEqual(Array.from({length:E.deed.supply},(_,i)=>BigInt(E.deed.firstId+i)));
  expect(fixture.client.multicall.mock.calls.every(([call])=>call.blockNumber===100n&&call.contracts.length<=500)).toBe(true);
 });
 it('never batches multiple log pages into the public RPC aggregate range limit',async()=>{
  let active=0,peak=0;vi.stubEnv('VITE_V3_START_BLOCK','0');fixture.client.getBlockNumber.mockResolvedValue(250n);
  fixture.client.getLogs.mockImplementation(async()=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,0));active--;return [];});
  expect((await readCounters({force:true})).transactions).toBe(0);expect(peak).toBe(1);
 });
 it('shares a live RPC result for 60 seconds and can explicitly retry',async()=>{
  await readCounters({force:true});const calls=fixture.client.getChainId.mock.calls.length;
  await readCounters();expect(fixture.client.getChainId).toHaveBeenCalledTimes(calls);
  await readCounters({force:true});expect(fixture.client.getChainId).toHaveBeenCalledTimes(calls+1);
 });
 it('surfaces public RPC failure without substituting local saves',async()=>{
  localStorage.setItem('fake-counters',JSON.stringify({deeds:100,burned:999}));fixture.client.getChainId.mockRejectedValue(new Error('offline'));
  await expect(readCounters({force:true})).rejects.toThrow('offline');localStorage.removeItem('fake-counters');
 });

it('retains last verified counters with their original age on RPC failure',async()=>{
 const first=await readCounters({force:true});fixture.client.getChainId.mockRejectedValueOnce(new Error('offline'));
 const retained=await readCounters({force:true});expect(retained.burned).toBe(first.burned);expect(retained.asOf?.burned).toBe(first.asOf?.burned);expect(retained.stale?.burned).toBe(true);
});
