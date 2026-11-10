// Extract original film frames for manual acceptance; never composite into the film.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const receipt=JSON.parse(await readFile(process.env.ART_FILM_JSON,'utf8')),out=resolve(process.env.ART_OUT),scratch=resolve('work/p10-final-film-samples');
await mkdir(out,{recursive:true});await mkdir(scratch,{recursive:true});
const o=receipt.observation,ultimates=o.events.filter(e=>e.ultimate),formations=o.formations??[],four=formations.find(r=>r.bases.length===4),three=formations.find(r=>r.bases.length===3);
const duration=Number(receipt.probe.format.duration),requested=[0,ultimates[0]?.at+.4,duration*.3,duration*.5,four?.at+.7,three?.at+.7,duration*.8,duration-3,duration-.1].filter(Number.isFinite);
const times=[...new Set(requested.map(t=>Math.round(Math.max(0,Math.min(duration-.1,t))*10)/10))].sort((a,b)=>a-b),tiles=[];
for(const [i,t] of times.entries()){
 const file=scratch+'/'+i+'.png';
 execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(t),'-i',receipt.master,'-frames:v','1',file]);
 const left=i%3*480,top=Math.floor(i/3)*324;
 tiles.push({input:await sharp(file).resize(480,300).toBuffer(),left,top:top+24});
 tiles.push({input:Buffer.from(`<svg width="480" height="24"><text x="9" y="17" fill="#fff0d2" font-size="14">Uncut x1 boss film · ${t.toFixed(1)} s</text></svg>`),left,top});
}
await sharp({create:{width:1440,height:Math.ceil(times.length/3)*324,channels:3,background:'#173039'}}).composite(tiles).webp({quality:85}).toFile(out+'/boss-film-contact.webp');
if(four){
 const file=scratch+'/phase3-four.png';execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(four.at+.7),'-i',receipt.master,'-frames:v','1',file]);
 await sharp(file).webp({quality:87}).toFile(out+'/phase3-four-helpers.webp');
}
const review={method:'Unaltered frames sampled from the uninterrupted master. Contact-sheet labels are outside frames. These stills are for manual acceptance, not a performance benchmark.',duration,observationSeconds:o.seconds,encodedClockDifference:Math.abs(duration-o.seconds),size:receipt.probe.format.size,ultimates:ultimates.length,complete:receipt.completeBattle,resultView:receipt.resultView??null,result:o.result,errors:receipt.errors,faceHpOverlap:o.faceHpOverlap,formations,times,master:receipt.master,preview:receipt.preview};
await writeFile(out+'/film-review.json',JSON.stringify(review,null,2)+'\n');
if(!review.complete||!review.resultView?.visible||review.resultView.heldMs<1800||review.result!==receipt.expectedResult||review.errors.length||review.faceHpOverlap||review.ultimates<3||!four||!three||review.encodedClockDifference>1)throw Error('Film acceptance checks failed: inspect film-review.json');
console.log(JSON.stringify({seconds:duration,ultimates:review.ultimates,result:review.result,fourHelpersAt:four.at,threeHelpersAt:three.at,clockDifference:review.encodedClockDifference,manualReview:'pending'}));
