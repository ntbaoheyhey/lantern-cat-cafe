// Static CSS-pair check supplements the browser's measured computed colors.
const parse=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),luma=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
export const contrast=(foreground,background)=>{const a=luma(parse(foreground)),b=luma(parse(background));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
