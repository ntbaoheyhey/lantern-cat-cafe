/** Cosmetic hit pieces retain exactly the resolved integer total. Rules events stay untouched. */
export function numberPieces(amount:number,count:number):number[]{
 const total=Math.max(0,Math.round(amount)),n=Math.min(Math.max(1,Math.floor(count)),Math.max(1,total));
 return Array.from({length:n},(_,i)=>Math.floor(total/n)+(i<total%n?1:0));
}
