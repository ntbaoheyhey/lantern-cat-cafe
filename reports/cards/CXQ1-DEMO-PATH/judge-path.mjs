import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { runStages, allowedRequest, assertProof, STAGES } from './gate-core.mjs';
const card = dirname(fileURLToPath(import.meta.url));
const repo = resolve(process.env.REPO_DEP_PATH || '/Users/bao/.codex/worktrees/mega-deno0/taskbar-hero');
const base = process.env.BASE_URL || 'https://taskbarhero-eight.vercel.app/';
const output = resolve(process.env.EVIDENCE_DIR || resolve(card,'evidence',new Date().toISOString().replace(/[:.]/g,'-')));
const args = process.argv.slice(2); const requested = args[0] || 'both';
assert.ok(['both','1280x720','1600x900'].includes(requested), 'Size must be both, 1280x720 or 1600x900');
assert.equal(new URL(base).hash, '', 'Use the public landing URL; no hash shortcuts');
assert.equal(new URL(base).search, '', 'Use the public landing URL; no fixture query parameters');
await mkdir(output,{recursive:true});
const runtimePath=resolve(card,'runtime.json');
const runtime=JSON.parse(await readFile(runtimePath,'utf8'));
await writeFile(runtimePath,JSON.stringify({...runtime,status:'RUNNING',known_pids:[process.pid],updated_at:new Date().toISOString()},null,2)+'\n');
const command = {argv:process.argv,env:{REPO_DEP_PATH:repo,BASE_URL:base,EVIDENCE_DIR:output},startedAt:new Date().toISOString()};
await writeFile(resolve(output,'command.json'),JSON.stringify(command,null,2));
function git(...args) { try { return execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim(); } catch { return null; } }
const source = {head:git('rev-parse','HEAD'),dirty:git('status','--porcelain'),role:'Inspection/dependency source only; NOT claimed deployed head'};
const require = createRequire(resolve(repo,'apps/web/package.json'));
let browser; const results = [];
const safeUrl = input => { try { const u = new URL(input); return `${u.origin}${u.pathname}`; } catch { return '[invalid URL]'; } };
const redact = s => String(s).replace(/https?:\/\/[^\s"')]+/g,safeUrl).replace(/(?:Bearer\s+|eyJ)[A-Za-z0-9._-]+/g,'[redacted]');
async function control() { assert.doesNotMatch(await readFile(resolve(card,'CONTROL.md'),'utf8'), /\bPAUSED?\b(?! instruction)/i, 'Card paused'); }
try {
  await control();
  const { chromium, expect } = require('@playwright/test');
  browser = await chromium.launch({headless:true});
  for (const size of requested === 'both' ? ['1280x720','1600x900'] : [requested]) {
    await control();
    const [width,height] = size.split('x').map(Number); const dir = resolve(output,size); await mkdir(dir,{recursive:true});
    if(results.some(r=>(r.responses||[]).some(x=>x.status===429))) {
      const blocked={status:'BLOCKED',viewport:{width,height},reason:'Prior viewport observed HTTP 429; no retry or further probe is authorized in this run',steps:STAGES.map(name=>({name,status:'BLOCKED',blockedBy:'HTTP 429'})),source};
      await writeFile(resolve(dir,'result.json'),JSON.stringify(blocked,null,2)+'\n'); results.push(blocked); continue;
    }
    const context = await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
    const page = await context.newPage(); page.setDefaultTimeout(5000); page.setDefaultNavigationTimeout(20000);
    const events = []; const errors = []; const responses = []; let screenshotBytes = 0; let screenshots = 0; let timer;
    const bad = (kind,message) => { const event = {at:new Date().toISOString(),kind,message:redact(message)}; events.push(event); errors.push(event); };
    page.on('console', m => { if(m.type()==='error') bad('console-error',m.text()); });
    page.on('pageerror', e => bad('page-error',e.message));
    page.on('requestfailed', r => bad('request-failed',`${r.method()} ${safeUrl(r.url())} ${r.failure()?.errorText}`));
    page.on('response', r => { const item={url:safeUrl(r.url()),status:r.status()}; responses.push(item); if(r.status()>=400) bad('http-error',`${r.status()} ${safeUrl(r.url())}`); });
    await context.route('**/*',async route => {
      const r = route.request();
      if(!allowedRequest(r.method(),r.postData())) { bad('blocked-write',`${r.method()} ${safeUrl(r.url())}`); await route.abort('blockedbyclient'); }
      else await route.continue();
    });
    const health = () => assert.equal(errors.length,0,`Browser/network failures: ${JSON.stringify(errors)}`);
    const visible = async locator => { await expect(locator).toBeVisible(); await expect(locator).toBeInViewport(); };
    const click = async locator => { await visible(locator); await expect(locator).toBeEnabled(); await locator.click(); };
    const tab = name => page.getByRole('tab',{name,exact:true});
    const id = name => page.getByTestId(name);
    const text = async () => page.locator('body').innerText();
    let deployment = {head:null,status:'UNVERIFIED',reason:'No trusted deployed commit metadata observed'};
    let identity = {}; let idleBefore = '';
    const actions = {
      landing: async () => {
        const response = await page.goto(base,{waitUntil:'domcontentloaded'});
        assert.ok(response && response.ok(), 'Landing HTTP load failed');
        const html = await response.text(); const headers = response.headers();
        identity = {finalUrl:safeUrl(page.url()),htmlSha256:createHash('sha256').update(html).digest('hex'),etag:headers.etag??null,vercelRequestId:headers['x-vercel-id']??null,assets:await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('src')))};
        const declared = await page.locator('meta[name="git-commit"],meta[name="build-commit"]').evaluateAll(nodes=>nodes.map(n=>n.content));
        const hash = declared.find(x=>/^[a-f0-9]{40}$/i.test(x));
        if(hash) deployment={head:hash,status:'DECLARED_NOT_INDEPENDENTLY_VERIFIED',reason:'HTML build metadata declaration; coordinator must verify deployment mapping'};
        await visible(id('landing-hero')); await visible(page.getByRole('button',{name:'Play as guest',exact:true}));
      },
      guest: async () => { await click(page.getByRole('button',{name:'Play as guest',exact:true})); await visible(id('class-picker')); assert.match(await text(),/guest|demo|preview/i,'Guest mode must be visibly identified'); },
      class: async () => { await click(id('class-card-warrior')); await click(id('class-picker-choose-button')); await click(id('class-picker-confirm-button')); await visible(id('home-dashboard')); await expect(id('home-hero-card')).toContainText(/Warrior/i); },
      'idle-loop': async () => {
        const progress=page.getByRole('group',{name:/^Chapter \d+ .*round \d+ of \d+, \d+ of \d+ monsters$/i});
        await visible(progress); idleBefore=await progress.getAttribute('aria-label');
        await expect(progress).not.toHaveAttribute('aria-label',idleBefore,{timeout:20000});
        await expect(id('home-event-log')).toContainText(/gathered [1-9]\d* Fish|Advanced to Chapter|leveled up/i,{timeout:15000});
      },
      boss: async () => {
        await click(tab('Map')); await visible(page.getByRole('region',{name:'Boss Gate',exact:true}));
        await click(page.getByRole('button',{name:'Fight',exact:true}));
        await expect(page.getByRole('status').filter({hasText:/Victory|Defeat/}).first()).toBeVisible({timeout:20000});
        assert.doesNotMatch(await text(),/Defeat[. —]/,'Judge path requires a completed boss victory');
        await click(page.getByRole('button',{name:'Back to exploring',exact:true}));
      },
      forge: async () => {
        await click(tab('Forge')); await visible(id('forge-panel')); await click(id('craft-btn'));
        await click(id('craft-confirm-btn')); await visible(id('craft-result'));
        assert.match(await id('craft-result').innerText(),/crafted|obtained|new|Lv\./i,'Craft result must describe an item');
      },
      bag: async () => {
        await click(tab('Bag')); await visible(id('bag-screen'));
        const items=page.getByRole('list',{name:'Bag items',exact:true}); await visible(items);
        await click(items.getByRole('button').first()); await visible(page.getByRole('region',{name:'Item detail',exact:true}));
      },
      'on-chain-proof': async () => {
        // A real visible proof affordance is required; no hash navigation or injected UI.
        await click(page.getByRole('button',{name:/^(?:View )?On.chain proof$/i}));
        const proof=page.getByRole('region',{name:/^On.chain proof$/i}); await visible(proof);
        const links=await proof.locator('a:visible').evaluateAll(nodes=>nodes.map(n=>n.href));
        assertProof(await proof.innerText(),links);
      },
      market: async () => {
        await click(tab('Market')); const panel=page.getByRole('tabpanel',{name:'Market',exact:true}); await visible(panel);
        const content=await panel.innerText(); assert.match(content,/Fuji.*testnet|testnet.*Fuji/i);
        assert.doesNotMatch(content,/Connect your wallet to see|not available|couldn't read/i,'Guest browsing must be available');
        await visible(panel.locator('[data-testid="listings"], [data-testid="listings-empty"]'));
      }
    };
    const afterStep = async step => {
      await control();
      assert.ok(screenshots<9,'Screenshot count budget: 9 per viewport');
      const path=resolve(dir,`${String(STAGES.indexOf(step.name)+1).padStart(2,'0')}-${step.name}-${step.status}.png`);
      await page.screenshot({path,fullPage:false,timeout:5000}); const bytes=(await stat(path)).size; screenshots++; screenshotBytes+=bytes;
      step.screenshot={path,bytes}; assert.ok(bytes<=2*1024*1024,'Screenshot exceeds 2 MiB'); assert.ok(screenshotBytes<=18*1024*1024,'Viewport screenshots exceed 18 MiB');
      await writeFile(resolve(dir,`${step.name}.txt`),redact(await text()));
    };
    const started=Date.now(); timer=setTimeout(()=>{bad('deadline','Three-minute judge deadline reached');void context.close();},180000);
    let result;
    try { result=await runStages(actions,{health,afterStep}); } finally {clearTimeout(timer);}
    if(errors.length) result.status='FAIL';
    Object.assign(result,{viewport:{width,height},baseUrl:base,source,deployment,identity,startedAt:new Date(started).toISOString(),endedAt:new Date().toISOString(),judgeBudgetMs:180000,screenshotBytes,screenshots,errors,responses,events,transactionsPerformed:0,guestOnly:true});
    await writeFile(resolve(dir,'result.json'),JSON.stringify(result,null,2)+'\n');
    results.push(result); await context.close();
  }
} catch(error) {
  results.push({status:'SETUP_ERROR',error:redact(error.stack),source});
} finally { if(browser) await browser.close(); }
const status=results.length && results.every(r=>r.status==='PASS')?'PASS':'FAIL';
const summary={status,scope:'Recurring guest judge path; not formal grade or full CXQ1',source,results,command,exitCode:status==='PASS'?0:1};
await writeFile(resolve(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({status,output,viewports:results.map(r=>({viewport:r.viewport,status:r.status,failed:r.steps?.find(s=>s.status==='FAIL')?.name,error:r.error}))}));
await writeFile(runtimePath,JSON.stringify({...runtime,status,known_pids:[],updated_at:new Date().toISOString(),observations_429:results.flatMap(r=>(r.responses||[]).filter(x=>x.status===429))},null,2)+'\n');
process.exitCode=summary.exitCode;
