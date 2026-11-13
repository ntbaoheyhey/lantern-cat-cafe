/** Re-enter the real audited screens in isolated, disposable browser accounts. */
export const chainScreen=id=>id.startsWith('wallet-')||id.startsWith('market-');
export async function openAudioScreen(p,id){
 p.setDefaultTimeout(12000);
 await p.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
 await p.goto('http://127.0.0.1:5996/?demo=1&squad=1&cardrpg2=1&a6=1&formationc2=1');
 const button=name=>p.getByRole('button',{name,exact:true});
 const click=name=>button(name).click();
 await button('Play free').waitFor();
 // A real keyboard gesture unlocks the existing engine; no fixture plays cues.
 await p.keyboard.press('Shift');
 if(id==='sign-in')await click('Connect wallet');
 if(['landing','sign-in'].includes(id)){await p.waitForTimeout(400);return;}
 await click('Play free');await p.locator('.uv-shell').waitFor();
 await p.evaluate(async()=>{
  const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state.tutorial=5;m.state.freeInvite=true;m.state.economyV3=true;m.state.settings.reducedMotion=true;
  m.state.account.currencies={...m.state.account.currencies,fish:200000,threads:50000,stamps:6000};
  m.state.materials=500;m.state.seals=10;m.state.account.cards.forEach(c=>{c.shards=100;});
  for(const item of R.itemCatalogueV4())m.state.account.inventory.stacks[item.id]=10;
  for(let n=0;n<4;n++)m.state.gear.push(R.makeGear(m.state,'hearthloom-weapon-common',1));
  m.notify(false);await window.__thAudio.preload('home');
 });
 await p.waitForTimeout(450);
 for(let n=0;n<20;n++){
  const dismiss=p.getByRole('button',{name:/^(Dismiss celebration|Skip celebration)$/}).first();
  if(!await dismiss.isVisible().catch(()=>false))break;await dismiss.click();
 }
 const go=async screen=>{await p.evaluate(screen=>window.__depthReview.go(screen),screen);await p.waitForTimeout(250);};
 const shell=async page=>{await p.evaluate(page=>window.dispatchEvent(new CustomEvent('shell:page',{detail:page})),page);await p.getByRole('dialog',{name:page,exact:true}).waitFor();};
 if(id==='cafe-hub')return;
 if(['team-formation','team-presets'].includes(id)){await go('team');if(id==='team-presets'){await p.getByRole('button',{name:/Saved/}).click();await p.locator('.b2-dialog').waitFor();}}
 else if(id==='cats-list'||id.startsWith('hero-')){
  await go('collection');await p.locator('.a6-cat-tabs').waitFor();
  const tab=id.split('-').at(-1);if(['skills','bonds','gear'].includes(tab))await p.locator('.a6-cat-tabs').getByRole('button',{name:tab[0].toUpperCase()+tab.slice(1),exact:true}).click();
  if(id==='hero-awakening')await click('Awakening');
 }else if(id.startsWith('bag-')||id.startsWith('forge-')){
  await go('inventory');await p.locator('.b2-bag').waitFor();
  if(id==='bag-item-detail')await click('Set & affixes');
  if(id==='forge-enhance')await click('Enhance +1');
  if(id==='forge-fusion')await click('Gear workshop');
  if(['bag-materials','bag-manage','bag-consumables','bag-batch-use'].includes(id))await click('Materials');
  if(['bag-manage','bag-consumables','bag-batch-use'].includes(id))await click('Use & manage supplies');
  if(['bag-consumables','bag-batch-use'].includes(id))await click('Consumables');
  if(id==='bag-batch-use')await click('Warm Milk Tonic');
 }else if(id.startsWith('invitations')){
  await go('gacha');await p.locator('.uv-recruit').waitFor();
  if(id==='invitations-rates')await button('Invitation odds').last().click();
  if(['invitations-reveal','invitations-ten-results'].includes(id)){
   if(id==='invitations-reveal'){
    await p.emulateMedia({reducedMotion:'no-preference'});
    await p.evaluate(()=>{window.__depthReview.state.settings.reducedMotion=false;window.__depthReview.notify(false);});
   }
   await p.getByRole('button',{name:/Recruit ×10/}).click();
   await p.locator(id==='invitations-reveal'?'[data-beat="seal"]':'[aria-label="Invitation results"]').waitFor();
  }
 }else if(id.startsWith('season-')){await shell('season');if(id==='season-guide')await click('Season guide');}
 else if(id.startsWith('economy-')){await shell('economy');const tab=id.split('-')[1];if(tab!=='flow')await p.locator('.b-page-nav').getByRole('button',{name:tab,exact:true}).click();}
 else if(id==='field-guide')await go('codex');
 else if(id.startsWith('settings')){await go('save');if(id==='settings-audio')await p.locator('.th-audio summary').click();}
 else if(['quests-daily','events'].includes(id))await click(id==='quests-daily'?'Daily quests':'Events');
 else if(id==='chapter-map')await go('map');
 else if(id==='battle-prep'){await p.evaluate(()=>window.__depthReview.tutorial());await p.waitForTimeout(300);}
 else if(['victory','defeat'].includes(id)){
  await p.evaluate(async id=>{
   const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
   m.leave();m.state.tutorial=5;m.state.freeInvite=true;m.start(1,'campaign',1);m.enter(R.availableNodes(m.state.run)[0].id);m.fight();
   if(id==='defeat')for(const a of m.battle.actors){if(a.side==='party'){a.hp=1;a.attack=1;a.defense=0;a.shield=0;}else{a.hp=a.maxHp=100000;a.attack=100000;a.defense=100000;}}
   R.playBattle(m.battle,'auto');m.showResult();
   if(m.battle.result!==(id==='victory'?'party':'enemy'))throw Error('Invalid result fixture');
  },id);await p.getByRole('heading',{name:id==='victory'?'Victory':'Defeat',exact:true}).waitFor();
 }else if(id==='error-offline'){
  await p.context().setOffline(true);await p.evaluate(()=>{const m=window.__depthReview;m.error=true;m.notice='Connection lost. Retry.';m.notify(false);});
 }else if(chainScreen(id)){
  // Audio fixtures are isolated by the caller's Anvil snapshot. Fund only this
  // throwaway local guest so repeated screen runs do not exhaust the drip quota.
  const address=await p.evaluate(async()=>{const g=await import('/src/game/cardrpg/chain/guest.ts');return g.existingGuestAddress();});
  if(!address)throw Error('Missing disposable guest');
  const funded=await p.request.post('http://127.0.0.1:8546',{data:{jsonrpc:'2.0',id:1,method:'anvil_setBalance',params:[address,'0x16345785d8a0000']}});
  if((await funded.json()).error)throw Error('Local fixture funding failed');
  if(id==='wallet-panel'){await p.evaluate(()=>window.dispatchEvent(new Event('chain:wallet')));await p.locator('.chain-panel').waitFor();return;}
  const start=id.startsWith('market-')?'Market':'Café';
  await p.evaluate(name=>window.dispatchEvent(new CustomEvent('chain:open',{detail:name})),start);await p.locator('.chain-room').waitFor();
  const tab=async name=>{
   const rail=p.getByRole('navigation',{name:'Chain screens'}),b=rail.getByRole('button',{name,exact:true});
   if(await b.count())await b.click();else{await rail.getByRole('button',{name:'More',exact:true}).click();await p.getByRole('dialog',{name:'More',exact:true}).getByRole('button',{name,exact:true}).click();}
   await p.waitForTimeout(300);
  };
  if(id.startsWith('market-')){
   await button('Buy').first().waitFor();
   if(['market-buy','market-list'].includes(id)){await button('Buy').first().click();await click('Confirm purchase');await p.locator('.chain-success').waitFor({timeout:25000});if(id==='market-list')await click('Close receipt');}
   if(id==='market-my-listings')await click('Mine');
   if(id==='market-list'){await tab('Bag');await button('List').first().click();await p.getByRole('dialog',{name:'List',exact:true}).waitFor();}
  }else{
   await button('Complete quest').waitFor();
   if(['wallet-cafe','wallet-deed','wallet-withdraw','wallet-seal','wallet-fusion','wallet-spool','wallet-history','wallet-style','wallet-ornament-forge'].includes(id)){
    await tab('Judge');await p.getByRole('button',{name:'Judge pass',exact:false}).click();await p.getByRole('button',{name:'Fight boss',exact:false}).click();await tab('Café');await button('Complete quest').waitFor();
    if(id!=='wallet-cafe'){await click('Complete quest');await button('Mint free Deed').waitFor();}
    if(!['wallet-cafe','wallet-deed'].includes(id)){await click('Mint free Deed');await p.locator('.b-chain-receipts a').first().waitFor({timeout:25000});}
   }
   const view=id.split('-')[1];
   if(['withdraw','seal','fusion','spool'].includes(view))await p.getByRole('navigation',{name:'Café objects'}).getByRole('button',{name:view[0].toUpperCase()+view.slice(1),exact:true}).click();
   if(id==='wallet-history')await tab('History');
   if(id==='wallet-style')await tab('Style');
   if(id==='wallet-ornament-forge')await tab('Forge');
   if(id==='wallet-offline'){await p.context().setOffline(true);await click('Refresh chain');await p.waitForTimeout(700);}
  }
 }else throw Error(`No fixture for ${id}`);
 await p.waitForTimeout(200);
}

