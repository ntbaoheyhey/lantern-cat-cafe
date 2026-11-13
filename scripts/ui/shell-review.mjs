import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
await page.getByRole('button',{name:'Play free',exact:true}).waitFor();await page.screenshot({path:'reports/v3-shell/shots/b4-landing-1280.png'});
await page.getByRole('button',{name:'Connect wallet',exact:true}).click();await page.screenshot({path:'reports/v3-shell/shots/b4-signin-1280.png'});await page.getByRole('button',{name:'Close sign-in'}).click();
await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>!!window.__depthReview);await page.waitForTimeout(1500);
await page.screenshot({path:'reports/v3-shell/shots/b4-home-1280.png'});
for(const width of [1280,1440]){await page.setViewportSize({width,height:width===1280?720:900});for(const screen of ['hub','team','collection','inventory','gacha','codex','save']){await page.evaluate(screen=>{const m=window.__depthReview;m.state.tutorial=3;m.state.freeInvite=true;m.go(screen);},screen);await page.waitForTimeout(400);await page.screenshot({path:`reports/v3-shell/shots/b4-${screen}-${width}.png`});}await page.evaluate(()=>window.dispatchEvent(new Event('shell:landing')));await page.getByRole('button',{name:'Play free',exact:true}).waitFor();await page.screenshot({path:`reports/v3-shell/shots/b4-landing-${width}.png`});await page.getByRole('button',{name:'Connect wallet',exact:true}).click();await page.screenshot({path:`reports/v3-shell/shots/b4-signin-${width}.png`});await page.getByRole('button',{name:'Close sign-in'}).click();await page.getByRole('button',{name:'Play free',exact:true}).click();}
console.log(JSON.stringify({errors,screenshots:18}));
writeFileSync('reports/v3-shell/tests/b4-browser.json',JSON.stringify({errors,url:page.url()},null,2));await browser.close();
