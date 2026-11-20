/** Apply the exact public, deterministic quote. Desire and purchase timing are
 * modeled separately; insufficient funds never create debt or a free benefit. */
export function buyStudioRecipe(runtime,account,id,now,spend) {
 const inventory=account.studio;
 const item=inventory.gear.find(g=>g.quality<runtime.ECONOMY_LAB.policy.quality.at(-1).floorBp);
 // Ineligible rows are common after a finite collection is complete. Avoid
 // constructing thrown Error stacks for these already-known public predicates.
 if(id==='polish'&&!item)return null;
 if(id==='display'&&inventory.styles.includes(`display:${runtime.ECONOMY_LAB.sinks.display.maxLevel}`))return null;
 if(id==='decor'&&runtime.v3Season&&inventory.styles.includes(`decor:${runtime.v3Season(now).number}`))return null;
 let quote;try{quote=runtime.economySinkQuote(id,inventory,item?.id,now);}catch{return null;}
 if(account.stars<quote.starThread||!spend(account,quote.yarn,id))return null;
 account.stars-=quote.starThread;
 if(quote.item)inventory.gear.find(g=>g.id===quote.item.id).quality=quote.quality;
 if(quote.style)inventory.styles.push(quote.style);
 return quote;
}
