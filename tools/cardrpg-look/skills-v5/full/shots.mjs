import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {open,apply,audit} from './harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;
await mkdir(out+'/shots',{recursive:true});
const rows=JSON.parse(await readFile(process.env.V5_CASES||'/tmp/cardrpg-v5full-m1/cases.json'));
const result={sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),shots:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{for(const [width,height]of JSON.parse(process.env.V5_SIZES||'[[1440,900],[1280,720],[1024,600]]')){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:Number(process.env.V5_DPR||1)});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,artifact);
 for(const row of rows){await apply(page,row);const name=`${width}-${row.id}-${row.name}.webp`;
 await sharp(await page.screenshot()).webp({quality:80}).toFile(`${out}/shots/${name}`);
 result.shots.push({id:row.id,mode:row.mode??'FIXTURE',case:row.case,seed:row.seed,round:row.round,action:row.action,name,width,dpr:Number(process.env.V5_DPR||1),file:'shots/'+name,...await page.evaluate(audit)});
 }await page.close();
}}finally{await browser.close();await writeFile(out+'/shots.json.gz',gzipSync(JSON.stringify(result)))}
console.log(JSON.stringify({shots:result.shots.length,errors:result.errors,overlaps:result.shots.reduce((n,r)=>n+r.overlaps.length,0),unplaced:result.shots.filter(r=>r.unplaced.length).map(r=>[r.id,r.width,r.unplaced])}));
