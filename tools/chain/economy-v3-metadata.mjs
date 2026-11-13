// Static ERC-1155 metadata, emitted after Vite copies public assets. No chain calls.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const require=createRequire(resolve(root,'apps/web/package.json'));
const {createServer}=await import(pathToFileURL(require.resolve('vite')));
const loader=await createServer({root,configFile:false,envDir:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
try{
 const {V3_QUALITY_IDS,V3_DEED_IDS,tradeRuleV3}=await loader.ssrLoadModule('/packages/game-rules/src/cardrpg/trade.ts');
 const out=resolve(root,process.argv.find(a=>a.startsWith('--out='))?.slice(6)||'apps/web/dist/relics');
 const origin=new URL(JSON.parse(readFileSync(resolve(root,'apps/web/public/relics/3.json'),'utf8')).image).origin;
 mkdirSync(out,{recursive:true});let files=0,bytes=0;
 for(const token of [...V3_QUALITY_IDS,...V3_DEED_IDS]){
  const rule=tradeRuleV3(Number(token));assert(rule);
  const deed=token>=30001n,art=deed?'/icons/deed-128.webp':'/chain/sealed-gear.svg';
  assert(existsSync(resolve(root,'apps/web/public'+art)));
  const metadata={name:rule.name,description:'Avalanche Fuji testnet; no real value. '+rule.reason,image:origin+art,
   attributes:[{trait_type:'Rarity',value:rule.rarity},{trait_type:'Type',value:deed?'Café Deed':'Equipment'},
    ...(deed?[]:[{trait_type:'Quality',value:rule.name.startsWith('Perfect ')?'Perfect':'Fine'}]),{trait_type:'Chain',value:'Avalanche Fuji 43113'}]};
  const json=JSON.stringify(metadata,null,2)+'\n';
  for(const id of [String(token),token.toString(16).padStart(64,'0')]){writeFileSync(resolve(out,id+'.json'),json);files++;bytes+=Buffer.byteLength(json);}
 }
 assert.equal(V3_DEED_IDS.length,3000);assert.equal(new Set([...V3_QUALITY_IDS,...V3_DEED_IDS].map(String)).size,V3_QUALITY_IDS.length+3000);
 console.log(JSON.stringify({v3MetadataFiles:files,bytes,deeds:V3_DEED_IDS.length,qualityItems:V3_QUALITY_IDS.length}));
}finally{await loader.close();}
