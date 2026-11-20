import {useEffect,useMemo,useRef,useState} from 'react';
import {useAccount,useWalletClient} from 'wagmi';
import type {Address} from 'viem';
import {useSession} from '../../../wallet/WalletProvider';
import {chainFlags} from './flags';
import {existingGuestAddress,guestClient} from './guest';
import {chainRuntime,loadChainConfig,type ChainConfig} from './runtime';
import {journeyClient} from './journey-client';
import {ReceiptToast} from './ReceiptToast';
import {FujiCollection} from './FujiCollection';
import {friendlyError} from './errors';

function FixturePreview({reason}:{reason:string}) {
  const [preview,setPreview]=useState(0);
  return <section className="judge-reward"><p>{reason}</p><button onClick={()=>setPreview(n=>n+1)}>Preview receipt fixture</button>{preview>0&&<ReceiptToast key={preview} fixture/>}</section>;
}
function ConnectedReward() {
  const session=useSession(),{data:externalWallet}=useWalletClient();
  const [config,setConfig]=useState<ChainConfig>(),[busy,setBusy]=useState(false),[error,setError]=useState(''),[minted,setMinted]=useState(false);
  const lock=useRef(false),mounted=useRef(true),address=session?.wallet as Address|undefined;
  useEffect(()=>{mounted.current=true;void loadChainConfig().then(c=>{if(mounted.current)setConfig(c);}).catch(()=>{if(mounted.current)setError('Fuji configuration unavailable.');});return()=>{mounted.current=false;};},[]);
  const runtime=useMemo(()=>{
    if(!config||!address)return;
    const wallet=existingGuestAddress()?.toLowerCase()===address.toLowerCase()?guestClient(config.rpcUrl):externalWallet;
    if(wallet?.account?.address.toLowerCase()!==address.toLowerCase())return;
    return chainRuntime(config,wallet,address);
  },[config,address,externalWallet]);
  useEffect(()=>()=>runtime?.silenceSounds(),[runtime]);
  async function mint() {
    if(lock.current||!session||!runtime||!config||!address)return;
    lock.current=true;setBusy(true);setError('');
    try {
      await journeyClient(config,runtime,session.token,address).mintBossReward();
      if(mounted.current){setMinted(true);window.dispatchEvent(new Event('chain:changed'));}
    }catch(e){if(mounted.current)setError(friendlyError(e));}
    finally{lock.current=false;if(mounted.current)setBusy(false);}
  }
  return <section className="judge-reward"><ReceiptToast/>
    {session?<><p>{minted?'Your reward is in your Fuji Collection.':'Keep a café memory on Avalanche Fuji. The café supplies test gas.'}</p><button disabled={busy||!runtime||minted} onClick={()=>void mint()}>{busy?'Minting on Fuji…':minted?'Relic claimed':'Mint my Relic on Fuji'}</button></>:<><p>Sign in to claim your boss Relic on Avalanche Fuji.</p><button onClick={()=>window.dispatchEvent(new Event('chain:wallet'))}>Open Fuji wallet</button></>}
    {error&&<><p role="alert">{error}</p><FixturePreview reason="Live mint unavailable. This preview is a fixture, not a transaction."/></>}
  </section>;
}
export function JudgeRewardV9() {
  return chainFlags().chainLoop&&import.meta.env.VITE_SUPABASE_URL?<ConnectedReward/>:<FixturePreview reason="Receipt fixture — this build has no connected mint backend. No transaction has been submitted."/>;
}
function ConnectedCollection() {
  const session=useSession(),account=useAccount();
  const address=session?.wallet??account.address??existingGuestAddress()??'';
  return <FujiCollection key={address} initialAddress={address}/>;
}
export function JudgeRelicCollection() {
  return chainFlags().chainLoop?<ConnectedCollection/>:<FujiCollection/>;
}
