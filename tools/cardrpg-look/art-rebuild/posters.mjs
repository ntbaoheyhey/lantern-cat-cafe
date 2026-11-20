import { chromium } from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { open, apply, audit } from '../skills-v5/full/harness.mjs';
const sharp = createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact = resolve(process.env.ART_ARTIFACT || 'docs/cardrpg-look/v5-live.html');
const out = resolve(process.env.ART_OUT);
const cases = JSON.parse(gunzipSync(await readFile('reports/cardrpg-look/skills-v5/full/m4/live-pilot/live-cases/cases.json.gz')));
await mkdir(out,{recursive:true});
const result = { artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),
  method:'Fixed P16 resolved live replay; four labelled gallery ultimates at impact beat55%; camera B, time3.2, DPR1. No gameplay or timing claims from capture.', shots:[], errors:[] };
const browser = await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try {
  for(const [width,height] of [[1440,900],[1024,600]]) {
    const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    page.on('pageerror', e=>result.errors.push(String(e)));
    await open(page,artifact);
    const hero = cases.find(r=>r.id==='P16');
    if(!hero) throw Error('Registered P16 missing');
    for(const id of ['hero','mochi','soot','clover','mallow']) {
      if(id==='hero') await apply(page,hero);
      else {
        await apply(page,{gallery:id+'-4',progress:0});
        await page.evaluate(()=>{const m=window.__depthReview,b=m.plan.beats[2];m.animationAt=b.start+b.duration*.55;m.notify(false)});
        await page.evaluate(async()=>{await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame)});
      }
      const file=`${width}-${id}.webp`;
      await sharp(await page.screenshot()).webp({quality:88}).toFile(out+'/'+file);
      result.shots.push({id,width,file,pin:id==='hero'?{seed:hero.seed,round:hero.round,action:hero.action}:{gallery:id+'-4',beat:2,fraction:.55},...await page.evaluate(audit)});
    }
    await page.close();
  }
} finally {await browser.close();await writeFile(out+'/posters.json',JSON.stringify(result,null,2)+'\n')}
console.log(JSON.stringify({shots:result.shots.length,errors:result.errors,overlaps:result.shots.flatMap(r=>r.overlaps).length}));
