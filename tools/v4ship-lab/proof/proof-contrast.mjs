/** Measure proof text against rendered solid backgrounds or every opaque gradient stop.
 * Unknown images/translucency fail closed; this is scoped to receipt/wallet text,
 * not an assertion that every screen satisfies WCAG.
 */
export const proofContrast = page => page.evaluate(() => {
 const parse = value => {
  const channels = value.match(/[\d.]+/g)?.map(Number);
  return channels?.length >= 3 ? [...channels.slice(0,3),channels[3]??1] : null;
 };
 const luminance = rgb => rgb.slice(0,3).map(c=>c/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[0.2126,0.7152,0.0722][i],0);
 const backgrounds = element => {
  for(let node=element;node;node=node.parentElement){
   const style=getComputedStyle(node);
   if(Number(style.opacity)!==1||style.filter!=='none'||style.mixBlendMode!=='normal')return null;
   if(style.backgroundImage!=='none'){
    if(!/^(?:radial|linear)-gradient\(/.test(style.backgroundImage)||style.backgroundImage.includes('url('))return null;
    const stops=(style.backgroundImage.match(/rgba?\([^)]*\)/g)??[]).map(parse);
    return stops.length&&stops.every(c=>c&&c[3]===1)?stops:null;
   }
   const color=parse(style.backgroundColor);
   if(color?.[3]===1)return [color];
   if(color?.[3])return null;
  }
  return null;
 };
 const selector='.ship-wallet-proof a,.ship-wallet-proof button,.ship-wallet-proof h1,.ship-wallet-proof h2,.ship-wallet-proof p,.ship-wallet-proof strong,.ship-receipt-toast strong,.ship-receipt-toast dt,.ship-receipt-toast dd,.ship-receipt-toast small,.ship-receipt-toast a,.ship-receipt-toast button';
 return [...document.querySelectorAll(selector)].filter(e=>e.checkVisibility()&&!e.closest('[inert],[aria-hidden="true"]')).map(element=>{
  const style=getComputedStyle(element),foreground=parse(style.color),surfaces=backgrounds(element);
  const ratios=foreground&&surfaces?surfaces.map(background=>{
   const blended=foreground.slice(0,3).map((c,i)=>c*foreground[3]+background[i]*(1-foreground[3]));
   const a=luminance(blended),b=luminance(background);
   return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
  }):[];
  const ratio=ratios.length?Math.min(...ratios):null;
  return {scope:element.closest('.ship-wallet-proof')?'wallet':'receipt',tag:element.tagName.toLowerCase(),text:element.textContent?.trim().slice(0,90),foreground:style.color,backgrounds:surfaces?.map(c=>c.slice(0,3))??null,ratio:ratio===null?null:Number(ratio.toFixed(3)),minimum:4.5,pass:ratio!==null&&ratio>=4.5};
 });
});
