"""Diagnostic recognition of first distinct lines in each unchanged browser mix variant."""
import argparse, hashlib, json, re, subprocess
from pathlib import Path
from faster_whisper import WhisperModel
ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser();parser.add_argument('trial');args=parser.parse_args()
assert re.fullmatch(r'[a-z0-9-]+',args.trial)
folder=ROOT/'reports/v4-ship/S5'/args.trial;raw=ROOT/'work/v4ship-audio'/args.trial
out=folder/'recognition.json'
if out.exists():raise RuntimeError('Preserve earlier recognition')
manifest=json.loads((ROOT/'apps/web/public/audio/manifest.json').read_text())
metadata={r['cueId']:r for r in json.loads((ROOT/'apps/web/src/audio/voice-callouts.json').read_text())}
probe=json.loads((folder/'mix-probe.json').read_text())
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=2,download_root=str(ROOT/'tools/audio-models'),local_files_only=True)
report={'method':'Diagnostic first occurrence of each authored voice in each actual full-mix variant, 150ms pre-roll/200ms tail. Unprompted small.en CPU/int8, beam5, no VAD/conditioning. Not the predeclared12-line acceptance set.','rows':[]}
for variant in probe['rows']:
 name=variant['variant']['id'];events=json.loads((raw/(name+'-events.json')).read_text());seen=set()
 for hit in events['hits']:
  cue=hit['id']
  if hit['result']!='played' or cue not in metadata or cue in seen:continue
  sample=next(s for s in manifest['cues'][cue] if s['variantId']==hit['layers'][0]['variantId'])
  at=hit['at']/1000-events['start'];duration=sample['duration']/hit['layers'][0]['pitch']
  if at<.15 or at+duration+.2>variant['seconds']:continue
  seen.add(cue);crop=raw/f'{name}-line-{len(seen):02d}.flac'
  subprocess.run(['ffmpeg','-v','error','-n','-ss',str(at-.15),'-i',str(raw/(name+'.webm')),'-t',str(duration+.35),'-ac','1','-ar','24000','-c:a','flac',str(crop)],check=True)
  segments,_=model.transcribe(str(crop),language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False,temperature=0)
  text=' '.join(s.text.strip() for s in segments);expected=metadata[cue]['text'];normalize=lambda t:re.findall(r"[a-z0-9']+",t.lower())
  row={'variant':name,'cue':cue,'expected':expected,'recognized':text,'exact':normalize(expected)==normalize(text),'sha256':hashlib.sha256(crop.read_bytes()).hexdigest()}
  report['rows'].append(row);out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(row),flush=True)
report['summary']={v['variant']['id']:{'measured':sum(r['variant']==v['variant']['id'] for r in report['rows']),'exact':sum(r['variant']==v['variant']['id'] and r['exact'] for r in report['rows'])} for v in probe['rows']}
out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report['summary']),flush=True)
