import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import{execFileSync}from'node:child_process';
const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>console.log(e.message));await p.goto('http://127.0.0.1:5950/tools/ui-v3/index.html?ui=v3');await p.waitForTimeout(1200);await p.screenshot({path:'/tmp/ui-v3-current.png'});console.log((await p.locator('body').innerText()).slice(0,350));await b.close();
