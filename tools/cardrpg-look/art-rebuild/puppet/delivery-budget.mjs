// Measure the delivered standalone artifact, not an estimate from source sizes.
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const artifact=resolve(process.env.ART_ARTIFACT),receiptPath=resolve(process.env.ART_RECEIPT),out=resolve(process.env.ART_OUT);
const html=await readFile(artifact,'utf8'),receipt=JSON.parse(await readFile(receiptPath,'utf8'));
const assets=JSON.parse(html.match(/<script id="asset-manifest" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const lengths=new Map([...html.matchAll(/<script id="asset-(\d+)" type="application\/octet-stream">([A-Za-z0-9+/=]+)<\/script>/g)].map(m=>[Number(m[1]),m[2].length]));
if(lengths.size!==assets.length)throw Error('Artifact asset payloads are incomplete');
const categories={};
const classify=key=>key.startsWith('assets/cardrpg-look/v3-puppets/')?'B current puppet atlases':key.startsWith('assets/cardrpg-look/v3-vfx/')?'B current VFX':key.startsWith('assets/cardrpg-look/stage/')?'B cafe stage':key.startsWith('assets/cardrpg-look/v3-portraits/')?'B selected portraits':key.startsWith('assets/cardrpg-a6/')?'A6 selected illustrations':key.startsWith('assets/cardrpg-look/')?'B retained classic and diagnostic assets':'Other shared assets';
assets.forEach(({key},i)=>{const row=categories[classify(key)]??={files:0,embeddedBytes:0};row.files++;row.embeddedBytes+=lengths.get(i);});
const actual=(await stat(artifact)).size;
if(actual!==receipt.bytes)throw Error('Receipt size does not match delivered artifact');
const result={artifact,receipt:receiptPath,bytes:actual,limit:40000000,headroom:40000000-actual,pass:actual<=40000000,method:'Actual standalone HTML bytes including gzip/base64 assets, loader, scripts and styles. Category bytes are embedded asset payload only; rig JSON and runtime code are in the script payload.',categories,otherHtmlAndCodeBytes:actual-[...lengths.values()].reduce((a,b)=>a+b,0),optionalPortraitCatalog:{units:25,skills:60,uniqueFiles:403,rawBytes:9550158,note:'Published variants and linked puppets overlap the runtime. A6 imports selected formats; unused catalog variants are not added to this measured artifact.'}};
await mkdir(out,{recursive:true});await writeFile(out+'/budget.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));if(!result.pass)process.exitCode=1;
