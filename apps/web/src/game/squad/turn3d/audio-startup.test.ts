import { afterEach, expect, it, vi } from 'vitest';
import { warmAudioDevice } from './audio-startup';
import { CafeAudio } from './audio';

function mediaFixture() {
  const media = { currentTime: 0, volume: 0, preload: '', play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), removeAttribute: vi.fn(), load: vi.fn() };
  const create = vi.fn(() => 'blob:sound'), revoke = vi.fn();
  vi.stubGlobal('Audio', vi.fn(function () { return media; }));
  vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
  vi.useFakeTimers();
  return { media, create, revoke };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

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
