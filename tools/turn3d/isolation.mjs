import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {gzipSync} from 'node:zlib';import assert from 'node:assert/strict';
const browser=await chromium.launch(),rows=[];const errors=[];
try{
 for(const [name,base,dir] of [['before','http://localhost:5516','apps/web/dist-turn3d-base'],['after','http://localhost:5515','apps/web/dist-turn3d-final']]){
  const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});const urls=[];page.on('request',r=>urls.push(r.url()));page.on('pageerror',e=>errors.push(String(e)));await page.goto(base+'/?demo&coach=off#home');await page.waitForTimeout(1800);
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')).map(e=>e.name.split('/assets/')[1]).filter(Boolean));let raw=0,gzip=0;
  for(const file of resources){const buf=await fs.readFile(dir+'/assets/'+file);assert(!buf.includes('Original 3D cafe battlefield'));assert(!buf.includes('isWebGLRenderer'));assert(!buf.includes('THREE.GLTFLoader'));raw+=buf.length;gzip+=gzipSync(buf).length}
  const squadAssets=urls.filter(u=>/turn3d|\.glb/.test(u));assert.deepEqual(squadAssets,[]);assert.equal(await page.locator('[data-testid="turn3d-prototype"]').count(),0);
  await page.screenshot({path:`reports/turn3d/shots/flag-off-${name}.png`});rows.push({name,resources,rawJSBytes:raw,gzipJSBytes:gzip,squadAssets});await page.close();
 }
 const page=await browser.newPage();const writes=[],requests=[];page.on('request',r=>requests.push({url:r.url(),method:r.method()}));page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{window.__writes=[];const orig=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.__writes.push({store:this===localStorage?'local':'session',key:k});return orig.call(this,k,v)};const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){window.__writes.push({store:'indexedDB',name:this.name});return put.apply(this,args)}});
 await page.goto('http://localhost:5515/?demo&squad=1&squad3d=1');await page.getByRole('checkbox',{name:'Auto all cats'}).check();await page.getByLabel('Animation speed').selectOption('4');await page.waitForTimeout(6000);await page.getByRole('button',{name:'Effects',exact:true}).click();await page.getByLabel('Effect action').selectOption('nineLives');await page.waitForTimeout(2000);
 writes.push(...await page.evaluate(()=>window.__writes));const mutations=requests.filter(r=>!['GET','HEAD'].includes(r.method));assert.deepEqual(writes,[]);assert.deepEqual(mutations,[]);const external=requests.filter(r=>!r.url.startsWith('http://localhost:5515/'));assert(external.every(r=>/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(r.url)));rows.push({name:'flag-on-isolation',writes,mutations,external,requests:requests.length});await page.close();
}finally{await fs.writeFile('reports/turn3d/isolation.json',JSON.stringify({date:new Date().toISOString(),rows,errors},null,2));await browser.close()}
assert.deepEqual(errors,[]);console.log(JSON.stringify({rows,errors}));
