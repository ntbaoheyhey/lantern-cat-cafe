import json,re,sys
from faster_whisper import WhisperModel
m=WhisperModel('small.en',device='cpu',compute_type='int8')
rows=json.load(open((sys.argv[1] if len(sys.argv)>1 else '/tmp/v10-voice/rows.json')))
norm=lambda s:re.sub(r"[^a-z ]","",s.lower().replace('café','cafe')).split()
bad=0
for r in rows:
  import soundfile as sf,numpy as np,scipy.signal as ss
  x,sr=sf.read(r['file']);x=ss.resample_poly(x,1,3).astype(np.float32);x=np.concatenate([np.zeros(8000,np.float32),x,np.zeros(8000,np.float32)])
  segs,_=m.transcribe(x,beam_size=3,language='en')
  got=' '.join(s.text for s in segs).strip()
  a,b=set(norm(r['text'])),set(norm(got));score=len(a&b)/max(1,len(a))
  r['asr']=got;r['asr_score']=score
  flag='' if score>=.66 else '  <-- CHECK'
  if flag:bad+=1
  print(f"{r['unit']:10} {r['event']:28} {score:.2f} | {r['text']} | {got}{flag}",flush=True)
json.dump(rows,open((sys.argv[1] if len(sys.argv)>1 else '/tmp/v10-voice/rows.json'),'w'),indent=1);print('flagged',bad)
