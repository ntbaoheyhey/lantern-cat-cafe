/** Contact sheets are scratch evidence; full captures remain authoritative. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readFile,access} from 'node:fs/promises';
const root=resolve(import.meta.dirname,'../..'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp'),tag=process.argv[2]??'c11';
const directory=resolve(root,'reports/cardrpg-c/shots',tag);
const reportFile=await access(resolve(directory,'captures.json')).then(()=>'captures.json',()=>access(resolve(directory,'review.json')).then(()=>'review.json',()=>'gallery-review.json'));
const report=JSON.parse(await readFile(resolve(directory,reportFile),'utf8'));
for(const width of [1280,1440]){
 const rows=report.shots.filter(s=>s.width===width);
 for(let from=0;from<rows.length;from+=6){
  const cells=[];
  for(const[slot,s]of rows.slice(from,from+6).entries()){
   const top=Math.floor(slot/2)*370,left=slot%2*640;
   const frame=await sharp(resolve(root,'reports/cardrpg-c/shots',tag,s.file)).resize(640,338,{fit:'contain',background:'#322730'}).png().toBuffer();
   cells.push({input:frame,left,top},{input:Buffer.from(`<svg width="640" height="32"><rect width="640" height="32" fill="#322730"/><text x="12" y="23" font-family="sans-serif" font-size="18" fill="#f8e5c4">${width} · ${s.name??s.file}</text></svg>`),left,top:top+338});
  }
  await sharp({create:{width:1280,height:Math.ceil(Math.min(6,rows.length-from)/2)*370,channels:4,background:'#322730'}}).composite(cells).webp({quality:88}).toFile(`/tmp/cardrpg-c-${tag}-sheet-${width}-${from}.webp`);
 }
}
console.log(JSON.stringify({tag,shots:report.shots.length}));
