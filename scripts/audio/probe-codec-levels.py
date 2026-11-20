"""Measure codec overshoot without altering any production source or evidence."""
import json,subprocess
import numpy as np
from publish_callouts import ROOT,REPORT,RATE,decode,cat_speak
p=json.loads((REPORT/'VOICE-CALLOUTS-PRODUCTION.json').read_text())
unit=next(u for u in p['units'] if u['unitId']=='teacup-healer')
x=np.concatenate([part for row in unit['lines'] for part in [decode(ROOT/row['path']),np.zeros(int(RATE*.02),dtype=np.float32)]])
out=ROOT/'work/v3b2/callouts/codec-probe';out.mkdir(exist_ok=True)
trials=[]
for bitrate in ['48k','64k','96k']:
    for gain in [.6,.65,.7,.75,.8,.9]:
        path=out/f'{bitrate}-{gain}.webm'
        subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a','libopus','-b:a',bitrate,str(path)],input=(x*10**(gain/20)).astype('<f4').tobytes(),check=True)
        levels=cat_speak.loudness(path)
        row={'bitrate':bitrate,'gain':gain,**levels,'pass':-17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1};trials.append(row);print(row,flush=True)
(REPORT/'tests/v-codec-probe.json').write_text(json.dumps(trials,indent=2)+'\n')
