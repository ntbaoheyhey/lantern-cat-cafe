#!/usr/bin/env python3
"""Unpublished word-onset trials after the formant-only method."""
import datetime, json
from callout_dsp import ROOT, WORK, RATE, PROFILES, enemy_profile, process, save, speak, recognizer, recognize, cat_speak, words
from publish_callouts import signed

source=ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json'
production=json.loads(source.read_text())
formants=json.loads((ROOT/'reports/v3-shell/b2/q5/formant-probes.json').read_text())
rescued={r['source']['path'] for r in formants['rows'] if any(a['meetsRecognitionAndLevels'] for a in r['attempts'])}
report=ROOT/'reports/v3-shell/b2/q5/onset-probes.json'
options=[{'consonantCore':.6,'grainGain':.06}, {'consonantCore':1.0,'grainGain':.06,'preserveFormants':True}, {'consonantCore':1.0,'grainGain':.08,'paceMultiplier':1.12}, {'consonantCore':1.3,'grainGain':.08,'paceMultiplier':1.12,'preserveFormants':True}]
result=json.loads(report.read_text()) if report.exists() else {'sourceProduction':signed(source),'method':'Clean Piper source word timestamps from unprompted local small.en; place cat accents 60ms after each onset; preserve 140ms upper-band consonant grains after character EQ. Independently recognise processed output without hints. No production replacement.','options':options,'rows':[]}
assert result['sourceProduction']==signed(source)
model=recognizer()
for unit in production['units']:
 for row in unit['lines']:
  target=.7 if row['kind']=='ultimate' else .5
  if row['wordAccuracy']>=target or row['path'] in rescued:continue
  previous=next((r for r in result['rows'] if r['source']['path']==row['path']),None)
  if previous:
   assert previous['source']['sha256']==row['sha256']
   for trial in previous['attempts']:assert signed(ROOT/trial['path'])['sha256']==trial['sha256']
   if previous['complete']:continue
  else:
   previous={'source':{'path':row['path'],'sha256':row['sha256']},'unit':unit['unitId'],'cueId':row['cueId'],'take':row['take'],'text':row['text'],'baselineAccuracy':row['wordAccuracy'],'target':target,'attempts':[],'complete':False};result['rows'].append(previous)
  for index,option in enumerate(options):
   if index<len(previous['attempts']):continue
   settings={**unit['profile'],**row['production']['settings'],**option}
   p=PROFILES.get(unit['unitId']) or enemy_profile(unit['unitId'])
   pace=(.98+(p['speed']-.18)*1.2)*settings.get('paceMultiplier',1)
   clean=speak(settings.get('ttsText',row['text']),settings.get('ttsTake',row['take']-1),pace)
   clean_path=WORK/'q5-onsets'/f"{unit['unitId']}-{row.get('slot',row.get('phase'))}-{row['take']}-{index}-clean.flac"
   save(clean_path,clean)
   segments,_=model.transcribe(str(clean_path),language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False,temperature=0,word_timestamps=True)
   timestamps=[{'text':w.word,'start':w.start,'end':w.end} for s in segments for w in s.words]
   settings['wordOnsetsSeconds']=[w['start'] for w in timestamps]
   pcm,used,details=process(row,row['take']-1,settings)
   path=clean_path.with_name(clean_path.name.replace('-clean',''));save(path,pcm)
   levels=cat_speak.loudness(path);asr=recognize(model,path,row['text'])
   accepted=asr['wordAccuracy']>=target and -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1
   trial={**signed(path),'attempt':index+1,'production':details,'alignment':{'audio':signed(clean_path),'words':timestamps,'prompt':None},'sources':[{'path':x['path'],'sha256':x['sha256']} for x in {r['path']:r for r in used}.values()],**levels,**asr,'meetsRecognitionAndLevels':accepted}
   previous['attempts'].append(trial)
   if accepted or index==len(options)-1:previous['complete']=True
   result['date']=datetime.datetime.now(datetime.timezone.utc).isoformat();report.write_text(json.dumps(result,indent=2)+'\n')
   print(row['cueId'],row['take'],index+1,asr['wordAccuracy'],asr['recognized'],'ACCEPTABLE' if accepted else 'MISS',flush=True)
   if accepted:break
print('Completed',len(result['rows']),'remaining takes; acceptable',sum(any(a['meetsRecognitionAndLevels'] for a in r['attempts']) for r in result['rows']),flush=True)
