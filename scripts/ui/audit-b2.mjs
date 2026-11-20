/** U1: reproducible baseline captures of the actual pre-rebuild interface. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {measureScreen} from './measure-screen.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const dir='reports/v3-shell/b2',out=`${dir}/shots/ui-before`,rows=[],errors=[];
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));
if(process.env.AUDIT_RESUME)rows.push(...JSON.parse(readFileSync(`${dir}/UI-AUDIT-RAW.json`)).screens);
const capture=async(id,family,notes=[])=>{
 if(rows.some(r=>r.id===id))return;
 await p.waitForFunction(()=>![...document.querySelectorAll('body *')].some(e=>e.children.length===0&&e.getClientRects().length&&/^(Opening(?: the cafe)?[.…]+|Loading[.…]+)$/.test(e.textContent.trim())),{},{timeout:20000});
 await p.waitForTimeout(350);await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length&&!i.complete).map(i=>new Promise(resolve=>{i.onload=i.onerror=resolve;setTimeout(resolve,3000);}))));
 const metrics=await p.evaluate(measureScreen),path=`${out}/${id}.png`;await p.screenshot({path});
 const row={id,family,viewport:{width:1280,height:720},screenshot:{path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')},...metrics,notes};rows.push(row);
 writeFileSync(`${dir}/UI-AUDIT-RAW.json`,JSON.stringify({method:'Local isolated browser fixture; DOM viewport/occlusion text measurement, numbers excluded. Screens are unmodified application UI.',screens:rows,errors},null,2)+'\n');
 console.log(id,metrics.visibleWords,'words',metrics.plainTextButtons,'plain buttons');
};
const go=async screen=>{await p.evaluate(s=>window.__depthReview.go(s),screen);await p.waitForTimeout(550);};
const help=label=>p.getByRole('button',{name:label,exact:true}).click();
const closeHelp=()=>p.getByRole('button',{name:'Close help',exact:true}).click();
const shell=async page=>{await p.evaluate(s=>window.dispatchEvent(new CustomEvent('shell:page',{detail:s})),page);await p.getByRole('dialog',{name:page,exact:true}).waitFor();};
const optional=async(id,fn)=>{try{await fn();}catch(e){errors.push(`${id}: ${e.message.split('\n')[0]}`);console.log('MISSING',id,e.message.split('\n')[0]);await p.keyboard.press('Escape');}};
try{
 await p.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
 await p.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
 await p.getByRole('button',{name:'Play free',exact:true}).waitFor();await capture('landing','home');
 await p.getByRole('button',{name:'Connect wallet',exact:true}).click();await capture('sign-in','dialog');await p.getByRole('button',{name:'Close sign-in'}).click();
 await p.getByRole('button',{name:'Play free',exact:true}).click();await p.waitForFunction(()=>window.__depthReview);
 await p.locator('.uv-shell').waitFor();
 await p.evaluate(async()=>{
  const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state.tutorial=5;m.state.freeInvite=true;m.state.economyV3=true;m.state.account.currencies={...m.state.account.currencies,fish:20000,threads:5000,stamps:6000};
  m.state.materials=500;m.state.seals=10;m.state.account.cards.forEach(c=>{c.shards=100;});
  for(const i of R.itemCatalogueV4())m.state.account.inventory.stacks[i.id]=10;
  for(let n=0;n<4;n++)m.state.gear.push(R.makeGear(m.state,'hearthloom-weapon-common',1));
  m.notify(false);
 });
 await capture('cafe-hub','home',['Seeded local balances and items; no live account changes.']);
 await go('team');await capture('team-formation','formation');
 await optional('team-presets',async()=>{await p.getByRole('button',{name:/Saved/}).click();await capture('team-presets','formation');});
 await go('collection');await capture('cats-list','hero');
 await capture('hero-level-star','hero',['Level and star currently share the Growth tab; no separate info/level/star screens.']);
 await help('Awakening');await capture('hero-awakening','hero');await closeHelp();
 for(const tab of ['Skills','Bonds','Gear']){await p.locator('.a6-cat-tabs').getByRole('button',{name:tab,exact:true}).click();await capture(`hero-${tab.toLowerCase()}`,'hero');}
 await go('inventory');await capture('bag-gear','bag');
 await help('Set & affixes');await capture('bag-item-detail','bag');await closeHelp();
 await p.getByRole('button',{name:'Enhance +1',exact:true}).click();await capture('forge-enhance','forge',['Enhancement currently occurs in the bag detail, without a dedicated workshop scene.']);
 await help('Gear workshop');await capture('forge-fusion','forge');await closeHelp();
 await p.getByRole('button',{name:'Materials',exact:true}).click();await capture('bag-materials','bag');
 await help('Use & manage supplies');await capture('bag-manage','bag',['No Min/-10/-/+/+10/Max batch-use dialog exists; rebuild must add one.']);
 await p.getByRole('button',{name:'Consumables',exact:true}).click();await capture('bag-consumables','bag');await closeHelp();
 await go('gacha');await capture('invitations','gacha');
 await p.getByRole('button',{name:'Invitation odds',exact:true}).last().click();await capture('invitations-rates','gacha');await closeHelp();
 await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>{window.__depthReview.state.settings.reducedMotion=false;window.__depthReview.notify(false);});
 if(!rows.some(r=>r.id==='invitations-reveal')){
  await p.getByRole('button',{name:/Recruit ×10/}).click();await p.locator('[data-beat="seal"]').waitFor();await capture('invitations-reveal','gacha');
  await p.getByRole('button',{name:'Skip all',exact:true}).click();await p.locator('[aria-label="Invitation results"]').waitFor();await capture('invitations-ten-results','gacha');
 }
 await p.emulateMedia({reducedMotion:'reduce'});
 await go('hub');
 await shell('season');await capture('season-track-countdown-edition','season',['Pass track is a placeholder: Play / Collect / Grow; countdown and edition share the page.']);
 await p.getByText('Season guide',{exact:true}).click();await capture('season-guide','season');await help('Close page');
 await shell('economy');await capture('economy-flow','economy');
 for(const tab of ['allocation','fees','odds']){await p.locator('.b-page-nav').getByRole('button',{name:tab,exact:true}).click();await capture(`economy-${tab}`,'economy');}await help('Close page');
 await go('codex');await capture('field-guide','guide');
 await go('save');await capture('settings','settings',['Language selector is absent. Tutorial reset is Replay lessons.']);
 await p.locator('.th-audio summary').click();await capture('settings-audio','settings');await p.locator('.th-audio summary').click();
 await go('hub');await p.getByRole('button',{name:'Daily quests',exact:true}).click();await capture('quests-daily','quest');
 await p.getByRole('button',{name:'Close',exact:true}).click();await go('hub');await p.getByRole('button',{name:'Events',exact:true}).click();await capture('events','quest');
 await go('map');await capture('chapter-map','map');
 await p.evaluate(()=>window.__depthReview.tutorial());await p.waitForTimeout(700);await capture('battle-prep','result',['B audits the existing preparation wrapper; session A battle code remains untouched.']);
 await p.evaluate(async()=>{const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');R.playBattle(m.battle,'auto');m.showResult();});
 await p.waitForTimeout(700);await capture('victory','result',['Outcome generated with the live local rules; screenshot only, not performance evidence.']);
 await p.evaluate(async()=>{const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');m.tutorial();for(const a of m.battle.actors){if(a.side==='party'){a.hp=1;a.attack=1;a.defense=0;a.shield=0;}else{a.hp=a.maxHp=100000;a.attack=100000;a.defense=100000;}}R.playBattle(m.battle,'auto');if(m.battle.result!=='enemy')throw Error('Loss fixture did not lose');m.showResult();});
 await p.getByRole('heading',{name:'Defeat',exact:true}).waitFor();await capture('defeat','result',['Local fixture with overwhelming enemy stats played through live rules; no battle source edits.']);
 await go('hub');await p.context().setOffline(true);await p.evaluate(()=>{const m=window.__depthReview;m.error=true;m.notice='Connection lost. Retry.';m.notify(false);});await capture('error-offline','error',['Browser network disabled; explicit local error fixture.']);
}catch(e){errors.push(e.message);throw e;}finally{
 writeFileSync(`${dir}/UI-AUDIT-RAW.json`,JSON.stringify({method:'Local isolated browser fixtures. DOM viewport/occlusion measurement counts painted text nodes, excludes numbers. No reference media in repository.',screens:rows,errors},null,2)+'\n');
 await browser.close();
}
