import type {Actor,Battle,Choice} from '../contract';
import {ENEMY_BY_ID} from '../catalog';
const count=(a:Actor,id:string)=>a.statuses.find(s=>s.id===id)?.stacks??0;
/** Expected near-term status value, summed for every target by the existing evaluator. */
export function actorValueV5(b:Battle,a:Actor):number {
  if(a.hp<=0)return a.side==='party'?-300:-35;
  const foes=b.actors.filter(x=>x.side!==a.side&&x.hp>0),allies=b.actors.filter(x=>x.side===a.side&&x.hp>0);
  const threat=foes.reduce((n,x)=>n+x.attack,0)*80/(80+a.defense);
  const hp=a.hp+(a.hp/a.maxHp<.3?-65:0),shield=Math.min(a.shield,a.maxHp*.35)*.45;
  const bitter=count(a,'bitter')>0,regen=18*count(a,'steep')*(bitter?.5:1);
  const buffs=Math.min(a.maxHp-a.hp+threat*.4,regen*2)+count(a,'cozy')*threat*.08+count(a,'decoy')*25+count(a,'sprout')*30+count(a,'glaze')*9+count(a,'riposte')*(a.row==='front'?14:5);
  const healer=allies.some(x=>['clover','sorrel','cinnamon','marigold','teacup-healer'].includes(x.catalogId));
  const intent=b.intents.find(i=>i.actorId===a.id),boss=ENEMY_BY_ID[a.catalogId]?.tier==='boss';
  const debuffs=count(a,'scald')*24+Math.max(0,count(a,'snag')*16-a.shield*.3)+count(a,'crumb')*18
    +count(a,'scent')*threat*.2+count(a,'brittle')*(threat*.04+Math.min(15,a.shield))
    +(bitter?(healer?32:8):0)+(count(a,'drowsy')?(!boss||intent?.signature?a.attack*.55:0):0);
  return hp+shield+buffs-debuffs;
}
export function actionBonusV5(before:Battle,after:Battle,choice:Choice):number {
  let score=after.log.filter(e=>e.kind==='reaction').length*12;
  for(const old of before.actors){
    const next=after.actors.find(a=>a.id===old.id);if(!next)continue;
    if(old.side==='party')score+=Math.max(0,old.statuses.filter(s=>['scald','snag','bitter','drowsy'].includes(s.id)).length-next.statuses.filter(s=>['scald','snag','bitter','drowsy'].includes(s.id)).length)*6;
    else if(before.intents.some(i=>i.actorId===old.id&&i.signature)&&!count(old,'drowsy')&&count(next,'drowsy'))score+=15;
  }
  // A small tie-break rewards a first available ultimate without forcing an illegal or useless revival.
  const actor=before.actors.find(a=>a.id===choice.actorId);
  if(choice.skillId.endsWith('-4')&&actor&&!before.choices.some(c=>c.actorId===actor.id&&c.skillId===choice.skillId))score+=8;
  return score;
}
