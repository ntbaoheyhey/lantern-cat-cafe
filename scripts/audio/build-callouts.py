#!/usr/bin/env python3
"""Build real, licensed callout takes and per-unit compressed voice sprites."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
import subprocess
from callout_dsp import ROOT,WORK,PROFILES,MODEL_URL,process,save,features,decode,recognizer,recognize,cat_speak,RATE

REPORT=ROOT/'reports/v3-shell/b2';OUT=ROOT/'apps/web/public/audio'
SOURCES=ROOT/'assets/audio-sources/b2/callouts';SOURCES.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
signed=lambda p:{'path':str(p.relative_to(ROOT)),'sha256':sha(p)}
roster=json.loads((REPORT/'VOICE-ROSTER.json').read_text())
selection=json.loads((ROOT/'scripts/audio/data/callout-profiles.json').read_text())
if len(selection['selected'])!=12:raise ValueError('Need twelve verified spoken identities before production')
settings=selection['settings']
manifest=json.loads((OUT/'manifest.json').read_text());licences=json.loads((OUT/'LICENSES.json').read_text())
model=recognizer();produced=[];all_samples=[];metadata=[];recognised=[];files=[];cats=[]
selected_units=set(sys.argv[1:])

def licence(path,used,description):
    rel=str(path.relative_to(ROOT));unique={r['path']:r for r in used}.values()
    licences['files'][:]=[r for r in licences['files'] if r['path']!=rel]
    licences['files'].append({'path':rel,'file':path.name,'sha256':sha(path),'sourceUrl':MODEL_URL,
      'licenseUrl':'https://keithito.com/LJ-Speech-Dataset/','license':'Own synthesis',
      'author':'Taskbar Hero original callout synthesis; CC0 grains: '+', '.join(sorted(set(r['author'] for r in unique))),
      'date':'2026-11-13','speechModel':{'model':'Piper en_US-ljspeech-high','modelLicense':'MIT','datasetLicense':'public domain',
      'evidence':['assets/audio-sources/license-evidence/piper-ljspeech-MODEL_CARD.txt','assets/audio-sources/license-evidence/piper-voices-README.md']},
      'sourceFiles':[{'path':r['path'],'sha256':r['sha256'],'sourceUrl':r['sourceUrl'],'license':'CC0-1.0'} for r in unique],
      'processing':description})

for unit in [r['unitId'] for r in roster['roster']]:
    if selected_units and unit not in selected_units:continue
    pack='callout-'+unit;pieces=[];cursor=0;unit_lines=[];unit_used=[]
    profile={**settings,'eq':selection['selected'][unit]['eq']} if unit in PROFILES else {'pitchWeight':.65,'filterWeight':.25,'grainGain':.32,'tailSeconds':.2}
    for row in [r for r in roster['rows'] if r['unitId']==unit]:
        variants=[];samples=[];durations=[]
        for take in range(2 if row['kind']=='ultimate' else 1):
            x,used,details=process(row,take,profile)
            filename=f"{unit}-{row.get('phase','skill-'+str(row.get('slot')))}-{take+1}.flac"
            path=SOURCES/filename;save(path,x);licence(path,used,'Local Piper + real CC0 cat/mouth grains; character pitch/formants, physical vocal EQ, effort, 71 ms room tail, two-pass -16 LUFS. No reference input.')
            decoded=decode(path)
            asr=recognize(model,path,row['text']);log_path=REPORT/'recognizer'/filename.replace('.flac','.json');log_path.parent.mkdir(exist_ok=True)
            log_path.write_text(json.dumps({'audio':signed(path),**asr},indent=2)+'\n')
            metric={**signed(path),**cat_speak.loudness(path),**features(decoded)}
            entry={**row,'take':take+1,**metric,'production':details,'recogniserLog':signed(log_path),'wordAccuracy':asr['wordAccuracy'],'recognized':asr['recognized']}
            unit_lines.append(entry);all_samples.append(entry);files.append(metric);variants.append(signed(path));unit_used.extend(used)
            samples.append({'pack':pack,'start':cursor/RATE,'duration':len(x)/RATE,'bus':'voice','variantId':filename,'processedVoice':True})
            pieces.extend([x,np.zeros(int(RATE*.02),dtype=np.float32)]);cursor+=len(x)+int(RATE*.02);durations.append(round(len(x)/RATE*1000))
            print(unit,row.get('phase',row.get('slot')),take+1,asr['wordAccuracy'],asr['recognized'],flush=True)
        manifest['cues'][row['cueId']]=samples
        metadata.append({**row,'durationMs':max(durations),'syncPointMs':95 if row.get('phase')=='charge' else 40})
        line_report={'cueId':row['cueId'],'unitId':unit,'text':row['text'],'variants':variants,
                     'wordAccuracy':min(r['wordAccuracy'] for r in unit_lines if r['cueId']==row['cueId']),
                     'recogniserLog':signed(log_path)}
        recognised.append({**line_report,'kind':row['kind']})
    data=np.concatenate(pieces).astype('<f4').tobytes()
    for fmt,codec,bitrate in [('webm','libopus','64k'),('mp3','libmp3lame','56k')]:
        path=OUT/f'{pack}.{fmt}'
        subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a',codec,'-b:a',bitrate,str(path)],input=data,check=True)
        licence(path,unit_used,'Per-unit sprite of original local spoken callouts. Each source line is normalized before encoding; 20 ms sprite gap.')
        files.append({**signed(path),**cat_speak.loudness(path)})
    manifest['packs'][pack]={'webm':f'/audio/{pack}.webm','mp3':f'/audio/{pack}.mp3'}
    produced.append({'unitId':unit,'profile':profile,'lines':unit_lines})
    # Save after every unit so a restarted session can inspect real work.
    (REPORT/'VOICE-CALLOUTS-PRODUCTION.json').write_text(json.dumps({'units':produced,'files':files,'recognised':recognised},indent=2)+'\n')

if selected_units:
    # Deliberately do not publish an incomplete catalogue during a pilot.
    print('Pilot units complete; manifest/catalogue unchanged.',flush=True)
else:
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (OUT/'LICENSES.json').write_text(json.dumps(licences,indent=2)+'\n')
    (ROOT/'apps/web/src/audio/voice-callouts.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print('Published',len(metadata),'callout entries;',len(all_samples),'takes',flush=True)
