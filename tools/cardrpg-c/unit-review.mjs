/** Every required animation, same 512-unit grid. PNG scratch stays outside git. */
import {createRequire} from 'node:module';import {resolve} from 'node:path';import {mkdir,writeFile,readFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const units=JSON.parse(await readFile('assets/cardrpg-look/spine/slots.json')).units,only=process.argv.find(a=>a.startsWith('--ids='))?.slice(6).split(','),psd=process.argv.includes('--psd');
const output=resolve('reports/cardrpg-c/spine'),browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']}),result=[],lineup=[];
try{
 const page=await browser.newPage({viewport:{width:320,height:470},deviceScaleFactor:1});await page.goto('http://127.0.0.1:5970/@fs/'+root+'/tools/cardrpg-c/unit-review.html');await page.waitForFunction(()=>window.review,null,{timeout:30000});
 for(const unit of units.filter(u=>!only||only.includes(u.id))){
  const override=psd?{skeleton:`assets/cardrpg-look/spine/${unit.id}/psd-placeholder/${unit.id}.json`,atlas:`assets/cardrpg-look/spine/${unit.id}/psd-placeholder/${unit.id}.atlas`,scale:1}:null;
  const loaded=await page.evaluate(async({unit,override})=>{document.querySelector('#label').textContent=unit.name+' · '+unit.targetHeight+'u';return await window.review.load(unit.id,override);},{unit,override});
  if(loaded.source!=='placeholder')throw Error(JSON.stringify(loaded));
  if(process.argv.includes('--metadata-only')){result.push(loaded);continue;}
  const folder=resolve(output,unit.id);await mkdir(folder,{recursive:true});
  const idle=await page.locator('#unit').screenshot();lineup.push({input:await sharp(idle).extend({bottom:30,background:'#322730'}).composite([{input:Buffer.from(`<svg width="320" height="30"><text x="160" y="21" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#f8e5c4">${unit.name} · ${unit.targetHeight}u</text></svg>`),left:0,top:400}]).png().toBuffer(),left:(result.length%5)*320,top:Math.floor(result.length/5)*430});
  const film=[];const samples=[0,.25,.5,.69,.86,1];
  for(let row=0;row<unit.animations.length;row++){
   const clip=unit.animations[row];
   for(let col=0;col<samples.length;col++){
    await page.evaluate(({clip,progress})=>window.review.pose(clip,progress),{clip,progress:samples[col]});const frame=await page.locator('#unit').screenshot();film.push({input:frame,left:col*320,top:row*430});
   }
   film.push({input:Buffer.from(`<svg width="1920" height="30"><rect width="1920" height="30" fill="#322730"/><text x="12" y="21" font-family="sans-serif" font-size="16" fill="#f8e5c4">${unit.name} · ${clip} · 0 / 25 / 50 / 69 / 86 / 100%</text></svg>`),left:0,top:row*430+400});
  }
  await sharp({create:{width:1920,height:unit.animations.length*430,channels:4,background:'#322730'}}).composite(film).webp({quality:82}).toFile(resolve(folder,psd?'psd-filmstrip.webp':'filmstrip.webp'));
  result.push(loaded);console.log(unit.id,loaded.source,loaded.animations.length);
 }
 if(!only&&!process.argv.includes('--metadata-only'))await sharp({create:{width:1600,height:Math.ceil(result.length/5)*430,channels:4,background:'#322730'}}).composite(lineup).webp({quality:88}).toFile(resolve(output,'lineup.webp'));
 await writeFile(resolve(output,psd?'psd-review.json':only?'unit-review-followup.json':'unit-review.json'),JSON.stringify(result,null,2)+'\n');
}finally{await browser.close();}
