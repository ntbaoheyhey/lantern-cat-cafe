import { expect, it, vi } from 'vitest';
import { CafeAudio } from './audio';
import { cardSoundScore } from './card-audio-score';
import { CARD_EFFECT_RECIPES } from './card-effect-data';
import { LAB_EFFECT_RECIPES } from './card-lab-effects';
it('gives every authored identity a deterministic, distinct audible score',()=>{
 const ids=[...Object.keys(CARD_EFFECT_RECIPES),...Object.keys(LAB_EFFECT_RECIPES)],seen=new Set<string>();
 for(const id of ids){const score=cardSoundScore(id),key=JSON.stringify(score);expect(seen.has(key),id).toBe(false);seen.add(key);expect(cardSoundScore(id)).toBe(score);expect(score.root).toBeGreaterThan(80);expect(score.root).toBeLessThan(1000);expect(score.notes).toHaveLength(3);}
});
it('clamps optional volume preferences and never opens audio before a sound click',()=>{
 const AudioContext=vi.fn();vi.stubGlobal('AudioContext',AudioContext);
 localStorage.setItem('tbh-card-audio-v1',JSON.stringify({version:1,volume:8,muted:false}));
 const audio=new CafeAudio();audio.useBrowserPreferences(true);expect(audio.volume).toBe(1);expect(audio.enabled).toBe(false);expect(AudioContext).not.toHaveBeenCalled();
 audio.setVolume(-2);expect(audio.volume).toBe(0);audio.setVolume(NaN);expect(audio.volume).toBe(0);audio.setVolume(.35);expect(JSON.parse(localStorage.getItem('tbh-card-audio-v1')!).volume).toBe(.35);audio.dispose();vi.unstubAllGlobals();localStorage.clear();
});
it('keeps offline audio controls free of storage writes',()=>{
 const read=vi.spyOn(Storage.prototype,'getItem'),write=vi.spyOn(Storage.prototype,'setItem');const audio=new CafeAudio();audio.useBrowserPreferences(false);audio.setVolume(.4);audio.dispose();expect(read).not.toHaveBeenCalled();expect(write).not.toHaveBeenCalled();read.mockRestore();write.mockRestore();
});
