import {expect,it} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DEMO_CREW_V9,DEMO_WAVE_V9,demoSetupV9,demoRecordingV9} from '@taskbar-hero/game-rules/src/cardrpg/depth/demo-v9';
import {judgeDemoV9} from '../gate';
import {DepthModel} from './model';

it('limits the judge route to three cats and one street wave, preserving the legacy opt-out',()=>{
  expect(judgeDemoV9('?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3')).toBe(true);
  expect(judgeDemoV9('?demo=1&squad=1&cardrpg2=1&a6=1')).toBe(false);
  expect(judgeDemoV9('?demo=1&squad=1&cardrpg2=1&a6=1&dev=1')).toBe(false);
  expect(judgeDemoV9('?demo=1&legacy=1')).toBe(false);
  expect(judgeDemoV9('')).toBe(false);
  const setup=demoSetupV9('wave');
  expect(setup.cats.map(c=>c.id)).toEqual(DEMO_CREW_V9);
  expect(setup.enemies).toEqual(DEMO_WAVE_V9);
  expect(demoRecordingV9('wave').won).toBe(true);
  expect(()=>R.createBattle({...setup,demoV9:false})).toThrow();
  const legacy=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(),true));
  expect(R.createBattle({...setup,demoV9:false,cats:R.battleCats(legacy)}).actors.filter(a=>a.side==='party')).toHaveLength(4);
});

it('replays exactly one ultimate per cat and defeats the boss on the third',()=>{
  const recording=demoRecordingV9('boss');
  expect(recording).toEqual(demoRecordingV9('boss'));
  expect(recording.replay.choices.filter(c=>c.skillId.endsWith('-4')).map(c=>c.skillId)).toEqual(['mochi-4','clover-4','soot-4']);
  expect(recording.replay.choices.at(-1)?.skillId).toBe('soot-4');
  const model=new DepthModel(true,true,true,true,true),before=R.exportSave(model.state);
  expect(model.replayEncounter(recording.replay.setup,recording.replay.choices)).toBe(true);
  model.sceneReady=true;
  let elapsed=0;
  while(model.showBattle&&elapsed<75000){model.replayStep();elapsed+=50;model.tick(50,elapsed);}
  expect(model.replay?.result).toBe('party');
  expect(model.showBattle).toBe(false);
  expect(elapsed).toBeLessThan(75000);
  expect(R.exportSave(model.state)).toBe(before);
});
