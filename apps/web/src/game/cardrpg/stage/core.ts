import measured from './opaque-bounds.json';
type Bounds={x:number;y:number;width:number;height:number};
/** Actual setup-pose alpha measurements; see LEARN/Q2.md and the repeatable lab. */
export const UNIT_OPAQUE=new Map(Object.entries(measured.units));
export function opaqueBounds(id:string,source:string,fallback:Bounds){const row=UNIT_OPAQUE.get(id);return row?.source===source?row.world:fallback;}
export function unitCore(id:string,bounds:Bounds){return {id,world:bounds,scale:512/bounds.height,ratio:UNIT_OPAQUE.get(id)?.tier==='boss'?1.6:1};}
export function unitFace(id:string,bounds:Bounds):Bounds{
 const [x,y,w,h]=UNIT_OPAQUE.get(id)?.face??[.2,.12,.6,.34];
 return{x:bounds.x+bounds.width*x!,y:bounds.y+bounds.height*(1-y!-h!),width:bounds.width*w!,height:bounds.height*h!};
}
/** Reflection is relative to the delivered artwork, not automatically to team. */
export function spriteFacing(nativeFacing:string,side:'party'|'enemy'){return (side==='party'?1:-1)*(nativeFacing==='left'?-1:1);}
export const ELEMENT_COLORS:Record<string,string>={mochi:'#ffd77e',soot:'#c18dff',clover:'#91de9a',panko:'#dfb37e',mallow:'#ffa986',sorrel:'#91cdb1',biscuit:'#f4bb62',inkcap:'#a48cdb',cinnamon:'#f89970',brioche:'#eb97bc',velvet:'#9cbce9',marigold:'#f5dc6f'};
