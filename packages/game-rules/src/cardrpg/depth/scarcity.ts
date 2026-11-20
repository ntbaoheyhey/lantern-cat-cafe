/** Local authority transition. A copied save is not an authenticated global ledger. */
export const EDITIONS = {
 'moon-collar': { name:'Moon Collar', lifetime:2400, season:400, seals:3 },
 'golden-maneki': { name:'Golden Maneki', lifetime:360, season:60, seals:10 },
} as const;
export type EditionId = keyof typeof EDITIONS;
export interface EffortReceipt { id:string; day:number; source:'boss-day'|'legacy-local' }
export interface AuthorityContext { accountId:string; now:number; effort:EffortReceipt[]; chapterOne:boolean; allMasteries:boolean; towerBest:number }
export type IssuanceCommand = { commandId:string; expectedRevision:number; accountId:string } & (
 {kind:'reserve';edition:EditionId} | {kind:'burn';reservationId:string} | {kind:'fuse';reservationIds:[string,string]} | {kind:'advance-season'});
export interface Reservation { id:string; edition:EditionId; accountId:string; season:string; sequence:number; status:'live'|'burned'|'fused'; legacy?:true }
export interface IssuanceGenesis { authorityId:string; season:string; lifetime:Record<EditionId,number>; seasonal:Record<EditionId,number>; reservations:Reservation[] }
export interface IssuanceEvent { version:1; sequence:number; command:IssuanceCommand; context:AuthorityContext; proofIds:string[]; reservationId?:string }
export interface IssuanceLedger {
 version:1; genesis:IssuanceGenesis; revision:number; currentSeason:string; lifetimeIssued:Record<EditionId,number>;
 seasonIssued:Record<string,Record<EditionId,number>>; accountClaims:string[]; lastReservationDay:Record<string,string>;
 consumedProofIds:string[]; reservations:Reservation[]; badges:string[]; events:IssuanceEvent[];
}
const copy=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
function check(v:unknown,message:string):asserts v {if(!v)throw Error(message);}
const safe=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>=0;
const id=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,119}$/.test(v)&&!['constructor','prototype','__proto__'].includes(v);
const month=(v:unknown)=>typeof v==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(v);
function canonical(v:unknown):string {
 if(v===null||typeof v!=='object')return JSON.stringify(v);
 if(Array.isArray(v))return `[${v.map(canonical).join(',')}]`;
 const obj=v as Record<string,unknown>;return `{${Object.keys(obj).sort().map(k=>`${JSON.stringify(k)}:${canonical(obj[k])}`).join(',')}}`;
}
const zero=():Record<EditionId,number>=>({'moon-collar':0,'golden-maneki':0});
const claimKey=(account:string,edition:string,season:string)=>`${account}|${edition}|${season}`;
export function createIssuanceLedger(authorityId:string,now:number,legacy?:Omit<IssuanceGenesis,'authorityId'|'season'>):IssuanceLedger {
 check(id(authorityId)&&Number.isSafeInteger(now)&&now>=0&&now<253402300800000,'Invalid authority/time.');
 const season=new Date(now).toISOString().slice(0,7);
 return fromGenesis({authorityId,season,lifetime:legacy?.lifetime??zero(),seasonal:legacy?.seasonal??zero(),reservations:legacy?.reservations??[]});
}
function fromGenesis(genesis:IssuanceGenesis):IssuanceLedger {
 check(genesis&&id(genesis.authorityId)&&month(genesis.season),'Invalid ledger genesis.');
 check(Array.isArray(genesis.reservations)&&genesis.reservations.length<=2760,'Invalid legacy records.');
 for(const edition of Object.keys(EDITIONS) as EditionId[]){
  const total=genesis.lifetime?.[edition],seasonal=genesis.seasonal?.[edition],spec=EDITIONS[edition];
  check(safe(total)&&safe(seasonal)&&total<=spec.lifetime&&seasonal<=spec.season&&seasonal<=total,'Legacy supply is inconsistent or over cap; new issuance is disabled.');
  check(genesis.reservations.filter(r=>r.edition===edition).length<=total,'Legacy reservations exceed issued supply.');
  check(genesis.reservations.filter(r=>r.edition===edition&&r.season===genesis.season).length<=seasonal,'Legacy season counters are inconsistent.');
 }
 const seen=new Set<string>(),claims=new Set<string>();
 for(const r of genesis.reservations){
  check(r&&id(r.id)&&id(r.accountId)&&Object.hasOwn(EDITIONS,r.edition)&&month(r.season)&&r.season<=genesis.season&&r.legacy===true&&r.status==='live'&&r.sequence===0,'Invalid legacy reservation.');
  const key=claimKey(r.accountId,r.edition,r.season);check(!seen.has(r.id)&&!claims.has(key),'Duplicate legacy reservation.');seen.add(r.id);claims.add(key);
 }
 return {version:1,genesis:copy(genesis),revision:0,currentSeason:genesis.season,lifetimeIssued:copy(genesis.lifetime),seasonIssued:{[genesis.season]:copy(genesis.seasonal)},accountClaims:[...claims],lastReservationDay:{},consumedProofIds:[],reservations:copy(genesis.reservations),badges:[],events:[]};
}
function transition(ledger:IssuanceLedger,command:IssuanceCommand,context:AuthorityContext):IssuanceEvent {
 check(command&&id(command.commandId)&&id(command.accountId)&&safe(command.expectedRevision),'Invalid command.');
 check(command.expectedRevision===ledger.revision,'Stale revision; reread local supply.');
 check(!ledger.events.some(e=>e.command.commandId===command.commandId),'Command ID was already used.');
 check(context&&context.accountId===command.accountId&&Number.isSafeInteger(context.now)&&context.now>=0&&context.now<253402300800000,'Invalid authority context.');
 check(typeof context.chapterOne==='boolean'&&typeof context.allMasteries==='boolean'&&safe(context.towerBest),'Invalid qualification.');
 const date=new Date(context.now).toISOString().slice(0,10),season=date.slice(0,7);
 check(season>=ledger.currentSeason,'Authority season cannot move backward.');
 check(!ledger.events.length||context.now>=ledger.events.at(-1)!.context.now,'Authority clock cannot move backward.');
 check(Array.isArray(context.effort)&&context.effort.length<=10000,'Invalid effort receipts.');
 const proofs=new Set<string>(),days=new Set<number>();
 for(const p of context.effort){check(p&&id(p.id)&&safe(p.day)&&['boss-day','legacy-local'].includes(p.source)&&!proofs.has(p.id)&&!days.has(p.day),'Duplicate or invalid effort receipt.');proofs.add(p.id);days.add(p.day);}
 const event:IssuanceEvent={version:1,sequence:ledger.revision+1,command:copy(command),context:{...copy(context),effort:[]},proofIds:[]};
 if(command.kind==='advance-season'){
  check(season>ledger.currentSeason,'A later UTC month is required.');ledger.currentSeason=season;ledger.seasonIssued[season]??=zero();
 }else{
  check(season===ledger.currentSeason,'Advance the local season before issuance.');
  if(command.kind==='reserve'){
   check(Object.hasOwn(EDITIONS,command.edition),'Unknown edition.');const spec=EDITIONS[command.edition];
   const key=claimKey(command.accountId,command.edition,season);
   check(ledger.lifetimeIssued[command.edition]<spec.lifetime&&ledger.seasonIssued[season]![command.edition]<spec.season,'Edition supply cap reached.');
   check(!ledger.accountClaims.includes(key),'One reservation per account, edition and season.');
   check(ledger.lastReservationDay[command.accountId]!==date,'Only one reservation per account per UTC day.');
   check(command.edition==='moon-collar'?context.chapterOne:context.allMasteries||context.towerBest>=5,'Complete the required chapter/mastery milestone.');
   const eligible=context.effort.filter(p=>!ledger.consumedProofIds.includes(p.id));check(eligible.length>=spec.seals,'More unspent boss-day seals are required.');
   event.context.effort=copy(eligible.slice(0,spec.seals));event.proofIds=event.context.effort.map(p=>p.id);
   ledger.consumedProofIds.push(...event.proofIds);ledger.lifetimeIssued[command.edition]++;ledger.seasonIssued[season]![command.edition]++;
   event.reservationId=`${command.edition}:${ledger.lifetimeIssued[command.edition]}`;
   check(!ledger.reservations.some(r=>r.id===event.reservationId),'Reservation serial collision.');
   ledger.reservations.push({id:event.reservationId,edition:command.edition,accountId:command.accountId,season,sequence:event.sequence,status:'live'});
   ledger.accountClaims.push(key);ledger.lastReservationDay[command.accountId]=date;
  }else if(command.kind==='burn'){
   check(id(command.reservationId),'Invalid reservation.');const r=ledger.reservations.find(r=>r.id===command.reservationId);
   check(r&&r.accountId===command.accountId&&r.status==='live','Choose your live reservation.');r.status='burned';event.reservationId=r.id;
  }else if(command.kind==='fuse'){
   check(Array.isArray(command.reservationIds)&&command.reservationIds.length===2&&command.reservationIds[0]!==command.reservationIds[1],'Choose two different reservations.');
   const records=command.reservationIds.map(id=>ledger.reservations.find(r=>r.id===id));
   check(records.every(r=>r&&r.accountId===command.accountId&&r.status==='live'&&r.edition==='moon-collar'),'Fusion needs two owned live Moon Collars.');
   check(records[0]!.season!==records[1]!.season&&!ledger.badges.includes(command.accountId),'Use different seasons; only one fusion badge per account.');
   records.forEach(r=>{r!.status='fused';});ledger.badges.push(command.accountId);
  }else throw Error('Unknown issuance command.');
 }
 ledger.revision++;ledger.events.push(event);check(ledger.events.length<=10000,'Local ledger event limit reached.');return event;
}
export function replayIssuance(genesis:IssuanceGenesis,events:IssuanceEvent[]):IssuanceLedger {
 check(Array.isArray(events)&&events.length<=10000,'Invalid event history.');const ledger=fromGenesis(genesis);
 for(const e of events){check(e&&e.version===1&&e.sequence===ledger.revision+1,'Invalid event order.');const actual=transition(ledger,e.command,e.context);check(canonical(actual)===canonical(e),'Event payload or proof use is inconsistent.');}
 return ledger;
}
export function validateIssuance(ledger:IssuanceLedger):void {
 check(ledger?.version===1,'Unsupported ledger version.');
 const replay=replayIssuance(ledger.genesis,ledger.events);check(canonical(replay)===canonical(ledger),'Ledger snapshot does not match its event history.');
}
export function applyIssuance(ledger:IssuanceLedger,command:IssuanceCommand,context:AuthorityContext):
 {ok:true;ledger:IssuanceLedger;receipt:IssuanceEvent;replayed:boolean}|{ok:false;ledger:IssuanceLedger;error:string} {
 try{
  check(context?.accountId===command?.accountId,'Authority account differs from command.');
  validateIssuance(ledger);
  const old=ledger.events.find(e=>e.command.commandId===command.commandId);
  if(old){check(canonical(old.command)===canonical(command),'Command ID reused with a changed payload.');return {ok:true,ledger,receipt:copy(old),replayed:true};}
  const next=copy(ledger),receipt=transition(next,command,context);return {ok:true,ledger:next,receipt,replayed:false};
 }catch(error){return {ok:false,ledger,error:error instanceof Error?error.message:'Invalid local issuance.'};}
}
