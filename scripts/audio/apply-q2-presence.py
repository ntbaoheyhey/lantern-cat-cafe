"""Publish a bounded articulation proposal only when words and levels survive.

Candidates, rejected takes, before hashes, and recognizer evidence are retained.
No reference recording, detector, or acceptance threshold is changed.
"""
import argparse,datetime,gzip,json,shutil
from callout_dsp import ROOT,WORK,process,save,recognizer,recognize,cat_speak
from publish_callouts import publish,signed
from analyse import analyse_file

parser=argparse.ArgumentParser()
parser.add_argument('plan');parser.add_argument('--label',required=True)
args=parser.parse_args()
if not args.label.replace('-','').isalnum():raise ValueError('Invalid proposal label')
report=ROOT/'reports/v3-shell/b2'
production_path=report/'VOICE-CALLOUTS-PRODUCTION.json'
production=json.loads(production_path.read_text())
proposal=json.loads((ROOT/args.plan).read_text())
archive=report/'q2'/f'{args.label}-before.json.gz'
if archive.exists():raise ValueError('Preserve the previous proposal; use a new label')
archive.write_bytes(gzip.compress(production_path.read_bytes()))
model=recognizer();changes=[];accepted=[]
for unit in production['units']:
    for row in unit['lines']:
        options=[p for p in proposal if p['unitId']==unit['unitId'] and all(row.get(k)==v for k,v in p.get('match',{}).items())]
        if not options:continue
        if len(options)>4:raise ValueError('At most four proposals per take')
        before={k:row[k] for k in ['path','sha256','wordAccuracy','recogniserLog']}
        target=max(row['wordAccuracy'],.7 if row['kind']=='ultimate' else .5)
        for option in options:
            settings={**row['production']['settings'],**option['settings']}
            settings['paceMultiplier']=settings.get('paceMultiplier',1)*settings.pop('paceScale',1)
            audio,used,details=process(row,row['take']-1,settings)
            candidate=WORK/args.label/f"{unit['unitId']}-{row.get('phase',row.get('slot'))}-{row['take']}-{len(changes)}.flac"
            save(candidate,audio)
            asr=recognize(model,candidate,row['text']);metrics=analyse_file(candidate,duration=10)
            levels={k:metrics[k] for k in ['integratedLufs','truePeakDbTP','durationSeconds']}
            ok=asr['wordAccuracy']>=target and -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1
            trial={'cueId':row['cueId'],'take':row['take'],'before':before,'candidate':signed(candidate),'settings':settings,
              'recognition':asr,'levels':levels,'contours':metrics['voiceContourEvents'],'accepted':ok,'minimumWordAccuracy':target}
            changes.append(trial)
            print(json.dumps({'cueId':row['cueId'],'take':row['take'],'accepted':ok,'accuracy':asr['wordAccuracy'],'contours':len(trial['contours'])}),flush=True)
            if ok:
                path=ROOT/row['path'];shutil.copyfile(candidate,path)
                log=ROOT/row['recogniserLog']['path'];log.write_text(json.dumps({'audio':signed(path),**asr},indent=2)+'\n')
                row.update(**signed(path),**levels,production=details,wordAccuracy=asr['wordAccuracy'],recognized=asr['recognized'],recogniserLog=signed(log))
                accepted.append(row['cueId']+'/'+str(row['take']))
                break
        (report/'q2'/f'{args.label}-trials.json').write_text(json.dumps(changes,indent=2)+'\n')
        # Checkpoint accepted source changes before encoding the complete sprites.
        production_path.write_text(json.dumps(production,indent=2)+'\n')
publish(production)
licence_path=ROOT/'apps/web/public/audio/LICENSES.json';licences=json.loads(licence_path.read_text())
by_path={r['path']:r for r in licences['files']}
for unit in production['units']:
    for row in unit['lines']:
        if row['cueId']+'/'+str(row['take']) not in accepted:continue
        entry=by_path[row['path']]
        entry['processing']='Local Piper speech and licensed CC0 cat grains; measured character articulation, saved production settings, peak-controlled -16 LUFS. No reference input.'
        entry['processingEvidence']='reports/v3-shell/b2/VOICE-CALLOUTS-PRODUCTION.json'
        entry['processingDate']=datetime.datetime.now(datetime.timezone.utc).isoformat()
        if row['production']['settings'].get('preserveFormants'):
            entry['formantProcessor']={'tool':'pyworld 0.3.5','license':'MIT','evidence':'assets/audio-sources/license-evidence/pyworld-LICENSE.txt'}
licence_path.write_text(json.dumps(licences,indent=2)+'\n')
print('Published accepted takes:',len(accepted),flush=True)
