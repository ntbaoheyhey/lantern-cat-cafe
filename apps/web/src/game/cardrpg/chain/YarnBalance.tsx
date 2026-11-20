import {useEffect,useState} from 'react';
import {formatEther,type Address} from 'viem';
import {yarnTokenAbi} from '@taskbar-hero/chain';
import {useSession} from '../../../wallet/WalletProvider';
import {loadChainConfig,publicChain} from './runtime';
import {requireFuji} from './guest';
export function YarnBalance(){
  const session=useSession(),[balance,setBalance]=useState<string>();
  useEffect(()=>{if(!session)return;let active=true;
    const update=async()=>{try{const c=await loadChainConfig();if(!c.YarnToken)return;const client=publicChain(c);requireFuji(await client.getChainId());const value=await client.readContract({address:c.YarnToken,abi:yarnTokenAbi,functionName:'balanceOf',args:[session.wallet as Address]});if(active)setBalance(formatEther(value));}catch{if(active)setBalance(undefined);}};
    void update();const timer=setInterval(()=>void update(),5000);const changed=()=>void update();window.addEventListener('chain:changed',changed);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('chain:changed',changed);};
  },[session]);
  return balance===undefined?null:<output aria-label="YARN balance">{balance}</output>;
}
