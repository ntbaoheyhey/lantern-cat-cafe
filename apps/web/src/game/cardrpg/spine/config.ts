import config from '../../../../../../assets/cardrpg-look/spine/config.json';
import registry from '../../../../../../assets/cardrpg-look/spine/slots.json';
export const SPINE_CONFIG=config;
export const SPINE_UNITS=registry.units;
export const SPINE_UNIT_BY_ID=new Map(SPINE_UNITS.map(unit=>[unit.id,unit]));
export const SPINE_SKILLS=new Map(SPINE_UNITS.flatMap(unit=>unit.skills.map(skill=>[skill.id,skill] as const)));
export type SpineUnit=(typeof SPINE_UNITS)[number];
export type SpineSocket=keyof typeof config.sockets;
export type SpineAnimation=keyof typeof config.animations;
export interface AcceptedSkeleton {format?:'json'|'binary';skeleton:string;atlas:string;scale:number;revision?:string}
export interface AcceptedSequence {format:'sequence';manifest:string;scale:number;revision?:string}
export function lookSpineEnabled(search=typeof location==='undefined'?'':location.search,look=typeof window!=='undefined'&&window.__LOOK_V2__===true){
 const query=new URLSearchParams(search);return query.get('lookSpine')==='1'||query.get('lookSpine')!=='0'&&(query.get('demo')==='1'||look);
}
export function lookV3DEnabled(search=typeof location==='undefined'?'':location.search){return new URLSearchParams(search).get('lookV3D')==='1'&&!lookSpineEnabled(search);}
