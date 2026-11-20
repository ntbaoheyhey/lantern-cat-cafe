import {isAddressEqual,type Address,type Hash} from 'viem';
import {FORGE_COST,FORGE_DESIGNS,isForgeInput,relicForgeAbi,relicNftAbi,yarnTokenAbi} from '@taskbar-hero/chain';
import {type ChainConfig,chainRuntime} from './runtime';
export async function craftDesign(runtime:ReturnType<typeof chainRuntime>,config:ChainConfig,
  wallet:Address,design:number,first:bigint,second:bigint):Promise<Hash|undefined>{
  if(!config.RelicForge||!config.YarnToken||!FORGE_DESIGNS.some(d=>d.id===design))throw new Error('Forge changed. Retry.');
  await runtime.guard();
  const read=(functionName:'relicNFT'|'yarn'|'COST'|'DESIGNS')=>runtime.client.readContract({address:config.RelicForge!,abi:relicForgeAbi,functionName});
  const [nft,token,cost,count]=await Promise.all([read('relicNFT'),read('yarn'),read('COST'),read('DESIGNS')]);
  if(typeof nft!=='string'||typeof token!=='string'||!isAddressEqual(nft,config.RelicNFT)||!isAddressEqual(token,config.YarnToken)
    ||cost!==FORGE_COST||count!==FORGE_DESIGNS.length)throw new Error('Forge changed. Retry.');
  // Retry after a lost receipt reads the permanent on-chain unlock first.
  if(await runtime.client.readContract({address:config.RelicForge,abi:relicForgeAbi,functionName:'hasDesign',args:[wallet,design]}))return;
  if(!isForgeInput(first)||!isForgeInput(second))throw new Error('Select two Epics.');
  const holdings=await runtime.holdings([...new Set([first,second])]);
  if((holdings.find(h=>h.id===first)?.amount??0n)<(first===second?2n:1n)
    ||(holdings.find(h=>h.id===second)?.amount??0n)<1n)throw new Error('Select two Epics.');
  if(!await runtime.client.readContract({address:config.RelicNFT,abi:relicNftAbi,functionName:'isApprovedForAll',args:[wallet,config.RelicForge]}))
    await runtime.write({address:config.RelicNFT,abi:relicNftAbi,functionName:'setApprovalForAll',args:[config.RelicForge,true]});
  // Exact allowance, never an unlimited token approval. Consumed by burnFrom.
  await runtime.write({address:config.YarnToken,abi:yarnTokenAbi,functionName:'approve',args:[config.RelicForge,FORGE_COST]});
  return runtime.write({address:config.RelicForge,abi:relicForgeAbi,functionName:'forge',args:[design,first,second]});
}
