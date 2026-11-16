import {useMemo,useRef,useState} from 'react';
import type {Address} from 'viem';
import {ECONOMY_V3 as E} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import {useAuthContext} from '../../../wallet/WalletProvider';
import type {ChainConfig,chainRuntime} from '../chain/runtime';
import {workshopClient,type WorkshopStep} from '../chain/journey-workshop';
import {friendlyError} from '../chain/errors';
import {PaintedButton,PaintedIcon,type KitIcon} from './PaintedKit';

const content:Record<WorkshopStep,{title:string;body:string;button:string;icon:KitIcon}>={
 fund:{title:'Prepare your workshop',body:'Each demo wallet claims 20 YARN. Buyer gifts 12.',button:'Fund workshop',icon:'yarn'},
 seal:{title:'Seal an Epic',body:'Burn 13 YARN and one Boss Seal to seal your Epic.',button:'Seal Epic',icon:'seal'},
 fusion:{title:'Guaranteed Legendary',body:'3 Epics + Star Thread. Burn 18 YARN; sealed Epic destroyed.',button:'Forge Legendary',icon:'fuse'},
 list:{title:'Open your market stall',body:'Price: 5 YARN. Fees: 2% burned, 3% treasury.',button:'List for 5 YARN',icon:'list'},
 buy:{title:'Meet your first customer',body:'Demo buyer pays 5 YARN. You receive 4.75 after fees.',button:'Buy with demo wallet',icon:'buy'},
 withdraw:{title:'Claim your Spool',body:`Free Café Deed. Receive 6 YARN; ${E.spool.feeBp/100}% stays in Spool.`,button:'Withdraw Spool',icon:'withdraw'},
 done:{title:'Your café is ready',body:'Your Legendary sold. Face the boss again.',button:'Face the boss',icon:'quest'},
};
export function DemoWorkshop({config,runtime,address,token,onBoss}:{config:ChainConfig;runtime:ReturnType<typeof chainRuntime>;address:Address;token:string;onBoss:()=>Promise<void>}) {
 const {api}=useAuthContext();
 const initialized=useMemo(()=>{try{return {client:workshopClient({config,runtime,address,token,auth:api})};}catch(e){return {error:friendlyError(e)};}},[config,runtime,address,token,api]);
 const client=initialized.client;
 const [step,setStep]=useState<WorkshopStep>(()=>client?.step()??'fund'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),row=content[step];
 const act=async()=>{
  if(!client||lock.current)return;lock.current=true;setBusy(true);setError('');
  try{if(step==='done')await onBoss();else{await client.advance();setStep(client.step());}}
  catch(e){setError(friendlyError(e));}finally{lock.current=false;setBusy(false);}
 };
 return <section className="ship-workshop ship-trial-card" data-workshop-step={step}>
  <h1>{row.title}</h1><PaintedIcon name={row.icon} size={160}/><p>{row.body}</p>
  <PaintedButton icon={row.icon} disabled={busy||!client} onClick={()=>void act()}>{row.button}</PaintedButton>
  {busy&&<p role="status">Confirming on Avalanche…</p>}
  {(error||initialized.error)&&<p role="alert">{error||initialized.error}</p>}
 </section>;
}
