// Completes the navigation-race check after the static portrait contract.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const build=JSON.parse(await readFile('docs/cardrpg-look/build.json'));
const artifact=resolve('docs/cardrpg-look/index.html'),out='reports/cardrpg-look/validation/l6/preview-ready';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(await readFile(artifact)),build.sha256);await mkdir(out,{recursive:true});
const receipt={artifact:build.sha256,script:hash(await readFile(import.meta.filename)),rows:[],errors:[],remote:[]};
await withTimingLock('LOOK L6 navigation previews finish loading',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  page.on('pageerror',error=>receipt.errors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')receipt.errors.push(message.text())});
  page.on('request',request=>{if(/^https?:/.test(request.url()))receipt.remote.push(request.url())});
  await page.goto('file://'+artifact);
  await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
  // Move while the persistent Hub preview is still preparing its roster.
  await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:'Companions',exact:true}).click();
  for(const id of ['mochi','soot','clover','cinnamon']){
   if(id!=='mochi')await page.getByRole('button',{name:new RegExp(`^${id},`,'i')}).click();
   await page.waitForFunction(id=>{
    const scene=window.__depthPreviewScene;
    return scene?.ready&&scene.puppets.size===1&&[...scene.puppets.values()].every(p=>p.asset===id);
   },id,{timeout:60000});
   await page.locator('.dp-miniature-loading').waitFor({state:'hidden'});
   const row=await page.evaluate(()=>({ready:window.__depthPreviewScene.ready,
    models:[...window.__depthPreviewScene.puppets.values()].map(p=>p.asset)}));
   assert.deepEqual(row.models,[id]);receipt.rows.push({id,...row});
   if(id==='mochi')await page.screenshot({path:`${out}/collection-ready.png`});
  }
  // Two more actions complete a six-action window and restore Atelier mode.
  await page.getByRole('button',{name:'Look A/B',exact:true}).click();
  await page.getByRole('button',{name:'Look A/B',exact:true}).click();
  await page.waitForFunction(()=>window.__depthPreviewScene?.ready,{},{timeout:60000});
  await page.locator('.dp-miniature-loading').waitFor({state:'hidden'});
  assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.remote,[]);
  receipt.passed=true;console.log(JSON.stringify(receipt));
 }finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n')}
});
