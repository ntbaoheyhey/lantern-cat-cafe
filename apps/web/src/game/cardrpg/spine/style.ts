/** One palette/timing surface for the painted stage and every Lane C effect. */
export const PAINT = {
 cream:'#fff0ca', honey:'#efbd73', ember:'#d87857', rose:'#d98d99', sage:'#a9c49a', sky:'#a1c5cd', iris:'#b4a1cb',
 ink:'#49333a', wood:'#9d684b', wall:'#bd9470', night:'#42545c', rim:'#63414a',
 glow:.28, rimWidth:2, impactSeconds:2/60, hitstopMs:60, maxZoom:1.10, shake:4, windupStartLimit:.30,
 ultimatePaint:{coreScale:1.8,minCore:1.4,maxCore:1.8,groundScale:1.24,opacity:.88,life:.70,fill:.20,rim:3.5,stroke:2.4},
 worldHeight:1950, catHeight:512, fxPool:256, framingMargin:16,
 cutinSeconds:.8, zoomInSeconds:.18, zoomOutSeconds:.20, phaseSeconds:1.25, entranceStagger:.08,
 stage:{glassTop:'#46555f',glassBottom:'#9a9690',distant:'#4c6263',foliage:'#52665d',leaf:'#8b9c75',
  plasterTop:'#d0ae82',plasterBottom:'#af866a',frame:'#755144',trim:'#d9ae76',sill:'#735042',
  panel:'#8d614e',panelLight:'#bc9063',floorTop:'#c39970',floorBottom:'#825746',seam:'#6b483d',
  rug:'#a57365',rugEdge:'#d8ae82',lamp:'#f0c87f',light:'#f3cf8e',pot:'#b4775f',paper:'#e7cfaa',
  paintingSaturation:1,paintingContrast:1,paintingBrightness:1},
} as const;
