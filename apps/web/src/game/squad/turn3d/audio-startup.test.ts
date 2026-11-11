import { afterEach, expect, it, vi } from 'vitest';
import { resumeAudioContext, warmAudioDevice } from './audio-startup';
import { CafeAudio } from './audio';

function mediaFixture() {
  const media = { currentTime: 0, volume: 0, preload: '', play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), removeAttribute: vi.fn(), load: vi.fn() };
  const create = vi.fn(() => 'blob:sound'), revoke = vi.fn();
  vi.stubGlobal('Audio', vi.fn(function () { return media; }));
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  vi.useFakeTimers();
  return { media, create, revoke };
}
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('waits for actual silent playback, then keeps the device open until context startup finishes', async () => {
  const { media, create, revoke } = mediaFixture(), controller = new AbortController();
  let ready = false;
  const pending = warmAudioDevice(controller.signal).then(release => { ready = true; return release; });
  await vi.advanceTimersByTimeAsync(100); expect(ready).toBe(false); expect(media.play).toHaveBeenCalledOnce();
  expect((create.mock.calls[0] as unknown[])[0]).toBeInstanceOf(Blob);
  media.currentTime = .03; await vi.advanceTimersByTimeAsync(5);
  const release = await pending; expect(media.pause).not.toHaveBeenCalled();
  release(); release(); expect(media.pause).toHaveBeenCalledOnce(); expect(revoke).toHaveBeenCalledWith('blob:sound'); expect(vi.getTimerCount()).toBe(0);
});

it('bounds stalled media and releases the URL before falling back to WebAudio', async () => {
  const { media, revoke } = mediaFixture(), pending = warmAudioDevice(new AbortController().signal);
  await vi.advanceTimersByTimeAsync(1500); await pending;
  expect(media.pause).toHaveBeenCalledOnce(); expect(revoke).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
});

it('releases rejected media without an unhandled play rejection', async () => {
  const { media, revoke } = mediaFixture(); media.play.mockRejectedValueOnce(new Error('NotAllowedError'));
  await warmAudioDevice(new AbortController().signal);
  expect(revoke).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
});

it('coalesces repeated sound clicks and disposal cancels startup before creating a context', async () => {
  const { media, revoke } = mediaFixture(), context = vi.fn(); vi.stubGlobal('AudioContext', context);
  const audio = new CafeAudio(), first = audio.toggle(), second = audio.toggle();
  expect(media.play).toHaveBeenCalledOnce(); audio.dispose(); await Promise.all([first, second]);
  expect(context).not.toHaveBeenCalled(); expect(audio.enabled).toBe(false); expect(audio.blocked).toBe(false);
  expect(revoke).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
});

it.each(['reject','throw','timeout','cancel'] as const)('releases a %s during context resume and clears its timer', async mode => {
  vi.useFakeTimers();const controller = new AbortController();
  const resume = vi.fn(() => mode === 'reject' ? Promise.reject(new Error('Denied')) : new Promise<void>(()=>{}));
  if(mode === 'throw')resume.mockImplementation(()=>{throw new Error('Device unavailable');});
  const pending = resumeAudioContext({resume} as unknown as AudioContext,controller.signal).catch(error=>error);
  if(mode === 'timeout')await vi.advanceTimersByTimeAsync(4000);
  if(mode === 'cancel')controller.abort();
  expect(await pending).toBeInstanceOf(Error);expect(vi.getTimerCount()).toBe(0);
});

function contextFixture() {
  const gain = {value:1,setTargetAtTime:vi.fn()}, node = () => ({connect:(target:unknown)=>target,disconnect:vi.fn()});
  const ctx = {state:'suspended',sampleRate:44100,currentTime:0,destination:{},resume:vi.fn<()=>Promise<void>>(),close:vi.fn().mockResolvedValue(undefined),
    createGain:()=>({...node(),gain}),createDynamicsCompressor:()=>({...node(),threshold:{value:0},knee:{value:0},ratio:{value:0},attack:{value:0},release:{value:0}}),
    createBuffer:(_channels:number,length:number)=>({getChannelData:()=>new Float32Array(length)})};
  const construct=vi.fn(function(){return ctx;});vi.stubGlobal('Audio',undefined);vi.stubGlobal('AudioContext',construct);
  return {ctx,construct,gain};
}
it('bounds a stalled context, ignores its late completion and lets the next gesture enable then mute', async () => {
  vi.useFakeTimers();const {ctx,construct,gain}=contextFixture(),audio=new CafeAudio();vi.spyOn(audio,'ui').mockImplementation(()=>{});
  let finish!:()=>void;ctx.resume.mockImplementationOnce(()=>new Promise(resolve=>{finish=()=>{ctx.state='running';resolve();};}));
  const first=audio.toggle(),repeated=audio.toggle();expect(audio.pending).toBe(true);
  await vi.advanceTimersByTimeAsync(4000);await Promise.all([first,repeated]);
  expect(ctx.resume).toHaveBeenCalledOnce();expect(construct).toHaveBeenCalledOnce();expect(audio.pending).toBe(false);expect(audio.blocked).toBe(true);expect(audio.enabled).toBe(false);expect(gain.value).toBe(0);
  finish();await Promise.resolve();expect(audio.enabled).toBe(false);expect(audio.ui).not.toHaveBeenCalled();
  ctx.resume.mockResolvedValue(undefined);await audio.toggle();expect(audio.enabled).toBe(true);expect(audio.blocked).toBe(false);expect(audio.pending).toBe(false);
  await audio.toggle();expect(audio.enabled).toBe(false);expect(gain.setTargetAtTime).toHaveBeenLastCalledWith(0,0,.04);expect(vi.getTimerCount()).toBe(0);audio.dispose();
});
it('cancels a pending context on disposal without waiting for the device or reporting an error',async()=>{
  vi.useFakeTimers();const {ctx}=contextFixture(),audio=new CafeAudio();ctx.resume.mockImplementation(()=>new Promise(()=>{}));
  const pending=audio.toggle();await Promise.resolve();expect(audio.pending).toBe(true);audio.dispose();await pending;
  expect(audio.pending).toBe(false);expect(audio.blocked).toBe(false);expect(audio.enabled).toBe(false);expect(ctx.close).toHaveBeenCalledOnce();expect(vi.getTimerCount()).toBe(0);
});
