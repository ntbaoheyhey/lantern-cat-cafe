import {renderHook} from '@testing-library/react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {audioEngine} from './engine';
import {useCafeChatter} from './chatter';
beforeEach(()=>{vi.useFakeTimers();vi.spyOn(Math,'random').mockReturnValue(.5);});
afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();});
it('uses the shared voice bus at a quiet cadence and cancels when the hub closes',()=>{
 const play=vi.spyOn(audioEngine,'play').mockImplementation(()=>{});
 const {rerender,unmount}=renderHook(({active})=>useCafeChatter(active),{initialProps:{active:true}});
 vi.advanceTimersByTime(19000);expect(play).not.toHaveBeenCalled();
 vi.advanceTimersByTime(6000);expect(play).toHaveBeenCalledExactlyOnceWith('voice.guide.idle',{priority:25});
 rerender({active:false});vi.advanceTimersByTime(60000);expect(play).toHaveBeenCalledTimes(1);
 unmount();
});
it('stays quiet when the document is hidden',()=>{
 vi.spyOn(document,'hidden','get').mockReturnValue(true);
 const play=vi.spyOn(audioEngine,'play').mockImplementation(()=>{});
 const {unmount}=renderHook(()=>useCafeChatter(true));
 vi.advanceTimersByTime(60000);expect(play).not.toHaveBeenCalled();unmount();
});
