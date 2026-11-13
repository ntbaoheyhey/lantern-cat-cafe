import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import {root,evidenceMeta} from './check-gates.mjs';
const require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const b=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 const p=await b.newPage();await p.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await p.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await p.waitForFunction(()=>window.__depthReview);
 const result=await p.evaluate(async root=>{
  await document.fonts.ready;
  const {BattleNumbers}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/numbers.ts');
  const host=document.createElement('div');document.body.append(host);const n=new BattleNumbers(host);
  const atlas=n.atlas('#ffd891'),c=atlas.getContext('2d'),heights={};
  for(let i=0;i<10;i++){
   const a=c.getImageData(i*64,0,64,80).data;let lo=80,hi=0;
   for(let y=0;y<80;y++)for(let x=0;x<64;x++)if(a[(y*64+x)*4+3]>=128){lo=Math.min(lo,y);hi=Math.max(hi,y);}
   heights[i]=hi-lo+1;
  }
  const font=getComputedStyle(host).getPropertyValue('--font-num');n.dispose();host.remove();return {font,atlasFontSize:48,heights};
 },root);
 await writeFile(root+'/reports/v3-battle/a2/R/baseline/glyph-ink.json',JSON.stringify({_meta:evidenceMeta(),...result},null,2)+'\n');
 console.log(result);
}finally{await b.close();}
