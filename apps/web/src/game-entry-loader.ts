export type GameEntry='depth'|'cardrpg'|'squad3d'|'squad'|'legacy';
/** Make the judge-facing game the default while retaining explicit older routes. */
export function gameEntry(search:string):{entry:GameEntry;search:string}{
 const query=new URLSearchParams(search);
 if(query.get('legacy')==='1')return{entry:'legacy',search:'?'+query.toString()};
 const selected:GameEntry|undefined=query.get('cardrpg2')==='1'?'depth':query.get('cardrpg')==='1'?'cardrpg':query.get('squad3d')==='1'?'squad3d':query.get('squad')==='1'?'squad':undefined;
 if(!selected){
  for(const [key,value]of Object.entries({demo:'1',squad:'1',cardrpg2:'1',a6:'1',ui:'v3'}))query.set(key,value);
 }else{
  query.set('demo','1');query.set('squad','1');
 }
 return{entry:selected??'depth',search:'?'+query.toString()};
}
