#!/usr/bin/env python3
"""Pack V10 voice takes (one file per unit) and point the manifest voice cues at them.
Usage: python3 pack_voices.py <rows.json from build_voices.py>
"""
import json,subprocess,sys,hashlib
from pathlib import Path
import numpy as np,soundfile as sf
ROOT=Path(__file__).resolve().parents[3];PUB=ROOT/'apps/web/public/audio';OUT=PUB/'v9'
rows=json.loads(Path(sys.argv[1]).read_text())
SKIP={('soot','ult.release',1)}  # take failed the Whisper clarity gate
GAP=0.25;SR=48000
manifest=json.loads((PUB/'manifest.json').read_text())
callouts_path=ROOT/'apps/web/src/audio/voice-callouts.json';callouts=json.loads(callouts_path.read_text())
prov=[]
for unit in dict.fromkeys(r['unit'] for r in rows):
  takes=[r for r in rows if r['unit']==unit and (unit,r['event'],r['i']) not in SKIP]
  pcm=[];t=0.0;cues={}
  for r in takes:
    x,sr=sf.read(r['file']);assert sr==SR
    cue=f"voice.{unit}.{r['event']}"
    cues.setdefault(cue,[]).append({'pack':f'v10-voice-{unit}','start':round(t,5),'duration':round(len(x)/SR,5),'bus':'voice',
      'variantId':f"v10:{unit}:{r['event']}:{r['i']+1}",'processedVoice':True})
    prov.append({'unit':unit,'cue':cue,'text':r['text'],'asr':r.get('asr'),'asrScore':r.get('asr_score')})
    pcm+= [x,np.zeros(int(GAP*SR))];t+=len(x)/SR+GAP
  wav=Path('/tmp')/f'v10-voice-{unit}.wav';sf.write(wav,np.concatenate(pcm).astype(np.float32),SR)
  base=OUT/f'voice-v10-{unit}'
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','libopus','-b:a','64k','-ac','1',str(base)+'.opus'],check=True)
  subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(wav),'-c:a','aac','-b:a','96k','-ac','1',str(base)+'.m4a'],check=True)
  manifest['packs'][f'v10-voice-{unit}']={'opus':f'/audio/v9/voice-v10-{unit}.opus','m4a':f'/audio/v9/voice-v10-{unit}.m4a','preferredFormat':'opus'}
  for cue,samples in cues.items():
    manifest['cues'][cue]=samples
    if 'designs' in manifest and cue in manifest['designs']:del manifest['designs'][cue]
  for row in callouts:
    if row['unitId']!=unit:continue
    key=f"ult.{row['phase']}" if row['kind']=='ultimate' else f"skill.{row['skillId']}"
    first=next((r for r in takes if r['event']==key),None)
    if first:row['text']=first['text'].replace('[Vow](/vˈW/)','Vow');row['durationMs']=round(first['dur']*1000)
(PUB/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
callouts_path.write_text(json.dumps(callouts,indent=2,ensure_ascii=False)+'\n')
pp=ROOT/'scripts/audio/v10/voice-provenance.json'
units={r['unit'] for r in prov}
if pp.exists():prov=[r for r in json.loads(pp.read_text())['takes'] if r['unit'] not in units]+prov
pp.write_text(json.dumps({
 'tool':'Kokoro-82M v1.0 (hexgrad/Kokoro-82M, Apache-2.0) via kokoro 0.9.4 Python package; voices per unit in lines.json',
 'post':'ffmpeg rubberband pitch, EQ, compressor, short room echo; pyloudnorm to -16 LUFS (-14 for ultimate shouts)',
 'qa':'faster-whisper small.en transcript per take; takes under 0.66 word match re-written or dropped',
 'takes':prov},indent=1,ensure_ascii=False)+'\n')
print('packed',len(prov),'takes')
