"""Keep the frozen twelve-line selection; compare each shipped take with its mixed crop."""
import datetime,gzip,hashlib,json,re,subprocess,sys
from pathlib import Path
from faster_whisper import WhisperModel
ROOT=Path(__file__).resolve().parents[3]
trial=sys.argv[1]
assert re.fullmatch(r'[a-z0-9-]+',trial)
folder=ROOT/'reports/v4-ship/S5'/trial
out=folder/'source-diagnosis.json'
if out.exists():raise RuntimeError('Preserve previous diagnosis')
selection=json.loads((folder/'intelligibility.json').read_text())
capture=json.loads((folder/'recognition-capture.json').read_text())
manifest=json.loads((ROOT/'apps/web/public/audio/manifest.json').read_text())
for item in capture['signature']:
 if item['path'].startswith('apps/web/public/audio/') and hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()!=item['sha256']:
  raise RuntimeError('Shipped source differs from frozen capture')
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=1,download_root=str(ROOT/'tools/audio-models'),local_files_only=True)
words=lambda text:re.findall(r"[a-z0-9']+",text.lower())
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'trial':trial,'method':'Same twelve frozen gameplay occurrences and same unprompted small.en recognizer. Decode each exact shipped pack offset/duration from source telemetry, add only150ms/200ms silence, no normalization or gain. Compare source versus full mixed recognition; no replacement acceptance lines.','rows':[]}
for i,row in enumerate(selection['rows']):
 scene=next(s for s in capture['rows'] if s['name']==row['scene'])
 data=json.loads(gzip.decompress((ROOT/scene['events']['path']).read_bytes()))
 candidates=[]
 for s in data['starts']:
  if s['id']!=row['cueId'] or not s.get('request'):continue
  r=s['request'];at=(r['wallMs']+s['callPerformanceMs']-r['performanceMs'])/1000-data['started']+s['when']-s['callAudioTime']
  candidates.append((abs(at-row['atSeconds']),s))
 delta,start=min(candidates,key=lambda x:x[0])
 if delta>.01:raise RuntimeError('Cannot locate exact frozen occurrence')
 pack=ROOT/'apps/web/public'/manifest['packs'][start['pack']]['webm'].lstrip('/')
 clip=ROOT/'work/v4ship-audio'/trial/f'source-{i+1:02d}.flac'
 subprocess.run(['ffmpeg','-v','error','-n','-ss',str(start['offset']),'-i',str(pack),'-t',str(start['bufferDuration']),'-ac','1','-ar','24000','-c:a','flac',str(clip)],check=True)
 # Padding is applied in a separate step so -t does not truncate the spoken take.
 padded=clip.with_name(clip.stem+'-padded.flac')
 subprocess.run(['ffmpeg','-v','error','-n','-i',str(clip),'-af','adelay=150,apad=pad_dur=0.2','-c:a','flac',str(padded)],check=True)
 segments,_=model.transcribe(str(padded),language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False,temperature=0)
 recognized=' '.join(s.text.strip() for s in segments)
 result={'cueId':row['cueId'],'variantId':start.get('variantId'),'expected':row['expected'],'mixedRecognized':row['recognized'],'mixedExact':row['exact'],'sourceRecognized':recognized,'sourceExact':words(row['expected'])==words(recognized),'sourcePack':{'path':str(pack.relative_to(ROOT)),'sha256':hashlib.sha256(pack.read_bytes()).hexdigest()},'crop':{'path':str(padded.relative_to(ROOT)),'sha256':hashlib.sha256(padded.read_bytes()).hexdigest()}}
 report['rows'].append(result)
 report.update(sourceExact=sum(r['sourceExact'] for r in report['rows']),mixedExact=sum(r['mixedExact'] for r in report['rows']))
 out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({k:result[k] for k in ['cueId','expected','mixedExact','sourceRecognized','sourceExact']}),flush=True)
