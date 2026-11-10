import { clone, integer, requireRule } from '../internal';
import type { BattleSetup, DepthAccount, RunNode } from './contract';
import { gameplayA6 } from './gameplay-a6';
import { battleCats, grantDepth, requireHome, transactDepth } from './state';
import { cappedPreviewV4 } from './meta-v4';
import { challengeStatsV4 } from './pacing-v4';

export const TOWER_FLOORS_A6 = 30;
export const TOWER_CHESTS_A6 = [5, 10, 15, 20, 25, 30] as const;
const formations = [
  [['button-guard', 'needle-moth'], ['sock-skipper', 'teacup-healer'], ['spool-ram', 'needle-moth'], ['kettle-knight', 'sock-skipper']],
  [['pollen-scout', 'needle-moth'], ['kettle-knight', 'teacup-healer'], ['spool-ram', 'button-guard'], ['needle-moth', 'sock-skipper']],
  [['crumb-sentinel', 'binding-thread'], ['sock-skipper', 'teacup-healer'], ['kettle-knight', 'pollen-scout'], ['binding-thread', 'needle-moth']],
] as const;
/** The same floor always has the same foes, level and seed, on every account. */
export function towerFloorA6(floor: number) {
  requireRule(integer(floor, 1, TOWER_FLOORS_A6), 'INVALID_AMOUNT', 'Choose a floor from one to thirty.');
  const chapter = floor <= 10 ? 1 : floor <= 20 ? 2 : 3;
  const boss = floor % 5 === 0;
  const enemies: string[] = boss ? [[ 'yarn-giant', 'rain-spool', 'pantry-crown' ][chapter - 1]!] : [...formations[chapter - 1]![(floor - 1) % 4]!];
  const level = 1 + Math.floor((floor - 1) / 3), seed = 670001 + floor * 97;
  const stats = challengeStatsV4(level);
  // Compact HP bands keep fixed floors brisk; attacks, defenses and mechanics carry the climb.
  const scale = 1 + (floor - 1) * .025;
  const enemyStats: NonNullable<BattleSetup['enemyStats']> = Object.fromEntries(Object.entries(stats).map(([id, s]) => {
    const active = enemies.includes(id);
    const formationBudget = chapter > 1 && (enemies.includes('kettle-knight') || enemies.includes('teacup-healer')) ? .72 : 1;
    const hp = !active ? s.hp : boss ? Math.min(s.hp * scale * .55, 450 + floor * 2) * (chapter === 2 ? 1.12 : 1)
      : Math.max(225 + floor * 2, Math.min(s.hp * scale, 250 + floor * 2)) * formationBudget;
    return [id, { hp: Math.max(1, Math.round(hp)),
      attack: Math.max(1, Math.round(s.attack * (1 + (floor - 1) * .015))),
      defense: active && !boss ? Math.min(s.defense, 25) : s.defense }];
  }));
  const node: RunNode = {id:'0-0',depth:0,lane:0,kind:boss?'boss':'battle',next:[],enemies};
  return {floor, chapter, level, seed, boss, enemies, enemyStats, node};
}
export function startTowerFloorA6(state: DepthAccount, floor = Math.min(TOWER_FLOORS_A6, state.towerBest + 1)) {
  return transactDepth(state, s => {
    requireHome(s);
    requireRule(gameplayA6(s), 'NOT_READY', 'Open A6 first.');
    requireRule(s.cleared.includes(1), 'LOCKED', 'Clear Tangled Cafe to open Yarn Tower.');
    const f = towerFloorA6(floor);
    requireRule(floor <= s.towerBest + 1, 'LOCKED', 'Clear the preceding floor first.');
    const cats = battleCats(s);
    s.run = {id:s.nextRunId++,seed:f.seed,chapter:f.chapter,mode:'tower',floor,
      gameplayA6:true,skillsV5:true,gameplayV4:true,challengeLevel:f.level,towerA6:{enemyStats:clone(f.enemyStats)},
      nodes:[clone(f.node)],visited:[],current:null,points:0,boons:{},upgrades:{},rewardChoices:[],
      hp:Object.fromEntries(cats.map(c=>[c.id,c.stats.hp])),battle:null,complete:false,won:false,
      mutator:'',supplies:0,earnedItems:[],date:'2026-11-10'};
  });
}
export function towerChestA6(s: DepthAccount, floor: number) {
  requireRule(TOWER_CHESTS_A6.includes(floor as typeof TOWER_CHESTS_A6[number]),'UNKNOWN_ID','Choose a Tower milestone.');
  const id = `a6-tower-chest-${floor}`, claimed=s.challengeClaims.includes(id);
  const reward=cappedPreviewV4(s,{stamps:50+floor*2,threads:10+floor});
  const reason=!gameplayA6(s)?'Open A6 first.':s.run&&!s.run.complete?'Finish this floor first.':claimed?'Already collected.'
    :s.towerBest<floor?`Clear floor ${floor}.`:!Object.values(reward).some(n=>n>0)?'Today’s supplies are full. This chest can wait.':null;
  return {id,floor,claimed,reward,reason};
}
export function claimTowerChestA6(state: DepthAccount, floor: number) {
  return transactDepth(state,s=>{requireHome(s);const p=towerChestA6(s,floor);requireRule(!p.reason,'NOT_READY',p.reason??'');grantDepth(s,p.reward);s.challengeClaims.push(p.id);});
}
