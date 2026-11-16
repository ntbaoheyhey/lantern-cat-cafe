/** Observe shipped loading/error UI and its visible canvas; never read debug objects. */
export async function waitForBattleReady(page,timeout=30000){
 await page.waitForFunction(()=>{
  const battle=document.querySelector('.dp-battle'),canvas=battle?.querySelector('canvas');
  if(!battle?.checkVisibility()||!canvas?.checkVisibility()||battle.querySelector('.dp-loading'))return false;
  const box=canvas.getBoundingClientRect();return box.width>0&&box.height>0;
 },null,{timeout});
}
