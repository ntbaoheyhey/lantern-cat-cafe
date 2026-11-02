import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {STAGES,NFT,MARKET,allowedRequest,assertProof,runStages,phaseStages} from './gate-core.mjs';
const actions = () => Object.fromEntries(STAGES.map(n=>[n,async()=>{}]));
const proof=`Avalanche Fuji testnet. Guest preview is not a transaction. RelicNFT ${NFT}; RelicMarket ${MARKET}`;
const links=[NFT,MARKET].map(a=>`https://testnet.snowtrace.io/address/${a}`);
test('complete controlled run passes all nine stages',async()=>{const r=await runStages(actions());assert.equal(r.status,'PASS');assert.equal(r.steps.length,9);});
test('missing stage fails and blocks every later action without skipping',async()=>{const a=actions();let called=false;a.class=async()=>{throw Error('missing class')};a.market=async()=>{called=true};const r=await runStages(a);assert.equal(r.status,'FAIL');assert.equal(r.steps[2].status,'FAIL');assert.equal(r.steps.filter(x=>x.status==='BLOCKED').length,6);assert.equal(called,false);});
test('console and page errors fail the same health gate',async()=>{for(const kind of ['console-error','page-error','request-failed','http-error','blocked-write']){const r=await runStages(actions(),{health(){throw Error(kind)}});assert.equal(r.status,'FAIL');assert.equal(r.steps[0].error,kind)}});
test('elapsed judge time over 180 seconds fails',async()=>{let time=0;const a=actions();a.landing=async()=>{time=180001};const r=await runStages(a,{now:()=>time});assert.equal(r.steps[0].status,'FAIL');assert.match(r.steps[0].error,/budget/);});
test('capture or screenshot budget failures cannot pass',async()=>{const r=await runStages(actions(),{afterStep:async()=>{throw Error('Screenshot exceeds 200 KiB')}});assert.equal(r.status,'FAIL');assert.match(r.steps[0].error,/Screenshot/);});
test('read-only transport rejects backend writes, signing, and mixed RPC batches',()=>{assert.equal(allowedRequest('GET',null),true);assert.equal(allowedRequest('POST',JSON.stringify({jsonrpc:'2.0',method:'eth_call'})),true);for(const body of [null,'{}',JSON.stringify({jsonrpc:'2.0',method:'eth_sendRawTransaction'}),JSON.stringify([{jsonrpc:'2.0',method:'eth_call'},{jsonrpc:'2.0',method:'personal_sign'}])]) assert.equal(allowedRequest('POST',body),false);assert.equal(allowedRequest('DELETE',null),false);});
test('proof validates both visible exact addresses and Fuji explorer links',()=>{assert.doesNotThrow(()=>assertProof(proof,links));for(const [txt,ls] of [[proof.replace(NFT,'0xwrong'),links],[proof,links.map(x=>x.replace('testnet.snowtrace.io','snowtrace.io'))],[proof.replace('Fuji','mainnet'),links],[proof.replace('not a transaction','a minted transaction'),links],[proof,[]]])assert.throws(()=>assertProof(txt,ls));});
test('real browser assertions reject hidden stage and ineffective guest click',async()=>{
 const repo=process.env.REPO_DEP_PATH||'/Users/bao/.codex/worktrees/mega-deno0/taskbar-hero';
 const require=createRequire(resolve(repo,'apps/web/package.json'));const {chromium,expect}=require('@playwright/test');const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage();await page.setContent('<section data-testid="landing-hero" hidden>Landing</section><button>Play as guest</button>');
 const a=actions();a.landing=async()=>{await expect(page.getByTestId('landing-hero')).toBeVisible({timeout:150})};let r=await runStages(a);assert.equal(r.steps[0].status,'FAIL');
 await page.setContent('<section data-testid="landing-hero">Landing</section><button>Play as guest</button>');a.guest=async()=>{await page.getByRole('button',{name:'Play as guest'}).click();await expect(page.getByTestId('class-picker')).toBeVisible({timeout:150})};r=await runStages(a);assert.equal(r.steps[0].status,'PASS');assert.equal(r.steps[1].status,'FAIL');
 }finally{await browser.close()}
});

test('late browser error or evidence time cannot escape final health/budget check',async()=>{let time=0;const r=await runStages(actions(),{now:()=>time,afterStep:async()=>{time=180001}});assert.equal(r.status,'FAIL');assert.match(r.steps[0].error,/evidence capture/);let late=false;const e=await runStages(actions(),{health:()=>{if(late)throw Error('late page error')},afterStep:async()=>{late=true}});assert.equal(e.status,'FAIL');assert.match(e.steps[0].error,/late page error/);});

test('failed screenshot capture is not retried',async()=>{let captures=0;const r=await runStages(actions(),{afterStep:async()=>{captures++;throw Error('capture failed')}});assert.equal(r.status,'FAIL');assert.equal(captures,1);});

test('phased gate explicitly defers proof and cannot persist after both prerequisite merges',async()=>{
 assert.equal(phaseStages('full').length,9);
 assert.equal(phaseStages('merged-core',[]).length,8);
 assert.equal(phaseStages('merged-core',['CXU3']).includes('on-chain-proof'),false);
 assert.throws(()=>phaseStages('merged-core',['CXU3','CXC2']),/full nine-stage/);
 const a=actions();a.bag=async()=>{throw Error('broken merged bag')};
 const result=await runStages(a,{stages:phaseStages('merged-core')});assert.equal(result.status,'FAIL');
 assert.throws(()=>phaseStages('unknown'));
});
