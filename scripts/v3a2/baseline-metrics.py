"""Apply the reference estimators to the unchanged production battle recordings."""
import json, subprocess
from pathlib import Path
import numpy as np
import cv2
from ref_metrics import meta,summary,pixel_metrics,audio_metrics,read_video,OUT,ROOT
fixtures=[];heights=[];glyphs=[];plateStats=[];textCounts=[];impactRates=[]
glyphInk=json.loads((OUT/'R/baseline/glyph-ink.json').read_text())
for id in ['wave1','wave3','boss']:
 folder=OUT/'R/baseline'/id
 capture=json.loads((folder/'capture.json').read_text())
 frames=read_video(folder/'battle.webm')
 samples=capture['frames'][::3]
 intervals=[];start=None;field=1
 for i,s in enumerate(samples+[{'sequence':{'plate':False}}]):
  plate=s.get('sequence',{}).get('plate',False)
  if plate and start is None:start=i+1
  if not plate and start is not None:
   intervals.append(dict(startFrame=start,endFrame=i,fieldFrame=max(1,start-1)));start=None
 motion,plates=pixel_metrics(frames,intervals);plateStats+=plates
 cores={}
 for u in capture['frames'][0]['units']:
  core=json.loads((ROOT/'art/units'/u['asset']/'core.json').read_text())
  h=u['box']['height']*core['world']['height']/u['height']/capture['height']
  cores[u['id']]=h
  if u['kind']!='boss':heights.append(h)
 wav=folder/'measurement.wav'
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(folder/'audio.webm'),'-ac','1','-ar','16000',str(wav)],check=True)
 audio=audio_metrics(wav);wav.unlink()
 cue=json.loads((folder/'audio.json').read_text())['hits']
 displacements=0;last=-100
 for i,s in enumerate(samples):
  if i<3:continue
  before={u['id']:u for u in samples[i-3]['units']}
  for u in s['units']:
   if u['id'] in before:
    a=before[u['id']]['box'];b=u['box']
    d=np.hypot((b['x']+b['width']/2)-(a['x']+a['width']/2),b['y']-a['y'])/capture['width']
    if d>.08 and i-last>=3:displacements+=1;last=i
 nMax=0;births=[];previous=set();active=set()
 for s in samples:
  nums=s.get('numbers',[]);nMax=max(nMax,len(nums))
  keys={(n['id'],n['text']) for n in nums}
  births.extend([s['t'] for k in keys-previous]);previous=keys
  textCounts.append(len(s['visibleWords']))
  # Measure the renderer's baked alpha ink, not the warm floor visible through
  # a numeric rectangle. The prior colour threshold contaminated this result.
  for n in nums:
   digits=[glyphInk['heights'][ch] for ch in n['text'] if ch.isdigit()]
   if digits:glyphs.append(max(digits)/48*(n['height']/1.2)*720/capture['height'])
 for p in capture['plans']:
  if p.get('ultimate'):
   contact=p['at']+capture['frames'][p['frame']]['sequence']['contact']/1000
   if contact+1<=capture['seconds']:impactRates.append(sum(contact-.1<=t<contact+1 for t in births))
 fixtures.append(dict(id=id,seconds=capture['seconds'],frames=len(frames),parity=capture['parity'],coreHeights=cores,motion=motion,
  displacementPer10s=displacements/capture['seconds']*10,ultimate=plates,numberMaxSimultaneous=nMax,numberBirths=len(births),
  numberBirthsPerSecond=len(births)/capture['seconds'],audio=audio,cues=dict(attempted=len(cue),played=sum(c['result']=='played' for c in cue),
  eventsPerSecond=len(cue)/10,playedPerSecond=sum(c['result']=='played' for c in cue)/10)))
result=dict(_meta=meta(),samples=dict(windows=3,seconds=sum(f['seconds'] for f in fixtures),audioSeconds=30),
 scale=summary(heights),motion=dict(meanEnergy=float(np.mean([f['motion']['meanEnergy'] for f in fixtures])),displacementPer10s=float(np.mean([f['displacementPer10s'] for f in fixtures]))),
 ultimate=dict(coverageMedian=float(np.median([p['coverageClimax'] for p in plateStats])) if plateStats else None,
  peakLuminance=max([p['peakLuminance'] for p in plateStats],default=None),whiteoutFraction=float(np.mean([p['whiteoutFraction'] for p in plateStats])) if plateStats else None,
  dominantHues=float(np.median([p['dominantHues'] for p in plateStats])) if plateStats else None,durationMedian=float(np.median([p['duration'] for p in plateStats])) if plateStats else None),
 numbers=dict(medianHeight720=float(np.median(glyphs)),glyphSamples=len(glyphs),maxSimultaneous=max(f['numberMaxSimultaneous'] for f in fixtures),impactPerSecond=float(np.median(impactRates)) if impactRates else None),
 text=dict(medianWords=float(np.median(textCounts)),maxWords=max(textCounts)),
 audio=dict(onsetsPerSecond=float(np.mean([f['audio']['onsetsPerSecond'] for f in fixtures])),voiceLikePerMinute=float(np.mean([f['audio']['voiceLikePerMinute'] for f in fixtures])),
  cueEventsPerSecond=float(np.mean([f['cues']['eventsPerSecond'] for f in fixtures])),playedCuesPerSecond=float(np.mean([f['cues']['playedPerSecond'] for f in fixtures]))),
 limitations=['Semantic body height uses the original manually reviewed per-unit core bounds projected through the actual rendered transform. Boss excluded from normal-unit median.',
 'Numbers measure alpha ink in the actual loaded bitmap atlas scaled by each captured burst. Rectangle height is not used as glyph ink height.',
 'Audio real-time capture is separate from fixed-clock visuals and includes B engine fallbacks, duplicate attempts and cooldown rejections; played rate is reported separately.',
 'Pitch contours are an acoustic proxy, not a count of intelligible spoken callouts.','Displacement counts are renderer body transforms; camera motion can contribute.'],fixtures=fixtures)
(OUT/'OURS-BASELINE.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['fixtures','limitations']},indent=2))
