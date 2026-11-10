import {LEGACY_EVENT_KINDS} from '../events-v4';
import {STATUS_BY_ID} from '../catalog';
const strings=(x:unknown):x is string[]=>Array.isArray(x)&&x.length<=1024&&x.every(s=>typeof s==='string'&&s.length>0);
const integer=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
/** Old v1 battle events remain valid inside THC14/15; new payloads require the V5 flag. */
export function validBattleEventV5(value:unknown,index:number,enabled:boolean):boolean {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const e=value as Record<string,unknown>;
  if(e.sequence!==index||!integer(e.round)||typeof e.text!=='string'||typeof e.kind!=='string')return false;
  if(e.version===1)return LEGACY_EVENT_KINDS.includes(e.kind);
  if(!enabled||e.version!==2||!integer(e.actionId)||!integer(e.logIndex)||!['setup','action','round-end'].includes(String(e.stage)))return false;
  if(LEGACY_EVENT_KINDS.includes(e.kind))return true;
  if(e.kind==='rage.full')return typeof e.actorId==='string'&&e.actorId.length>0&&e.amount===100;
  if(e.kind==='ultimate.cast')return typeof e.actorId==='string'&&typeof e.skillId==='string'&&typeof e.displayName==='string'&&e.displayName.length>0;
  if(e.kind==='bond.combo')return typeof e.actorId==='string'&&typeof e.comboId==='string'&&e.comboId.length>0&&typeof e.displayName==='string'&&e.displayName.length>0&&strings(e.contributors)&&e.contributors.length===2&&new Set(e.contributors).size===2&&strings(e.targets)&&e.targets.length>0;
  const status=typeof e.statusId==='string'&&Object.prototype.hasOwnProperty.call(STATUS_BY_ID,e.statusId);
  const actor=typeof e.sourceId==='string'&&e.sourceId.length>0&&typeof e.targetId==='string'&&e.targetId.length>0;
  if(e.kind==='status-applied')return !!(actor&&status&&integer(e.stacks)&&Number(e.stacks)>0&&Number(e.stacks)<=5);
  if(e.kind==='status-tick')return !!(actor&&status&&integer(e.amount));
  if(e.kind==='reaction')return actor&&['crumb-burst','wildfire','rupture','spread'].includes(String(e.reactionId))&&strings(e.primerIds)&&e.primerIds.every(id=>Object.prototype.hasOwnProperty.call(STATUS_BY_ID,id))&&strings(e.targets)&&e.targets.length>0;
  if(e.kind==='multi-hit')return typeof e.skillId==='string'&&e.skillId.length>0&&['single','pierce','row','splash','bounce','all','multi-hit','one','weakest','ally-row','ally-splash','team','self','fallen'].includes(String(e.shape))&&strings(e.targets)&&e.targets.length>0;
  return false;
}
