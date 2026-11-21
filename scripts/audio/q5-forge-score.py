"""Original workshop score: metal and wood mallets over a warm sustained harmony.
No reference recordings, pretrained generators or third-party samples are inputs.
"""
import argparse,datetime,hashlib,json,subprocess
from pathlib import Path
import numpy as np
from scipy.signal import butter,sosfilt
from analyse import analyse_file
ROOT=Path(__file__).resolve().parents[2];SR=44100
parser=argparse.ArgumentParser();parser.add_argument('--label',default='33');parser.add_argument('--publish',action='store_true');parser.add_argument('--variant',default='metal-wood');args=parser.parse_args()
folder=ROOT/('assets/audio-sources/b2/music' if args.publish else 'tmp/q5-forge-score');folder.mkdir(parents=True,exist_ok=True)
variants={'metal-wood':(96,.24,.16,.025),'warm-metal':(92,.18,.21,.035),'light-workshop':(100,.20,.14,.05)}
if args.publish:variants={args.variant:variants[args.variant]}
rows=[]
for name,(bpm,malletGain,padGain,shakerGain) in variants.items():
 beat=60/bpm;length=64*beat;n=round(length*SR);x=np.zeros(n);rng=np.random.default_rng(2026111332)
 def note(midi):return 440*2**((midi-69)/12)
 # Eight gentle chord changes, each eight beats; harmonic motion leaves room
 # for the spoken forging reactions. Crossfades keep the loop seam quiet.
 chords=[(50,57,62,65),(46,53,58,62),(53,60,65,69),(48,55,60,64)]*2
 t=np.arange(n)/SR
 for bar,chord in enumerate(chords):
  start=bar*8*beat;end=(bar+1)*8*beat;env=np.clip((t-start)/.35,0,1)*np.clip((end-t)/.35,0,1)
  for j,midi in enumerate(chord):
   f=note(midi);phase=j*.83
   tone=(np.sin(2*np.pi*f*t+phase)+.20*np.sin(2*np.pi*f*2*t+phase)+.07*np.sin(2*np.pi*f*3*t))
   x+=tone*env*padGain/len(chord)
 # Original repeating mallet figure: slightly inharmonic metal partials give
 # each strike a bell/wood character instead of a sustained sung lead.
 pattern=[0,2,1,3,2,1,3,2]
 for step in range(128):
  at=step*beat/2;chord=chords[min(7,step//16)];midi=chord[pattern[step%8]]+12;f=note(midi);nt=np.arange(round(.48*SR))/SR
  env=np.minimum(nt/.0025,1)*np.exp(-nt/.12)
  metal=sum(a*np.sin(2*np.pi*f*ratio*nt+p) * np.exp(-nt/tau) for ratio,a,tau,p in [(1,.55,.20,0),(2.756,.28,.10,.4),(5.404,.10,.055,1.2),(8.933,.05,.025,.8)])
  wood=sosfilt(butter(2,[1900,6500],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,len(nt)))*np.exp(-nt/.008)
  grain=(metal*env+wood*.12)*malletGain*(1 if step%4==0 else .7)
  start=round(at*SR);end=min(n,start+len(grain));x[start:end]+=grain[:end-start]
 # Quiet offbeat brush taps answer the mallets, adding a workshop pulse.
 for step in range(128):
  nt=np.arange(round(.055*SR))/SR;grain=sosfilt(butter(2,[3300,7800],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,len(nt)));grain/=max(.001,float(np.max(np.abs(grain))));grain*=np.minimum(nt/.0015,1)*np.exp(-nt/.008)*shakerGain;start=round((step*beat/2+beat/4)*SR);end=min(n,start+len(grain));x[start:end]+=grain[:end-start]
 # A restrained wooden knock on the backbeat and low hammer body keep the
 # rhythm identifiable at low volume without a busy hi-hat layer.
 for step in range(64):
  nt=np.arange(round(.13*SR))/SR;body=np.sin(2*np.pi*75*nt)*np.exp(-nt/.045)
  wood=sosfilt(butter(2,[600,1700],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,len(nt)))*np.exp(-nt/.012)
  grain=(body*.045+wood*(.024 if step%2 else .009))*np.minimum(nt/.0015,1);start=round(step*beat*SR);end=min(n,start+len(grain));x[start:end]+=grain[:end-start]
 edge=round(.02*SR);x[:edge]*=np.linspace(0,1,edge);x[-edge:]*=np.linspace(1,0,edge)
 path=folder/f'forge-{args.label}-{name}.flac'
 subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','pipe:0','-af','loudnorm=I=-18:TP=-4:LRA=11','-ar',str(SR),str(path)],input=x.astype('<f4').tobytes(),check=True)
 opus=ROOT/'tmp/q5-forge-score'/f'{args.label}-{name}-codec.opus';opus.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-af','treble=g=-9:f=1500','-c:a','libopus','-b:a','96k',str(opus)],check=True)
 metrics=analyse_file(opus,duration=length);row={'name':name,'bpm':bpm,'malletGain':malletGain,'padGain':padGain,'durationSeconds':length,'source':{'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()},'metrics':metrics};rows.append(row)
 print(name,{k:metrics[k] for k in ['onsetsPerSecond','tickTransientsPerSecond','voiceContoursPerMinute','musicBedFraction','integratedLufs']},flush=True)
 if args.publish:
  manifestPath=ROOT/'apps/web/public/audio/manifest.json';licensePath=ROOT/'apps/web/public/audio/LICENSES.json';manifest=json.loads(manifestPath.read_text());licenses=json.loads(licensePath.read_text());script=Path(__file__);record={'license':'Own synthesis','sourceUrl':'https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/codex/v3-shell-2026-11-13/scripts/audio/q5-forge-score.py','licenseUrl':'https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/codex/v3-shell-2026-11-13/scripts/audio/q5-forge-score.py','author':'Taskbar Hero original synthesis','date':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'tool':'Python NumPy/SciPy + ffmpeg','prompt':__doc__,'script':{'path':str(script.relative_to(ROOT)),'sha256':hashlib.sha256(script.read_bytes()).hexdigest()},'processing':f'Original {bpm} BPM mallet composition, eight chord changes, metal/wood attacks, sustained harmony. Mastered -18 LUFS, -4 dBTP.','file':path.name,**row['source']}
  records=[record]
  for ext,codec in [('webm','libopus'),('mp3','libmp3lame')]:
   target=ROOT/f'apps/web/public/audio/menu-forge.{ext}';subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-c:a',codec,'-b:a','96k',str(target)],check=True);records.append({**record,'file':target.name,'path':str(target.relative_to(ROOT)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sourceFiles':[row['source']]})
  for record in records:licenses['files']=[r for r in licenses['files'] if r['path']!=record['path']]+[record]
  manifest['cues']['music.forge']=[{'pack':'menu-forge','start':0,'duration':length,'bus':'music','loop':True}];manifestPath.write_text(json.dumps(manifest,indent=2)+'\n');licensePath.write_text(json.dumps(licenses,indent=2)+'\n')
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'diagnostic':not args.publish,'method':__doc__,'rows':rows};(ROOT/'reports/v3-shell/b2/q5'/(f'forge-original{args.label}-'+('publication' if args.publish else 'probes')+'.json')).write_text(json.dumps(report,indent=2)+'\n')
