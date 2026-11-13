import authoredVoiceProfiles from './voice-profiles.json';
export const CATS=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'] as const;
export const BUS_NAMES=['master','music','ambience','sfx','voice','ui'] as const;
export type Bus=typeof BUS_NAMES[number];
export const CUE_ALIASES: Readonly<Record<string,string>> = {
 'ui.forge-success':'ui.forge.success',
 'ui.forge-fail':'ui.forge.fail',
 'music.map':'music.home',
};
export const voiceProfiles=Object.fromEntries(Object.entries(authoredVoiceProfiles).map(([cat,p])=>[cat,{...p,pitch:2**(p.baseSemitones/12),timbre:String(p.source)}]));
export interface Sample { pack:string; start:number; duration:number; bus:Bus; loop?:boolean; variantId?:string; processedVoice?:boolean; }
export type LayerEq = 'flat'|'high-pass-1800'|'low-shelf-180'|'high-pass-80';
export interface CueLayer {
 role:string; variants:Sample[]; offsetMs:number; eq:LayerEq; gainDb:number;
}
export interface CueDesign {
 bus:Bus; layers:CueLayer[]; pitchRange:[number,number]; gainRange:[number,number];
 cooldownMs:number; priority:number; ducking?:boolean;
 /** Frequent UI composites retain their constituent identities in the playback log. */
 baked?:Array<{sample:Sample; layers:Array<{role:string;variantId:string;offsetMs:number}>}>;
}
export interface AudioManifest {
 version:number; packs:Record<string,{webm:string;mp3:string}>; cues:Record<string,Sample[]>;
 designs?:Record<string,CueDesign>; bindings?:Record<string,string>;
}
export function resolveDesign(id:string,manifest:AudioManifest,element='magic'):CueDesign|undefined {
 id=CUE_ALIASES[id]??id;
 let key=manifest.bindings?.[id]??id;
 if(id.startsWith('ult.'))key=`kit.${element}.${id.split('.').at(-1)}`;
 if(id.startsWith('skill.'))key=`kit.${element}.${id.endsWith('.cast')?'charge':'impact'}`;
 return manifest.designs?.[key]??manifest.designs?.[manifest.bindings?.[id]??id];
}
export function resolveCue(id:string,manifest:AudioManifest,element='magic'):Sample[]|undefined {
 if(CUE_ALIASES[id])id=CUE_ALIASES[id]!;
 const design=resolveDesign(id,manifest,element);
 if(design)return design.baked?.map(v=>v.sample)??design.layers[0]?.variants;
 if(manifest.cues[id])return manifest.cues[id];
 if(id.startsWith('voice.'))return manifest.cues['voice.meow'];
 if(id.startsWith('ult.'))return manifest.cues[`kit.${element}.${id.split('.').at(-1)}`]??manifest.cues[`kit.magic.${id.split('.').at(-1)}`];
 if(id.startsWith('skill.'))return manifest.cues[`kit.${element}.${id.endsWith('.cast')?'charge':'impact'}`]??manifest.cues['hit.magic'];
 if(id.startsWith('status.'))return manifest.cues[`status.${id.split('.')[1]}.${id.split('.').at(-1)}`]??manifest.cues['status.shield.on'];
 return undefined;
}
export const EVENT_CUES:Record<string,string>={
 round_start:'ui.turn',turn_start:'ui.turn',action_start:'kit.magic.charge',travel:'kit.slash.release',damage:'hit.blunt',heal:'ui.heal',shield:'status.shield.on',status_apply:'status.burn.on',status_expire:'status.burn.off',interrupt:'ui.block',passive:'ui.heal',death:'ui.death',intent:'ui.turn',wave_clear:'ui.reward',wave_start:'ui.open',boss_phase:'kit.heavy.charge',victory:'music.victory',defeat:'music.defeat',loot:'ui.coin',rest:'ui.heal',gear_proc:'ui.reward',turn_end:'ui.turn',charge:'kit.magic.charge',delay:'ui.hover',spawn:'ui.open',fizzle:'ui.fail',snapshot:'ui.turn',
 hit:'hit.blunt','status-tick':'status.burn.tick','status-on':'status.shield.on','status-off':'status.shield.off',crit:'ui.crit',block:'ui.block',cleanse:'status.shield.off',rage:'ui.reward',supply:'ui.heal',
};
export function eventCue(event:{type:string;status?:string;critical?:boolean}):string {
 if(event.critical)return 'ui.crit';
 if(event.status&&['status_apply','status_expire','status-tick'].includes(event.type))return `status.${event.status}.${event.type==='status_apply'?'on':event.type==='status_expire'?'off':'tick'}`;
 return EVENT_CUES[event.type]??'hit.magic';
}
