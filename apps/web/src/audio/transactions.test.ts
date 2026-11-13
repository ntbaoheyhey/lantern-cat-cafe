import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {TransactionSounds} from './transactions';
import {playCue} from '../game/cardrpg/contracts/audio-cues';
vi.mock('../game/cardrpg/contracts/audio-cues',()=>({playCue:vi.fn()}));
beforeEach(()=>{vi.useFakeTimers();vi.mocked(playCue).mockClear();});
afterEach(()=>vi.useRealTimers());
describe('transaction sound lifetime',()=>{
 it('shares one pending loop and stops only after the final receipt',()=>{
  const sound=new TransactionSounds(),one=sound.begin(),two=sound.begin();
  expect(playCue).toHaveBeenCalledTimes(1);vi.advanceTimersByTime(3200);expect(playCue).toHaveBeenCalledTimes(3);
  one(true);vi.advanceTimersByTime(1600);expect(playCue).toHaveBeenLastCalledWith('tx.pending',{volume:.35});
  two(false);expect(playCue).toHaveBeenLastCalledWith('tx.failed');const count=vi.mocked(playCue).mock.calls.length;
  vi.advanceTimersByTime(6400);two(true);expect(playCue).toHaveBeenCalledTimes(count);
 });
 it('silences a dismissed panel and suppresses its late confirmation',()=>{
  const sound=new TransactionSounds();sound.wallet();const finish=sound.begin();sound.silence();
  const count=vi.mocked(playCue).mock.calls.length;vi.advanceTimersByTime(5000);finish(true);expect(playCue).toHaveBeenCalledTimes(count);
  const next=sound.begin();next(true);expect(playCue).toHaveBeenLastCalledWith('tx.confirmed');
 });
 it('never restarts a pending loop when signing finishes after dismissal',()=>{
  const sound=new TransactionSounds(),scope=sound.scope();scope.wallet();sound.silence();
  const count=vi.mocked(playCue).mock.calls.length;scope.wallet();scope.failure();scope.begin()(true);vi.advanceTimersByTime(8000);
  expect(playCue).toHaveBeenCalledTimes(count);
 });
});
