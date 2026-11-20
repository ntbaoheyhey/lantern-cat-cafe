import {battleCats,createDepthAccount} from './state';
import {setGameplayA6} from './gameplay-a6';
import {createBattle} from './battle';
import {playBattle} from './policies';
import type {BattleSetup} from './contract';

export const DEMO_CREW_V9=['mochi','clover','soot'] as const;
export const DEMO_WAVE_V9=['needle-moth','teacup-healer','button-guard'] as const;
export const DEMO_SEED_V9=43113;
export type DemoEncounterV9='wave'|'boss';

/** Public recording data, shared by the browser and server voucher trial. */
export function demoSetupV9(encounter:DemoEncounterV9):BattleSetup {
  const state=setGameplayA6(createDepthAccount(DEMO_SEED_V9,0),true);
  state.team=[...DEMO_CREW_V9];
  state.rows={mochi:'front',clover:'rear',soot:'rear'};
  return {seed:DEMO_SEED_V9,chapter:1,demoV9:true,formationC2:true,gameplayA6:true,gameplayV4:true,skillsV5:true,
    cats:battleCats(state),enemies:encounter==='boss'?['yarn-giant']:[...DEMO_WAVE_V9],
    enemyStats:encounter==='boss'?{'yarn-giant':{hp:450,attack:25,defense:3}}:{
      'needle-moth':{hp:35,attack:12,defense:2},'teacup-healer':{hp:30,attack:10,defense:2},'button-guard':{hp:40,attack:12,defense:3},
    },
  };
}

export function demoRecordingV9(encounter:DemoEncounterV9) {
  const battle=playBattle(createBattle(demoSetupV9(encounter)),'auto');
  return {won:battle.result==='party',rounds:battle.round,replay:{setup:battle.initial,choices:battle.choices}};
}
