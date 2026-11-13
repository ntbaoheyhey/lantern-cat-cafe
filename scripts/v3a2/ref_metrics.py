"""Private reference measurement. No image generation, no shipped reference pixels.

Motion is mean absolute 8-bit luma difference at 320x180, 10 fps.
Audio is spectral-flux onsets and sustained autocorrelation pitch, not diarization.
The same estimators are used on reference and our recordings.
"""
from pathlib import Path
import json, subprocess, datetime, wave
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/v3-battle/a2'
ANN = json.loads((ROOT/'scripts/v3a2/ref-annotations.json').read_text())

def meta():
    return dict(generatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip())

def summary(xs):
    return {k:round(float(np.percentile(xs,p)),5) for k,p in [('p10',10),('median',50),('p90',90)]}

def luma(frame):
    return cv2.resize(cv2.cvtColor(frame,cv2.COLOR_BGR2GRAY),(320,180),interpolation=cv2.INTER_AREA).astype(np.float32)

def read_video(path,fps=10):
    cap=cv2.VideoCapture(str(path));rate=cap.get(cv2.CAP_PROP_FPS);i=0;frames=[]
    while True:
        ok,f=cap.read()
        if not ok:break
        if i % max(1,round(rate/fps))==0:frames.append(f)
        i+=1
    cap.release()
    return frames

