import { clone } from '../../internal';
import type { DepthAccount } from '../contract';
import { setGameplayV4 } from '../gameplay-v4';
export * from './statuses';
/** Like V4, a run retains its committed rules while preferences apply to the next run. */
export function skillsV5(state:DepthAccount):boolean {return !!(state.run&&!state.run.complete?state.run.skillsV5:state.gameplayV4&&state.skillsV5);}
export function setSkillsV5(state:DepthAccount,enabled:boolean):DepthAccount {
  const next=enabled?setGameplayV4(state,true):clone(state);
  if(enabled)next.skillsV5=true;else delete next.skillsV5;
  return next;
}
