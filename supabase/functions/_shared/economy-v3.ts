import {keccak256,toBytes,type Address,type Hex} from 'viem';
import {ECONOMY_V3 as E,withdrawalQuote,qualityBucket} from '../../../packages/game-rules/src/cardrpg/economy-v3.ts';
import {GEAR_BY_ID} from '../../../packages/game-rules/src/cardrpg/depth/equipment.ts';
import {gearQualityBp} from '../../../packages/game-rules/src/cardrpg/depth/fusion-v3.ts';
import {equipmentTokenId} from '../../../packages/game-rules/src/cardrpg/trade.ts';
import type {EconomyState,EconomyCommand,EconomyResponse,EconomyIntent,EconomyGear} from '../../../packages/chain/src/economy-v3.ts';
import type {CampaignState} from './chain-campaign.ts';
import {campaignHash} from './chain-campaign.ts';
import {ChainRequestError} from './chain-http.ts';
import {tiedRankAmounts} from '../../../packages/chain/src/rank.ts';
const UNIT=10n**18n,DAY=86400000;
export const ECONOMY_DEAD='0x000000000000000000000000000000000000dEaD' as Address;
export const economyIntentHash=(id:string)=>keccak256(toBytes(`lantern:economy:v3:${id}`));
export const freshEconomy=():EconomyState=>({spool:'0',stars:0,bossSeals:0,level:1,quest:false,deed:null,credits:[],gear:[],intents:[],styles:[],lastWithdraw:0,sealDay:0,sealsToday:0});
export interface EconomySnapshot {state:EconomyState;revision:number;createdAt:string;judge:boolean;campaign:{state:CampaignState;revision:number}|null;wins:{id:number;at:string;chapter:number}[];ranks?:{season:number;player:string;score:number}[]}
export interface EconomySaved {hash:string;state:EconomyState;revision:number}
export interface EconomyStore {
 read(player:string,wallet:string):Promise<EconomySnapshot>;
 receipt(player:string,wallet:string,id:string):Promise<EconomySaved|null>;
 commit(p:{player:string;wallet:string;id:string;hash:string;revision:number;state:EconomyState;deed:boolean;burn:string|null;intent:string|null;source:string|null;campaignRevision:number|null}):Promise<EconomySaved>;
}
export interface EconomyChain {
 nftUsed(nonce:bigint):Promise<boolean>;rewardUsed(nonce:bigint):Promise<boolean>;
 owns(wallet:Address,token:number,amount?:number):Promise<boolean>;
 paid(wallet:Address,hash:Hex):Promise<bigint>;
 burn(wallet:Address,intent:EconomyIntent,tx:Hex):Promise<void>;
 capacity(wallet:Address,net:bigint):Promise<void>;season():Promise<bigint>;
 mint(fields:{player:Address;relicId:bigint;rarity:number;nonce:bigint;expiry:bigint}):Promise<Hex>;
 claim(fields:{player:Address;amount:bigint;season:bigint;nonce:bigint;expiry:bigint}):Promise<Hex>;
 certify(message:string):Promise<Hex>;
}
function fail(message:string):never{throw new EconomyError(message);}
export class EconomyError extends Error {constructor(readonly reason:string){super(reason);}}
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const label=(s:unknown):s is string=>typeof s==='string'&&s.length>0&&s.length<=160;
export function economyRequest(input:unknown):{id:string;command:EconomyCommand}{
 if(!input||typeof input!=='object'||Array.isArray(input))return fail('invalid_request');
 const v=input as Record<string,unknown>;if(typeof v.id!=='string'||!uuid.test(v.id)||!v.command||typeof v.command!=='object'||Array.isArray(v.command)||Object.keys(v).sort().join(',')!=='command,id')return fail('invalid_request');
 const c=v.command as Record<string,unknown>;let keys:string[];
 switch(c.action){
  case 'state':case 'quest':case 'deed':keys=['action'];break;
  case 'withdraw':if(typeof c.amount!=='string'||! /^[1-9][0-9]{0,21}$/.test(c.amount)||!Number.isInteger(c.deed))return fail('invalid_request');keys=['action','amount','deed'];break;
  case 'import':case 'seal':if(!label(c.instance)||c.deed!==undefined&&!Number.isInteger(c.deed))return fail('invalid_request');keys=c.action==='import'?['action','instance']:['action','instance','deed'];break;
  case 'fusion':if(!Array.isArray(c.instances)||c.instances.length>3||!c.instances.every(label)||!Array.isArray(c.tokens)||c.tokens.length>3||!c.tokens.every(n=>Number.isSafeInteger(n)&&n>0)||!Number.isInteger(c.sealedStars)||Number(c.sealedStars)<0||Number(c.sealedStars)>2)return fail('invalid_request');keys=['action','instances','tokens','sealedStars'];break;
  case 'spend':if(c.sku!=='lantern-skin')return fail('invalid_request');keys=['action','sku'];break;
  case 'finalize':case 'voucher':if(typeof c.intent!=='string'||!uuid.test(c.intent)||c.burnTx!==undefined&&(typeof c.burnTx!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(c.burnTx)))return fail('invalid_request');keys=c.action==='voucher'?['action','intent']:['action','intent','burnTx'];break;
  default:return fail('invalid_request');
 }
 if(Object.keys(c).some(k=>!keys.includes(k)))return fail('invalid_request');
 return structuredClone(v) as unknown as {id:string;command:EconomyCommand};
}
export function decodeEconomyGear(token:number):EconomyGear|undefined {
 for(const t of Object.values(GEAR_BY_ID)){const base=equipmentTokenId(t);if(base!==undefined)for(const q of E.quality)if(base+q.offset===token)return {id:`nft:${token}`,template:t.id,quality:q.floorBp};}
}
function accrue(s:EconomyState,snap:EconomySnapshot,player:string){
 const g=snap.campaign?.state.game;
 if(g)s.level=Math.max(s.level,Math.min(...g.team.map(id=>g.account.cards.find(c=>c.cardId===id)!.level)));
 for(const w of snap.wins){const week=Math.floor((Date.parse(w.at)-4*DAY)/(7*DAY)),key=`boss:${week}`;
  if(!s.credits.includes(key)){s.credits.push(key);s.spool=(BigInt(s.spool)+BigInt(Math.round(E.rewards.weeklySpool*100))*UNIT/100n).toString();s.stars+=E.rewards.weeklyStarThread;s.bossSeals++;}
  const milestone=`chapter:${w.chapter}`;if(!s.credits.includes(milestone)){s.credits.push(milestone);s.spool=(BigInt(s.spool)+BigInt(E.rewards.chapterSpool)*UNIT).toString();}
 }
 for(const season of new Set((snap.ranks??[]).map(x=>x.season))){
  const key=`season:${season}`;if(s.credits.includes(key))continue;
  const rows=snap.ranks!.filter(x=>x.season===season).sort((a,b)=>b.score-a.score||a.player.localeCompare(b.player)),index=rows.findIndex(x=>x.player===player);
  if(index<0)continue;const amount=tiedRankAmounts(rows.map(x=>x.score),BigInt(E.rewards.seasonRankMax)*UNIT)[index]!;s.spool=(BigInt(s.spool)+amount).toString();s.credits.push(key);
 }
}
export function createEconomy({enabled=false,demo=false,store,chain,now=()=>Date.now()}:{enabled?:boolean;demo?:boolean;store:EconomyStore;chain:EconomyChain;now?:()=>number}){
 return async(player:string,wallet:Address,input:unknown):Promise<EconomyResponse>=>{
  if(!enabled)throw new ChainRequestError('campaign_disabled');
  if(!uuid.test(player)||!/^0x[0-9a-fA-F]{40}$/.test(wallet))throw new ChainRequestError('unauthenticated');
  const {id,command:c}=economyRequest(input),hash=await campaignHash([player,wallet.toLowerCase(),c]),clock=now();
  let saved=await store.receipt(player,wallet.toLowerCase(),id),intentId='intent' in c?c.intent:id;
  if(saved&&saved.hash!==hash)throw new ChainRequestError('campaign_conflict');
  if(!saved){
   const snap=await store.read(player,wallet.toLowerCase()),s=structuredClone(snap.state);accrue(s,snap,player);
   const ownsDeed=async(token:number)=>token>=E.deed.firstId&&token<=E.deed.lastId&&await chain.owns(wallet,token);
   let deed=false,burn:string|null=null,source:string|null=null;
   const newIntent=(kind:EconomyIntent['kind'],cost:bigint,token:number,rarity:number):EconomyIntent=>({id,kind,cost:cost.toString(),token,rarity,burnIds:[],burnAmounts:[],ready:false,created:clock});
   switch(c.action){
    case 'state':break;
    case 'quest':{
     if(!s.quest){
      if(demo&&snap.judge){s.level=Math.max(s.level,E.deed.demoLevel);s.spool=(BigInt(s.spool)+16n*UNIT).toString();s.stars+=2;s.bossSeals+=2;
       for(const slot of ['weapon','outfit','charm','relic'])s.gear.push({id:`quest:${slot}`,template:`hearthloom-${slot}-epic`,quality:8500});
       s.credits.push('demo-quest');
      }else {
       const level=demo?E.deed.demoLevel:E.deed.level;
       if(!snap.wins.length||s.level<level)fail(`Complete the café quest at level ${level}.`);
      }
      s.quest=true;
     }break;
    }
    case 'deed':if(!s.quest)fail('Complete the on-chain café quest.');deed=s.deed===null;break;
    case 'withdraw':{
     if(!await ownsDeed(c.deed))fail('A held Café Deed is required.');
     if(clock-Date.parse(snap.createdAt)<(demo?0:E.spool.minAgeDays)*DAY)fail('Account age must reach seven days.');
     if(s.lastWithdraw&&clock-s.lastWithdraw<E.spool.cooldownDays*DAY)fail('One withdrawal every seven days.');
     const quote=withdrawalQuote(BigInt(c.amount));if(quote.gross>BigInt(s.spool))fail('Not enough Spool.');
     if(quote.net>BigInt(E.spool.weeklyNetCap)*UNIT)fail('Net weekly cap is 12 YARN.');
     await chain.capacity(wallet,quote.net);
     const i={...newIntent('withdraw',0n,0,0),gross:quote.gross.toString(),net:quote.net.toString(),retained:quote.retained.toString(),ready:true};
     s.spool=(BigInt(s.spool)-quote.gross).toString();s.lastWithdraw=clock;s.intents.push(i);break;
    }
    case 'import':{
     const g=snap.campaign?.state.game,item=g?.gear.find(x=>x.id===c.instance),origin=snap.campaign?.state.origins[c.instance];
     if(!g||!item||!origin||origin.item!==item.templateId||!equipmentTokenId(GEAR_BY_ID[item.templateId]!))fail('Only earned Epic or Legendary gear can transfer.');
     if(g.run&&!g.run.complete||Object.values(g.equipment).some(x=>Object.values(x).includes(c.instance)))fail('Finish the route and unequip first.');
     source=c.instance;s.gear.push({id:`campaign:${c.instance}`,template:item.templateId,quality:gearQualityBp(item)});break;
    }
    case 'seal':{
     if(s.level<(demo?E.seal.demoLevel:E.seal.level))fail('Seal level not reached.');
     const day=Math.floor(clock/DAY);if(s.sealDay!==day){s.sealDay=day;s.sealsToday=0;}
     const extra=c.deed&&await ownsDeed(c.deed)?E.seal.deedExtra:0;
     if(s.sealsToday>=E.seal.perDay+extra)fail('Daily seal limit reached.');if(s.bossSeals<E.seal.bossSeals)fail('One Boss Seal required.');
     let token:number,rarity:number,reference:number;
     if(c.instance==='star-thread'){if(s.stars<1)fail('Star Thread required.');s.stars--;token=10001;rarity=1;reference=E.seal.reference.starThread;}
     else {const item=s.gear.find(x=>x.id===c.instance),t=item&&GEAR_BY_ID[item.template],base=t&&equipmentTokenId(t);
      if(!item||!t||base===undefined)fail('Only earned Epic or Legendary gear can seal.');
      token=base+qualityBucket(item.quality).offset;rarity=t.rarity==='legendary'?3:2;reference=rarity===3?E.seal.reference.legendary:E.seal.reference.epic;s.gear=s.gear.filter(x=>x.id!==c.instance);
     }
     s.bossSeals-=E.seal.bossSeals;s.sealsToday++;s.intents.push(newIntent('seal',BigInt(reference)*UNIT*BigInt(E.seal.feeBp)/10000n,token,rarity));break;
    }
    case 'fusion':{
     if(c.instances.length+c.tokens.length!==3||new Set(c.instances).size!==c.instances.length)fail('Choose three distinct Epic inputs.');
     const items=c.instances.map(x=>s.gear.find(g=>g.id===x)),sealed=c.tokens.map(decodeEconomyGear);
     if(items.some(x=>!x)||sealed.some(x=>!x))fail('Input unavailable.');
     const all=[...items,...sealed] as EconomyGear[],t=GEAR_BY_ID[all[0]!.template]!;
     if(all.some(x=>GEAR_BY_ID[x.template]!.rarity!=='epic'||GEAR_BY_ID[x.template]!.setId!==t.setId))fail('Use three Epics from the same set.');
     const boundStars=2-c.sealedStars;if(s.stars<boundStars)fail('Two Star Thread required.');
     const totals=new Map<number,number>();for(const token of c.tokens)totals.set(token,(totals.get(token)??0)+1);if(c.sealedStars)totals.set(10001,c.sealedStars);
     for(const [token,amount] of totals)if(!await chain.owns(wallet,token,amount))fail('Sealed input balance changed.');
     const quality=E.quality[Math.max(0,Math.max(...all.map(x=>qualityBucket(x.quality).offset/1000))-1)]!;
     const target=GEAR_BY_ID[`${t.setId}-${t.slot}-legendary`]!,i=newIntent('fusion',BigInt(E.fusion.legendary.yarn)*UNIT,equipmentTokenId(target)!+quality.offset,3);
     i.burnIds=[...totals.keys()];i.burnAmounts=[...totals.values()];s.stars-=boundStars;s.gear=s.gear.filter(x=>!c.instances.includes(x.id));s.intents.push(i);break;
    }
    case 'spend':if(s.styles.includes(c.sku))fail('Already owned.');if(BigInt(s.spool)<BigInt(E.spool.skinCost)*UNIT)fail(`${E.spool.skinCost} Spool required.`);s.spool=(BigInt(s.spool)-BigInt(E.spool.skinCost)*UNIT).toString();s.styles.push(c.sku);break;
    case 'finalize':{
     const i=s.intents.find(x=>x.id===c.intent);if(!i||i.kind==='withdraw')fail('Intent unavailable.');
     if(!i.ready){
      if(await chain.paid(wallet,economyIntentHash(i.id))!==BigInt(i.cost))fail('Exact YARN burn payment required.');
      if(i.burnIds.length){if(!c.burnTx)fail('Sealed input burn receipt required.');await chain.burn(wallet,i,c.burnTx as Hex);burn=c.burnTx.toLowerCase();i.burnTx=burn;}
      i.ready=true;
     }break;
    }
    case 'voucher':if(!s.intents.find(i=>i.id===c.intent)?.ready)fail('Finish the reserved action first.');break;
   }
   saved=await store.commit({player,wallet:wallet.toLowerCase(),id,hash,revision:snap.revision,state:s,deed,burn,intent:burn?intentId:null,source,campaignRevision:source?snap.campaign!.revision:null});
  }
  const result:EconomyResponse={state:saved.state,revision:saved.revision},expiry=BigInt(Math.floor(now()/1000)+600);
  const mint=async(token:number,rarity:number,nonce:bigint)=>{const fields={player:wallet,relicId:BigInt(token),rarity,nonce,expiry},used=await chain.nftUsed(nonce);return {...fields,relicId:String(token),nonce:String(nonce),expiry:String(expiry),signature:used?'0x':await chain.mint(fields),used};};
  if(c.action==='deed'&&saved.state.deed)result.voucher=await mint(saved.state.deed,3,BigInt(economyIntentHash(`deed:${player}`)));
  const i=saved.state.intents.find(x=>x.id===intentId);if(i){result.intent=i;result.hash=economyIntentHash(i.id);
   if(i.ready&&i.kind!=='withdraw')result.voucher=await mint(i.token,i.rarity,BigInt(result.hash));
   if(i.kind==='withdraw'){
    const nonce=BigInt(result.hash),used=await chain.rewardUsed(nonce),fields={player:wallet,amount:BigInt(i.net!),season:await chain.season(),nonce,expiry};
    if(!used)await chain.capacity(wallet,fields.amount);
    result.withdrawal={claim:{...fields,amount:String(fields.amount),season:String(fields.season),nonce:String(nonce),expiry:String(expiry)},signature:used?'0x':await chain.claim(fields),used};
   }
  }
  const message=`Lantern Spool v3|43113|${wallet.toLowerCase()}|${saved.revision}|${saved.state.spool}|${Math.floor(now()/1000)}`;
  result.certificate={message,signature:await chain.certify(message)};return result;
 };
}