def pixel_metrics(frames, intervals):
    gs=[luma(f) for f in frames]
    diff=[float(np.abs(a-b).mean()) for a,b in zip(gs,gs[1:])]
    per_second=[float(np.mean(diff[i:i+10])) for i in range(0,len(diff),10)]
    plates=[]
    for interval in intervals:
        start,end,field=interval['startFrame'],interval['endFrame'],interval['fieldFrame']
        indices=list(range(max(0,start-1),min(len(gs),end)))
        if not indices:continue
        baseline=gs[max(0,field-1)]
        if interval.get('fieldWindow'):
            baseline=luma(cv2.imread(str(OUT/'ref'/interval['fieldWindow']/f'frame-{field:03}.jpg')))
        coverage=[float((np.abs(gs[i]-baseline)>25).mean()) for i in indices]
        climax=indices[int(np.argmax(coverage))]
        # Seeded k-means in Lab; count distinct saturated hue sectors among six centres.
        samples=np.concatenate([cv2.resize(frames[i],(80,45)).reshape(-1,3) for i in indices]).astype(np.float32)
        cv2.setRNGSeed(2039)
        _,labels,centres=cv2.kmeans(samples,6,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,40,.1),3,cv2.KMEANS_PP_CENTERS)
        hues=cv2.cvtColor(centres.astype(np.uint8)[None,:,:],cv2.COLOR_BGR2HSV)[0]
        distinct=len(set(int(h//15) for h,s,v in hues if s>35 and v>30))
        plates.append(dict(**interval,coverageClimax=max(coverage),coverageMean=float(np.mean(coverage)),
            peakLuminance=float(max(np.percentile(gs[i],99.9) for i in indices)),
            whiteoutFraction=float(np.mean([float((gs[i]>235).mean())>.65 for i in indices])),
            dominantHues=distinct,kmeansCentresBGR=centres.round(1).tolist(),duration=len(indices)/10,climaxFrame=climax+1))
    return dict(meanEnergy=float(np.mean(diff)),perSecond=per_second),plates

def audio_metrics(path):
    with wave.open(str(path),'rb') as f:
        sr=f.getframerate();channels=f.getnchannels();x=np.frombuffer(f.readframes(f.getnframes()),np.int16).astype(np.float64)/32768
        if channels>1:x=x.reshape(-1,channels).mean(axis=1)
    hop=round(sr*.01);size=round(sr*.04)
    frames=np.lib.stride_tricks.sliding_window_view(x,size)[::hop].copy()
    frames-=frames.mean(axis=1,keepdims=True)
    rms=np.sqrt((frames**2).mean(axis=1))
    spec=np.log1p(np.abs(np.fft.rfft(frames*np.hanning(size),axis=1))*10)
    flux=np.maximum(np.diff(spec,axis=0),0).mean(axis=1)
    peaks=[]
    for i in range(1,len(flux)-1):
        local=flux[max(0,i-25):i+26];median=np.median(local);mad=np.median(np.abs(local-median))
        if flux[i]>max(.012,median+1.5*mad) and flux[i]>=flux[i-1] and flux[i]>flux[i+1] and (not peaks or i-peaks[-1]>=7):peaks.append(i)
    low,high=int(sr/600),int(sr/85);f0=[];voiced=[]
    for y,energy in zip(frames,rms):
        ac=np.correlate(y,y,'full')[size-1:];lag=low+int(np.argmax(ac[low:high+1]));strength=ac[lag]/max(ac[0],1e-9)
        voiced.append(bool(strength>.65 and energy>max(.006,np.percentile(rms,25)*1.15)))
        f0.append(sr/lag)
    # Bridge <=80 ms gaps; reject contours jumping over an octave between frames.
    v=np.asarray(voiced,np.uint8)
    v=cv2.morphologyEx(v[:,None],cv2.MORPH_CLOSE,np.ones((9,1),np.uint8)).ravel()
    events=[];start=None
    for i,b in enumerate([*v,0]):
        if b and start is None:start=i
        if not b and start is not None:
            pitch=np.asarray(f0[start:i]);jump=np.abs(np.diff(np.log2(pitch)))
            if (i-start)*.01>=.3 and (not len(jump) or float((jump>.8).mean())<.15):events.append(dict(start=start*.01,end=i*.01,medianHz=float(np.median(pitch))))
            start=None
    return dict(seconds=len(x)/sr,onsetTimes=[round(i*.01,2) for i in peaks],voiceLikeEvents=events,
                onsetsPerSecond=len(peaks)/(len(x)/sr),voiceLikePerMinute=len(events)*60/(len(x)/sr))

def reference():
    windows=[];allplates=[];normal_onsets=ult_onsets=0;normal_seconds=ult_seconds=0;voice_events=0
    for w in ANN['windows']:
        folder=OUT/'ref'/w['id'];frames=[cv2.imread(str(p)) for p in sorted(folder.glob('frame-*.jpg'))]
        if len(frames)<100:raise ValueError(f'{w["id"]}: incomplete decode')
        motion,plates=pixel_metrics(frames,w['plateIntervals']);sound=audio_metrics(folder/'measurement.wav')
        for p in plates:p['window']=w['id']
        allplates+=plates
        ult_ranges=w.get('ultimateIntervals',[(p['startFrame']/10,p['endFrame']/10) for p in plates])
        mask=np.zeros(round(w['seconds']*100),bool)
        for a,b in ult_ranges:mask[max(0,round(a*100)):min(len(mask),round(b*100))]=True
        ult_seconds+=float(mask.mean())*w['seconds'];normal_seconds+=float((~mask).mean())*w['seconds']
        for t in sound['onsetTimes']:
            if mask[min(len(mask)-1,round(t*100))]:ult_onsets+=1
            else:normal_onsets+=1
        voice_events+=len(sound['voiceLikeEvents'])
        windows.append(dict(id=w['id'],start=w['start'],seconds=w['seconds'],motion=motion,audio=sound,plates=plates))
    if not allplates:raise ValueError('No manually confirmed plate intervals')
    tracks=ANN['actorTracks'];counts={w:0 for w in ANN['displacementWindows']}
    for t in tracks:
        # Each pair is explicitly annotated, not an optical-flow blob or summoned VFX.
        a,b=t['samples'];dt=(b['frame']-a['frame'])/10
        d=float(np.hypot(b['box'][0]-a['box'][0],b['box'][1]-a['box'][1]))
        t['displacementFraction']=d/1280;t['qualifies']=0<dt<=.300001 and d/1280>.08
        counts[t['window']]+=int(t['qualifies'])
    # Join contiguous fragments before measuring duration. Censored fragments are
    # retained in plate detail, but never masquerade as complete short ultimates.
    merged=[]
    for w in ANN['windows']:
        for p in w['plateIntervals']:
            start=w['start']+(p['startFrame']-1)/10;end=w['start']+p['endFrame']/10
            if merged and abs(start-merged[-1]['end'])<.11:
                merged[-1].update(end=end,rightCensored=p['endFrame']==100)
            else:merged.append(dict(start=start,end=end,leftCensored=p['startFrame']==1,rightCensored=p['endFrame']==100))
    durations=[p['end']-p['start'] for p in merged if not p['leftCensored'] and not p['rightCensored']]
    impacts=ANN['impactIntervals'];numberRate=float(np.median([i['distinctNumbers']/(i['end']-i['start']) for i in impacts]))
    result=dict(_meta=meta(),source=ANN['source'],method='10 fps; 320x180 luma; hand boxes; annotated actor pairs; spectral flux; autocorrelation contour',
      limitations=ANN['notes'],samples=dict(windows=len(windows),minWindowSeconds=min(w['seconds'] for w in windows),
        ultimateWindows=sum(bool(w['plateIntervals']) for w in ANN['windows']),boxes=len(ANN['unitBoxes']),
        boxFrames=len(set((b['window'],b['frame']) for b in ANN['unitBoxes'])),numbers=len(ANN['numberBoxes']),
        textFrames=len(ANN['textFrames']),displacementWindows=len(counts),audioSeconds=sum(w['seconds'] for w in windows)),
      scale=summary([b['box'][3]/592 for b in ANN['unitBoxes']]),
      motion=dict(meanEnergy=float(np.mean([w['motion']['meanEnergy'] for w in windows])),
        displacementPer10s=float(np.mean(list(counts.values()))),displacementCounts=counts,tracks=tracks),
      ultimate=dict(coverageMedian=float(np.median([p['coverageClimax'] for p in allplates])),
        peakLuminance=max(p['peakLuminance'] for p in allplates),whiteoutFraction=float(np.mean([p['whiteoutFraction'] for p in allplates])),
        dominantHues=float(np.median([p['dominantHues'] for p in allplates])),durationMedian=float(np.median(durations)),completePlates=len(durations),durationIntervals=merged,plates=allplates),
      numbers=dict(medianHeight720=float(np.median([b['box'][3]*720/592 for b in ANN['numberBoxes']])),
        maxSimultaneous=max(i['maxSimultaneous'] for i in impacts),impactPerSecond=numberRate),
      text=dict(medianWords=float(np.median([f['words'] for f in ANN['textFrames']]))),
      audio=dict(normalOnsetsPerSecond=normal_onsets/normal_seconds,ultimateOnsetsPerSecond=ult_onsets/ult_seconds,
        voiceLikePerMinute=voice_events*60/sum(w['seconds'] for w in windows),normalSeconds=normal_seconds,ultimateSeconds=ult_seconds,
        caveat='Pitch contours also include harmonic music and commentator speech; this is not a semantic voice classifier.'),windows=windows)
    (OUT/'REF-METRICS.json').write_text(json.dumps(result,indent=2)+'\n')
    targets=json.loads((ROOT/'scripts/v3a2/targets.json').read_text());s=result['scale']['median'];n=result['numbers']['medianHeight720']
    targets.update(status='measured',reference='reports/v3-battle/a2/REF-METRICS.json',scaleMedian=s,scaleBand=[s*.75,s*1.25],
      numberHeightBand=[n*.75,n*1.25],motionEnergyMin=result['motion']['meanEnergy']*.7,
      displacementEventsPer10sMin=max(2,result['motion']['displacementPer10s']*.7),
      effectCoverageMin=result['ultimate']['coverageMedian']*.7,numbersPerSecondMin=numberRate*.7,
      cueEventsPerSecondMin=max(result['audio']['normalOnsetsPerSecond'],result['audio']['ultimateOnsetsPerSecond'])*.7)
    (ROOT/'scripts/v3a2/targets.json').write_text(json.dumps(targets,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['samples','scale','numbers','text','audio']},indent=2))
    return result

if __name__=='__main__':reference()
