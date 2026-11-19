/**
 * V10 enemy presence. Painted enemy cut-outs read as stickers when only the
 * generic sway moves them, so each archetype gets its own small idle life on
 * top of it (a hovering moth, a rocking teacup, a heavy giant's breath) and a
 * colour grade that lifts the pastel paintings off the wooden floor.
 * Pure functions: same time in, same pose out, so replays stay exact.
 */
export interface EnemyLife {y:number;sx:number;sy:number;angle:number}
/** Saturation and contrast for painted enemies; cats keep their designer colours. */
export const ENEMY_GRADE:readonly [number,number]=[1.22,1.1];
export const IDENTITY_GRADE:readonly [number,number]=[1,1];

type Profile={bob:number;bobHz:number;breath:number;breathHz:number;rock:number;rockHz:number};
const PROFILES:Record<string,Profile>={
 // Hovering flyer: clear vertical bob with a light wing-beat squash.
 'needle-moth':{bob:9,bobHz:.9,breath:.03,breathHz:2.4,rock:.03,rockHz:.7},
 // Teacup on spindly legs: rocks side to side like a wobbling cup.
 'teacup-healer':{bob:2,bobHz:1.6,breath:.018,breathHz:1.6,rock:.045,rockHz:.8},
 // Armoured button: slow, heavy breath, almost no sway.
 'button-guard':{bob:0,bobHz:0,breath:.024,breathHz:.55,rock:.012,rockHz:.45},
 // The boss: deep breath that lifts the whole mass.
 'yarn-giant':{bob:0,bobHz:0,breath:.03,breathHz:.38,rock:.014,rockHz:.3},
 'spool-ram':{bob:1,bobHz:1.2,breath:.02,breathHz:.9,rock:.02,rockHz:.6},
};
const DEFAULT:Profile={bob:1.5,bobHz:1,breath:.018,breathHz:.8,rock:.015,rockHz:.6};

/** `height` is the field height in px (bob amplitudes are authored at 720). */
export function enemyIdleLife(asset:string,time:number,lane:number,height:number,reduced:boolean):EnemyLife{
 if(reduced)return {y:0,sx:1,sy:1,angle:0};
 const p=PROFILES[asset]??DEFAULT,k=height/720,phase=lane*1.7+asset.length*.37,TAU=Math.PI*2;
 const breath=Math.sin(time*TAU*p.breathHz+phase);
 // Bob is negative-up in screen px; ease the bottom of the arc so it floats.
 const bob=p.bob?-((Math.sin(time*TAU*p.bobHz+phase)*.5+.5)**1.4)*p.bob*k:0;
 return {y:bob,sx:1-breath*p.breath*.45,sy:1+breath*p.breath,angle:Math.sin(time*TAU*p.rockHz+phase*.6)*p.rock};
}

/** Hit-light colour by attacker: each cat's element, a hostile rose for enemies. */
const HIT:Record<string,[number,number,number]>={mochi:[1,.78,.36],soot:[.78,.5,1],clover:[.55,.95,.5]};
export function hitColor(attacker:string|undefined):[number,number,number]{return (attacker&&HIT[attacker])||[1,.42,.38];}
