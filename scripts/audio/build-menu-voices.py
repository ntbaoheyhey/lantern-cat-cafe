#!/usr/bin/env python3
"""Original spoken café/gear reactions using the existing free local voice chain."""
import hashlib,json,subprocess
from pathlib import Path
import numpy as np
from callout_dsp import ROOT,MODEL_URL,process,save,decode,recognizer,recognize,cat_speak,RATE
OUT=ROOT/'apps/web/public/audio';DEST=ROOT/'assets/audio-sources/b2/menu-voices'
selection=json.loads((ROOT/'scripts/audio/data/callout-profiles.json').read_text())
manifest=json.loads((OUT/'manifest.json').read_text());licenses=json.loads((OUT/'LICENSES.json').read_text())
lines=[('mallow','voice.guide.idle','Warm cups. Welcome home.'),('mallow','voice.guide.idle','Your tea is ready.'),
 ('mochi','voice.mochi.gear','This looks sturdy.'),('mochi','voice.mochi.gear','Ready for the night.'),
 ('mochi','voice.mochi.forge','A good piece of work.'),('mochi','voice.mochi.forge','Stronger than before.')]
pieces=[];cursor=0;rows=[];used_all=[];model=recognizer();cue_samples={}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def license(path,used):
 rel=str(path.relative_to(ROOT));licenses['files'][:]=[r for r in licenses['files'] if r['path']!=rel]
 licenses['files'].append({'path':rel,'file':path.name,'sha256':sha(path),'sourceUrl':MODEL_URL,'licenseUrl':'https://keithito.com/LJ-Speech-Dataset/','license':'Own synthesis','author':'Taskbar Hero original writing and synthesis; CC0 grains: '+', '.join(sorted({r['author'] for r in used})),'date':'2026-11-13','speechModel':{'model':'Piper en_US-ljspeech-high','modelLicense':'MIT','datasetLicense':'public domain','evidence':['assets/audio-sources/license-evidence/piper-ljspeech-MODEL_CARD.txt','assets/audio-sources/license-evidence/piper-voices-README.md']},'sourceFiles':[{'path':r['path'],'sha256':r['sha256']} for r in {r['path']:r for r in used}.values()],'processing':'Original menu dialogue, existing character formants and CC0 mouth/cat grains, local Piper; normalized -16 LUFS; no reference input.'})
for i,(unit,cue,text) in enumerate(lines):
 settings={**selection['settings'],'eq':selection['selected'][unit]['eq']}
 x,used,production=process({'unitId':unit,'cueId':cue,'kind':'skill','text':text},i%2,settings)
 path=DEST/f'{unit}-{i+1}.flac';save(path,x);license(path,used);used_all.extend(used)
 result=recognize(model,path,text)
 rows.append({'cueId':cue,'unitId':unit,'text':text,'path':str(path.relative_to(ROOT)),'sha256':sha(path),'durationSeconds':len(x)/RATE,'production':production,**cat_speak.loudness(path),**result})
 cue_samples.setdefault(cue,[]).append({'pack':'menu-voices','start':cursor/RATE,'duration':len(x)/RATE,'bus':'voice','processedVoice':True,'variantId':path.name})
 pieces.extend([x,np.zeros(round(.04*RATE),dtype=np.float32)]);cursor+=len(x)+round(.04*RATE)
 print(cue,text,result['wordAccuracy'],flush=True)
pcm=np.concatenate(pieces).astype('<f4').tobytes()
for extension,codec in [('webm','libopus'),('mp3','libmp3lame')]:
 path=OUT/f'menu-voices.{extension}'
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a',codec,'-b:a','56k',str(path)],input=pcm,check=True);license(path,used_all)
manifest['packs']['menu-voices']={'webm':'/audio/menu-voices.webm','mp3':'/audio/menu-voices.mp3'}
manifest['cues'].update(cue_samples)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/'LICENSES.json').write_text(json.dumps(licenses,indent=2)+'\n')
(ROOT/'reports/v3-shell/b2/MENU-VOICE-LINES.json').write_text(json.dumps({'lines':rows},indent=2)+'\n')
