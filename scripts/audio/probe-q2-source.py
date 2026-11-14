"""Compare real callout articulation without changing shipped sprite assets."""
import hashlib,json,sys
from callout_dsp import ROOT,WORK,process,save,recognizer,recognize,cat_speak
from analyse import analyse_file

production=json.loads((ROOT/'reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json').read_text())
mode=sys.argv[1] if len(sys.argv)>1 else 'core'
options=[(str(n),{'spokenCore':n}) for n in [0,.15,.3]] if mode=='core' else [('baseline',{}),('pace118',{'spokenCore':.15,'paceScale':1.18}),('pace130',{'spokenCore':.15,'paceScale':1.3}),('pace120-dry',{'paceScale':1.2})]
if mode=='formants':
    options=[('baseline',{}),('world',{'spokenCore':.15,'preserveFormants':True}),('emphasis',{'spokenCore':.15,'preserveFormants':True,'phraseAccent':5})]
out=ROOT/f'reports/v3-shell/b2/q2/source-probe-{mode}.json'
model=recognizer();results=[]
for unit in production['units']:
    if unit['unitId'] not in ['mochi','soot','clover','panko']:continue
    for row in unit['lines']:
        if row['take']!=1 or not (row.get('slot')==2 or row.get('phase')=='release'):continue
        for label,changes in options:
            settings={**row['production']['settings'],**changes}
            settings['paceMultiplier']=settings.get('paceMultiplier',1)*settings.pop('paceScale',1)
            if not changes or changes=={'spokenCore':0}:
                path=ROOT/row['path'];details=row['production']
            else:
                x,used,details=process(row,0,settings)
                path=WORK/'q2-presence'/f"{unit['unitId']}-{row.get('phase','skill')}-{mode}-{label}.flac"
                save(path,x)
            measured=analyse_file(path,duration=8)
            asr=recognize(model,path,row['text'])
            result={'cueId':row['cueId'],'take':1,'label':label,'audio':{'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},
              'production':details,'levels':{k:measured[k] for k in ['integratedLufs','truePeakDbTP','durationSeconds']},
              'contours':measured['voiceContourEvents'],'recognition':asr}
            results.append(result);out.write_text(json.dumps(results,indent=2)+'\n')
            print(json.dumps({'cueId':row['cueId'],'label':label,'contours':len(result['contours']),'accuracy':asr['wordAccuracy'],'levels':result['levels']}),flush=True)
