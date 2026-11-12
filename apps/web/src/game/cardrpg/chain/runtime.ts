import { createPublicClient, http, isAddress, type Abi, type Address, type Hash, type WalletClient } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { getAddresses, relicNftAbi, relicMarketAbi, relicMarketV2Abi } from '@taskbar-hero/chain';
import { requireFuji } from './guest';

export interface ChainConfig {
  chainId: 43113; rpcUrl: string; RelicNFT: Address; RelicMarket: Address;
  YarnToken?: Address; RelicMarketV2?: Address; SeasonRewards?: Address; startBlock?: string;
}
export async function loadChainConfig(): Promise<ChainConfig> {
  if (import.meta.env.VITE_CHAIN_MODE === 'local') {
    // A missing local deployment must never fall back to a public chain.
    const response = await fetch('/chain-local.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Start the local chain.');
    const config = await response.json() as ChainConfig;
    const url = new URL(config.rpcUrl);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('Local RPC required.');
    requireFuji(config.chainId);
    if (!isAddress(config.RelicNFT) || !isAddress(config.RelicMarket)) throw new Error('Deploy the local contracts.');
    return config;
  }
  const addresses = getAddresses(43113);
  const optional = (value?: string) => value && isAddress(value) ? value : undefined;
  return { chainId: 43113, rpcUrl: import.meta.env.VITE_FUJI_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
    RelicNFT: addresses.RelicNFT!, RelicMarket: addresses.RelicMarket!,
    YarnToken: optional(import.meta.env.VITE_YARN_ADDRESS), RelicMarketV2: optional(import.meta.env.VITE_MARKET_V2_ADDRESS),
    SeasonRewards: optional(import.meta.env.VITE_SEASON_REWARDS_ADDRESS),
  };
}
export function publicChain(config: ChainConfig) {
  return createPublicClient({ chain: avalancheFuji, transport: http(config.rpcUrl, { timeout: 10_000, retryCount: 1 }), pollingInterval: 750 });
}
export const erc20Abi = [
  {type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'owner',type:'address'}],outputs:[{type:'uint256'}]},
  {type:'function',name:'transfer',stateMutability:'nonpayable',inputs:[{name:'to',type:'address'},{name:'amount',type:'uint256'}],outputs:[{type:'bool'}]},
  {type:'function',name:'approve',stateMutability:'nonpayable',inputs:[{name:'spender',type:'address'},{name:'amount',type:'uint256'}],outputs:[{type:'bool'}]},
] as const;
export interface ChainListing {id:bigint;seller:Address;relicId:bigint;amount:bigint;price:bigint;currency:number;version:'v1'|'v2'}
export function chainRuntime(config: ChainConfig, wallet: WalletClient, address: Address) {
  const client = publicChain(config);
  const guard = async () => { requireFuji(await client.getChainId()); requireFuji(await wallet.getChainId()); };
  const receipt = async (hash: Hash) => {
    const r = await client.waitForTransactionReceipt({ hash, timeout: 60_000 });
    if (r.status !== 'success') throw new Error('Transaction failed.');
    return hash;
  };
  async function write(request: {address: Address; abi: Abi; functionName: string; args?: readonly unknown[]; value?: bigint}) {
    await guard();
    const simulation = await client.simulateContract({ ...request, account: address });
    return receipt(await wallet.writeContract({ ...simulation.request, account: wallet.account ?? address, chain: avalancheFuji }));
  }
  const listings = async (version:'v1'|'v2'='v1'):Promise<ChainListing[]> => {
    const market=version==='v2'?config.RelicMarketV2:config.RelicMarket;
    if(!market)return [];
    const abi=version==='v2'?relicMarketV2Abi:relicMarketAbi;
    // One block snapshot keeps pagination coherent if another player trades mid-refresh.
    const blockNumber=await client.getBlockNumber({cacheTime:0});
    const count=await client.readContract({address:market,abi,functionName:'activeListingCount',blockNumber});
    const rows:ChainListing[]=[];
    for(let offset=0n;offset<count;offset+=100n){
      const [ids,items]=await client.readContract({address:market,abi,functionName:'getListings',args:[offset,100n],blockNumber});
      rows.push(...items.map((item,i)=>({...item,id:ids[i]!,currency:'currency' in item?item.currency:0,version})));
    }
    return rows;
  };
  const holdings = async (ids: bigint[]) => {
    if (!ids.length) return [];
    const balances = await client.readContract({ address: config.RelicNFT, abi: relicNftAbi, functionName: 'balanceOfBatch', args: [ids.map(() => address), ids] });
    return ids.map((id, i) => ({id, amount: balances[i]!})).filter(row => row.amount > 0n);
  };
  return { client, guard, receipt, write, listings, holdings,
    async moveAdapter(ids: bigint[]) {
      return {
        address, chainId: async () => { await guard(); return 43113; },
        cancelListings: async () => { for (const version of ['v1','v2'] as const) for(const l of await listings(version)) if(l.seller.toLowerCase()===address.toLowerCase()) await write({address:version==='v2'?config.RelicMarketV2!:config.RelicMarket,abi:version==='v2'?relicMarketV2Abi:relicMarketAbi,functionName:'cancel',args:[l.id]}); },
        withdrawProceeds: async () => {if(!config.RelicMarketV2)return;for(const currency of [0,1]){const amount=await client.readContract({address:config.RelicMarketV2,abi:relicMarketV2Abi,functionName:'proceeds',args:[address,currency]});if(amount>0n)await write({address:config.RelicMarketV2,abi:relicMarketV2Abi,functionName:'withdraw',args:[currency,address]});}},
        relics: () => holdings(ids),
        moveRelics: (to: Address, tokenIds: bigint[], amounts: bigint[]) => write({address: config.RelicNFT, abi: relicNftAbi, functionName: 'safeBatchTransferFrom', args: [address, to, tokenIds, amounts, '0x']}),
        yarnBalance: () => config.YarnToken ? client.readContract({address: config.YarnToken, abi: erc20Abi, functionName: 'balanceOf', args: [address]}) : Promise.resolve(0n),
        moveYarn: (to: Address, amount: bigint) => write({address: config.YarnToken!, abi: erc20Abi, functionName: 'transfer', args: [to, amount]}),
        balance: () => client.getBalance({address}),
        sweep: async (to: Address, balance: bigint) => {
          // Legacy gas gives a known fee; contracts receive an estimated gas allowance.
          const gasPrice = await client.getGasPrice();
          const gas = await client.estimateGas({account: address, to, value: 0n});
          const reserve = gas * gasPrice;
          if (balance <= reserve) return undefined;
          await guard();
          return receipt(await wallet.sendTransaction({account: wallet.account ?? address, chain: avalancheFuji, to, value: balance - reserve, gas, gasPrice, type: 'legacy'}));
        },
      };
    },
  };
}
export const txLink = (hash: string) => `https://testnet.snowtrace.io/tx/${hash}`;
