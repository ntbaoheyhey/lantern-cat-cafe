import {expect,it,vi} from 'vitest';
import {readFujiCollection} from './fuji-collection';
import type {publicChain,ChainConfig} from './runtime';
const wallet='0x0000000000000000000000000000000000000001';
const config:ChainConfig={chainId:43113,rpcUrl:'https://api.avax-test.network/ext/bc/C/rpc',RelicNFT:'0x0000000000000000000000000000000000000002',RelicMarket:'0x0000000000000000000000000000000000000003'};
function rpc(){return {getChainId:vi.fn().mockResolvedValue(43113),getBlockNumber:vi.fn().mockResolvedValue(123n),readContract:vi.fn(async({args}:{args:[string[],bigint[]]})=>args[1].map(id=>id===1n?2n:0n))};}
it('reads ownership at one Fuji block without a backend, wallet signer or session',async()=>{
 const client=rpc(),fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(Error('backend offline'));
 try{
  expect(await readFujiCollection(config,wallet,client as unknown as ReturnType<typeof publicChain>)).toEqual([{id:1n,amount:2n,name:'Paw Charm'}]);
  expect(fetch).not.toHaveBeenCalled();expect(client.getBlockNumber).toHaveBeenCalledTimes(1);
  expect(client.readContract.mock.calls.length).toBeGreaterThan(1);
  for(const [request] of client.readContract.mock.calls){expect(request).toMatchObject({address:config.RelicNFT,functionName:'balanceOfBatch',blockNumber:123n});expect(request.args[0].every(a=>a===wallet)).toBe(true);}
 }finally{fetch.mockRestore();}
});
it('rejects the wrong chain and never returns local fixtures as Fuji ownership',async()=>{
 const client=rpc();client.getChainId.mockResolvedValue(1);
 await expect(readFujiCollection(config,wallet,client as unknown as ReturnType<typeof publicChain>)).rejects.toThrow('43113');
 expect(client.readContract).not.toHaveBeenCalled();
 await expect(readFujiCollection({...config,rpcUrl:'http://127.0.0.1:8545'},wallet,client as unknown as ReturnType<typeof publicChain>)).rejects.toThrow('public Fuji');
});
