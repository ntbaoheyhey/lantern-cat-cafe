import {createServer}from'vite';import{chromium,expect}from'@playwright/test';import fs from'node:fs';
const c='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GB-R1';
process.env.VITE_GAME_V2='1';process.env.VITE_SUPABASE_URL='';process.env.VITE_SUPABASE_ANON_KEY='';
const server=await createServer({envDir:false,server:{port:4434,strictPort:true}});let browser;
const results=[];
try{await server.listen();browser=await chromium.launch();
for(const viewport of[{width:1280,height:720},{width:1600,height:900}]){
const ctx=await browser.newContext({viewport,reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.addInitScript(()=>localStorage.setItem('taskbar-hero.howToPlaySeen','1'));await page.goto('http://localhost:4434');
const save=await page.evaluate(async()=>{const m=await import('/src/api/mockV2Fixtures.ts');return m.mockV2SaveJson('midGame',{nowMs:Date.now(),classId:'witch'});});
const key=fs.readFileSync('src/api/MockGameApiV2.ts','utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];await page.evaluate(([k,s])=>localStorage.setItem(k,s),[key,save]);await page.reload();
await expect(page.getByTestId('nav-home')).toBeVisible();await page.evaluate(()=>document.fonts.ready);
const canvas=page.getByRole('region',{name:'Game stage'}).locator('canvas');await expect(canvas).toHaveCount(1);await expect.poll(()=>canvas.evaluate(c=>{const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data,halves=[false,false];for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>0)halves[x<c.width/2?0:1]=true;return halves;})).toEqual([true,true]);await page.screenshot({path:c+'/ui-home-'+viewport.width+'.png',animations:'disabled'});if(fs.statSync(c+'/ui-home-'+viewport.width+'.png').size>=200*1024)throw Error('PNG budget');
const home=page.getByTestId('nav-home');for(let i=0;i<20&&!await home.evaluate(e=>e===document.activeElement);i++)await page.keyboard.press('Tab');await expect(home).toBeFocused();
const screens=[];for(const id of['home','bag','map','forge','market','hero','help']){
const nav=page.getByTestId('nav-'+id);await expect(nav).toBeFocused();await expect(nav).toHaveAttribute('aria-selected','true');const focus=await nav.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{outline:s.outlineStyle,width:parseFloat(s.outlineWidth),inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}});expect(focus.outline).not.toBe('none');expect(focus.width).toBeGreaterThan(0);expect(focus.inside).toBe(true);
await page.keyboard.press('Enter');await expect(page.locator('.app-shell')).toHaveAttribute('data-active-screen',id);await expect.poll(()=>page.evaluate(id=>document.getElementById('panel-'+id)?.contains(document.activeElement),id)).toBe(true);const subnav=[];if(id==='forge'){for(const sub of ['craft','salvage','relic']){const target=page.getByTestId('tab-'+sub);for(let i=0;i<30&&!await target.evaluate(e=>e===document.activeElement);i++)await page.keyboard.press('Tab');await expect(target).toBeFocused();await page.keyboard.press('Enter');await expect(target).toHaveAttribute('aria-selected','true');await expect(page.getByTestId(sub+'-panel')).toBeVisible();subnav.push(sub);}}await page.keyboard.press('Escape');await expect(nav).toBeFocused();screens.push({id,focus,enteredPanel:true,escapeReturned:true,subnav});await page.keyboard.press('ArrowDown');}
expect(errors).toEqual([]);results.push({viewport,screens,errors});await ctx.close();}
fs.writeFileSync(c+'/keyboard.json',JSON.stringify(results,null,2));console.log('14 rail journeys plus6Forge subnav visits pass;2 PNGs under200KiB');
}finally{await browser?.close();await server.close();}
