/** Only a successfully prepared commissioned media body opts out of legacy motion. */
export function hasDesignerIdleBody(asset:string,actor:object){
 return (asset==='mochi'||asset==='clover'||asset==='soot')&&'designerIdle' in actor&&actor.designerIdle===true;
}
