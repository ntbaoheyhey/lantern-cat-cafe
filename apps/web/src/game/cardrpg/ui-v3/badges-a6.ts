import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';

/** A6 dots describe enabled actions, rather than unseen collection entries. */
export function badgesA6(state: R.DepthAccount, now: number) {
  const enabled = R.gameplayA6(state);
  const active = !enabled || !!state.run && !state.run.complete;
  const board = R.dailyBoardA6(state, now);
  const upgrades = active ? [] : R.upgradeOptionsA6(state);
  const cat = upgrades.find(u => u.change.kind === 'level' || u.change.kind === 'ascend');
  const gearUpgrade = upgrades.find(u => u.change.kind === 'enhance');
  const autoEquip = !active && R.autoEquipA6(state).ok;
  const free = !active && !state.freeInvite && firstInvitation(state, 4).ok;
  const recruit = free || !active && R.metaCommand(state, { type: 'pull', bannerId: 'standard', seed: 4 }).ok;
  const stars = active ? [] : R.STAR_REWARDS_V4.filter(c => !R.starRewardPreviewV4(state, c.id).reason);
  const tower = active ? [] : R.TOWER_CHESTS_A6.filter(f => !R.towerChestA6(state, f).reason);
  const journal = active ? [] : R.MILESTONES_V4.filter(c => !R.milestonePreviewV4(state, c.id).reason);
  const tasks = board.tasks.filter(t => !t.reason);
  const weekly = board.weekly.filter(w => !w.reason);
  const login = !board.login.reason;
  const idle = enabled && !R.idleChestA6(state, now).reason;
  return { cat, gearUpgrade, autoEquip, free, recruit, stars, tower, journal, tasks, weekly, login, idle,
    cats: !!cat, gear: !!gearUpgrade || autoEquip,
    events: tasks.length + weekly.length + Number(login) + stars.length + tower.length + journal.length };
}
