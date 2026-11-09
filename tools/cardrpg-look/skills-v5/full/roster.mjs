import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {open,apply} from './harness.mjs';import {coverage} from '../../b2/coverage.mjs';
import {createRequire} from 'node:module';const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=process.env.V5_OUT;await mkdir(out,{recursive:true});const rows=[],errors=[];
const ids=['button-guard','sock-skipper','teacup-healer','spool-ram','binding-thread','practice-cushion','pollen-scout','crumb-sentinel','needle-moth','rain-spool','yarn-giant','kettle-knight','pantry-crown'];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await open(page,process.env.V5_ARTIFACT);
 for(const id of ids){await apply(page,{gallery:'enemy:'+id,progress:-1});const detail=await page.evaluate(coverage);const unit=detail.units.find(u=>u.asset===id);rows.push({id,unit,...detail});await sharp(await page.screenshot()).webp({quality:78}).toFile(out+'/'+id+'.webp');}
}finally{await browser.close();const bosses=['yarn-giant','kettle-knight','pantry-crown'],regularMax=Math.max(...rows.filter(r=>!bosses.includes(r.id)).map(r=>r.unit.heightPercent));await writeFile(out+'/roster.json',JSON.stringify({method:'B2 same thirteen-opponent idle gallery at preset B; original boss denominator excludes Yarn/Kettle/Pantry only. Every actual model vertex checked against canvas bounds.',rows,errors,regularMax,ratios:rows.filter(r=>bosses.includes(r.id)).map(r=>({id:r.id,ratio:r.unit.heightPercent/regularMax})),outside:rows.flatMap(r=>r.units.filter(u=>u.box[0]<0||u.box[1]<0||u.box[2]>1||u.box[3]>1).map(u=>({shot:r.id,id:u.id,box:u.box})))},null,2));}
