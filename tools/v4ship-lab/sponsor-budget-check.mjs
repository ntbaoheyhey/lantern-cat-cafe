/** QA-8: compare the operator budget with the real reservation SQL on disposable databases. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sponsorBudget} from '../chain/check-sponsor-budget.mjs';
const root=resolve(import.meta.dirname,'../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/sponsor-budget-check-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const require=createRequire(resolve(root,'supabase/tests/package.json')),{PGlite}=require('@electric-sql/pglite');
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={at:new Date().toISOString(),harnessSha256:sha(readFileSync(import.meta.filename)),policySha256:sha(readFileSync(resolve(root,'supabase/migrations/20261112010000_guest_drip.sql'))),calculatorSha256:sha(readFileSync(resolve(root,'tools/chain/check-sponsor-budget.mjs'))),rows:[],complete:false,scope:'Real migrated SQL in disposable PGlite only. No public transfer, global journey reservation or quota bypass claim.'};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const wallet=n=>'0x'+n.toString(16).padStart(40,'0');
async function database(){const db=new PGlite();await db.exec(readFileSync(resolve(root,'supabase/tests/sql/bootstrap.sql'),'utf8'));for(const name of readdirSync(resolve(root,'supabase/migrations')).filter(name=>name.endsWith('.sql')).sort())await db.exec(readFileSync(resolve(root,'supabase/migrations',name),'utf8'));return db;}
async function reserve(db,n,balance,gas,ipGroup=n){
 const player=(await db.query('select upsert_player_by_wallet($1) id',[wallet(n)])).rows[0].id;
 return (await db.query('select chain_drip_reserve($1,$2,$3,$4,0,$5,$6) r',[player,wallet(n),ipGroup.toString(16).padStart(64,'0'),wallet(9999),gas.toString(),balance.toString()])).rows[0].r;
}
async function pending(db){return BigInt((await db.query("select coalesce(sum(50000000000000000+21000*gas_price),0)::text n from chain_guest_drips where status in ('reserved','pending')")).rows[0].n);}
try{
 let db=await database();
 try{
  const oldBalance=1_075_000_000_000_000_000n,gas=25_000_000_000n;
  await reserve(db,1,oldBalance,gas,1);
  await assert.rejects(()=>reserve(db,2,oldBalance,gas,1),/sponsor_low/);
  const plan=sponsorBudget({balanceWei:String(oldBalance),pendingWei:'0',gasPriceWei:String(gas)});assert(!plan.budgetPass);
  report.rows.push({case:'reported-low-balance',firstWalletAccepted:true,secondWalletRejected:true,newPreflightRejects:true,pendingWei:String(await pending(db))});save();
 }finally{await db.close();}
 for(const existing of [0,2]){
  db=await database();
  try{
   for(let n=1;n<=existing;n++)await reserve(db,100+n,10n**20n,25_000_000_000n,100+n);
   const before=await pending(db),runs=existing?3:1;
   const quoted=sponsorBudget({balanceWei:'0',pendingWei:String(before),gasPriceWei:'25000000000',runs});
   const balance=BigInt(quoted.minimumWei);assert(sponsorBudget({...quoted,balanceWei:String(balance),gasPriceWei:'25000000000'}).budgetPass);
   const nonces=[];for(let n=1;n<=quoted.newWallets;n++)nonces.push((await reserve(db,n,balance,200_000_000_000n,Math.ceil(n/2))).nonce);
   const outstanding=await pending(db),remaining=balance-outstanding;
   assert(remaining>=1_100_000_000_000_000_000n);assert.equal(new Set(nonces).size,quoted.newWallets);
   report.rows.push({case:existing?'batch-with-pending':'full-two-wallet-journey',runs,existingPending:existing,newWallets:quoted.newWallets,allAdmitted:true,uniqueNonces:true,balanceWei:String(balance),pendingBeforeWei:String(before),pendingAfterWei:String(outstanding),remainingAfterObligationsWei:String(remaining),quotaScope:'At most2new recipients per synthetic local IP; public quotas unchanged.'});save();
  }finally{await db.close();}
 }
 report.complete=true;
}catch(error){report.failure=error.message;throw error;}finally{save();}
console.log(JSON.stringify({output,complete:report.complete,rows:report.rows}));
