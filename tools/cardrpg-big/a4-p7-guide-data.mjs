// REFERENCE: GAMEPLAY-V4 P7. Documentation tables from the exact production catalogue.
import {loadRules} from './a4-load.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const {rules:C,load,vite}=await loadRules();
try{
 const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
 const build=JSON.parse(await readFile('docs/cardrpg3/build.json','utf8'));
 await mkdir('reports/cardrpg-big/a4/p7',{recursive:true});
 await writeFile('reports/cardrpg-big/a4/p7/guide-data.json',JSON.stringify({artifactSha256:build.sha256,sourceHashes:build.sourceHashes,sets:R.SETS.map(s=>R.setTextV4(s,true)),items:R.itemCatalogueV4(),rarities:R.RARITY_MULTIPLIERS_V4,banners:C.BANNERS,editions:R.EDITIONS,caps:R.DEPTH_CAPS},null,2));
}finally{await vite.close();}
