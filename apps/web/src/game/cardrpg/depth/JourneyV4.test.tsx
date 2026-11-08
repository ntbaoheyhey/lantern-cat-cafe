// @vitest-environment jsdom
import {useSyncExternalStore} from 'react';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import {DepthModel} from './model';
import {DiscoveryCelebrationV4} from './JourneyV4';
const Wrapper=({m}:{m:DepthModel})=>{useSyncExternalStore(m.subscribe,m.snapshot);return <DiscoveryCelebrationV4 m={m}/>;};
const model=()=>{const m=new DepthModel(true,true);R.observeDiscoveriesV4(m.state);return m;};
beforeEach(()=>vi.useFakeTimers());
afterEach(()=>{cleanup();vi.useRealTimers();});
it('keeps a discovery for 1.2 seconds, then dismisses only that receipt',()=>{
 const m=model(),pending=[...m.state.v4!.journey!.pending],found=[...m.state.v4!.journey!.found],money={...m.state.account.currencies};
 render(<Wrapper m={m}/>);expect(screen.getByRole('status')).toBeTruthy();
 act(()=>vi.advanceTimersByTime(1199));expect(m.state.v4!.journey!.pending[0]).toEqual(pending[0]);
 act(()=>vi.advanceTimersByTime(1));expect(m.state.v4!.journey!.pending).toEqual(pending.slice(1));
 expect(m.state.v4!.journey!.found).toEqual(found);expect(m.state.account.currencies).toEqual(money);
});
it('skips immediately without changing a discovery or currency, including reduced motion',()=>{
 const m=model();m.state.settings.reducedMotion=true;const count=m.state.v4!.journey!.pending.length,found=[...m.state.v4!.journey!.found];
 render(<Wrapper m={m}/>);expect(screen.getByRole('status').getAttribute('data-reduced')).toBe('true');
 fireEvent.click(screen.getByRole('button',{name:'Skip celebration'}));
 expect(m.state.v4!.journey!.pending.length).toBe(count-1);expect(m.state.v4!.journey!.found).toEqual(found);
});
it('waits during invitations and OFF, and leaves the earned receipt queued',()=>{
 const m=model(),pending=[...m.state.v4!.journey!.pending];m.screen='gacha';
 render(<Wrapper m={m}/>);act(()=>vi.advanceTimersByTime(2000));expect(screen.queryByRole('status')).toBeNull();expect(m.state.v4!.journey!.pending).toEqual(pending);
 act(()=>{m.state=R.setGameplayV4(m.state,false);m.go('hub');});act(()=>vi.advanceTimersByTime(2000));
 expect(screen.queryByRole('status')).toBeNull();expect(m.state.v4!.journey!.pending).toEqual(pending);
 act(()=>{m.state=R.setGameplayV4(m.state,true);m.notify();});expect(screen.getByRole('status')).toBeTruthy();
});
