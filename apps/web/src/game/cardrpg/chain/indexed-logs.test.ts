import {afterEach,expect,it,vi} from 'vitest';
import {fetchIndexedRange,readIndexedLogs,normalizeIndexedLog} from './indexed-logs';
const address='0x0000000000000000000000000000000000000001' as const;
const blockHash=`0x${'b'.repeat(64)}` as const,transactionHash=`0x${'a'.repeat(64)}` as const;
const log={address,blockHash,transactionHash,topics:[blockHash],data:'',blockNumber:'0x14',transactionIndex:'0x0',logIndex:'0x'};
const response=(result:unknown)=>({ok:true,json:async()=>({status:'1',result})}) as Response;
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
it('requires exhaustion and validates every returned event, even after a short page',async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(response([log])).mockResolvedValueOnce(response([]));
 const rows=await fetchIndexedRange([address],10n,30n,fetcher,async()=>{});
 expect(rows).toHaveLength(1);expect(rows[0]).toMatchObject({blockNumber:'20',logIndex:0,removed:false});
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect(new URL(fetcher.mock.calls[1]![0]).searchParams.get('page')).toBe('2');
 expect(()=>normalizeIndexedLog({...log,address:'0x0000000000000000000000000000000000000002'},address,10n,30n)).toThrow();
 expect(()=>normalizeIndexedLog({...log,removed:true},address,10n,30n)).toThrow();
 expect(()=>normalizeIndexedLog({...log,blockNumber:'31'},address,10n,30n)).toThrow();
});
it('rejects repeated pages and API failures instead of showing a partial total',async()=>{
 await expect(fetchIndexedRange([address],0n,30n,vi.fn().mockResolvedValue(response([log])),async()=>{})).rejects.toThrow('Repeated');
 const fetcher=vi.fn().mockResolvedValueOnce(response([log])).mockResolvedValueOnce({ok:false});
 await expect(fetchIndexedRange([address],0n,30n,fetcher,async()=>{})).rejects.toThrow('unavailable');
});
it('reads a recent RPC tail so indexer latency cannot hide a new receipt',async()=>{
 const config={chainId:43113 as const,RelicNFT:address,RelicMarket:address,rpcUrl:'https://fuji.example/tail'};
 const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({items:[{chainId:'43113',number:80,id:blockHash}]})}).mockResolvedValueOnce(response([]));
 vi.stubGlobal('fetch',fetcher);
 const client={getBlock:vi.fn().mockResolvedValue({hash:blockHash}),getLogs:vi.fn().mockResolvedValue([{...log,blockNumber:99n,logIndex:0,transactionIndex:0}])};
 const rows=await readIndexedLogs(client as unknown as Parameters<typeof readIndexedLogs>[0],config,100n);
 expect(rows.through).toBe('100');expect(rows.logs.map(l=>l.blockNumber)).toEqual(['99']);
 expect(client.getLogs).toHaveBeenCalledWith({address:[address],fromBlock:61n,toBlock:100n});
});
it('fails closed when the index is too far behind, and never sends local activity to it',async()=>{
 const config={chainId:43113 as const,RelicNFT:address,RelicMarket:address,rpcUrl:'https://fuji.example/lag'};
 const fetcher=vi.fn().mockResolvedValue({ok:true,json:async()=>({items:[{chainId:'43113',number:80,id:blockHash}]})});vi.stubGlobal('fetch',fetcher);
 const client={getBlock:vi.fn().mockResolvedValue({hash:blockHash}),getLogs:vi.fn()};
 await expect(readIndexedLogs(client as unknown as Parameters<typeof readIndexedLogs>[0],config,1000n)).rejects.toThrow('behind');
 expect(client.getLogs).not.toHaveBeenCalled();
 fetcher.mockClear();await expect(readIndexedLogs(client as unknown as Parameters<typeof readIndexedLogs>[0],{...config,rpcUrl:'http://127.0.0.1:8546'},100n)).rejects.toThrow('local');expect(fetcher).not.toHaveBeenCalled();
});
