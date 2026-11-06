import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const emblems={
  mochi:'M16 11L30 6L44 11V29Q30 46 16 29Z M24 22H36M30 16V29',
  soot:'M21 12H39L36 35H24ZM25 8L30 3L35 8M25 20L35 27M35 20L25 27',
  clover:'M30 36V20C12 32 9 8 23 13L30 20C34 4 50 12 40 24L30 26',
  panko:'M12 28Q14 7 30 11Q47 8 48 28L42 36H18ZM22 14L25 24M33 13L36 23',
  mallow:'M29 40L31 24M30 25C7 16 23 4 30 10C36 2 53 15 30 25M30 10V25',
  sorrel:'M23 8H37M26 8V20Q7 40 30 39Q52 40 34 20V8M19 29H41',
  biscuit:'M14 16L37 34M9 12L15 6M36 39L43 31M18 9L43 28L34 39L10 20Z',
  inkcap:'M10 24Q30 0 50 24ZM25 25V38H35V25M21 18H22M37 17H38',
  cinnamon:'M19 9L12 35L22 39L29 13ZM33 11L29 37L40 39L44 13ZM18 16L25 18',
  brioche:'M39 6Q14 14 38 31Q6 32 17 9M31 22Q43 20 45 34H28ZM36 35V40',
  velvet:'M30 18L9 7L14 36L30 29L47 38L51 8ZM30 18V29M9 7L30 24L51 8',
  marigold:'M30 18C11 3 9 22 23 25C9 41 29 46 30 31C44 47 53 26 37 24C53 9 32 1 30 18Z',
};
const overlays=['M5 48L15 38M6 39L14 47','M45 46Q51 35 57 46Q51 55 45 46Z','M44 36L56 36L56 48L44 48ZM47 42H53M50 39V45','M50 33L53 41L61 43L53 46L50 54L47 46L39 43L47 41Z'];
const palette=['#e8c58e','#93cbb8','#b4a0de','#f0ca68'];
await mkdir('assets/cardrpg2/icons',{recursive:true});const assets=[];
for(const [id,path] of Object.entries(emblems))for(let i=0;i<4;i++){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 60"><g fill="none" stroke="${palette[i]}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/><path d="${overlays[i]}"/></g></svg>`;
  const output=`assets/cardrpg2/icons/${id}-${i+1}.svg`;await writeFile(output,svg);
  assets.push({id:`${id}-${i+1}`,path:output,sha256:createHash('sha256').update(svg).digest('hex')});
}
await writeFile('assets/provenance/cardrpg-depth-icons.json',JSON.stringify({tool:'Original hand-authored SVG paths, Node.js writer',command:'node tools/cardrpg-depth/icons.mjs',source:'tools/cardrpg-depth/icons.mjs',sourceSha256:createHash('sha256').update(await readFile('tools/cardrpg-depth/icons.mjs')).digest('hex'),externalReferences:[],license:'CC0-1.0',assets},null,2));
console.log(`${assets.length} original skill icons`);
