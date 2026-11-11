import config from '../../../../../../assets/cardrpg-look/spine/config.json';
import registry from '../../../../../../assets/cardrpg-look/spine/slots.json';
export const SPINE_CONFIG=config;
// Intake validates these optional delivery records; their types must not depend
// on whether this checkout happens to contain a designer export yet.
export type SpineUnit=Omit<(typeof registry.units)[number],'designer'|'sequence'|'activeSource'>&{designer:AcceptedSkeleton|null;sequence:AcceptedSequence|null;activeSource?:'designer'|'sequence'};
export const SPINE_UNITS=registry.units as SpineUnit[];
export const SPINE_UNIT_BY_ID=new Map(SPINE_UNITS.map(unit=>[unit.id,unit]));
export const SPINE_SKILLS=new Map(SPINE_UNITS.flatMap(unit=>unit.skills.map(skill=>[skill.id,skill] as const)));
export type SpineSocket=keyof typeof config.sockets;
export type SpineAnimation=keyof typeof config.animations;
export interface AcceptedSkeleton {format?:'json'|'binary';skeleton:string;atlas:string;scale:number;revision?:string}
export interface AcceptedSequence {format:'sequence';manifest:string;scale:number;revision?:string}
export function lookSpineEnabled(search=typeof location==='undefined'?'':location.search,look=typeof window!=='undefined'&&window.__LOOK_V2__===true){
 const query=new URLSearchParams(search);return query.get('lookSpine')==='1'||query.get('lookSpine')!=='0'&&(query.get('demo')==='1'||look);
}
export function lookV3DEnabled(search=typeof location==='undefined'?'':location.search){return new URLSearchParams(search).get('lookV3D')==='1'&&!lookSpineEnabled(search);}
