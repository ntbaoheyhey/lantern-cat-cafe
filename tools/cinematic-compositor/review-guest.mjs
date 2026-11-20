/** Stable returning-guest setup for isolated visual reviews after shell integration. */
export async function returningGuest(page){
  await page.addInitScript(()=>{
    localStorage.setItem('lantern.entered.v3','1');
    localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));
  });
}
