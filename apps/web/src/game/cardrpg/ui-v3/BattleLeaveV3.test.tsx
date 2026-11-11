import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterAll,afterEach,beforeAll,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from '../depth/model';
import BattleHudV3 from './BattleHudV3';

const methods=['showModal','close'] as const;
const original=methods.map(key=>Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,key));
beforeAll(()=>{for(const key of methods)Object.defineProperty(HTMLDialogElement.prototype,key,{configurable:true,value:function(this:HTMLDialogElement){this.open=key==='showModal';}});});
afterAll(()=>{methods.forEach((key,i)=>{if(original[i])Object.defineProperty(HTMLDialogElement.prototype,key,original[i]!);else Reflect.deleteProperty(HTMLDialogElement.prototype,key);});});
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function Surface({m}:{m:DepthModel}){useSyncExternalStore(m.subscribe,m.snapshot);return m.showBattle?<BattleHudV3 m={m}/>:<p>Returned to {m.screen}</p>;}
function setup(mode:'campaign'|'daily'|'tower'|'practice'='campaign'){
 const m=new DepthModel(true,true,true,true);m.state.tutorial=4;
 if(mode==='practice')m.tutorial();
 else{
  if(mode==='tower'){m.state.cleared=[1,2,3];m.state=R.startTowerFloorA6(m.state,1).state;}
  else m.start(1,mode);
  m.enter(R.availableNodes(m.state.run!)[0]!.id);
 }
 m.sceneReady=true;m.fight();m.paused=true;return m;
}
function open(){fireEvent.click(screen.getByRole('button',{name:'More battle options'}));fireEvent.click(screen.getByRole('button',{name:'Leave table'}));return screen.getByRole('dialog');}

it.each([false,true])('holds the fight and restores prior pause=%s when cancelling leave',paused=>{
 const m=setup();m.paused=paused;const before=structuredClone(m.state);render(<Surface m={m}/>);
 const dialog=open();expect(dialog.tagName).toBe('DIALOG');expect((dialog as HTMLDialogElement).open).toBe(true);
 expect(m.paused).toBe(true);const at=m.playbackAt;act(()=>m.tick(1000));expect(m.playbackAt).toBe(at);expect(m.state).toEqual(before);
 if(paused)fireEvent(dialog,new Event('cancel',{cancelable:true}));else fireEvent.keyDown(within(dialog).getByRole('button',{name:'Keep fighting'}),{key:'Escape'});
 expect(screen.queryByRole('dialog')).toBeNull();expect(m.paused).toBe(paused);expect(m.state).toEqual(before);
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'More battle options'}));
});
it.each(['campaign','daily','tower'] as const)('confirms exactly the existing %s settlement once',mode=>{
 const m=setup(mode),before=structuredClone(m.state),expected=R.abandonRun(before);expect(expected.ok).toBe(true);
 const leave=vi.spyOn(m,'leave');render(<Surface m={m}/>);const dialog=open();
 expect(m.state).toEqual(before);expect(within(dialog).getByRole('button',{name:'Keep fighting'})).toBeTruthy();
 fireEvent.click(within(dialog).getByRole('button',{name:mode==='tower'?'Leave floor':'End patrol'}));
 expect(leave).toHaveBeenCalledOnce();expect(m.state).toEqual(expected.state);expect(m.screen).toBe('hub');expect(m.plan).toBeNull();expect(m.paused).toBe(false);
});
it('discloses the daily gift claim even when its currencies are capped',()=>{
 const m=setup('daily');Object.assign(m.state.account.daily.earned,{fish:99999,threads:99999,stamps:99999,essence:99999});
 const before=structuredClone(m.state);render(<Surface m={m}/>);const dialog=open();
 expect(dialog.textContent).toContain('Uses this daily challenge’s gift');expect(dialog.textContent).toContain('1 of today’s 6 route gifts');
 expect(m.state).toEqual(before);fireEvent.click(within(dialog).getByRole('button',{name:'Keep fighting'}));expect(m.state).toEqual(before);
});
it('does not promise another gift after all six route gifts were used',()=>{
 const m=setup();m.state.account.daily.battles=6;render(<Surface m={m}/>);const dialog=open();
 expect(dialog.textContent).toContain('All 6 route gifts were already used today.');expect(dialog.textContent).toContain('No new supplies');
});
it('does not consume or promise a second daily challenge gift',()=>{
 const m=setup('daily');m.state.challengeClaims.push(`daily-${m.state.run!.date}`);render(<Surface m={m}/>);const dialog=open();
 expect(dialog.textContent).toContain('This challenge’s gift was already claimed.');expect(dialog.textContent).not.toContain('Uses this daily challenge’s gift');
});
it('leaves practice without granting its completion reward',()=>{
 const m=setup('practice'),account=structuredClone(m.state.account);render(<Surface m={m}/>);const dialog=open();
 expect(dialog.textContent).toContain('practice reward');fireEvent.click(within(dialog).getByRole('button',{name:'Leave practice'}));
 expect(m.tutorialBattle).toBeNull();expect(m.state.tutorial).toBe(3);expect(m.state.account).toEqual(account);expect(m.screen).toBe('hub');
});
it('returns from a replay directly without ending the active patrol',()=>{
 const m=setup();R.playBattle(m.battle!,'auto');m.watching=false;m.go('result');
 const before=structuredClone(m.state);m.replayLast();render(<Surface m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'More battle options'}));fireEvent.click(screen.getByRole('button',{name:'Return from replay'}));
 expect(m.replay).toBeNull();expect(screen.queryByRole('dialog')).toBeNull();expect(m.state).toEqual(before);
});
it('closes a preview directly and restores the underlying paused battle',()=>{
 const m=setup(),before=structuredClone(m.state);m.inspect(m.galleryActions[0]!.id);render(<Surface m={m}/>);
 fireEvent.click(screen.getByRole('button',{name:'More battle options'}));fireEvent.click(screen.getByRole('button',{name:'Close preview'}));
 expect(m.galleryBattle).toBeNull();expect(screen.queryByRole('dialog')).toBeNull();expect(m.state).toEqual(before);expect(m.paused).toBe(true);
});
