import {act,cleanup,render} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {RewardFly} from './RewardFly';

afterEach(()=>{cleanup();vi.useRealTimers();});
it.each([false,true])('clears reward feedback when currency is spent before it expires (reduced motion: %s)',reducedMotion=>{
 vi.useFakeTimers();
 const view=(fish:number)=><><span data-currency="fish"/><RewardFly values={{fish}} reducedMotion={reducedMotion}/></>;
 const {container,rerender}=render(view(100));
 rerender(view(130));
 expect(container.querySelectorAll('.uv-reward-fly>span')).toHaveLength(1);
 act(()=>{vi.advanceTimersByTime(500);});
 rerender(view(120));
 act(()=>{vi.advanceTimersByTime(1200);});
 expect(container.querySelectorAll('.uv-reward-fly>span')).toHaveLength(0);
 rerender(view(140));
 expect(container.querySelectorAll('.uv-reward-fly>span')).toHaveLength(1);
 act(()=>{vi.advanceTimersByTime(1200);});
 expect(container.querySelectorAll('.uv-reward-fly>span')).toHaveLength(0);
});
