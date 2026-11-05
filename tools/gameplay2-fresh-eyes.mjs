// Four separate UI-first review passes. This is one author using fresh browser profiles,
// not independent judges or a retention study. Only visible review controls mutate state.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, root } from './visual-support.mjs';
const role=process.argv[2], valid=['first-time','returning','minmax','judge'];if(!valid.includes(role))throw Error('Choose a review role');
const round=process.argv[3]??'fresh-eyes';if(!/^fresh-eyes(?:-regrade)?$/.test(round))throw Error('Invalid review round');
const out=resolve(root,'reports/gameplay2',round,role);mkdirSync(out,{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:900}}),log=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));const start=Date.now();
const record=async(name)=>{await page.locator('#game').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await page.screenshot({path:resolve(out,`${log.length}-${name}.png`)});log.push({at:(Date.now()-start)/1000,name,text:await page.locator('#game').innerText()});};
const nav=name=>page.getByRole('navigation',{name:'Adventure pages'}).getByRole('button',{name,exact:true}).click();
const fixture=name=>page.getByRole('button',{name,exact:true}).click();
try{
  await page.context().setOffline(true);await page.goto(pathToFileURL(resolve(root,'docs/gameplay2/index.html')).href);await page.getByTestId('cafe-adventure').waitFor();
  if(role==='first-time'){
    await fixture('Fresh start');await record('arrival');await page.waitForTimeout(9000);await record('first-find');
    await page.waitForTimeout(15000);await nav('Workshop');await record('first-workshop');
    const craft=page.getByRole('button',{name:/^Craft Moss paw/});if(await craft.isEnabled())await craft.click();
    await nav('Wardrobe');await page.getByRole('button',{name:'Moss / sustain',exact:true}).click();await record('first-build');
    await nav('Patrol');await page.waitForTimeout(95000);await page.getByRole('button',{name:/^Challenge boss/}).click();await record('first-boss');
    const end=Date.now()+35000;while(Date.now()<end&&await page.getByRole('region',{name:'Boss counterplay'}).count()){
      const cue=await page.locator('.cafe-cue').innerText(),match=cue.match(/(Dodge|Break|Interrupt) before/);
      if(match){const button=page.getByRole('region',{name:'Boss counterplay'}).getByRole('button',{name:new RegExp('^'+match[1])});if(await button.isEnabled())await button.click();}
      if(cue.includes('Recovery')){const button=page.getByRole('button',{name:/^Pounce/});if(await button.isEnabled())await button.click();}
      await page.waitForTimeout(500);
    }await record('boss-result');
  }else if(role==='returning'){
    await fixture('Away summary');await record('return');await page.getByRole('button',{name:'Welcome home',exact:true}).click();
    await nav('Journal');await record('kept-collection');await nav('Cafe');await page.getByRole('checkbox',{name:/Gentle assist/}).uncheck();await record('control-over-assist');
    await fixture('Tour preview');await nav('Cafe');await page.getByRole('button',{name:'Preview a new tour',exact:true}).click();await record('keep-reset-preview');
    await page.getByRole('button',{name:'Start new tour',exact:true}).click();await record('reset');await page.getByRole('button',{name:/Undo tour/}).click();await record('undo');
  }else if(role==='minmax'){
    await fixture('Ember set');await nav('Wardrobe');await record('compare-set');await page.getByRole('button',{name:'Save kit A',exact:true}).click();
    await nav('Workshop');await page.getByRole('button',{name:/^Steady stitch/}).click();await record('near-stitch-cap');
    await page.getByRole('button',{name:/^Spark stitch/}).click();await record('spark-outcome');
    await nav('Patrol');await page.getByLabel('Challenge tier').selectOption('2');await record('hard-tier');
    await page.getByRole('button',{name:/^Challenge boss/}).click();await record('room-two-boss');
    await page.locator('#builds').scrollIntoViewIfNeeded();await page.getByLabel('Chapter-two tier').selectOption('2');await page.getByRole('checkbox',{name:/Match counters/}).uncheck();
    await page.screenshot({path:resolve(out,'build-lab.png')});log.push({at:(Date.now()-start)/1000,name:'unattended-daring-lab',text:await page.locator('#builds').innerText()});
  }else{
    await fixture('Fresh start');await record('three-minute-start');await page.waitForTimeout(10000);
    await fixture('Boss tells');await record('telegraph');await page.waitForTimeout(5000);await record('impact');
    await fixture('Workshop kit');await nav('Workshop');await record('forge');await page.getByRole('button',{name:/^Craft Moss paw/}).click();
    await nav('Wardrobe');await record('sets');await nav('Journal');await record('goals');await fixture('Away summary');await record('away');
    const left=Math.max(0,180000-(Date.now()-start));if(left)await page.waitForTimeout(left);await record('three-minute-end');
  }
}finally{writeFileSync(resolve(out,'receipt.json'),JSON.stringify({role,source:'Offline candidate UI only; no research notes read by this pass; review fixtures explicitly selected',duration:(Date.now()-start)/1000,log,errors},null,2));await browser.close();}
console.log(JSON.stringify({role,duration:(Date.now()-start)/1000,captures:log.length,errors}));
