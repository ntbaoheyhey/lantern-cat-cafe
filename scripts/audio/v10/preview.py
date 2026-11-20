#!/usr/bin/env python3
"""Render each MVP ultimate as heard in battle (name shout at cut-in, riser, impact, tail) for review."""
import sys,subprocess,json
from pathlib import Path
import numpy as np,soundfile as sf
ROOT=Path(__file__).resolve().parents[3];PUB=ROOT/'apps/web/public/audio'
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
m=json.loads((PUB/'manifest.json').read_text())
def dec(path):
    r=subprocess.run(['ffmpeg','-loglevel','error','-i',str(PUB/path.lstrip('/').removeprefix('audio/')),'-f','f32le','-ac','2','-ar','48000','-'],capture_output=True,check=True)
    return np.frombuffer(r.stdout,np.float32).reshape(-1,2).T
def voice(cue,k=0):
    s=m['cues'][cue][k];x=dec(m['packs'][s['pack']]['opus']);a=int(s['start']*48000);return x[:,a:a+int(s['duration']*48000)]
full=[]
for cat in ('mochi','clover','soot'):
    L=int(3.6*48000);mixd=np.zeros((2,L))
    def put(x,t,g=1.0):
        i=int(t*48000);n=min(x.shape[1],L-i);mixd[:,i:i+n]+=g*x[:,:n]
    put(dec(f'/audio/v9/sfx-ult-{cat}-riser.opus'),0)
    put(voice(f'voice.{cat}.ult.release'),0.0,1.3)
    put(dec(f'/audio/v9/sfx-ult-{cat}-transient.opus'),1.1)
    put(dec(f'/audio/v9/sfx-ult-{cat}-body.opus'),1.1,10**(-2/20))
    put(dec(f'/audio/v9/sfx-ult-{cat}-tail.opus'),1.3)
    mixd=np.tanh(mixd*1.1)/1.1
    sf.write(out/f'ult-{cat}.wav',mixd.T,48000);full.append(mixd);full.append(np.zeros((2,24000)))
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(out/f'ult-{cat}.wav'),'-lavfi','showspectrumpic=s=900x300:legend=0:scale=log',str(out/f'ult-{cat}.png')],check=True)
sf.write(out/'ultimates-preview.wav',np.concatenate(full,axis=1).T,48000)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(out/'ultimates-preview.wav'),'-b:a','192k',str(out/'ultimates-preview.mp3')],check=True)
print('ok')
