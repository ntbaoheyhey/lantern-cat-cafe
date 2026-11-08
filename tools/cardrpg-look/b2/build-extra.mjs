import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json'),sharp=require('sharp');
export async function b2Evidence(root){
 const images=[],files=[];const names=['First round','Mochi’s last light','Clover’s greenhouse','Three opponents','Yarn Giant awakens','A new companion'];
 for(let i=1;i<=6;i++){
  const pair={name:names[i-1]};
  for(const [side,dir]of [['before','v0'],['after','v5/shots']]){
   const {rows}=JSON.parse(await readFile(resolve(root,`reports/cardrpg-look/b2/${dir}/shots.json`)));
   const row=rows.find(r=>r.width===1280&&r.name.startsWith(`${i}-`));const path=`reports/cardrpg-look/b2/${dir}/${row.file}`,raw=await readFile(resolve(root,path));
   const thumb=await sharp(raw).resize(640).webp({quality:82}).toBuffer();pair[side]=`data:image/webp;base64,${thumb.toString('base64')}`;files.push({path,sourceSha256:createHash('sha256').update(raw).digest('hex')});
  }
  images.push(pair);
 }
 const path='reports/cardrpg-look/b2/v5/ultimates/sheet.png',raw=await readFile(resolve(root,path));
 const sheet=await sharp(raw).resize({width:1200}).webp({quality:84}).toBuffer();files.push({path,sourceSha256:createHash('sha256').update(raw).digest('hex')});
 const payload=JSON.stringify({images,ultimateSheet:`data:image/webp;base64,${sheet.toString('base64')}`}).replace(/</g,'\\u003c');
 return {script:`window.__b2Showcase=${payload};`,bytes:Buffer.byteLength(payload),files};
}
