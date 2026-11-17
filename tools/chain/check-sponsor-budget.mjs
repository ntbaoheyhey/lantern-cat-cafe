// Read-only operator preflight. No RPC, private keys, signing, or fund reservation.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const AVAX=10n**18n,GRANT=AVAX/20n,GAS=21000n,MAX_GAS_PRICE=200_000_000_000n;
function amount(value,name){
 if(typeof value!=='string'||!/^\d+$/.test(value))throw Error(`${name} must be a nonnegative integer string`);
 return BigInt(value);
}
function count(value,name,min,max){
 if(!Number.isSafeInteger(value)||value<min||value>max)throw Error(`${name} must be an integer between ${min} and ${max}`);
 return value;
}
export function sponsorBudget({balanceWei,pendingWei,gasPriceWei,runs=1,fundedWallets=0}){
 const balance=amount(balanceWei,'balanceWei'),pending=amount(pendingWei,'pendingWei'),gas=amount(gasPriceWei,'gasPriceWei');
 count(runs,'runs',1,25);count(fundedWallets,'fundedWallets',0,2*runs);
 if(gas===0n||gas>MAX_GAS_PRICE)throw Error('Current gas price is outside the existing server admission range');
 const newWallets=2*runs-fundedWallets,headroom=AVAX/10n;
 const currentPriceMinimum=AVAX+pending+BigInt(newWallets)*(GRANT+GAS*gas);
 const minimum=AVAX+pending+BigInt(newWallets)*(GRANT+GAS*MAX_GAS_PRICE)+headroom;
 return {runs,fundedWallets,newWallets,balanceWei:balance.toString(),pendingWei:pending.toString(),
  currentGasPriceWei:gas.toString(),budgetGasPriceWei:MAX_GAS_PRICE.toString(),reserveWei:AVAX.toString(),
  headroomWei:headroom.toString(),currentPriceMinimumWei:currentPriceMinimum.toString(),minimumWei:minimum.toString(),
  shortfallWei:(balance>=minimum?0n:minimum-balance).toString(),budgetPass:balance>=minimum,
  limits:'Read-only batch budget; no funds reserved. Recheck before the batch. Daily50 and per-IP3/24h quotas still apply; server admission is atomic per wallet.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const args=Object.fromEntries(process.argv.slice(2).map(value=>{const match=/^--([a-z-]+)=(.*)$/.exec(value);if(!match)throw Error('Use --name=value arguments');return [match[1],match[2]];}));
  const allowed=new Set(['balance-wei','pending-wei','gas-price-wei','runs','funded-wallets']);
  if(Object.keys(args).some(key=>!allowed.has(key)))throw Error('Unknown sponsor-budget argument');
  const result=sponsorBudget({balanceWei:args['balance-wei'],pendingWei:args['pending-wei'],gasPriceWei:args['gas-price-wei'],runs:args.runs===undefined?1:Number(args.runs),fundedWallets:args['funded-wallets']===undefined?0:Number(args['funded-wallets'])});
  console.log(JSON.stringify(result,null,2));process.exitCode=result.budgetPass?0:1;
 }catch(error){console.error(error.message);process.exitCode=2;}
}
