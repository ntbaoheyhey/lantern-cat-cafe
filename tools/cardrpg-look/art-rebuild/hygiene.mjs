// Review only: distinguish B's existing dev gate from U-owned shell controls.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=process.env.ART_ARTIFACT,out=process.env.ART_OUT;
await mkdir(out,{recursive:true});
const result={artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const dev of [false,true]){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>result.errors.push(String(e)));
  await page.goto('file://'+artifact+(dev?'?dev=1':''));
  await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  const affordances=[];
  for(const name of ['Feel lab','Look atelier','Review studio','Mechanics lab','Battle gallery','B2: After','Look: Atelier','Frame meter']){
   const button=page.getByRole('button',{name,exact:true});
   affordances.push({name,visible:await button.first().isVisible().catch(()=>false)});
  }
  const file=dev?'dev.webp':'normal.webp';
  await sharp(await page.screenshot()).webp({quality:86}).toFile(out+'/'+file);
  result.rows.push({dev,file,affordances});
  await page.close();
 }
}finally{await browser.close();await writeFile(out+'/hygiene.json',JSON.stringify(result,null,2)+'\n');}
if(result.errors.length||result.rows.some(r=>r.affordances.find(a=>a.name==='Feel lab').visible!==r.dev))throw Error('B dev gate failed');
console.log(JSON.stringify({bDevGate:'PASS',shellRequests:result.rows[0].affordances.filter(a=>a.visible).map(a=>a.name)}));
