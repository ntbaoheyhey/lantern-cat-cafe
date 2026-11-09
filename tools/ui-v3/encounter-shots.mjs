import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';
const out=process.argv[2]??'u4',browser=await chromium.launch({headless:true});
mkdirSync(`reports/ui-v3/${out}`,{recursive:true});
try{for(const look of ['on','off']){
 const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
 await page.goto(`http://127.0.0.1:5950/tools/ui-v3/index.html?ui=v3&look=${look}`);
 async function shot(name){await page.waitForTimeout(300);await page.screenshot({path:'/tmp/ui-v3-encounter.png'});execFileSync('/tmp/ui-v3-python/bin/python',['-c','from PIL import Image;import sys;Image.open(sys.argv[1]).save(sys.argv[2],quality=80)','/tmp/ui-v3-encounter.png',`reports/ui-v3/${out}/${name}-${look}.webp`]);}
 await page.getByRole('button',{name:'Night Patrol'}).click();await shot('prepare');
 await page.getByRole('button',{name:'Route',exact:true}).click();await shot('route');
 await page.getByRole('button',{name:'Prepare',exact:true}).click();await page.getByRole('button',{name:'Fight',exact:true}).click();
 await page.getByRole('button',{name:'Skip to result',exact:true}).click();await shot('result');await page.close();
}}finally{await browser.close();}
