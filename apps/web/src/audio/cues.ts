export const CATS=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'] as const;
export const BUS_NAMES=['master','music','ambience','sfx','voice','ui'] as const;
export type Bus=typeof BUS_NAMES[number];
export const voiceProfiles=Object.fromEntries(CATS.map((cat,i)=>[cat,{pitch:2**((-9+(i%6)*4)/12),speed:.085+(i%3)*.022,brightness:i<6?750+i*200:2400+(i-6)*350,timbre:i<6?'warm':'bright'}]));
export interface Sample { pack:string; start:number; duration:number; bus:Bus; loop?:boolean; }
export interface AudioManifest { version:number; packs:Record<string,{webm:string;mp3:string}>; cues:Record<string,Sample[]>; }
export function resolveCue(id:string,manifest:AudioManifest,element='magic'):Sample[]|undefined {
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
