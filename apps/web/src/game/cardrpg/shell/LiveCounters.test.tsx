import {cleanup,render,screen,within} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {ECONOMY_V3 as E,v3Season} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {readCounters} from './LiveCounters';
import {PublishedOdds} from './ShellPages';

const fixture=vi.hoisted(()=>({
 config:{RelicNFT:'0x1111111111111111111111111111111111111111',YarnToken:'0x2222222222222222222222222222222222222222',SeasonRewards:'0x3333333333333333333333333333333333333333'},
 client:{getChainId:vi.fn(),getBlockNumber:vi.fn(),readContract:vi.fn(),getLogs:vi.fn()},
}));
vi.mock('../chain/runtime',()=>({loadChainConfig:async()=>fixture.config,publicChain:()=>fixture.client}));
beforeEach(()=>{
 vi.resetAllMocks();vi.stubEnv('VITE_V3_START_BLOCK','');vi.stubEnv('VITE_CHAIN_STATS_URL','');
 fixture.client.getChainId.mockResolvedValue(43113);fixture.client.getBlockNumber.mockResolvedValue(100n);
 fixture.client.readContract.mockImplementation(async({functionName})=>({totalSupply:(1_000_000_000n-20n)*10n**18n,currentSeason:0n,emittedInSeason:40n*10n**18n,burnedInSeason:20n*10n**18n})[functionName as 'currentSeason']);
});
afterEach(()=>{cleanup();vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('verified live economy counters',()=>{
 it('uses one block and actual contract claims, without counting retained Spool as burned',async()=>{
  const result=await readCounters();
  expect(result).toMatchObject({burned:'20',emitted:'40',seasonBurned:'20',burnEmission:'0.50',rewardSeason:0});
  expect(result.deeds).toBeUndefined();expect(result.fused).toBeUndefined();
  expect(fixture.client.readContract.mock.calls.every(([args])=>args.blockNumber===100n)).toBe(true);
 });
 it('refuses another chain and does not invent counts before an activation block',async()=>{
  fixture.client.getChainId.mockResolvedValueOnce(1);await expect(readCounters()).rejects.toThrow('Wrong network');
  vi.stubEnv('VITE_V3_START_BLOCK','101');expect((await readCounters()).deeds).toBeUndefined();
 });
 it('keeps verified RPC data when the optional indexer is offline',async()=>{
  vi.stubEnv('VITE_CHAIN_STATS_URL','/chain-stats.json');vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));
  expect(await readCounters()).toMatchObject({burned:'20',emitted:'40'});
 });
 it('accepts only fresh, matching-chain edition data within its fixed supply',async()=>{
  vi.stubEnv('VITE_CHAIN_STATS_URL','/chain-stats.json');
  const stats={chainId:43113,relicNFT:fixture.config.RelicNFT,indexedAt:Date.now(),deeds:4,fused:2,transactions:8,edition:{season:v3Season().number,supply:E.season.editionSupply,minted:3}};
  const fetcher=vi.fn().mockImplementation(async()=>({ok:true,json:async()=>stats}));vi.stubGlobal('fetch',fetcher);
  expect(await readCounters()).toMatchObject({deeds:4,fused:2,transactions:8,editionMinted:3});
  stats.edition.minted=601;expect((await readCounters()).editionMinted).toBeUndefined();
  stats.indexedAt-=120001;expect((await readCounters()).fused).toBeUndefined();
 });
 it('renders the published banner odds and pity from the same rules used for draws',()=>{
  render(<PublishedOdds/>);
  const rows=within(screen.getByRole('table',{name:'Published gacha odds'})).getAllByRole('row').slice(1);
  for(const [i,kind] of (['cat','gear'] as const).entries())expect(within(rows[i]!).getAllByRole('cell').map(cell=>cell.textContent)).toEqual([...Object.values(E[kind].odds).map(bp=>`${bp/100}%`),String(E[kind].soft),String(E[kind].hard)]);
 });
});
