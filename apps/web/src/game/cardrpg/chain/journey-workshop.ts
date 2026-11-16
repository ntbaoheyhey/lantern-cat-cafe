import {decodeFunctionData,encodeFunctionData,getAddress,parseEther,type Address,type Hash,type Hex} from 'viem';
import {relicNftAbi,relicMarketV2Abi,seasonRewardsAbi,yarnTokenAbi} from '@taskbar-hero/chain';
import type {EconomyCommand,EconomyResponse,EconomyVoucher} from '@taskbar-hero/chain/src/economy-v3';
import {ECONOMY_V3 as E} from '@taskbar-hero/game-rules/src/cardrpg/economy-v3';
import type {AuthApi} from '../../../wallet/authApi';
import {createSessionStore} from '../../../wallet/session';
import {chainPost} from './api';
import {chainRuntime,erc20Abi,type ChainConfig} from './runtime';
import {guestClient,guestSignIn} from './guest';

type Runtime=ReturnType<typeof chainRuntime>;
type Request=Parameters<Runtime['write']>[0];
export type WorkshopStep='fund'|'seal'|'fusion'|'list'|'buy'|'withdraw'|'done';
const steps:WorkshopStep[]=['fund','seal','fusion','list','buy','withdraw','done'];
interface Journal {step:WorkshopStep;requests:Record<string,string>;transactions:Record<string,Hash>}
const DEAD='0x000000000000000000000000000000000000dEaD' as Address;

/** A renewed voucher may change expiry/signature, but never who, what or nonce. */
export function sameJourneyCall(request:Request,input:Hex) {
  const decoded=decodeFunctionData({abi:request.abi,data:input});
  if(decoded.functionName!==request.functionName)return false;
  const normalized=(args:readonly unknown[]|undefined)=>{
    if(['mint','claim','claimTester'].includes(request.functionName)&&args?.length===2&&args[0]&&typeof args[0]==='object'&&'expiry' in args[0])return [{...args[0],expiry:0n},'0x'];
    return args;
  };
  return encodeFunctionData({abi:request.abi,functionName:request.functionName,args:normalized(request.args)})===
    encodeFunctionData({abi:request.abi,functionName:request.functionName,args:normalized(decoded.args)});
}

