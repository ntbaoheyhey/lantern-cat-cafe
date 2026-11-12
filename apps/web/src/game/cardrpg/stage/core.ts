/** Measured semantic body bounds; accessories do not determine a unit's size. */
const files=import.meta.glob('../../../../../../art/units/*/core.json',{eager:true,import:'default'}) as Record<string,{id:string;world:{x:number;y:number;width:number;height:number};scale:number;ratio:number}>;
export const UNIT_CORES=new Map(Object.values(files).map(core=>[core.id,core]));
export function unitCore(id:string,bounds:{x:number;y:number;width:number;height:number}){return UNIT_CORES.get(id)??{id,world:bounds,scale:512/bounds.height,ratio:1};}
export const ELEMENT_COLORS:Record<string,string>={mochi:'#ffd77e',soot:'#c18dff',clover:'#91de9a',panko:'#dfb37e',mallow:'#ffa986',sorrel:'#91cdb1',biscuit:'#f4bb62',inkcap:'#a48cdb',cinnamon:'#f89970',brioche:'#eb97bc',velvet:'#9cbce9',marigold:'#f5dc6f'};
