#!/usr/bin/env python3
"""Local grain-concatenated cat-speak. CC0 cats + mouth grains; no TTS/model calls.
Text -> syllables -> consonant onset + real cat vowel grain -> contour/formants.
"""
import json,re,hashlib,subprocess,math,sys
from pathlib import Path
import numpy as np
from voice_features import decode,RATE
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'apps/web/public/audio';REPORT=ROOT/'reports/v3-shell/b2'
CATDIR=ROOT/'assets/audio-sources/b2/cat-lines';CATDIR.mkdir(parents=True,exist_ok=True)
profiles=json.loads((ROOT/'scripts/audio/data/cat-voices.json').read_text())
catalog=json.loads((ROOT/'assets/audio-sources/CATALOG.json').read_text())['clips'];by_path={r['path']:r for r in catalog}
licences=json.loads((OUT/'LICENSES.json').read_text());manifest=json.loads((OUT/'manifest.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mouth=[r for r in catalog if r['role']=='consonant'];mouth_pcm={r['id']:decode(ROOT/r['path']) for r in mouth}
# These are audible grain classes, not a claim of phonetic transcription of the CC0 mouth sessions.
classes={'plosive':[r for r in mouth if any('pop' in t or 'click' in t for t in r['tags'])], 'fricative':[r for r in mouth if r['sourceId']=='freesound:691913'], 'nasal':[r for r in mouth if r['sourceId']=='freesound:104374'], 'liquid':[r for r in mouth if r['sourceId']=='freesound:843435']}
BANKS={}
VOWELS={'a':(730,1090),'e':(530,1840),'i':(270,2290),'o':(570,840),'u':(300,870)}

def edge(x,seconds=.005):
 x=x.copy();n=min(int(RATE*seconds),len(x)//4)
 if n:x[:n]*=np.linspace(0,1,n);x[-n:]*=np.linspace(1,0,n)
 return x

def syllables(text):
 result=[]
 for word in re.findall("[a-z']+",text.lower()):
  # Romanised groups; silent terminal e is folded into the preceding syllable.
  parts=re.findall('[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=[^aeiouy]|$))?|[^aeiouy]+$',word)
  if len(parts)>1 and parts[-1]=='e':parts[-2]+='e';parts.pop()
  result.extend(parts or [word])
 return result

def vowel_class(s):
 match=re.search('[aeiouy]',s);return ('i' if match and match[0]=='y' else match[0]) if match else 'u'

def onset_class(s):
 if s.startswith(('sh','ch','s','f','h','v','z')):return 'fricative'
 if s.startswith(('m','n')):return 'nasal'
 if s.startswith(('l','r','w','y')):return 'liquid'
 return 'plosive'

def spectral(x,gain):
 n=len(x);freq=np.fft.rfftfreq(n,1/RATE);return np.fft.irfft(np.fft.rfft(x)*gain(freq),n=n).astype(np.float32)

def grains(x):
 # Five non-overlapping, high-energy windows from the source; fallback wraps only very short recordings.
 size=int(RATE*.12);hop=max(1,size//2)
 starts=list(range(0,max(1,len(x)-size),hop));rank=sorted(starts,key=lambda s:float(np.mean(x[s:s+size]**2)),reverse=True)
 selected=[]
 for s in rank:
  if all(abs(s-a)>=size for a in selected):selected.append(s)
  if len(selected)==5:break
 if not selected:raise ValueError('Empty cat recording')
 while len(selected)<5:selected.append(rank[len(selected)%len(rank)])
 selected.sort();return {v:(s,edge(x[s:min(len(x),s+size)])) for v,s in zip(VOWELS,selected)}

def pitch_grain(x,seconds,ratio,contour):
 count=int(RATE*seconds);rates=ratio*2**(np.linspace(0,contour,count)/12)
 positions=np.cumsum(rates);period=max(1,len(x)-1)
 # Overlapped grains avoid a discontinuous modulo seam while retaining the sampled cat excitation.
 a=np.interp(positions%period,np.arange(len(x)),x);b=np.interp((positions+period/2)%period,np.arange(len(x)),x)
 weights=.5-.5*np.cos(2*np.pi*positions/period)
 return edge((a*weights+b*(1-weights)).astype(np.float32))

def render(cat,p,text,event,take):
 row=by_path[f"assets/audio-sources/b2/cats/{p['source']}.flac"];bank=BANKS.setdefault(row['path'],None)
 if bank is None:bank=grains(decode(ROOT/row['path']));BANKS[row['path']]=bank
 sylls=syllables(text);segments=[];used=[row];details=[]
 rng=np.random.default_rng(sum(map(ord,cat+text))+take*103)
 for i,s in enumerate(sylls):
  v=vowel_class(s);cls=onset_class(s);pool=classes[cls];mr=pool[(i+take+sum(map(ord,cat)))%len(pool)];used.append(mr)
  consonant=mouth_pcm[mr['id']];consonant=consonant[:int(RATE*(.035 if cls=='plosive' else .05))]
  if cls=='nasal':consonant=spectral(consonant,lambda f:np.exp(-(f/650)**2))
  elif cls=='liquid':consonant=spectral(consonant,lambda f:np.exp(-((f-1100)/950)**2))
  elif cls=='fricative':consonant=spectral(consonant,lambda f:1-np.exp(-(f/1900)**2))
  peak=max(.001,float(np.max(np.abs(consonant))));consonant=edge(consonant/peak*.16)
  start,g=bank[v];duration=p['speed']*(1.3 if i==len(sylls)-1 and event=='ult' else 1)*(1+(take-.5)*.04)
  contour=p['range']*(.65 if text.endswith(('!','?')) else -.55)*(i+1)/len(sylls)
  voice=pitch_grain(g,duration,2**(p['baseSemitones']/12),contour)
  f1,f2=VOWELS[v];shift=p['formantShift']
  # Keep the source's excitation audible: a common narrow vowel filter made
  # different real cats converge to the same synthetic timbre in iteration 1.
  mix=p.get('vowelMix',.3)
  voice=spectral(voice,lambda f:1-mix+mix*(np.exp(-((f-f1*shift)/(180*shift))**2)+.55*np.exp(-((f-f2*shift)/(400*shift))**2)))
  voice=spectral(voice,lambda f:1/(1+(f/p['brightness'])**(2*p.get('rolloff',1))))
  if p.get('colorHz'):
   # One broad chest/nasal resonance, not added tones or a spectral watermark.
   voice=spectral(voice,lambda f:10**(p.get('colorDb',0)*np.exp(-.5*(np.log2(np.maximum(f,30)/p['colorHz'])/.65)**2)/20))
  peak=max(.001,float(np.max(np.abs(voice))));voice=voice/peak*.48
  noise=rng.normal(0,.15,len(voice)).astype(np.float32)*p['breathiness'];noise=spectral(noise,lambda f:(1-np.exp(-(f/1700)**2))*np.exp(-(f/8500)**2))
  voice=edge(voice+noise);segments.extend([consonant,voice,np.zeros(int(RATE*.018),dtype=np.float32)])
  details.append({'syllable':s,'vowel':v,'class':cls,'consonantSource':mr['id'],'vowelSource':row['id'],'sourceStartSeconds':start/RATE,'durationSeconds':duration,'contourSemitones':contour})
 last=segments[-2];signature=last[-min(len(last),int(RATE*.12)):]*.35
 if p['signature']=='purr':signature*=.6+.4*np.sin(2*np.pi*29*np.arange(len(signature))/RATE)
 else:signature*=.55+.45*np.sin(2*np.pi*11*np.arange(len(signature))/RATE)
 x=np.concatenate(segments+[edge(signature),np.zeros(int(RATE*.1),dtype=np.float32)])
 # Short room tail, below the last syllable, no reference impulse response.
 tail=np.zeros(len(x)+int(RATE*.1),dtype=np.float32);tail[:len(x)]=x
 for delay,gain in [(.041,.08),(.079,.04)]:
  d=int(RATE*delay);tail[d:d+len(x)]+=x*gain
 return tail,used,details

def normalize(x):
 command=['ffmpeg','-hide_banner','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-af','loudnorm=I=-16:TP=-2:LRA=11:print_format=json','-f','null','-']
 r=subprocess.run(command,input=x.astype('<f4').tobytes(),capture_output=True,check=True);match=re.search(rb'\{\s*"input_i"[\s\S]*?\}',r.stderr);m=json.loads(match[0])
 params=f"loudnorm=I=-16:TP=-2:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
 b=subprocess.check_output(['ffmpeg','-v','error','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-af',params,'-ar',str(RATE),'-f','f32le','pipe:1'],input=x.astype('<f4').tobytes())
 return np.frombuffer(b,dtype='<f4').copy()

def loudness(path):
 r=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-16:TP=-1:LRA=11:print_format=json','-f','null','-'],capture_output=True,check=True)
 m=json.loads(re.search(rb'\{\s*"input_i"[\s\S]*?\}',r.stderr)[0]);return {'integratedLufs':float(m['input_i']),'truePeakDbTP':float(m['input_tp'])}

def licence(path,used):
 rel=str(path.relative_to(ROOT));used={r['path']:r for r in used}.values()
 licences['files'][:]=[r for r in licences['files'] if r['path']!=rel]
 licences['files'].append({'path':rel,'file':path.name,'sha256':sha(path),'sourceUrl':next(iter(used))['sourceUrl'],'licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','license':'CC0-1.0','author':', '.join(sorted(set(r['author'] for r in used))),'date':'2026-11-13','sourceFiles':[{'path':r['path'],'sha256':r['sha256'],'sourceUrl':r['sourceUrl']} for r in used],'processing':'Original cat-speak syllable concatenation, mouth onsets, vowel formants, pitch contour, authored voice identity, room tail; two-pass -16 LUFS normalization.'})

def main():
 result={'cats':[]}
 for cat,p in profiles.items():
  if len(sys.argv)>1 and cat not in sys.argv[1:]:continue
  pack='cat-'+cat;pieces=[];cursor=0;lines=[];all_used=[]
  for event,texts in p['lines'].items():
   samples=[]
   for j,text in enumerate(texts):
    for take in range(2):
     raw,used,details=render(cat,p,text,event,take);x=normalize(raw);filename=f'{cat}-{event}-{j+1}-{take+1}.flac';path=CATDIR/filename
     subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a','flac',str(path)],input=x.astype('<f4').tobytes(),check=True)
     licence(path,used);all_used.extend(used)
     samples.append({'pack':pack,'start':cursor/RATE,'duration':len(x)/RATE,'bus':'voice','variantId':filename,'processedVoice':True})
     pieces.extend([x,np.zeros(int(RATE*.08),dtype=np.float32)]);cursor+=len(x)+int(RATE*.08)
     lines.append({'path':str(path.relative_to(ROOT)),'text':text,'event':event,'take':take+1,'syllables':len(details),'consonants':len(details),'grains':details,**loudness(path)})
   manifest['cues'][f'voice.{cat}.{event}']=samples
  data=np.concatenate(pieces).astype('<f4').tobytes()
  for fmt,codec in [('webm','libopus'),('mp3','libmp3lame')]:
   path=OUT/f'{pack}.{fmt}';subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a',codec,'-b:a','64k',str(path)],input=data,check=True);licence(path,all_used)
  manifest['packs'][pack]={'webm':f'/audio/{pack}.webm','mp3':f'/audio/{pack}.mp3'}
  result['cats'].append({'id':cat,'sourceRecording':f"freesound:{p['source']}",'profile':p,'lines':lines});print(cat,len(lines),'lines',round(cursor/RATE,2),'seconds',flush=True)
 # Partial builds merge only the requested cats into existing production evidence.
 old=REPORT/'VOICE-PRODUCTION.json'
 if len(sys.argv)>1 and old.exists():result['cats']+=[r for r in json.loads(old.read_text())['cats'] if r['id'] not in sys.argv[1:]]
 old.write_text(json.dumps(result,indent=2)+'\n');(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/'LICENSES.json').write_text(json.dumps(licences,indent=2)+'\n')
 (ROOT/'apps/web/src/audio/voice-profiles.json').write_text(json.dumps(profiles,indent=2)+'\n')

if __name__=='__main__':main()
