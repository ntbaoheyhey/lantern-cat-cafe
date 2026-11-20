import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});let passed=0;
const check=(value,message)=>{assert(value,message);passed++;console.log('PASS',message);};
try{
 for(const mode of ['system','saved']){
  const p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:mode==='system'?'reduce':'no-preference'});
  await p.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
  await p.goto('http://127.0.0.1:5996/?demo=1&squad=1&cardrpg2=1&a6=1&formationc2=1');await p.getByRole('button',{name:'Play free',exact:true}).click();await p.locator('.uv-shell').waitFor();
  await p.evaluate(mode=>{const m=window.__depthReview;m.state.tutorial=5;m.state.settings.reducedMotion=mode==='saved';m.state.account.currencies.fish=20000;m.state.account.currencies.threads=5000;m.notify(false);m.go('inventory');},mode);
  await p.locator('.b2-bag').waitFor();
  const active=()=>p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target instanceof Element&&a.effect.target.closest('.uv-sheet,.b2-dialog,.b2-help,.b2-page')).length);
  check(await active()===0,mode+': sheet has no running animation');
  await p.getByRole('button',{name:'Enhance +1',exact:true}).click();check(await active()===0,mode+': forge portal has no running animation');
  await p.getByRole('button',{name:'Confirm enhance +1',exact:true}).click();check(await active()===0,mode+': enhancement has no shake or moving flash');
  check(await p.locator('.b2-forge-impact').evaluate(e=>getComputedStyle(e).display==='none'),mode+': hammer is suppressed');
  await p.getByRole('button',{name:'Close dialog',exact:true}).click();check(await p.locator('.b2-dialog').count()===0,mode+': portal closes without a delayed exit');
  await p.getByRole('button',{name:'Gear workshop',exact:true}).click();check(await active()===0,mode+': help portal has no animation');
  await p.getByRole('button',{name:'Close help',exact:true}).click();check(await p.locator('.b2-help').count()===0,mode+': help closes immediately');
  await p.locator('.uv-sheet-heading').getByRole('button',{name:'Close',exact:true}).click();check(await p.locator('.uv-sheet').count()===0,mode+': sheet closes immediately');
  await p.close();
 }
 console.log(JSON.stringify({passed,errors:[]}));
}finally{await browser.close();}
