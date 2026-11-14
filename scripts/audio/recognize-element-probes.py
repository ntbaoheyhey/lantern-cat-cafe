"""Compare unprompted speech recognition of diagnostic bus recombinations."""
import datetime,json,subprocess,sys
from pathlib import Path
from callout_dsp import ROOT,recognizer,recognize
from publish_callouts import signed
base=ROOT/'reports/v3-shell/b2'
label=sys.argv[1] if len(sys.argv)>1 else '38'
selected=set(sys.argv[2].split(',')) if len(sys.argv)>2 else set()
assert label.replace('-','').isalnum()
source=base/'polish/P2'/f'dialogue-probes{label}.json'
probe=json.loads(source.read_text())
assert probe['diagnostic']
model=recognizer(threads=2)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'diagnostic':True,'source':signed(source),'method':'First complete occurrence of each authored callout, same timing and unprompted local recognizer for the selected diagnostic mixes. No acceptance substitution.','rows':[],'summary':{}}
folder=ROOT/'work/audio'/f'dialogue{label}-asr';folder.mkdir(parents=True,exist_ok=True)
seen=set();windows=[]
for w in probe['windows']:
 if w.get('kind') not in ['ultimate','skill'] or w['cueId'] in seen or w['start']<.15:continue
 seen.add(w['cueId']);windows.append(w)
for variant in probe['rows']:
 if selected and variant['name'] not in selected:continue
 audio=ROOT/variant['path'];assert signed(audio)['sha256']==variant['sha256']
 for n,w in enumerate(windows):
  target=folder/f"{variant['name']}-{n:02d}.flac"
  subprocess.run(['ffmpeg','-v','error','-y','-ss',str(w['start']-.15),'-i',str(audio),'-t',str(w['duration']+.35),'-ac','1','-ar','24000',str(target)],check=True)
  result=recognize(model,target,w['text'])
  row={'variant':variant['name'],'cueId':w['cueId'],'kind':w['kind'],**result,'passes':result['wordAccuracy']>=(.7 if w['kind']=='ultimate' else .5)}
  report['rows'].append(row);print(variant['name'],w['cueId'],result['wordAccuracy'],result['recognized'],flush=True)
  (base/'polish/P2'/f'dialogue-probes{label}-recognition.json').write_text(json.dumps(report,indent=2)+'\n')
 rows=[r for r in report['rows'] if r['variant']==variant['name']]
 report['summary'][variant['name']]={'passed':sum(r['passes'] for r in rows),'measured':len(rows),'meanWordAccuracy':sum(r['wordAccuracy'] for r in rows)/len(rows)}
 (base/'polish/P2'/f'dialogue-probes{label}-recognition.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report['summary']),flush=True)
