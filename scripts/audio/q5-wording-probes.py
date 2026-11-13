#!/usr/bin/env python3
"""Read A-owned original text; retain every unchanged-text method's evidence."""
import argparse, datetime, hashlib, json
from pathlib import Path
from callout_dsp import ROOT, WORK, process, save, recognizer, recognize, cat_speak
from publish_callouts import signed

parser=argparse.ArgumentParser();parser.add_argument('--authoring',required=True);parser.add_argument('--label',default='wording-probes');parser.add_argument('--cues');args=parser.parse_args()
assert args.label.replace('-','').isalnum(), 'Use a simple evidence label'
authoring=Path(args.authoring);authored=json.loads(authoring.read_text())
source=ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json'
production=json.loads(source.read_text())
onsets=json.loads((ROOT/'reports/v3-shell/b2/q5/onset-probes.json').read_text())
eligible={r['cueId'] for r in onsets['rows'] if r['complete'] and len(r['attempts'])==4 and not any(a['meetsRecognitionAndLevels'] for a in r['attempts'])}
overrides={k:v for k,v in authored['overrides'].items() if k in eligible}
if args.cues:overrides={k:v for k,v in overrides.items() if k in args.cues.split(',')}
report=ROOT/'reports/v3-shell/b2/q5'/f'{args.label}.json'
options=[{'grainGain':.08,'paceMultiplier':1.05,'ttsTake':0}, {'preserveFormants':True,'pitchWeight':.2,'spokenCore':.08,'grainGain':.1}, {'preserveFormants':True,'phraseAccent':2.5,'spokenCore':.18,'grainGain':.1}, {'preserveFormants':False,'pitchWeight':.2,'spokenCore':.25,'paceMultiplier':1.12,'grainGain':.12}]
author_source={'path':str(authoring),'sha256':hashlib.sha256(authoring.read_bytes()).hexdigest()}
result=json.loads(report.read_text()) if report.exists() else {'sourceProduction':signed(source),'authoring':author_source,'authoredText':authored,'method':'Original A-authored short phrases after four unsuccessful unchanged-text consonant trials. Existing per-character source/EQ retained. Independently recognised local Piper/CC0 synthesis, no ASR text prompt. No production replacement.','options':options,'rows':[]}
assert result['sourceProduction']==signed(source) and result['authoring']==author_source
model=recognizer(threads=2)
for unit in production['units']:
 for original in unit['lines']:
  if original['cueId'] not in overrides:continue
  row={**original,'text':overrides[original['cueId']]};assert 2<=len(row['text'].split())<=4
  target=.7 if row['kind']=='ultimate' else .5
  previous=next((r for r in result['rows'] if r['source']['path']==row['path']),None)
  if previous:
   assert previous['source']['sha256']==row['sha256']
   for trial in previous['attempts']:assert signed(ROOT/trial['path'])['sha256']==trial['sha256']
   if previous['complete']:continue
  else:
   previous={'source':{'path':row['path'],'sha256':row['sha256']},'unit':unit['unitId'],'cueId':row['cueId'],'take':row['take'],'text':row['text'],'originalText':original['text'],'baselineAccuracy':row['wordAccuracy'],'target':target,'attempts':[],'complete':False};result['rows'].append(previous)
  for index,option in enumerate(options):
   if index<len(previous['attempts']):continue
   settings={**unit['profile'],**row['production']['settings'],**option}
   for key in ['ttsText','cutSpeechMs','wordOnsetsSeconds','consonantCore']:settings.pop(key,None)
   pcm,used,details=process(row,row['take']-1,settings)
   path=WORK/('q5-wording' if args.label=='wording-probes' else 'q5-'+args.label)/f"{unit['unitId']}-{row.get('slot',row.get('phase'))}-{row['take']}-{index}.flac";save(path,pcm)
   levels=cat_speak.loudness(path);asr=recognize(model,path,row['text'])
   accepted=asr['wordAccuracy']>=target and -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1
   trial={**signed(path),'attempt':index+1,'production':details,'sources':[{'path':x['path'],'sha256':x['sha256']} for x in {r['path']:r for r in used}.values()],**levels,**asr,'meetsRecognitionAndLevels':accepted}
   previous['attempts'].append(trial)
   if accepted or index==len(options)-1:previous['complete']=True
   result['date']=datetime.datetime.now(datetime.timezone.utc).isoformat();report.write_text(json.dumps(result,indent=2)+'\n')
   print(row['cueId'],row['take'],index+1,asr['wordAccuracy'],asr['recognized'],'ACCEPTABLE' if accepted else 'MISS',flush=True)
   if accepted:break
print('Completed',len(result['rows']),'wording takes from',len(overrides),'eligible cues. Run again after the remaining onset trials finish.',flush=True)
