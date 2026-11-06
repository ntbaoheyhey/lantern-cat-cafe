import { CARD_EFFECT_RECIPES } from './card-effect-data';
import { LAB_EFFECT_RECIPES } from './card-lab-effects';
export interface CardSoundScore { element: string; root: number; notes: [number, number, number]; gap: number; tail: number; wave: OscillatorType; noise: number; ultimate: boolean }
const cache = new Map<string, CardSoundScore>();
export function cardSoundScore(id: string): CardSoundScore {
  const cached = cache.get(id); if (cached) return cached;
  let seed = 2166136261;
  for (let i = 0; i < id.length; i++) { seed ^= id.charCodeAt(i); seed = Math.imul(seed, 16777619); }
  seed >>>= 0;
  const recipe = CARD_EFFECT_RECIPES[id] ?? LAB_EFFECT_RECIPES[id];
  const element = recipe?.element ?? (id.includes('heal') ? 'garden' : id.includes('Attack') ? 'blunt' : 'hearth');
  const palettes: Record<string, [number, OscillatorType, number]> = {
    hearth: [261.63, 'sine', .025], moon: [220, 'sine', .018], garden: [349.23, 'triangle', .02],
    tide: [293.66, 'sine', .06], ember: [196, 'triangle', .12], blunt: [110, 'sine', .09],
    slash: [329.63, 'triangle', .11], pierce: [440, 'sine', .07], thread: [246.94, 'triangle', .04],
    ink: [164.81, 'triangle', .055], holy: [523.25, 'sine', .01],
  };
  const [root, wave, noise] = palettes[element] ?? palettes.hearth!;
  const score: CardSoundScore = { element, root: root * 2 ** ((seed % 7 - 3) / 12),
    notes: [seed % 12, (seed >>> 5) % 17, (seed >>> 10) % 19],
    gap: .048 + (seed % 9) * .009, tail: .16 + (seed % 5) * .035,
    wave, noise, ultimate: !!recipe?.ultimate };
  cache.set(id, score); return score;
}
