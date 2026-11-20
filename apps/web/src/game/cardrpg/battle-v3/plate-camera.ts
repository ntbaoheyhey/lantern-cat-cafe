/** Alternate camera takes reuse the original encoded painting without extra media. */
export const ALTERNATE_CAMERAS={
 mochi:'lantern-rise',soot:'ember-whip',clover:'petal-orbit',panko:'oven-drop',
 biscuit:'crumb-arc',mallow:'frost-climb',sorrel:'tea-pullback',inkcap:'ink-dutch',
 cinnamon:'spice-sweep',brioche:'steam-orbit',velvet:'moon-reveal',marigold:'crane-ascent',
} as const;
export function alternatePlateCamera(owner:string,progress:number){
 if(progress<=0||progress>=1)return {x:0,y:0,angle:0,zoom:1};
 const p=Math.max(0,Math.min(1,progress)),e=Math.sin(Math.PI*p);
 let x=0,y=0,angle=0,zoom=1+.22*e;
 switch(owner){
  case 'mochi':y=5*e*(1-2*p);break;
  case 'soot':x=7*e*(2*p-1);angle=-.018*e;break;
  case 'clover':x=5*e*Math.sin(p*5);y=3*e*Math.cos(p*5);break;
  case 'panko':y=7*e*(2*p-1);break;
  case 'biscuit':x=-5*e;y=3*e*Math.sin(p*4);angle=.02*e;break;
  case 'mallow':y=-6*e;zoom=1+.25*e;break;
  case 'sorrel':zoom=1+.26*e*(1-p);y=2*e*(1-p);break;
  case 'inkcap':angle=.035*e*(2*p-1);x=3*e;break;
  case 'cinnamon':x=6*e*Math.sin(p*3);y=-2*e;break;
  case 'brioche':x=-4*e*Math.sin(p*5);y=4*e*Math.cos(p*5);break;
  case 'velvet':x=-6*e*(1-p);angle=-.015*e;break;
  case 'marigold':y=6*e*(1-2*p);x=2*e;break;
  default:return {x:0,y:0,angle:0,zoom:1};
 }
 return {x,y,angle,zoom};
}
