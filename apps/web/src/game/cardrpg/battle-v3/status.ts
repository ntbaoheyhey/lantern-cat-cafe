export type BodyStatus='burn'|'freeze'|'poison'|'bleed'|'stun'|'shield'|'buff'|'debuff';
export const STATUS_BODY:Record<string,BodyStatus>={
 scald:'burn',snag:'bleed',bitter:'poison',drowsy:'stun',
 cozy:'buff',steep:'buff',shelter:'buff',riposte:'buff',link:'buff',sprout:'buff',
 glaze:'shield',decoy:'shield',tangle:'debuff',crumb:'debuff',scent:'debuff',
 rattled:'debuff',hush:'debuff',brittle:'debuff',
 burn:'burn',freeze:'freeze',frozen:'freeze',poison:'poison',bleed:'bleed',stun:'stun',shield:'shield',
};
export const STATUS_COLOR:Record<BodyStatus,string>={burn:'#ff9446',freeze:'#8ce8ff',poison:'#a6f46c',bleed:'#ff5874',stun:'#ffe485',shield:'#d9f5ff',buff:'#86ecc3',debuff:'#bba2d6'};
export const STATUS_PATH:Record<BodyStatus,string>={
 burn:'M10 1C12 7 17 7 17 13A7 7 0 1 1 3 13C3 8 7 8 7 4L9 10Z',
 freeze:'M10 1V19M2 5L18 15M2 15L18 5M7 3L10 6L13 3M7 17L10 14L13 17',
 poison:'M6 2H14M8 2V8L3 16Q2 19 5 19H15Q18 19 17 16L12 8V2M5 14H15',
 bleed:'M10 1Q2 11 3 14A7 7 0 0 0 17 14Q18 11 10 1Z',
 stun:'M10 1L13 7L19 8L14 12L16 19L10 15L4 19L6 12L1 8L7 7Z',
 shield:'M10 1L18 4V11Q17 16 10 19Q3 16 2 11V4Z',
 buff:'M3 11L10 3L17 11M6 16L10 12L14 16',
 debuff:'M3 9L10 17L17 9M6 4L10 8L14 4',
};
export function bodyStatuses(statuses:readonly (string|{id:string})[]=[],shield=0):BodyStatus[]{
 const all=statuses.map(s=>STATUS_BODY[typeof s==='string'?s:s.id]??'debuff');
 if(shield>0)all.push('shield');return [...new Set(all)];
}
