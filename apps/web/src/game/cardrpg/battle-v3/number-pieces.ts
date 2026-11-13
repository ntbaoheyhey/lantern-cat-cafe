/** Support casts can resolve damage outside their primary friendly target list. */
export function numberRecipients(plan:{targetIds:readonly string[];events:readonly {type:string;targetIds:readonly string[]}[]}):string[]{
 return [...new Set([...plan.targetIds,...plan.events.filter(e=>['damage','heal','shield','fizzle'].includes(e.type)).flatMap(e=>e.targetIds)])];
}
/** Cosmetic hit pieces retain exactly the resolved integer total. Rules events stay untouched. */
export function numberPieces(amount:number,count:number):number[]{
 const total=Math.max(0,Math.round(amount)),n=Math.min(Math.max(1,Math.floor(count)),Math.max(1,total));
 return Array.from({length:n},(_,i)=>Math.floor(total/n)+(i<total%n?1:0));
}