/** Only controls that a pointer can actually reach in the current state. */
export function screenControls(){
 const selector='button,a[href],summary,input:not([type="hidden"]),select,[role="button"],[role="tab"],[role="switch"]';
 const seen=new Map();
 return [...document.querySelectorAll(selector)].filter(el=>{
  if(el.matches(':disabled,[aria-disabled="true"]')||el.closest('[inert]'))return false;
  const r=el.getBoundingClientRect(),style=getComputedStyle(el),x=r.x+r.width/2,y=r.y+r.height/2;
  if(!r.width||!r.height||x<0||y<0||x>innerWidth||y>innerHeight||style.visibility==='hidden')return false;
  const hit=document.elementFromPoint(x,y);return el===hit||el.contains(hit);
 }).map((el,index)=>{
  const label=el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent.trim().replace(/\s+/g,' ')||el.getAttribute('name')||el.tagName;
  // A disposable guest creates a different real transaction hash each time.
  // Match the receipt control's role, retaining its actual label in evidence.
  const stableLabel=label.replace(/0x[0-9a-f]{40,64}/gi,'<chain-id>');
  const key=[el.tagName,el.getAttribute('type')||'',stableLabel].join('|'),ordinal=seen.get(key)||0;seen.set(key,ordinal+1);
  el.setAttribute('data-audio-probe',String(index));
  return {index,key:`${key}|${ordinal}`,label:label.slice(0,140),tag:el.tagName,type:el.getAttribute('type')||'',value:el.value??null};
 });
}
