import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {gzipSync} from 'node:zlib';import assert from 'node:assert/strict';import {pinExistingFonts} from '../visual-support.mjs';
const out='reports/cardrpg/isolation';await fs.mkdir(out,{recursive:true});const browser=await chromium.launch(),rows=[],errors=[];
try{for(const [width,height]of [[1024,600],[1280,720],[1440,900]])for(const [name,port]of [['before',5590],['after',5591]]){
 const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),urls=[];p.on('request',r=>urls.push(r.url()));p.on('pageerror',e=>errors.push(String(e)));await pinExistingFonts(p);
 await p.goto(`http://127.0.0.1:${port}/?demo&coach=off#home`);await p.waitForTimeout(1800);await p.evaluate(()=>document.fonts.ready);
 const resources=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.js')).map(e=>e.name.split('/assets/')[1]).filter(Boolean));let raw=0,gzip=0;
 for(const file of resources){const b=await fs.readFile(`/tmp/cardrpg-flag-${name}/assets/${file}`);raw+=b.length;gzip+=gzipSync(b).length;assert.equal(b.includes('isWebGLRenderer'),false);assert.equal(b.includes('Original 3D cafe battlefield'),false)}
 const prototype=urls.filter(u=>/turn3d|\.glb|\/cardrpg/.test(u));assert.deepEqual(prototype,[]);assert.equal(await p.locator('.t3-shell,.cr-app').count(),0);await p.screenshot({path:`${out}/${width}-${name}.png`});rows.push({width,height,name,raw,gzip,resources,prototype});await p.close();
}
const p=await browser.newPage();await p.goto('http://127.0.0.1:5591/?demo&cardrpg=1');await p.waitForTimeout(600);assert.equal(await p.locator('.cr-app').count(),0);rows.push({name:'cardrpg flag alone cannot bypass squad gate',pass:true});await p.close();
}finally{await browser.close();await fs.writeFile(out+'/check.json',JSON.stringify({date:new Date().toISOString(),rows,errors},null,2))}assert.deepEqual(errors,[]);console.log('Captured flag-off startup at all three sizes');
