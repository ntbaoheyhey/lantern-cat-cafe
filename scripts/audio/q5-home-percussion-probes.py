"""Source-only original shaker arrangement diagnostic; no reference inputs."""
import argparse, datetime, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
from analyse import RATE,measure
ROOT=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser();parser.add_argument('--gains',default='-38,-32');parser.add_argument('--label',default='31');parser.add_argument('--phase',type=float,default=0);args=parser.parse_args()
folder=ROOT/'tmp/q5-home-percussion';folder.mkdir(parents=True,exist_ok=True)
source=ROOT/'assets/audio-sources/b2/music/menu-home-tempo-1.1.flac'
x=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']),dtype='<f4').copy()
rows=[]
for subdivisions,gain in [(s,float(g)) for s in [1,2] for g in args.gains.split(',')]:
 rng=np.random.default_rng(3113);percussion=np.zeros(len(x));period=60/99/subdivisions
 for i,at in enumerate(np.arange(args.phase,len(x)/RATE,period)):
  duration=.055 if i%2 else .045;n=round(duration*RATE);t=np.arange(n)/RATE
  grain=sosfilt(butter(2,[3200+(i%3)*150,7800],btype='bandpass',fs=RATE,output='sos'),rng.normal(0,1,n))
  grain=grain/np.max(np.abs(grain))*np.minimum(t/.002,1)*np.exp(-t/(.010 if i%2 else .014))
  start=round(at*RATE);end=min(len(x),start+n);percussion[start:end]+=grain[:end-start]*(1 if i%4==0 else .7)
 y=x+percussion*10**(gain/20)
 out=folder/f'home-shaker-{subdivisions}-{gain}.opus'
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a','libopus','-b:a','96k',str(out)],input=y.astype('<f4').tobytes(),check=True)
 decoded=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(out),'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1']),dtype='<f4')
 m=measure(decoded);row={'subdivisions':subdivisions,'gainDb':gain,'phaseSeconds':args.phase,'path':str(out.relative_to(ROOT)),**{k:v for k,v in m.items() if not isinstance(v,list)}};rows.append(row);print(json.dumps(row),flush=True)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'diagnostic':True,'method':__doc__,'source':{'path':str(source.relative_to(ROOT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()},'rows':rows}
(ROOT/f'reports/v3-shell/b2/q5/home-percussion{args.label}-probes.json').write_text(json.dumps(report,indent=2)+'\n')
