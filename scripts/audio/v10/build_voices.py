import json,subprocess,sys,os,hashlib
import numpy as np,soundfile as sf,torch,pyloudnorm as pyln
from kokoro import KPipeline
D='/tmp/v10-voice';os.makedirs(D+'/raw',exist_ok=True);os.makedirs(D+'/fx',exist_ok=True)
cast=json.load(open(__file__.rsplit('/',1)[0]+'/lines.json'))
pipe=KPipeline(lang_code='a')
def voice(spec):
  v=pipe.load_voice(spec['voice'])
  if 'blend' in spec:
    b=pipe.load_voice(spec['blend'][0]);w=spec['blend'][1];v=v*(1-w)+b*w
  return v
def trim(a,sr,db=-42):
  e=np.abs(a);thr=10**(db/20)*e.max();idx=np.where(e>thr)[0]
  s=max(0,idx[0]-int(.015*sr));t=min(len(a),idx[-1]+int(.06*sr));return a[s:t]
meter=pyln.Meter(48000,block_size=0.2)
rows=[]
for unit,spec in cast.items():
  vt=voice(spec)
  for event,lines in spec['lines'].items():
    for i,text in enumerate(lines):
      shout=event in('ult.release','ult') and i==0 or text.endswith('!!')
      speed=spec['speed']
      audio=np.concatenate([a.numpy() for _,_,a in pipe(text.replace('!!','!'),voice=vt,speed=speed)])
      audio=trim(audio,24000)
      name=f"{unit}-{event.replace(':','_').replace('.','-')}-{i+1}"
      raw=f'{D}/raw/{name}.wav';sf.write(raw,audio,24000)
      st=spec['pitch']+(0.8 if shout else 0)
      if spec.get('monster'):
        chain=(f"aresample=48000,rubberband=pitch={2**(st/12):.4f}:formant=shifted,highpass=f=50,"
               "equalizer=f=120:t=q:w=1:g=4,equalizer=f=2500:t=q:w=1.2:g=2,asoftclip=type=tanh:param=1.6,"
               "acompressor=threshold=-20dB:ratio=4:attack=4:release=80:makeup=2,"
               "aecho=0.8:0.7:60|110|170:0.35|0.25|0.18,apad=pad_dur=0.35")
      else:
        chain=(f"aresample=48000,rubberband=pitch={2**(st/12):.4f}:formant=preserved,highpass=f=90,"
               "equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3200:t=q:w=1.4:g=3,equalizer=f=9000:t=h:w=2000:g=2,"
               f"acompressor=threshold=-22dB:ratio={4 if shout else 3}:attack=3:release=60:makeup=3,"
               "aecho=0.85:0.5:23|41:0.12|0.08,apad=pad_dur=0.12")
      fx=f'{D}/fx/{name}.wav'
      subprocess.run(['ffmpeg','-y','-loglevel','error','-i',raw,'-af',chain,'-ac','1','-ar','48000',fx],check=True)
      x,sr=sf.read(fx);x=trim(x,sr,-55)
      lufs=meter.integrated_loudness(x) if len(x)>sr*.45 else None
      target=-14 if shout else -16
      if lufs is None or not np.isfinite(lufs):
        rms=20*np.log10(np.sqrt(np.mean(x**2))+1e-9);gain=target-3-rms
      else: gain=target-lufs
      x=x*10**(gain/20);pk=np.abs(x).max()
      if pk>0.89:x=x*0.89/pk
      fade=int(.01*sr);x[-fade:]*=np.linspace(1,0,fade)
      sf.write(fx,x.astype(np.float32),sr,subtype='FLOAT')
      rows.append({'unit':unit,'event':event,'i':i,'text':text,'file':fx,'dur':len(x)/sr})
      print(name,round(len(x)/sr,2),text,flush=True)
json.dump(rows,open(D+'/rows.json','w'),indent=1)
