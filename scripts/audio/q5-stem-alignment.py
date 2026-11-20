"""Measure recorder/source timing before drawing conclusions from mixed ASR."""
import datetime,gzip,json,subprocess
from pathlib import Path
import numpy as np
from scipy.signal import correlate
from callout_dsp import ROOT,recognizer,recognize,save
from publish_callouts import signed
b=ROOT/'reports/v3-shell/b2';m=json.loads((b/'mix/diagnostic-31-boss-stems-boss.json').read_text());rt=json.loads(gzip.decompress((ROOT/m['runtime']['path']).read_bytes()));integration=Path(json.loads((b/'q2/integration.json').read_text())['out']);manifest=json.loads((integration/'apps/web/public/audio/manifest.json').read_text());meta={r['cueId']:r for r in json.loads((integration/'apps/web/src/audio/voice-callouts.json').read_text())};sr=24000

def decode(p):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ac','1','-ar',str(sr),'-f','f32le','pipe:1']),dtype='<f4')
voice=decode(ROOT/next(s['path'] for s in m['stems'] if s['bus']=='voice'));packs={};rows=[];seen=set();model=recognizer(threads=2);out=b/'q5/stem31-alignment.json';folder=ROOT/'work/audio/stem31-alignment';folder.mkdir(parents=True,exist_ok=True)
for hit in rt['hits']:
 cue=hit['id']
 if hit['result']!='played' or cue not in meta or cue in seen:continue
 layer=hit['layers'][0];sample=next(s for s in manifest['cues'][cue] if s['variantId']==layer['variantId']);at=hit['at']/1000-rt['started'];duration=sample['duration'];
 if at<1 or at+duration+1>len(voice)/sr:continue
 assert layer['pitch']==1
 seen.add(cue);pack=sample['pack']
 if pack not in packs:packs[pack]=decode(integration/'apps/web/public'/manifest['packs'][pack]['webm'].lstrip('/'))
 ref=packs[pack][round(sample['start']*sr):round((sample['start']+duration)*sr)];start=round((at-.75)*sr);seg=voice[start:round((at+duration+.75)*sr)]
 corr=correlate(seg,ref,mode='valid',method='fft');idx=int(np.argmax(corr));offset=(start+idx)/sr-at
 crop=folder/f'{len(rows):02d}.flac';save(crop,voice[max(0,start+idx-round(.15*sr)):start+idx+len(ref)+round(.2*sr)])
 result=recognize(model,crop,meta[cue]['text']);rows.append({'cueId':cue,'nominalAt':at,'recorderOffsetSeconds':offset,**result});out.write_text(json.dumps({'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'diagnostic':True,'metric':signed(b/'mix/diagnostic-31-boss-stems-boss.json'),'method':'Cross-correlation of actual selected Opus sprite against continuous recorded voice bus, within +/-750ms of source-start log. Isolated recognition only diagnoses cropping or runtime processing.','rows':rows},indent=2)+'\n');print(cue,round(offset,4),result['wordAccuracy'],result['recognized'],flush=True)
