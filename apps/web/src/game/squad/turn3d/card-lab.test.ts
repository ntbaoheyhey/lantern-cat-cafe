import { expect, it, vi } from 'vitest';
import { MechanicsModel } from '../../../../../../tools/cardrpg-big2/mechanics-model';
import { DEFAULT_AUTO_EXTRAS } from '@taskbar-hero/game-rules/src/cardrpg/depth/auto-extras/index';
import { createAutoExtrasRunner } from '@taskbar-hero/game-rules/src/cardrpg/depth/auto-extras/runner';
const all = { autoExtras:true,teaCloud:true,frontRelay:true,intentLens:true };
it.each([DEFAULT_AUTO_EXTRAS,all])('keeps natural lab playback and skip equal to the rules runner',options=>{
 const m=new MechanicsModel(true);m.prepare('garden',1,4011,options);
 const expected=structuredClone(m.battle!);createAutoExtrasRunner(options)(expected,'auto');
 const account=JSON.stringify(m.state);m.fight();m.sceneReady=true;
 let steps=0, cues=0;
 while(m.watching && steps++<900){
  if(m.canAct)m.step();
  if(m.plan){
   for(const id of (m.plan.presentationCues??[]).filter(id=>id.startsWith('auto-extra:'))){expect(m.plan.presentationCueTargets?.[id]).toBeTruthy();cues++;}
   m.tick(m.plan.duration);
  } else m.tick(1);
 }
 expect(steps).toBeLessThan(900);expect(m.battle).toEqual(expected);expect(JSON.stringify(m.state)).toBe(account);
 if(options.autoExtras)expect(cues).toBeGreaterThan(0);
 const skipped=new MechanicsModel(true);skipped.prepare('garden',1,4011,options);skipped.fight();skipped.skip();expect(skipped.battle).toEqual(expected);
});
it('locks the options by value and avoids save or reward writes',()=>{
 const spy=vi.spyOn(Storage.prototype,'setItem');
 const options={...all},m=new MechanicsModel(true);m.prepare('tide',2,4005,options);
 options.teaCloud=false;expect(m.options.teaCloud).toBe(true);expect(Object.isFrozen(m.options)).toBe(true);
 const state=JSON.stringify(m.state);m.fight();m.skip();m.leave();expect(JSON.stringify(m.state)).toBe(state);expect(spy).not.toHaveBeenCalled();spy.mockRestore();
});
