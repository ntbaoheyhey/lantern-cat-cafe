#!/usr/bin/env python3
"""Unpublished articulation candidates, with exact source/recognizer receipts."""
import datetime, hashlib, json
from callout_dsp import ROOT, WORK, process, save, recognizer, recognize, cat_speak
from publish_callouts import signed

source=ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json'
production=json.loads(source.read_text())
report=ROOT/'reports/v3-shell/b2/q5/formant-probes.json'
report.parent.mkdir(parents=True,exist_ok=True)
source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
result=json.loads(report.read_text()) if report.exists() else {'sourceProduction':signed(source),'method':'Local Piper LJSpeech + CC0 character grains; WORLD formant-preserving excitation; unprompted small.en recognition. No production replacement.','options':[{'preserveFormants':True,'paceMultiplier':1.10,'grainGain':.08}, {'preserveFormants':True,'paceMultiplier':1.18,'pitchWeight':.2,'grainGain':.06}, {'preserveFormants':True,'paceMultiplier':1.12,'phraseAccent':1.8,'grainGain':.10}, {'preserveFormants':True,'paceMultiplier':1.16,'pitchWeight':0,'spokenCore':.12,'grainGain':.08}], 'rows':[]}
assert result['sourceProduction']['sha256']==source_hash,'Resume must keep the same source audio.'
model=recognizer()
for unit in production['units']:
 for row in unit['lines']:
  target=.7 if row['kind']=='ultimate' else .5
  if row['wordAccuracy']>=target:continue
  previous=next((r for r in result['rows'] if r['source']['path']==row['path']),None)
  if previous:
   assert previous['source']['sha256']==row['sha256']
   for trial in previous['attempts']:assert signed(ROOT/trial['path'])['sha256']==trial['sha256']
   if previous['complete']:continue
  else:
   previous={'source':{'path':row['path'],'sha256':row['sha256']},'unit':unit['unitId'],'cueId':row['cueId'],'take':row['take'],'text':row['text'],'baselineAccuracy':row['wordAccuracy'],'target':target,'attempts':[],'complete':False};result['rows'].append(previous)
  for index,option in enumerate(result['options']):
   if index<len(previous['attempts']):continue
   settings={**unit['profile'],**row['production']['settings'],**option}
   pcm,used,details=process(row,row['take']-1,settings)
   path=WORK/'q5-formants'/f"{unit['unitId']}-{row.get('slot',row.get('phase'))}-{row['take']}-{index}.flac"
   save(path,pcm);levels=cat_speak.loudness(path);asr=recognize(model,path,row['text'])
   accepted=asr['wordAccuracy']>=target and -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1
   trial={**signed(path),'attempt':index+1,'production':details,'sources':[{'path':x['path'],'sha256':x['sha256']} for x in {r['path']:r for r in used}.values()],**levels,**asr,'meetsRecognitionAndLevels':accepted}
   previous['attempts'].append(trial)
   if accepted or index==len(result['options'])-1:previous['complete']=True
   result['date']=datetime.datetime.now(datetime.timezone.utc).isoformat();report.write_text(json.dumps(result,indent=2)+'\n')
   print(row['cueId'],row['take'],index+1,asr['wordAccuracy'],asr['recognized'],'ACCEPTABLE' if accepted else 'MISS',flush=True)
   if accepted:break
print('Completed',len(result['rows']),'failing takes; acceptable',sum(any(a['meetsRecognitionAndLevels'] for a in r['attempts']) for r in result['rows']),flush=True)
