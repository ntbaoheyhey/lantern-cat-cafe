import {squadEnabled} from './game/squad/gate';

export type GameEntry='depth'|'cardrpg'|'squad3d'|'squad'|'legacy';
const selectors=['legacy','demo','squad','cardrpg2','cardrpg','squad3d'];
/** Make the judge-facing game the default while retaining explicit older routes. */
export function gameEntry(search:string):{entry:GameEntry;search:string}{
 const query=new URLSearchParams(search);
 if(!selectors.some(key=>query.has(key))){
  for(const [key,value]of Object.entries({demo:'1',squad:'1',cardrpg2:'1',a6:'1',ui:'v3'}))query.set(key,value);
 }
 const next=query.size?'?'+query.toString():'';
 if(query.get('legacy')==='1'||!squadEnabled(next,query.has('demo')))return{entry:'legacy',search:next};
 return{entry:query.get('cardrpg2')==='1'?'depth':query.get('cardrpg')==='1'?'cardrpg':query.get('squad3d')==='1'?'squad3d':'squad',search:next};
}
