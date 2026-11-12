import {createRequire} from 'node:module';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const out='/Users/bao/art/vfx-2026-11-12/before',base=process.env.C2_URL??'http://127.0.0.1:5970';
const audit=JSON.parse(await readFile(resolve(root,'work/cardrpg-c2/vfx-audit.json'),'utf8'));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1280,height:720}}});
const results=[],errors=[];
try{
 for(const skill of audit){
  const page=await context.newPage();page.on('pageerror',e=>errors.push({id:skill.id,error:e.message}));
  await page.goto(base+'/@fs'+resolve(root,'tools/cardrpg-c/vfx-gallery.html'));
  await page.waitForFunction(()=>window.vfxGallery?.scene.ready,null,{timeout:60000});
  await page.evaluate(id=>{const g=window.vfxGallery;g.manual(true);g.select(id);g.sample(0,3);},skill.id);
  await page.waitForFunction(()=>window.vfxGallery.scene.ready,null,{timeout:60000});
  await page.evaluate(()=>{const g=window.vfxGallery;g.sample(0,3);g.manual(false);});
  await page.waitForTimeout(skill.duration+350);
  const video=page.video();await page.close();await rename(await video.path(),resolve(out,skill.clip));results.push(skill.id);
  console.log(`${results.length}/${audit.length} ${skill.id}`);
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 const path=resolve(root,'reports/cardrpg-c2/vfx/V0-SKILLS.md');
 await writeFile(path,(await readFile(path,'utf8')).replace('Before clips: PENDING capture; do not mark V0 complete until the recorder passes.',`Before clips: ${results.length}/${audit.length} captured with Playwright video at 1280×720. Zero page errors. Raw clips remain outside git at ${out}. Passive fixtures without a registered painted recipe show the inherited absence of VFX; V3 will close coverage only after approval.`));
}finally{await context.close();await browser.close();await writeFile(resolve(root,'work/cardrpg-c2/vfx-before.json'),JSON.stringify({results,errors},null,2));}
