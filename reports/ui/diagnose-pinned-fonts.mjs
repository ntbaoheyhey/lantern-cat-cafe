import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
const root='/Users/bao/taskbar-hero-ui-firstplay-b',web=resolve(root,'apps/web');
const require=createRequire(resolve(web,'package.json'));
const {chromium}=require('@playwright/test');
const {preview}=await import(pathToFileURL(require.resolve('vite')).href);
const {PNG}=require(resolve(root,'node_modules/.pnpm/playwright-core@1.64.1/node_modules/playwright-core/lib/utilsBundle.js'));
const out='/Users/bao/taskbar-hero-ui-ledger/reports/ui/logs/flag-pinned-font-diagnostic';mkdirSync(out,{recursive:true});
const port=5380;const check=createServer();await new Promise((ok,fail)=>{check.once('error',fail);check.listen(port,'127.0.0.1',ok)});await new Promise(ok=>check.close(ok));
const baseline=readFileSync(resolve(web,'e2e/ui/art2-baseline/landing-1600.png'));
const server=await preview({configFile:false,root:web,envDir:false,build:{outDir:'dist-v2/e2e-5351'},preview:{port,strictPort:true}});
const browser=await chromium.launch();const report={head:'8c15199315bf6be4dad793b9364010fce3ccc4b7',runs:[]};
try{for(let i=0;i<40;i++){
 const context=await browser.newContext({viewport:{width:1600,height:900},reducedMotion:'reduce'});const page=await context.newPage();
 await page.clock.install({time:Date.UTC(2026,10,3,12)});await page.clock.pauseAt(Date.UTC(2026,10,3,12));
 await page.addInitScript(()=>localStorage.setItem('taskbar-hero.howToPlaySeen','1'));
 const definitions=JSON.parse(readFileSync('/Users/bao/taskbar-hero-ui-ledger/reports/ui/visual-fonts-prototype.json'));const css=definitions.flatMap(f=>f.weights.map(w=>`@font-face {font-family:'${f.family}';font-style:normal;font-weight:${w};font-display:swap;src:url('${f.url}') format('woff2');}`)).join('\n');await page.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:css}));await page.goto(`http://localhost:${port}/#landing`);await page.getByTestId('landing-hero').waitFor();
 await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(40);await page.evaluate(()=>document.fonts.ready);
 const shots=[];const states=[];
 for(let frame=0;frame<4;frame++){
  if(frame)await page.clock.runFor(40);
  const shot=await page.screenshot({animations:'disabled'});shots.push(shot);
  const state=await page.evaluate(()=>({fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight,style:f.style,status:f.status})),title:document.querySelector('.landing__title').getBoundingClientRect().toJSON(),textStyles:[...document.querySelectorAll('.landing__title,.landing__network-pill,.landing__promise,.landing__footnote')].map(n=>{const s=getComputedStyle(n);return {cls:n.className,font:s.font,color:s.color,opacity:s.opacity,transform:s.transform}})}));
  states.push({frame,matchBaseline:shot.equals(baseline),sameAsPrevious:frame?shot.equals(shots[frame-1]):null,state});
 }
 const mismatch=shots.some(s=>!s.equals(baseline));
 if(mismatch){for(let j=0;j<shots.length;j++)writeFileSync(resolve(out,`run${i}-frame${j}.png`),shots[j]);}
 report.runs.push({i,mismatch,states});writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({i,match:states.map(s=>s.matchBaseline),stable:states.map(s=>s.sameAsPrevious)}));
 await context.close();
}}finally{await browser.close();await new Promise(ok=>server.httpServer.close(ok));}
