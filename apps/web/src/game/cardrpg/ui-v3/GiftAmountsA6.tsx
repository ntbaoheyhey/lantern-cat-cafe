import type {Cost} from '@taskbar-hero/game-rules/cardrpg';

export const REDUCED_GIFT_NOTE_A6='Collecting today uses the whole gift. Wait for a new day for the full amount.';
export function giftReducedA6(requested:Cost,reward:Cost) {
 return Object.entries(requested).some(([id,n])=>(reward[id as keyof Cost]??0)<n);
}
export function GiftAmountsA6({requested,reward}:{requested:Cost;reward:Cost}) {
 const entries=Object.entries(requested).filter(([,n])=>n>0),reduced=giftReducedA6(requested,reward);
 return <div className="a6-gift-amounts">
  <p><b>Full gift:</b> {entries.map(([id,n])=><span key={id}>{n} {id}</span>)}</p>
  {reduced&&<p className="a6-gift-today"><b>Today:</b> {entries.map(([id])=><span key={id}>{reward[id as keyof Cost]??0} {id}</span>)}</p>}
 </div>;
}
