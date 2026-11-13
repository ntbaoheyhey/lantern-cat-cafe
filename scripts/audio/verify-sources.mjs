import {readFileSync,readdirSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');
const json=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const walk=p=>readdirSync(resolve(root,p),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const hash=p=>createHash('sha256').update(readFileSync(resolve(root,p))).digest('hex');
const catalog=json('assets/audio-sources/CATALOG.json');
const licenses=json('apps/web/public/audio/LICENSES.json').files;
const audio=[...walk('assets/audio-sources'),...walk('apps/web/public/audio')].filter(p=>/\.(flac|opus|webm|mp3|wav|ogg|aif|aiff)$/i.test(p));
const errors=[];
for(const path of audio){
  const rows=licenses.filter(r=>r.path===path);
  if(rows.length!==1){errors.push(path+': missing or duplicate licence');continue;}
  const r=rows[0];
  if(r.sha256!==hash(path))errors.push(path+': licence hash mismatch');
  if(!/^https:\/\//.test(r.sourceUrl??'')||!r.author||!r.date||!r.licenseUrl)errors.push(path+': incomplete provenance');
  if(!['CC0','CC0-1.0','Own synthesis','Own recording','SIL OFL-1.1','Pixabay Content License','Kenney (CC0)','Sonniss GDC bundle licence'].includes(r.license))errors.push(path+': disallowed licence');
}
const seen=new Set(),grainRanges=new Map();
for(const row of catalog.clips){
  if(row.sha256!==hash(row.path))errors.push(row.path+': catalogue hash mismatch');
  if(seen.has(row.sha256))errors.push(row.path+': duplicate waveform/container');
  seen.add(row.sha256);
  if(!['flac','opus'].includes(row.codec)||!(row.durationSeconds>0)||!row.role)errors.push(row.path+': unusable clip');
  if(!Number.isFinite(row.quality?.samplePeakDbFS)||row.quality.samplePeakDbFS>-2.99)errors.push(row.path+': invalid normalization');
  if(row.role==='consonant'){
    const ranges=grainRanges.get(row.sourceId)??[];
    ranges.push(row.sourceRangeSeconds);grainRanges.set(row.sourceId,ranges);
  }
}
for(const [source,ranges] of grainRanges){
  ranges.sort((a,b)=>a[0]-b[0]);
  for(let i=1;i<ranges.length;i++)if(ranges[i][0]<ranges[i-1][1])errors.push(source+': overlapping consonant cuts');
}
const result={audioFiles:audio.length,licensedFiles:audio.length-errors.filter(e=>e.includes('licence')).length,
  clips:catalog.clips.length,consonantSourceRecordings:grainRanges.size,errors,
  checkedBytes:audio.reduce((s,p)=>s+statSync(resolve(root,p)).size,0),
  catalogue:{path:'assets/audio-sources/CATALOG.json',sha256:hash('assets/audio-sources/CATALOG.json')},
  licences:{path:'apps/web/public/audio/LICENSES.json',sha256:hash('apps/web/public/audio/LICENSES.json')}};
writeFileSync(resolve(root,'reports/v3-shell/b2/SOURCE-VERIFICATION.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));process.exitCode=errors.length?1:0;
