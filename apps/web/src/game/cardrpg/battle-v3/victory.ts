/** Distinct root gestures complement each cat's authored victory bone clip. */
export const VICTORY_GESTURES:Record<string,{name:string;hop:number;sway:number;lean:number;lift:number}>={
 mochi:{name:'shield salute',hop:7,sway:0,lean:-.05,lift:.06},
 soot:{name:'lantern bow',hop:0,sway:2,lean:.13,lift:-.04},
 clover:{name:'leaf hop',hop:22,sway:5,lean:.06,lift:.08},
 panko:{name:'pan salute',hop:10,sway:0,lean:-.09,lift:.05},
 mallow:{name:'oven bounce',hop:17,sway:3,lean:-.03,lift:.10},
 sorrel:{name:'tea bow',hop:0,sway:0,lean:.16,lift:-.05},
 biscuit:{name:'guard salute',hop:5,sway:1,lean:-.07,lift:.09},
 inkcap:{name:'ink flourish',hop:4,sway:9,lean:.12,lift:.03},
 cinnamon:{name:'spice skip',hop:19,sway:11,lean:-.08,lift:.04},
 brioche:{name:'ribbon sway',hop:6,sway:14,lean:.15,lift:.03},
 velvet:{name:'crescent bow',hop:0,sway:6,lean:.19,lift:-.03},
 marigold:{name:'flower spring',hop:25,sway:7,lean:-.06,lift:.07},
};
export function victoryPose(id:string,seconds:number,reduced=false){
 const g=VICTORY_GESTURES[id]??VICTORY_GESTURES.mochi!,t=reduced?.75:Math.max(0,seconds),u=(t%2.8)/2.8;
 const wave=Math.sin(Math.PI*u),hop=reduced?0:Math.max(0,Math.sin(u*Math.PI*2));
 return {x:reduced?0:g.sway*Math.sin(u*Math.PI*2),y:-g.hop*hop,angle:g.lean*wave,sx:1-g.lift*wave*.45,sy:1+g.lift*wave};
}
