/** Original WebAudio synthesis. Context only opens after an explicit sound click. */
import { EFFECT_REGISTRY } from './effects';
import type { EffectFrame } from './effects';
import { cardSoundScore } from './card-audio-score';
import { resumeAudioContext, warmAudioDevice } from './audio-startup';
export type AudioFamily = 'swish' | 'thud' | 'chime' | 'flame' | 'glass' | 'whoosh';
export const AUDIO_SETTINGS = { master: .14, ambient: .018, cue: .14, peakCeiling: .72, notes: [196, 246.94, 293.66, 369.99, 293.66, 246.94, 220, 261.63], sampleRate: 44100 };
export function cueFamily(shape: string): AudioFamily { return ['slash','arrow'].includes(shape) ? 'swish' : ['bash','charge','sweep','cross'].includes(shape) ? 'thud' : ['mend','shelter','rally','wall'].includes(shape) ? 'chime' : ['orb','storm'].includes(shape) ? 'flame' : ['flask','patch'].includes(shape) ? 'glass' : 'whoosh'; }
// Preserve the published original registry signatures; new identities get their own score.
export function cueSignature(id: string) {
  const i = Object.keys(EFFECT_REGISTRY).indexOf(id);
  return i >= 0 ? { notes: [i % 12, (i * 5 + 3) % 17, (i * 7 + 5) % 19], gap: .06 + i % 5 * .012 }
    : { notes: cardSoundScore(id).notes, gap: cardSoundScore(id).gap };
}
const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext) {
  let buffer = noiseBuffers.get(ctx);
  if (buffer) return buffer;
  buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .6), ctx.sampleRate);
  const samples = buffer.getChannelData(0); let seed = 7919;
  for (let i = 0; i < samples.length; i++) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; samples[i] = (seed >>> 0) / 2147483648 - 1; }
  noiseBuffers.set(ctx, buffer); return buffer;
}
function tone(ctx: BaseAudioContext, destination: AudioNode, when: number, frequency: number, end: number,
  duration: number, volume: number, wave: OscillatorType) {
  const gain = ctx.createGain(), oscillator = ctx.createOscillator();
  gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(volume, when + .009);
  gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
  oscillator.type = wave; oscillator.frequency.setValueAtTime(frequency, when);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, end), when + duration);
  oscillator.connect(gain).connect(destination); oscillator.start(when); oscillator.stop(when + duration + .02);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
