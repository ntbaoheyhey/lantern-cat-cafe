import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {lazy,Suspense} from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {SheetBoundary,SheetLoading} from './SheetRecovery';

afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
it('contains a rejected screen import and keeps the surrounding controls available',async()=>{
 vi.spyOn(console,'error').mockImplementation(()=>{});
 let reject!:(error:Error)=>void;
 const Pending=lazy(()=>new Promise<{default:()=>null}>((_,fail)=>{reject=fail;})),close=vi.fn();
 const view=render(<><button>Café menu</button><SheetBoundary key="route" title="Night route" onClose={close}><Suspense fallback={<p>Loading route</p>}><Pending/></Suspense></SheetBoundary></>);
 expect(screen.getByText('Loading route')).toBeTruthy();
 await act(async()=>reject(new Error('Failed to fetch dynamically imported module')));
 expect(screen.getByRole('alert').textContent).toContain('Couldn’t open Night route');
 expect(screen.getByRole('button',{name:'Café menu'})).toBeTruthy();
 expect(screen.getByRole('button',{name:'Reload page'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Back to café'}));expect(close).toHaveBeenCalledOnce();
 view.rerender(<SheetBoundary key="bag" title="Bag" onClose={close}><p>Saved equipment</p></SheetBoundary>);
 expect(screen.queryByRole('alert')).toBeNull();expect(screen.getByText('Saved equipment')).toBeTruthy();
});
it('offers an exit after a stalled import without replacing the pending screen',()=>{
 vi.useFakeTimers();const close=vi.fn(),Pending=lazy(()=>new Promise<{default:()=>null}>(()=>{}));
 const view=render(<Suspense fallback={<SheetLoading title="Night route" illustrated={false} onClose={close}/>}><Pending/></Suspense>);
 act(()=>vi.advanceTimersByTime(7999));expect(screen.queryByRole('button',{name:'Reload page'})).toBeNull();
 act(()=>vi.advanceTimersByTime(1));expect(screen.getByText('Opening Night route…')).toBeTruthy();
 expect(screen.getByText('This is taking longer than expected.')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Back to café'}));expect(close).toHaveBeenCalledOnce();
 view.unmount();expect(vi.getTimerCount()).toBe(0);
});
it('clears the recovery timer when a delayed screen resolves normally',async()=>{
 vi.useFakeTimers();let resolve!:(value:{default:()=>React.ReactNode})=>void;
 const Pending=lazy(()=>new Promise<{default:()=>React.ReactNode}>(done=>{resolve=done;}));
 render(<Suspense fallback={<SheetLoading title="Prepare" illustrated={false} onClose={()=>{}}/>}><Pending/></Suspense>);
 await act(async()=>resolve({default:()=> <p>Your crew is ready</p>}));
 act(()=>vi.advanceTimersByTime(9000));
 expect(screen.getByText('Your crew is ready')).toBeTruthy();expect(screen.queryByRole('button',{name:'Reload page'})).toBeNull();
});
