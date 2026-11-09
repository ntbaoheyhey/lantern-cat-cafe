import type { Actor, Battle, StatusId, StatusRule } from '../contract';

/** Core vocabulary is mode-specific; historical catalogue entries remain unchanged. */
export const CORE_STATUS_RULES_V5: StatusRule[] = [
  { id:'scald',name:'Burn',kind:'debuff',cap:5,duration:3,dispellable:true,tick:'damage',strength:12,description:'Lose 12 HP per stack at round end, through shields.' },
  { id:'snag',name:'Bleed',kind:'debuff',cap:5,duration:3,dispellable:true,tick:'none',strength:8,description:'Lose 8 HP per stack before your action. Shields absorb it.' },
  { id:'bitter',name:'Bitter',kind:'debuff',cap:1,duration:2,dispellable:true,tick:'none',strength:50,description:'Receive half as much healing and shielding.' },
  { id:'scent',name:'Mark',kind:'debuff',cap:1,duration:2,dispellable:true,tick:'none',strength:20,description:'Take 20% more direct damage and become reachable through the front row.' },
  { id:'brittle',name:'Shred',kind:'debuff',cap:3,duration:2,dispellable:true,tick:'none',strength:8,description:'Lose 8% defense and 15 shield per direct hit, per stack.' },
  { id:'drowsy',name:'Daze',kind:'debuff',cap:1,duration:1,dispellable:true,tick:'none',strength:50,description:'Your next action becomes a half-power basic. Bosses only lose a signature.' },
  { id:'steep',name:'Regen',kind:'buff',cap:3,duration:3,dispellable:true,tick:'heal',strength:18,description:'Heal 18 HP per stack at round end and remove one Burn stack.' },
  { id:'cozy',name:'Warm',kind:'buff',cap:3,duration:2,dispellable:true,tick:'none',strength:10,description:'Take 10% less direct damage per stack. Burn ignores Warm.' },
];
export const NEW_STATUS_RULES_V5 = CORE_STATUS_RULES_V5.filter(s=>s.id==='snag'||s.id==='bitter');
const core = Object.fromEntries(CORE_STATUS_RULES_V5.map(s=>[s.id,s]));
export const STATUS_SUBTITLES_V5: Partial<Record<StatusId,string>> = {scald:'Scald',snag:'Snag',bitter:'Bitter tea',scent:'Scented',brittle:'Brittle sugar',drowsy:'Drowsy',steep:'Steep',cozy:'Cozy'};
export function statusIdV5(id:StatusId):StatusId { return id==='tangle'?'brittle':id==='hush'||id==='rattled'?'drowsy':id; }
export function statusRuleV5(id:StatusId,fallback:StatusRule):StatusRule {return core[statusIdV5(id)]??fallback;}
const count=(a:Actor,id:StatusId)=>a.statuses.find(s=>s.id===id)?.stacks??0;
export const receivedV5=(target:Actor,amount:number)=>amount*(count(target,'bitter')?.5:1);
export const defenseV5=(target:Actor)=>target.defense*(1-.08*count(target,'brittle'));
export interface StatusRuntimeV5 {
  heal:(b:Battle,source:Actor,target:Actor,amount:number)=>void;
  loseHp:(b:Battle,source:Actor,target:Actor,amount:number,kind:string)=>number;
  record:(b:Battle,source:Actor,target:Actor,kind:string,amount?:number,text?:string,skillId?:string)=>void;
  rule:(id:StatusId)=>StatusRule;
  isBoss:(actor:Actor)=>boolean;
}
/** Both DoTs share the boss budget; absorbed Bleed does not spend HP budget. */
export function statusDamageV5(b:Battle,source:Actor,target:Actor,id:'scald'|'snag',amount:number,io:StatusRuntimeV5):number {
  if(target.hp<=0)return 0;
  amount=Math.max(0,Math.round(amount));
  if(id==='snag') {const absorbed=Math.min(target.shield,amount);target.shield-=absorbed;amount-=absorbed;if(absorbed)io.record(b,source,target,'absorbed',absorbed,'Shield absorbed Bleed');}
  if(io.isBoss(target)){
    if(target.bonuses.v5DotRound!==b.round){target.bonuses.v5DotRound=b.round;target.bonuses.v5DotDamage=0;}
    amount=Math.min(amount,Math.max(0,Math.floor(target.maxHp*.06)-(target.bonuses.v5DotDamage??0)));
  }
  const actual=io.loseHp(b,source,target,amount,'dot');
  if(io.isBoss(target))target.bonuses.v5DotDamage=(target.bonuses.v5DotDamage??0)+actual;
  io.record(b,source,target,'status-tick',actual,core[id]!.name,id);
  return actual;
}
export function beforeActionV5(b:Battle,actor:Actor,io:StatusRuntimeV5):boolean {
  const bleed=actor.statuses.find(s=>s.id==='snag');
  if(bleed)statusDamageV5(b,b.actors.find(a=>a.id===bleed.source)??actor,actor,'snag',8*bleed.stacks,io);
  return actor.hp>0;
}
export function consumeDazeV5(b:Battle,actor:Actor,io:StatusRuntimeV5):boolean {
  if(!count(actor,'drowsy'))return false;
  const controller=b.actors.find(a=>a.id===actor.statuses.find(s=>s.id==='drowsy')?.source);
  actor.statuses=actor.statuses.filter(s=>s.id!=='drowsy');
  if(controller?.bonuses.crewSuppress&&!controller.bonuses.crewSuppressed){controller.bonuses.crewSuppressed=1;io.heal(b,controller,controller,controller.bonuses.crewSuppress);}
  actor.bonuses.controlImmuneUntil=b.round+1;
  io.record(b,actor,actor,'suppressed',1,'Daze spent the next action');
  return true;
}
export function tickStatusesV5(b:Battle,actors:Actor[],io:StatusRuntimeV5):void {
  // Global ordering is independent of actor order and original status insertion order.
  for(const actor of actors.filter(a=>a.hp>0)){
    const regen=actor.statuses.find(s=>s.id==='steep');
    if(regen){const source=b.actors.find(a=>a.id===regen.source)??actor,before=actor.hp;
      io.heal(b,source,actor,18*regen.stacks);
      io.record(b,source,actor,'status-tick',actor.hp-before,'Regen','steep');
      const burn=actor.statuses.find(s=>s.id==='scald');if(burn)burn.stacks--;
      actor.statuses=actor.statuses.filter(s=>s.stacks>0);
    }
  }
  for(const actor of actors.filter(a=>a.hp>0)){
    const burn=actor.statuses.find(s=>s.id==='scald');
    if(burn)statusDamageV5(b,b.actors.find(a=>a.id===burn.source)??actor,actor,'scald',12*burn.stacks,io);
  }
  for(const actor of actors){
    for(const s of actor.statuses){
      // Daze promises the next action, including when applied after this round's turn.
      if(s.id==='drowsy')continue;
      s.remaining--;if(s.remaining<=0)io.record(b,actor,actor,'expire',0,statusRuleV5(s.id,io.rule(s.id)).name);
    }
    actor.statuses=actor.statuses.filter(s=>s.remaining>0&&s.stacks>0);
  }
}
