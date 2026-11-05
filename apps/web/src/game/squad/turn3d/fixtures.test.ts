import { expect, it } from 'vitest';
import { createEffectFixture } from './fixtures';
import { TURN_SKILLS } from '@taskbar-hero/game-rules/src/squad/turn/config';
import { TurnPresenter } from './presenter';
it.each([...Object.keys(TURN_SKILLS),'steadfast','warmWick','lastSip','status_apply','status_expire','death','wave_clear','victory'])('gallery fixture %s resolves through the real core',(id)=>{
  const f=createEffectFixture(id);expect(f.events.length).toBeGreaterThan(0);const p=new TurnPresenter();p.reset(f.initial);p.push(f.events);let count=0;
  while(p.busy&&count++<40)p.skip();expect(p.busy).toBe(false);expect(p.state.actors).toEqual(f.battle.actors);
  if(['steadfast','warmWick','lastSip'].includes(id))expect(f.events.some(e=>e.type==='passive'&&e.skillId===id)).toBe(true);
});
