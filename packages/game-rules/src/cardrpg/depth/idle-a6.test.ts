import { expect, it } from 'vitest';
import * as R from './index';

const HOUR = 3600000, DAY = 24 * HOUR;
const state = () => R.setGameplayA6(R.createDepthAccount(3, 0), true);

it('caps tips at twelve hours and scales with earned combat progress', () => {
  const s=state(),early=R.idleChestA6(s,HOUR);
  expect(R.idleChestA6(s,20*HOUR).elapsed).toBe(12*3600);
  expect(R.idleChestA6(s,20*HOUR).reward).toEqual(R.idleChestA6(s,12*HOUR).reward);
  s.v4!.journey!.stars['1/0/0-0/battle']={key:'1/0/0-0/battle',chapter:1,band:0,nodeId:'0-0',kind:'battle',conditions:[true,true,true]};
  expect(R.idleChestA6(s,HOUR).stage).toBe(1);
  expect(R.idleChestA6(s,HOUR).reward.fish).toBeGreaterThan(early.reward.fish!);
  expect(R.cafeShiftV4(s,HOUR)).toEqual(R.idleChestA6(s,HOUR));
});

it('claims once, rejects rollback and preserves tips when rewards are capped or a route is active', () => {
  const s=state(),claimed=R.claimCafeShiftV4(s,HOUR);
  expect(claimed.ok).toBe(true);
  expect(claimed.state.account.quests['daily-service']!.progress).toBe(1);
  expect(R.metaCommand(claimed.state,{type:'claimQuest',questId:'daily-service'}).ok).toBe(true);
  expect(R.claimCafeShiftV4(claimed.state,HOUR).ok).toBe(false);
  expect(R.claimIdleA6(claimed.state,HOUR-1,true).ok).toBe(false);
  expect(R.importSave(R.exportSave(claimed.state))).toEqual(claimed.state);
  const capped=state();capped.account.daily.earned={...R.DEPTH_CAPS_V4};
  const result=R.claimIdleA6(capped,HOUR);
  expect(result.ok).toBe(false);expect(result.state).toBe(capped);
  expect(R.claimIdleA6(R.startRun(state(),1,3).state,HOUR).ok).toBe(false);
});

it('allows two fast rewards per day without draining elapsed tips and validates the save', () => {
  let s=state();
  for(let n=0;n<2;n++){const result=R.claimIdleA6(s,HOUR,true);expect(result.ok).toBe(true);s=result.state;}
  expect(s.idle.lastAt).toBe(0);
  expect(s.account.quests['daily-service']!.progress).toBe(0);
  expect(R.idleChestA6(s,HOUR,true).remaining).toBe(0);
  expect(R.claimIdleA6(s,HOUR,true).ok).toBe(false);
  expect(R.claimIdleA6(s,DAY+HOUR,true).ok).toBe(true);
  expect(R.importSave(R.exportSave(s))).toEqual(s);
  s.idle.a6!.fastClaims=-1;expect(()=>R.importSave(R.exportSave(s))).toThrow();
});

it('leaves the flag-OFF service cap and state unchanged', () => {
  const s=R.createDepthAccount(3,0),before=R.exportSave(s);
  expect(R.claimIdleA6(s,HOUR).ok).toBe(false);
  expect(R.idlePreview(s,20*HOUR).capHours).toBe(8);
  expect(R.exportSave(s)).toBe(before);
});
