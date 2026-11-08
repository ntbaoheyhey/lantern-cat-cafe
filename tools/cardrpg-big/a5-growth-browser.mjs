// REFERENCE: PROMPT-A5 C1; public-command growth previews. Targeted UI evidence, not balance or elapsed play.
import assert from 'node:assert/strict';
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const mode=process.argv[2],width=Number(process.argv[3]),height=width===1440?900:width===1024?600:720;
assert(['on','off'].includes(mode));assert([1280,1440,1024].includes(width));
const root='reports/cardrpg-big/a5/c1-growth-preview',artifact=`/tmp/cardrpg-a5-growth-${mode}/index.html`;
const out=`${root}/browser-${mode}-${width}-attempt-${process.env.A5_GROWTH_ATTEMPT||'1'}`;
await mkdir(out,{recursive:false});
const fixtures=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try{
 for(const look of ['baseline','look']){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>window.__depthReview.state);
  const selected=s=>s.account.cards.find(c=>c.cardId==='mochi');
  async function dismiss(){const skip=button('Skip celebration');while(await skip.count()){await skip.click();}}
  async function imported(name){
   const f=fixtures.checks.find(r=>r.mode===mode&&r.name===name),code=await readFile(f.path,'utf8');
   assert.equal(createHash('sha256').update(code).digest('hex'),f.sha256);
   await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(code.trim());await button('Import save code').click();
   assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);await nav('Companions');
   await page.locator('.dp-detail h2').filter({hasText:'Mochi'}).waitFor();await dismiss();
   return f;
  }
  async function capture(name){
   await dismiss();await page.waitForFunction(()=>!document.querySelector('.dp-miniature-loading'),null,{timeout:15000}).catch(()=>{});
   await page.locator('.dp-detail > .cr-actions').first().evaluate(e=>e.scrollIntoView({block:'center'}));
   const measured=await page.locator('.dp-detail > .cr-actions').first().evaluate(root=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const nodes=[...root.querySelectorAll('b,small,span,button')].filter(e=>!e.children.length&&e.getClientRects().length&&e.textContent.trim()&&!e.matches(':disabled'));
    const contrast=nodes.map(e=>{
     let p=e,bgs;const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
     while(p){const box=p.getBoundingClientRect();if(x<box.left||x>box.right||y<box.top||y>box.bottom){p=p.parentElement;continue;}
      const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));
      if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}
      const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;
     }
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));
     return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
    const box=root.getBoundingClientRect();return{contrast,overflow:document.documentElement.scrollWidth-innerWidth,controlsVisible:box.top>=60&&box.bottom<=innerHeight,text:root.innerText};
   });
   const path=`${out}/${look}-${name}.png`;await page.screenshot({path});captures.push({look,name,path,...measured});
   assert.equal(measured.overflow,0);assert(measured.controlsVisible,name);assert(measured.contrast.every(r=>r.ratio>=4.5),JSON.stringify(measured.contrast));
  }
  await page.goto('file://'+artifact+(look==='look'?'?dev=1':''));
  await page.getByRole('navigation',{name:'Cafe screens'}).waitFor({timeout:120000});if(look==='look')await button('Look A/B').click();
  for(const name of ['level5','star2']){
   const f=await imported(name),before=await read(),kind=name==='level5'?'level':'ascend',label=kind==='level'?'Level up':'Add a star';
   assert.deepEqual(selected(before),f.before.card);assert.deepEqual(before.account.currencies,f.before.currencies);
   const preview=page.locator(`[data-growth="${kind}"]`);assert.equal(await preview.count(),mode==='on'?1:0);
   if(mode==='on'){
    const copy=await preview.innerText();
    for(const [key,n]of Object.entries(f.before.currencies)){const spent=n-f.after.currencies[key];if(spent>0)assert(copy.includes(`${spent} ${key==='fish'?'fish points':key}`));}
    if(kind==='ascend')assert(copy.includes(`${f.before.card.shards-f.after.card.shards} matching shards`));
    for(const skill of f.skillNames)assert(copy.includes(`Unlocks ${skill}.`));
    for(const [stat,label]of [['hp','Health'],['attack','Attack'],['defense','Defense']]){const delta=f.after.stats[stat]-f.before.stats[stat];if(delta)assert(copy.includes(`${delta>0?'+':''}${delta} ${label}`));}
   }
   assert.deepEqual(await read(),before);await capture(name);
   await button(label).focus();await page.keyboard.press(kind==='level'?'Enter':'Space');
   const after=await read();assert.deepEqual(selected(after),f.after.card);assert.deepEqual(after.account.currencies,f.after.currencies);
   assert.deepEqual(after.account.cards.filter(c=>c.cardId!=='mochi'),before.account.cards.filter(c=>c.cardId!=='mochi'));
   await dismiss();
   const settled=structuredClone(after);if(mode==='on')settled.v4.journey.pending=[];
   assert.deepEqual(await read(),settled);
   checks.push({look,name,mode,preview:mode==='on',exactSpend:true,otherCatsUnchanged:true,celebrationAcknowledgementOnly:true,keyboard:kind==='level'?'Enter':'Space'});
   if(mode==='on'){await page.getByRole('button',{name:/^Soot,/}).click();assert((await page.locator('[data-growth="level"]').innerText()).includes('Soot → level 2'));assert.deepEqual(await read(),settled);}
  }
  for(const name of ['poor','max','active']){
   await imported(name);const before=await read();
   assert.equal(await button('Level up').isDisabled(),mode==='on'||name==='active');
   if(mode==='on'){
    const text=await page.locator('[data-growth="level"]').innerText();
    assert(text.includes(name==='poor'?'Need 25 fish.':name==='max'?'Cat reached its rarity level cap.':'Finish this route before training your companions.'));
    assert.equal(await button('Add a star').isDisabled(),true);
   }
   if(name==='poor')await capture(name);
   assert.deepEqual(await read(),before);checks.push({look,name,mode,unchanged:true,disabled:mode==='on'||name==='active'});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,mode,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,captures,errors,remote},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,mode,width,checks:checks.length,captures:captures.length}));
