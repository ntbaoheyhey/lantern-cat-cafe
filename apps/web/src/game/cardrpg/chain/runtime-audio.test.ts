import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {WalletClient,Hash} from 'viem';
import {chainRuntime,type ChainConfig} from './runtime';
import {playCue} from '../contracts/audio-cues';
const rpc=vi.hoisted(()=>({getChainId:vi.fn(),simulateContract:vi.fn(),waitForTransactionReceipt:vi.fn(),getGasPrice:vi.fn(),estimateGas:vi.fn()}));
vi.mock('viem',async importOriginal=>({...await importOriginal<typeof import('viem')>(),createPublicClient:()=>rpc}));
vi.mock('../contracts/audio-cues',()=>({playCue:vi.fn()}));
const address='0x0000000000000000000000000000000000000001',hash=`0x${'a'.repeat(64)}` as Hash;
const config:ChainConfig={chainId:43113,rpcUrl:'http://127.0.0.1:8546',RelicNFT:address,RelicMarket:address};
const request={address,abi:[],functionName:'test'} as const;
let runtime:ReturnType<typeof chainRuntime>;
const wallet=(type:'local'|'json-rpc'='json-rpc')=>({account:{address,type},getChainId:vi.fn(async()=>43113),getAddresses:vi.fn(async()=>[address]),writeContract:vi.fn(async()=>hash),sendTransaction:vi.fn(async()=>hash)});
beforeEach(()=>{vi.clearAllMocks();rpc.getChainId.mockResolvedValue(43113);rpc.simulateContract.mockResolvedValue({request});rpc.waitForTransactionReceipt.mockResolvedValue({status:'success',transactionHash:hash,from:address,gasUsed:21000n,effectiveGasPrice:1n,blockNumber:1n});rpc.getGasPrice.mockResolvedValue(1n);rpc.estimateGas.mockResolvedValue(21000n);});
afterEach(()=>runtime?.silenceSounds());
it('plays wallet, pending and confirmed in order for a successful receipt',async()=>{
 const w=wallet();runtime=chainRuntime(config,w as unknown as WalletClient,address);await expect(runtime.write(request)).resolves.toBe(hash);
 expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.wallet','tx.pending','tx.confirmed']);
});
it.each(['write','sweep'] as const)('keeps receipt feedback without a nonexistent guest-wallet prompt for %s',async mode=>{
 const w=wallet('local');runtime=chainRuntime(config,w as unknown as WalletClient,address);
 const operation=mode==='write'?runtime.write(request):(await runtime.moveAdapter([])).sweep(address,100000n);
 await expect(operation).resolves.toBe(hash);
 expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.pending','tx.confirmed']);
});
it.each(['write','sweep'] as const)('keeps one failure cue for failed local %s signing',async mode=>{
 const w=wallet('local');w.writeContract.mockRejectedValue(new Error('Local signing failed'));w.sendTransaction.mockRejectedValue(new Error('Local signing failed'));
 runtime=chainRuntime(config,w as unknown as WalletClient,address);
 const operation=mode==='write'?runtime.write(request):(await runtime.moveAdapter([])).sweep(address,100000n);
 await expect(operation).rejects.toThrow('Local signing failed');
 expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.failed']);
});
it('records the submitted hash before receipt waiting can time out',async()=>{
 const submitted=vi.fn();rpc.waitForTransactionReceipt.mockRejectedValue(new Error('receipt timeout'));
 runtime=chainRuntime(config,wallet() as unknown as WalletClient,address);
 await expect(runtime.write(request,submitted)).rejects.toThrow('receipt timeout');
 expect(submitted).toHaveBeenCalledExactlyOnceWith(hash);
 expect(submitted.mock.invocationCallOrder[0]).toBeLessThan(rpc.waitForTransactionReceipt.mock.invocationCallOrder[0]!);
});
it('plays one failed cue for a rejected wallet and never starts a pending loop',async()=>{
 const w=wallet();w.writeContract.mockRejectedValue(new Error('User rejected'));runtime=chainRuntime(config,w as unknown as WalletClient,address);
 await expect(runtime.write(request)).rejects.toThrow('User rejected');expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.wallet','tx.failed']);expect(rpc.waitForTransactionReceipt).not.toHaveBeenCalled();
});
it('stops waiting with one failure cue when the chain receipt reverts',async()=>{
 rpc.waitForTransactionReceipt.mockResolvedValue({status:'reverted'});runtime=chainRuntime(config,wallet() as unknown as WalletClient,address);
 await expect(runtime.write(request)).rejects.toThrow('Transaction failed');expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.wallet','tx.pending','tx.failed']);
});
it.each(['write','sweep'] as const)('does not restart sound after dismissal while %s signing is unresolved',async mode=>{
 const w=wallet();let sign!:(hash:Hash)=>void;const signing=new Promise<Hash>(resolve=>{sign=resolve;});
 w.writeContract.mockReturnValue(signing);w.sendTransaction.mockReturnValue(signing);runtime=chainRuntime(config,w as unknown as WalletClient,address);
 const operation=mode==='write'?runtime.write(request):(await runtime.moveAdapter([])).sweep(address,100000n);
 await vi.waitFor(()=>expect(playCue).toHaveBeenCalledWith('tx.wallet'));runtime.silenceSounds();sign(hash);await expect(operation).resolves.toBe(hash);
 expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.wallet']);expect(rpc.waitForTransactionReceipt).toHaveBeenCalled();
});

it('rejects a successful cancellation instead of confirming the requested action',async()=>{
 rpc.waitForTransactionReceipt.mockImplementation(async(options:{onReplaced:(event:{reason:string})=>void})=>{options.onReplaced({reason:'cancelled'});return {status:'success',transactionHash:hash,from:address,gasUsed:21000n,effectiveGasPrice:1n,blockNumber:1n};});
 runtime=chainRuntime(config,wallet() as unknown as WalletClient,address);
 await expect(runtime.write(request)).rejects.toThrow('Transaction replaced');
 expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).not.toContain('tx.confirmed');
});
