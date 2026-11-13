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
const wallet=()=>({account:{address},getChainId:vi.fn(async()=>43113),getAddresses:vi.fn(async()=>[address]),writeContract:vi.fn(async()=>hash),sendTransaction:vi.fn(async()=>hash)});
beforeEach(()=>{vi.clearAllMocks();rpc.getChainId.mockResolvedValue(43113);rpc.simulateContract.mockResolvedValue({request});rpc.waitForTransactionReceipt.mockResolvedValue({status:'success'});rpc.getGasPrice.mockResolvedValue(1n);rpc.estimateGas.mockResolvedValue(21000n);});
afterEach(()=>runtime?.silenceSounds());
it('plays wallet, pending and confirmed in order for a successful receipt',async()=>{
 const w=wallet();runtime=chainRuntime(config,w as unknown as WalletClient,address);await expect(runtime.write(request)).resolves.toBe(hash);
 expect(vi.mocked(playCue).mock.calls.map(c=>c[0])).toEqual(['tx.wallet','tx.pending','tx.confirmed']);
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
