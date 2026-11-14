import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CATS,ENEMIES,STATUS_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {EQUIPMENT_SLOTS,CURRENCY_IDS} from '@taskbar-hero/game-rules/src/cardrpg/contract';
import {SOUND_MAP,SOUND_CUES,SOUND_SCREENS,SOUND_SLOTS,SOUND_CURRENCIES,mappedCue} from './sound-map';
import {CUE_ALIASES,EVENT_CUES,resolveCue,resolveDesign,type AudioManifest} from './cues';

describe('production sound plan coverage',()=>{
  const manifest=JSON.parse(readFileSync(resolve(import.meta.dirname,'../../public/audio/manifest.json'),'utf8')) as AudioManifest;
  it('retains all shipped cues and fixes the screen forge aliases',()=>{
    for(const cue of [...Object.keys(manifest.cues),...Object.values(EVENT_CUES)])expect(mappedCue(cue),cue).toBeDefined();
    for(const [alias,id] of Object.entries(CUE_ALIASES)){
      expect(mappedCue(alias),alias).toBeDefined();
      expect(resolveCue(alias,manifest),alias).toEqual(resolveCue(id,manifest));
      expect(resolveDesign(alias,manifest),alias).toBe(resolveDesign(id,manifest));
      expect(manifest.cues[id]?.length,id).toBeGreaterThan(0);
    }
  });
  it('covers live cat skills, enemy mechanics, statuses, gear slots and every ambience transition',()=>{
    for(const cat of CATS)for(const skill of cat.skills){
      if(skill.type==='ultimate')for(const phase of ['charge','release','impact','tail'])expect(mappedCue(`ult.${cat.id}.${phase}`)).toBeDefined();
      else{
        expect(mappedCue(`skill.${cat.id}.${skill.id.split('-').at(-1)}.cast`)).toBeDefined();
        expect(mappedCue(`voice.${cat.id}.skill.${skill.id}`)).toBeDefined();
      }
    }
    for(const enemy of ENEMIES)for(const phase of ['charge','release'])expect(mappedCue(`voice.${enemy.id}.ult.${phase}`)).toBeDefined();
    for(const status of Object.keys(STATUS_BY_ID))for(const phase of ['on','off','tick'])expect(mappedCue(`status.${status}.${phase}`)).toBeDefined();
    expect([...SOUND_SLOTS].sort()).toEqual([...EQUIPMENT_SLOTS].sort());
    for(const currency of CURRENCY_IDS)expect(SOUND_CURRENCIES).toContain(currency);
    for(const screen of SOUND_SCREENS)expect(mappedCue(`ambience.${screen}`)?.loop).toBe(true);
  });
  it('uses one definition per screen event and safe layer, pitch and ducking policies',()=>{
    expect(new Set(SOUND_MAP.map(r=>`${r.screen}:${r.event}`)).size).toBe(SOUND_MAP.length);
    expect(SOUND_MAP.length).toBeGreaterThanOrEqual(160);
    expect(SOUND_SCREENS.length).toBeGreaterThanOrEqual(18);
    for(const row of SOUND_CUES.values()){
      expect(row.pitchRange[0]).toBeGreaterThan(0);
      expect(row.pitchRange[1]).toBeGreaterThanOrEqual(row.pitchRange[0]);
      expect(row.layers.every(l=>l.offsetMs>=0&&l.offsetMs<=25)).toBe(true);
      if(row.cueId.startsWith('hit.')){expect(row.layers.length).toBeGreaterThanOrEqual(3);expect(row.layers.every(l=>l.variants>=4)).toBe(true);}
      if(row.cueId.startsWith('voice.')||row.cueId.startsWith('ult.'))expect(row.ducking).toEqual({bus:'music',db:-8,attackMs:120,releaseMs:400});
    }
    expect(mappedCue('count.tick')?.cooldownMs).toBe(50);
    expect(mappedCue('tx.pending')?.loop).toBe(true);
    expect(mappedCue('typo.nonexistent')).toBeUndefined();
  });
});