/** The second demo wallet never replaces the player's guest key or session. */
export function scopedStorage(prefix:string,storage:Storage):Storage {
  const keys=()=>Array.from({length:storage.length},(_,i)=>storage.key(i)!).filter(k=>k.startsWith(prefix));
  return {get length(){return keys().length;},key:i=>keys()[i]?.slice(prefix.length)??null,
    getItem:k=>storage.getItem(prefix+k),setItem:(k,v)=>storage.setItem(prefix+k,v),removeItem:k=>storage.removeItem(prefix+k),clear:()=>keys().forEach(k=>storage.removeItem(k))};
}
export function workshopClient({config,runtime,address,token,auth,storage=localStorage}:{config:ChainConfig;runtime:Runtime;address:Address;token:string;auth:AuthApi;storage?:Storage}) {
  if(!config.YarnToken||!config.SeasonRewards||!config.RelicMarketV2)throw Error('Workshop contracts unavailable.');
  const journalKey=`lantern.ship.workshop:${address.toLowerCase()}`;
  let journal:Journal;
  try{const value=JSON.parse(storage.getItem(journalKey)??'null');journal=value&&steps.includes(value.step)&&value.requests&&value.transactions?value:{step:'fund',requests:{},transactions:{}};}catch{throw Error('Workshop recovery data unavailable.');}
  const save=()=>{storage.setItem(journalKey,JSON.stringify(journal));};
  const command=async(slot:string,value:EconomyCommand)=>{
    journal.requests[slot]??=crypto.randomUUID();save();
    return chainPost<EconomyResponse>('chain-economy-v3',token,{id:journal.requests[slot],command:value});
  };
  const send=async(slot:string,r:Runtime,owner:Address,request:Request)=>{
    const prior=journal.transactions[slot];
    if(prior){
      await r.guard();const tx=await r.client.getTransaction({hash:prior});
      if(tx.from.toLowerCase()!==owner.toLowerCase()||tx.to?.toLowerCase()!==request.address.toLowerCase()||!sameJourneyCall(request,tx.input)||tx.value!==(request.value??0n))throw Error('Workshop transaction mismatch.');
      await r.receipt(prior);return prior;
    }
    save();return r.write(request,hash=>{journal.transactions[slot]=hash;save();});
  };
  const buyer=async()=>{
    const walletStorage=scopedStorage(`lantern.ship.buyer:${address.toLowerCase()}:`,storage),store=createSessionStore(walletStorage);
    // SIWE establishes authority for this separately labelled demo wallet.
    if(!store.get())await guestSignIn(auth,store,walletStorage);
    const session=store.get();if(!session)throw Error('Demo buyer sign-in unavailable.');
    const wallet=guestClient(config.rpcUrl,walletStorage),owner=getAddress(session.wallet);
    if(wallet.account.address.toLowerCase()!==owner.toLowerCase())throw Error('Demo buyer wallet changed.');
    return {address:owner,token:session.token,runtime:chainRuntime(config,wallet,owner)};
  };
  const claimTester=async(slot:string,r:Runtime,owner:Address,sessionToken:string)=>{
    const gift=await chainPost<{used:boolean;claim:{player:Address;amount:string;season:string;nonce:string;expiry:string};signature:Hex}>('chain-items',sessionToken,{action:'reward'});
    if(gift.claim.player.toLowerCase()!==owner.toLowerCase()||BigInt(gift.claim.amount)!==parseEther('20'))throw Error('Tester quote changed.');
    if(!gift.used)await send(slot,r,owner,{address:config.SeasonRewards!,abi:seasonRewardsAbi,functionName:'claimTester',args:[{...gift.claim,amount:BigInt(gift.claim.amount),season:BigInt(gift.claim.season),nonce:BigInt(gift.claim.nonce),expiry:BigInt(gift.claim.expiry)},gift.signature]});
  };
  const mint=async(slot:string,v?:EconomyVoucher)=>{
    if(!v||v.player.toLowerCase()!==address.toLowerCase())throw Error('Workshop reward unavailable.');
    if(!v.used)await send(slot,runtime,address,{address:config.RelicNFT,abi:relicNftAbi,functionName:'mint',args:[{player:address,relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)},v.signature as Hex]});
  };
  const finish=async(slot:string,reservation:EconomyResponse)=>{
    const i=reservation.intent;if(!i||!reservation.hash)throw Error('Workshop intent unavailable.');
    const hash=reservation.hash as Hex;
    const paid=await runtime.client.readContract({address:config.YarnToken!,abi:yarnTokenAbi,functionName:'sealPayments',args:[address,hash]});
    if(paid!==0n&&paid!==BigInt(i.cost))throw Error('Workshop payment mismatch.');
    if(paid===0n)await send(`${slot}:payment`,runtime,address,{address:config.YarnToken!,abi:yarnTokenAbi,functionName:'seal',args:[hash,BigInt(i.cost)]});
    const burnTx=i.burnIds.length?await send(`${slot}:inputs`,runtime,address,{address:config.RelicNFT,abi:relicNftAbi,functionName:'safeBatchTransferFrom',args:[address,DEAD,i.burnIds.map(BigInt),i.burnAmounts.map(BigInt),hash]}):undefined;
    const final=await command(`${slot}:finalize`,{action:'finalize',intent:i.id,...(burnTx?{burnTx}:{})});
    await mint(`${slot}:mint`,final.voucher);return final;
  };
  return {
    step:()=>journal.step,
    transactions:()=>({...journal.transactions}),
    async advance(){
      await runtime.guard();
      switch(journal.step){
        case 'fund':{
          await claimTester('seller:tester',runtime,address,token);
          const b=await buyer();
          try{
            await chainPost('chain-judge',b.token,{action:'pass'});
            const gas=await chainPost<{status:string;txHash?:Hash}>('guest-drip',b.token);
            if(!gas.txHash||!['pending','confirmed'].includes(gas.status))throw Error('Demo buyer gas unavailable.');
            await b.runtime.receipt(gas.txHash);await claimTester('buyer:tester',b.runtime,b.address,b.token);
            await send('buyer:workshop-gift',b.runtime,b.address,{address:config.YarnToken!,abi:erc20Abi,functionName:'transfer',args:[address,parseEther('12')]});
            await command('quest',{action:'quest'});
          }finally{b.runtime.silenceSounds();}break;
        }
        case 'seal':await finish('seal',await command('seal',{action:'seal',instance:'quest:weapon'}));break;
        case 'fusion':{
          const sealed=await command('seal',{action:'seal',instance:'quest:weapon'});
          if(!sealed.intent)throw Error('Sealed input unavailable.');
          await finish('fusion',await command('fusion',{action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[sealed.intent.token],sealedStars:0}));break;
        }
        case 'list':{
          const sealed=await command('seal',{action:'seal',instance:'quest:weapon'});
          const fused=await command('fusion',{action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[sealed.intent!.token],sealedStars:0});
          if(!fused.intent)throw Error('Legendary unavailable.');
          await send('seller:approval',runtime,address,{address:config.RelicNFT,abi:relicNftAbi,functionName:'setApprovalForAll',args:[config.RelicMarketV2!,true]});
          await send('seller:list',runtime,address,{address:config.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'list',args:[BigInt(fused.intent.token),1n,parseEther('5'),1]});break;
        }
        case 'buy':{
          const b=await buyer();
          try{
            const sealed=await command('seal',{action:'seal',instance:'quest:weapon'});
            const fused=await command('fusion',{action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[sealed.intent!.token],sealedStars:0});
            const listings=await runtime.listings('v2');
            const listing=listings.find(l=>l.seller.toLowerCase()===address.toLowerCase()&&l.relicId===BigInt(fused.intent!.token)&&l.currency===1&&l.price===parseEther('5'));
            if(!listing&&!journal.transactions['buyer:purchase'])throw Error('Demo listing unavailable.');
            if(listing){
              await send('buyer:approval',b.runtime,b.address,{address:config.YarnToken!,abi:erc20Abi,functionName:'approve',args:[config.RelicMarketV2!,listing.price]});
              await send('buyer:purchase',b.runtime,b.address,{address:config.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'buy',args:[listing.id]});
            }else await b.runtime.receipt(journal.transactions['buyer:purchase']!);
            const owned=await b.runtime.client.readContract({address:config.RelicNFT,abi:relicNftAbi,functionName:'balanceOf',args:[b.address,BigInt(fused.intent!.token)]});
            if(owned<1n)throw Error('Demo buyer ownership unconfirmed.');
            await send('seller:proceeds',runtime,address,{address:config.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'withdraw',args:[1,address]});
          }finally{b.runtime.silenceSounds();}break;
        }
        case 'withdraw':{
          const deed=await command('deed',{action:'deed'});await mint('seller:deed',deed.voucher);
          const gross=BigInt(E.spool.weeklyNetCap)*10n**18n*10000n/BigInt(10000-E.spool.feeBp);
          const result=await command('withdraw',{action:'withdraw',amount:gross.toString(),deed:deed.state.deed!}),w=result.withdrawal;
          if(!w||w.claim.player.toLowerCase()!==address.toLowerCase())throw Error('Spool claim unavailable.');
          if(!w.used)await send('seller:spool',runtime,address,{address:config.SeasonRewards!,abi:seasonRewardsAbi,functionName:'claim',args:[{player:address,amount:BigInt(w.claim.amount),season:BigInt(w.claim.season),nonce:BigInt(w.claim.nonce),expiry:BigInt(w.claim.expiry)},w.signature as Hex]});break;
        }
        case 'done':return;
      }
      journal.step=steps[steps.indexOf(journal.step)+1]!;save();window.dispatchEvent(new Event('chain:changed'));
    },
  };
}