function noise(ctx: BaseAudioContext, destination: AudioNode, when: number, duration: number, volume: number, frequency: number) {
  const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
  source.buffer = noiseBuffer(ctx); filter.type = 'bandpass'; filter.frequency.value = frequency; filter.Q.value = .8;
  gain.gain.setValueAtTime(0, when); gain.gain.linearRampToValueAtTime(volume, when + .012); gain.gain.exponentialRampToValueAtTime(.0001, when + duration);
  source.connect(filter).connect(gain).connect(destination); source.start(when); source.stop(when + duration + .02);
  source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
}
export function synthCue(ctx: BaseAudioContext, destination: AudioNode, family: AudioFamily, beat: number, when: number, variant = 0) {
  const duration = beat === 2 ? .18 : beat === 0 ? .12 : .24;
  const base = { swish: 170, thud: 84, chime: 587, flame: 210, glass: 1046, whoosh: 330 }[family] * 2 ** ((variant % 19) / 19);
  const volume = beat === 2 ? .26 : .10;
  tone(ctx, destination, when, base * (beat === 0 ? .75 : 1.5), base * (family === 'thud' ? .35 : .7), duration, volume, family === 'flame' ? 'triangle' : 'sine');
  if (['swish','flame','whoosh','glass'].includes(family)) noise(ctx, destination, when, duration, volume * .3, family === 'glass' ? 4000 : 1200);
}
export function synthCardCue(ctx: BaseAudioContext, destination: AudioNode, id: string, beat: number, when: number) {
  const score = cardSoundScore(id);
  if (beat === 0) {
    for (let i = 0; i < 3; i++) {
      const frequency = score.root * 2 ** (score.notes[i]! / 12);
      tone(ctx, destination, when + i * score.gap, frequency * .94, frequency, score.tail, .045, score.wave);
    }
  } else if (beat === 2) {
    tone(ctx, destination, when, score.root * 1.5, score.root * .7, score.ultimate ? .36 : .20, score.ultimate ? .20 : .15, score.wave);
    noise(ctx, destination, when, .20, score.noise, score.root * 7);
    if (score.ultimate) for (let i = 0; i < 3; i++) tone(ctx, destination, when + .04 + i * .06, score.root * [1, 1.25, 1.5][i]!, score.root, .34, .045, 'sine');
  } else if (beat === 4 && score.ultimate) tone(ctx, destination, when, score.root * 2, score.root, .32, .04, 'sine');
}
export function synthCardKill(ctx: BaseAudioContext, destination: AudioNode, id: string, when: number) {
  const root = cardSoundScore(id).root;
  tone(ctx, destination, when + .02, root * 2, root, .32, .08, 'sine');
  tone(ctx, destination, when + .10, root * 3, root * 2, .30, .055, 'sine');
}
const PREFERENCE_KEY = 'tbh-card-audio-v1';
export class CafeAudio {
  enabled = false; blocked = false; volume = .7;
  private persist = false;
  private startup: AbortController | null = null;
  private starting: Promise<void> | null = null;
  get pending() { return this.startup !== null; }
  private ctx: AudioContext | null = null; private master: GainNode | null = null; private compressor: DynamicsCompressorNode | null = null;
  private key = ''; private round = 0; private actor = ''; private note = 0; private nextNote = 0;
  useBrowserPreferences(enabled: boolean) {
    if (!enabled || this.persist) return; this.persist = true;
    try { const saved = JSON.parse(localStorage.getItem(PREFERENCE_KEY) ?? 'null'); if (saved?.version === 1 && Number.isFinite(saved.volume)) this.volume = Math.max(0, Math.min(1, saved.volume)); } catch { /* Optional UI preference. */ }
  }
  private remember() {
    if (this.persist) try { localStorage.setItem(PREFERENCE_KEY, JSON.stringify({ version: 1, volume: this.volume, muted: !this.enabled })); } catch { /* Current controls remain usable. */ }
  }
  setVolume(volume: number) {
    if (!Number.isFinite(volume)) return; this.volume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(this.enabled ? AUDIO_SETTINGS.master * this.volume : 0, this.ctx.currentTime, .025);
    this.remember();
  }
  async toggle() {
    if (this.starting) return this.starting;
    if (this.enabled) { this.enabled = false; this.master?.gain.setTargetAtTime(0, this.ctx!.currentTime, .04); this.remember(); return; }
    const controller = new AbortController(); this.startup = controller; this.blocked = false;
    const task = this.enable(controller.signal); this.starting = task;
    try { await task; } finally { if (this.startup === controller) { this.startup = null; this.starting = null; } }
  }
  private async enable(signal: AbortSignal) {
    let release = () => {};
    try {
      if (!this.ctx) release = await warmAudioDevice(signal);
      if (signal.aborted) return;
      this.ctx ??= new AudioContext({ sampleRate: AUDIO_SETTINGS.sampleRate });
      if (!this.master) {
        this.master = this.ctx.createGain(); this.master.gain.value = 0; this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -8; this.compressor.knee.value = 5; this.compressor.ratio.value = 8;
        this.compressor.attack.value = .004; this.compressor.release.value = .12;
        this.master.connect(this.compressor).connect(this.ctx.destination); noiseBuffer(this.ctx);
      }
      await resumeAudioContext(this.ctx, signal);
      if (signal.aborted || !this.ctx || !this.master) return;
      this.enabled = this.ctx.state === 'running'; this.blocked = !this.enabled;
      this.master.gain.setTargetAtTime(this.enabled ? AUDIO_SETTINGS.master * this.volume : 0, this.ctx.currentTime, .04);
      this.nextNote = this.ctx.currentTime; this.key = ''; this.ui(); this.remember();
    } catch { if (!signal.aborted) { this.blocked = true; this.enabled = false; } }
    finally { release(); }
  }
  ui() { if (this.enabled && this.ctx && this.master) synthCue(this.ctx, this.master, 'chime', 0, this.ctx.currentTime, 4); }
  update(frame: EffectFrame | null, round: number, actor: string | null, quiet: boolean, ambienceScale = 1) {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, id = frame?.plan.presentationId || frame?.plan.skillId || '';
    const key = frame ? `${frame.plan.id}/${id}/${frame.beat.kind}` : '';
    if (key && key !== this.key) {
      this.key = key; const beat = ['anticipation','travel','impact','reaction','residue'].indexOf(frame!.beat.kind);
      synthCardCue(this.ctx, this.master, id, beat, now);
      if (beat === 2) for (const cue of frame!.plan.presentationCues ?? []) if (cue.startsWith('auto-extra:')) {
        synthCardCue(this.ctx, this.master, cue, 0, now + .045);
      }
      if (beat === 2 && frame!.plan.events.some(event => event.type === 'death')) {
        synthCardKill(this.ctx, this.master, id, now);
      }
      if (beat === 0 && ['victory','defeat'].includes(id)) for (let i = 0; i < 4; i++) synthCue(this.ctx, this.master, id === 'victory' ? 'chime' : 'thud', 0, now + i * .16, i * 2);
    }
    if (round !== this.round) { this.round = round; synthCue(this.ctx, this.master, 'chime', 0, now, 2); }
    if (actor && actor !== this.actor) { this.actor = actor; synthCue(this.ctx, this.master, 'glass', 0, now, 1); }
    if (!quiet && now >= this.nextNote) {
      this.nextNote = now + .65;
      const frequency = AUDIO_SETTINGS.notes[this.note++ % AUDIO_SETTINGS.notes.length]! * ambienceScale;
      tone(this.ctx, this.master, now, frequency, frequency, 1.2, AUDIO_SETTINGS.ambient, 'sine');
    }
  }
  dispose() { this.startup?.abort(); this.startup = null; this.starting = null; this.enabled = false; this.master?.disconnect(); this.compressor?.disconnect(); void this.ctx?.close(); this.ctx = null; this.master = null; this.compressor = null; }
}
