#!/usr/bin/env python3
"""Measure naturally inflected menu dialogue before changing shipped sprites."""
import argparse, datetime, importlib.util, json
from callout_dsp import ROOT, WORK, process, save, recognizer, recognize, cat_speak
from publish_callouts import signed

spec=importlib.util.spec_from_file_location('mix_analysis',ROOT/'scripts/audio/analyse.py')
analysis=importlib.util.module_from_spec(spec);spec.loader.exec_module(analysis)
source=ROOT/'reports/v3-shell/b2/MENU-VOICE-LINES.json'
production=json.loads(source.read_text())
parser=argparse.ArgumentParser();parser.add_argument('--delivery',action='store_true');args=parser.parse_args()
report=ROOT/'reports/v3-shell/b2/q5'/('menu-delivery-probes.json' if args.delivery else 'menu-probes.json')
options=[{'preserveFormants':True,'phraseAccent':3,'grainGain':.12}, {'preserveFormants':True,'phraseAccent':4.5,'grainGain':.12}, {'preserveFormants':True,'phraseAccent':3,'spokenCore':.12,'grainGain':.12}, {'preserveFormants':True,'phraseAccent':4.5,'spokenCore':.18,'grainGain':.10}]
if args.delivery:
 prior=json.loads((ROOT/'reports/v3-shell/b2/q5/menu-probes.json').read_text())
 assert all(r['complete'] for r in prior['rows']) and len(prior['rows'])==6
 # Broader spoken formants and full phrases after the narrow character EQ
 # retained the words but lost natural pitch movement in all four trials.
 options=[{'preserveFormants':True,'spokenCore':.45,'pitchWeight':.1,'grainGain':.08,'paceMultiplier':1.1}, {'preserveFormants':True,'spokenCore':.65,'pitchWeight':.25,'phraseAccent':2,'grainGain':.1,'paceMultiplier':1.12}, {'preserveFormants':False,'spokenCore':.45,'pitchWeight':.1,'grainGain':.08,'paceMultiplier':1.1}, {'preserveFormants':True,'spokenCore':.85,'pitchWeight':.35,'phraseAccent':3,'grainGain':.12,'paceMultiplier':1.15}]
 phrases=['Welcome home, little hero!', 'Come and have tea!', 'That looks good on you!', 'Ready for another night!', 'A fine piece of work!', 'Stronger than ever before!']
 production['lines']=[{**r,'originalText':r['text'],'text':text} for r,text in zip(production['lines'],phrases)]
result=json.loads(report.read_text()) if report.exists() else {'sourceProduction':signed(source),'method':'Original short dialogue, WORLD pitch gesture while preserving vowel formants, existing character EQ and licensed cat grains; unprompted small.en. Isolated contour measurement is diagnostic only; complete browser renders decide acceptance.','options':options,'rows':[]}
assert result['sourceProduction']==signed(source)
model=recognizer(threads=2)
for row in production['lines']:
 previous=next((r for r in result['rows'] if r['source']['path']==row['path']),None)
 if previous:
  assert previous['source']['sha256']==row['sha256']
  for trial in previous['attempts']:assert signed(ROOT/trial['path'])['sha256']==trial['sha256']
  if previous['complete']:continue
 else:
  previous={'source':{'path':row['path'],'sha256':row['sha256']},'unit':row['unitId'],'cueId':row['cueId'],'text':row['text'],'originalText':row.get('originalText',row['text']),'attempts':[],'complete':False};result['rows'].append(previous)
 for index,option in enumerate(options):
  if index<len(previous['attempts']):continue
  settings={**row['production']['settings'],**option}
  pcm,used,details=process({**row,'kind':'skill'},int(row['path'].split('-')[-1].split('.')[0])%2,settings)
  path=WORK/('q5-menu-delivery' if args.delivery else 'q5-menu')/f"{__import__('pathlib').Path(row['path']).stem}-{index}.flac";save(path,pcm)
  levels=cat_speak.loudness(path);asr=recognize(model,path,row['text'])
  metrics=analysis.analyse_file(path,duration=len(pcm)/24000)
  accepted=asr['wordAccuracy']>=.75 and -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1 and len(metrics['voiceContourEvents'])>=1
  trial={**signed(path),'attempt':index+1,'production':details,'sources':[{'path':x['path'],'sha256':x['sha256']} for x in {r['path']:r for r in used}.values()],**levels,**asr,'isolatedMetrics':metrics,'meetsDiagnosticCriteria':accepted}
  previous['attempts'].append(trial)
  if accepted or index==len(options)-1:previous['complete']=True
  result['date']=datetime.datetime.now(datetime.timezone.utc).isoformat();report.write_text(json.dumps(result,indent=2)+'\n')
  print(row['cueId'],row['text'],index+1,asr['wordAccuracy'],len(metrics['voiceContourEvents']),'CANDIDATE' if accepted else 'MISS',flush=True)
  if accepted:break
print('Completed',len(result['rows']),'menu lines.',flush=True)
