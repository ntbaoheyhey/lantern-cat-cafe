/** A blocked device must release the sound control even if resume never settles. */
export function resumeAudioContext(context: AudioContext, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Sound startup cancelled')); return; }
    const finish = (error?: unknown) => {
      clearTimeout(timeout); signal.removeEventListener('abort', cancel);
      if (error) reject(error); else resolve();
    };
    const cancel = () => finish(new Error('Sound startup cancelled'));
    const timeout = setTimeout(() => finish(new Error('Sound output did not start')), 4000);
    signal.addEventListener('abort', cancel, { once: true });
    try { void context.resume().then(() => finish(), error => finish(error)); }
    catch (error) { finish(error); }
  });
}

/** Open the output device asynchronously after a real sound gesture. */
export async function warmAudioDevice(signal: AbortSignal): Promise<() => void> {
  const noop = () => {};
  if (signal.aborted || typeof Audio === 'undefined' || typeof URL.createObjectURL !== 'function') return noop;
  const rate = 44100, bytes = new ArrayBuffer(44 + rate * 2), view = new DataView(bytes);
  const text = (at: number, value: string) => [...value].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + rate * 2, true); text(8, 'WAVEfmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, rate * 2, true);
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' })), media = new Audio(url);
  // Silent PCM, not muted media: a muted element may never open the output device.
  media.volume = 1; media.preload = 'auto';
  let released = false;
  const release = () => {
    if (released) return; released = true;
    signal.removeEventListener('abort', release);
    media.pause(); media.removeAttribute('src'); media.load(); URL.revokeObjectURL(url);
  };
  signal.addEventListener('abort', release, { once: true });
  try {
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearInterval(poll); clearTimeout(timeout); signal.removeEventListener('abort', cancel);
        if (error) reject(error); else resolve();
      };
      const cancel = () => finish(new Error('Sound startup cancelled'));
      const poll = setInterval(() => { if (media.currentTime >= .02) finish(); }, 5);
      const timeout = setTimeout(() => finish(new Error('Sound output did not advance')), 1500);
      signal.addEventListener('abort', cancel, { once: true });
      void media.play().catch(error => finish(error));
    });
    return release;
  } catch {
    release();
    // Some browsers reject HTML media while allowing WebAudio from this gesture.
    // The caller still checks cancellation before trying the original path.
    return noop;
  }
}
