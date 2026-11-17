import assert from 'node:assert/strict';
import test from 'node:test';
import {sponsorBudget} from './check-sponsor-budget.mjs';
const base={balanceWei:'1075000000000000000',pendingWei:'0',gasPriceWei:'25000000000'};
test('rejects the reproduced one-wallet gap and accepts only the complete journey boundary',()=>{
 const fault=sponsorBudget(base);assert.equal(fault.newWallets,2);assert.equal(fault.budgetPass,false);
 assert.equal(fault.currentPriceMinimumWei,'1101050000000000000');assert.equal(fault.minimumWei,'1208400000000000000');
 assert.equal(sponsorBudget({...base,balanceWei:'1208399999999999999'}).budgetPass,false);
 assert.equal(sponsorBudget({...base,balanceWei:fault.minimumWei}).budgetPass,true);
});
test('counts all fresh batch wallets and pending obligations without charging funded wallets twice',()=>{
 const batch=sponsorBudget({...base,runs:3,pendingWei:'101050000000000000'});
 assert.equal(batch.newWallets,6);assert.equal(batch.minimumWei,'1526250000000000000');
 const funded=sponsorBudget({...base,runs:3,fundedWallets:2,pendingWei:base.pendingWei});
 assert.equal(funded.newWallets,4);assert.equal(funded.minimumWei,'1316800000000000000');
 assert.equal(sponsorBudget({...base,runs:3,gasPriceWei:'200000000000'}).minimumWei,'1425200000000000000');
});
test('rejects missing, rounded, negative or impossible operator inputs',()=>{
 for(const change of [{pendingWei:undefined},{pendingWei:'-1'},{balanceWei:1.2e18},{gasPriceWei:'0'},{gasPriceWei:'200000000001'},{runs:0},{runs:1.5},{runs:26},{fundedWallets:3}])assert.throws(()=>sponsorBudget({...base,...change}));
});
