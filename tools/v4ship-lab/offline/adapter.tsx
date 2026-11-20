/** Build-only mock services. Never imported by the shipping application. LEARN/S10.md. */
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {WagmiProvider,createConfig} from 'wagmi';
import {custom,type Hash} from 'viem';
import {avalancheFuji} from 'viem/chains';
import {judgeTrial} from '../../../supabase/functions/_shared/chain-judge';

const STORAGE='lantern.v4.offline.mock.v1';
export const MOCK_WALLET='0x0000000000000000000000000000000000000001';
const steps=['fund','seal','fusion','list','buy','withdraw','done'] as const;
type Step=typeof steps[number];
type Row={id:string;action:string};
type Ledger={step:Step;rows:Row[]};
const unavailable=()=>{throw Error('Offline review: no wallet, RPC, or chain service.');};
function load():Ledger {
  const text=localStorage.getItem(STORAGE);
  if(!text)return {step:'fund',rows:[]};
  const value=JSON.parse(text);
  if(!steps.includes(value.step)||!Array.isArray(value.rows)||value.rows.length>20||value.rows.some((r:Row)=>!/^mock-\d{2}$/.test(r.id)||typeof r.action!=='string'))throw Error('Offline review data invalid. Reset this preview.');
  return value;
}
function save(value:Ledger){localStorage.setItem(STORAGE,JSON.stringify(value));}
function record(action:string){
  const state=load();let row=state.rows.find(r=>r.action===action);
  if(!row){row={id:`mock-${String(state.rows.length+1).padStart(2,'0')}`,action};state.rows.push(row);save(state);}
  window.dispatchEvent(new CustomEvent('offline:receipt',{detail:row}));
  // The shipping view stores this nominal type; IDs remain visibly mock, never valid chain hashes.
  return row.id as Hash;
}
const session={token:'offline-review-no-authority',wallet:MOCK_WALLET,playerId:'offline-review',expiresAt:Number.MAX_SAFE_INTEGER};
const auth={getNonce:async()=>unavailable(),verify:async()=>unavailable()};
const store={get:()=>session,set:unavailable,clear:unavailable,subscribe:()=>()=>{}};
const WalletContext=createContext({api:auth,store});
export function WalletProvider({children}:{children:ReactNode}){
  const [config]=useState(()=>createConfig({chains:[avalancheFuji],connectors:[],multiInjectedProviderDiscovery:false,
    transports:{[43113]:custom({request:async()=>unavailable()},{retryCount:0})}}));
  const [query]=useState(()=>new QueryClient());
  return <WagmiProvider config={config} reconnectOnMount={false}><QueryClientProvider client={query}><WalletContext.Provider value={{api:auth,store}}>{children}</WalletContext.Provider></QueryClientProvider></WagmiProvider>;
}
export const useSession=()=>session;
export const useAuthContext=()=>useContext(WalletContext);
export const GUEST_KEY='offline-no-key';
export const TESTNET_NOTICE='Offline mock chain · no real transactions';
export const existingGuestAddress=()=>MOCK_WALLET;
export const guestClient=()=>({account:{address:MOCK_WALLET}});
export const guestAccount=guestClient;
export const guestSignIn=async()=>MOCK_WALLET;
export const copyGuestKey=unavailable;
export const requireFuji=()=>{};
export const loadChainConfig=async()=>({chainId:43113,rpcUrl:'https://offline.invalid',RelicNFT:MOCK_WALLET,RelicMarket:MOCK_WALLET,fixtureId:'offline-mock'});
export const chainRuntime=()=>({silenceSounds:()=>{},guard:async()=>{},write:unavailable,receipt:unavailable,client:{},holdings:unavailable});
export const publicChain=unavailable;
export const readHoldings=unavailable;
export const requireWallet=unavailable;
export const erc20Abi=[];
export const txLink=()=> '#offline-ledger';
export function journeyClient(){return {
  // Exactly the server's current deterministic trial setup, including the same boss for both rounds.
  trial:async()=>({vouchers:[],battle:judgeTrial(true)}),
  mintFirstReward:async()=>record('Trial reward preview'),
};}
export function workshopClient(){return {
  step:()=>load().step,
  transactions:()=>({}),
  async advance(){
    const value=load();if(value.step==='done')return;
    const labels:Record<Exclude<Step,'done'>,string>={fund:'Workshop funding preview',seal:'Epic seal preview',fusion:'Legendary forge preview',list:'Market listing preview',buy:'Purchase preview',withdraw:'Spool withdrawal preview'};
    record(labels[value.step]);const updated=load();updated.step=steps[steps.indexOf(value.step)+1]!;save(updated);
  },
};}
export const sameJourneyCall=unavailable;
export const scopedStorage=unavailable;
export function ReceiptToast(){
  const [row,setRow]=useState<Row>();
  useEffect(()=>{const listener=(e:Event)=>setRow((e as CustomEvent<Row>).detail);window.addEventListener('offline:receipt',listener);return()=>window.removeEventListener('offline:receipt',listener);},[]);
  return row?<aside className="offline-receipt" role="status"><strong>Mock receipt</strong><span>{row.action}</span><small>No fee, confirmation time or chain transaction.</small><button onClick={()=>setRow(undefined)}>Dismiss mock receipt</button></aside>:null;
}
export function WalletProof(){const value=load();return <section className="ship-wallet-proof ship-trial-card" id="offline-ledger" data-wallet-proof-complete="true">
  <h1>Offline café ledger</h1><p>Mock records only. No transactions or live balances.</p>
  <ol>{value.rows.map(row=><li key={row.id} data-mock-record={row.id}>{row.action} · {row.id}</li>)}</ol>
  <button onClick={()=>{for(const key of [STORAGE,'lantern.v4.offline.entered',`lantern.v4.offline.journey:${MOCK_WALLET}`])localStorage.removeItem(key);location.reload();}}>Restart offline journey</button>
  </section>;}
export function LiveCounters(){return <div className="b-live" aria-label="Offline mock counters">{['Deeds','YARN burned','Fused','Transactions'].map(label=><div key={label} className="b-live-counter"><strong>Mock</strong><small>{label}</small></div>)}</div>;}
export const readCounters=async()=>({});
export const clearCounterCache=()=>{};
export const COUNTER_POLICY={};
export const EconomyVitals=()=> <p>Offline preview: live economy metrics unavailable.</p>;
export const SeasonEdition=()=> <p>Offline preview: edition supply unavailable.</p>;
export function OfflineWallet(){
  const dialog=useRef<HTMLDialogElement>(null),[open,setOpen]=useState(false);
  useEffect(()=>{const show=()=>setOpen(true);window.addEventListener('chain:wallet',show);return()=>window.removeEventListener('chain:wallet',show);},[]);
  useEffect(()=>{if(open)dialog.current?.showModal();},[open]);
  return open?<dialog ref={dialog} className="offline-wallet" aria-label="Offline wallet" onClose={()=>setOpen(false)}>
    <h2>Offline wallet preview</h2><p>No wallet is connected. No private key is created. Rewards and records are illustrative.</p>
    <p>{load().rows.length} mock records in this review.</p><button autoFocus onClick={()=>dialog.current?.close()}>Close offline wallet</button>
  </dialog>:null;
}
