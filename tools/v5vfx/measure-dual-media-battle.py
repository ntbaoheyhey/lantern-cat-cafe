"""Measure both commissioned decoders and frozen natural rules before viewing images."""
from pathlib import Path
import datetime, hashlib, json, math, sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
base,output=map(lambda p:Path(p).resolve(),sys.argv[1:3])
assert base.is_relative_to(ROOT/'work/v5/CXV')
assert output.is_relative_to(ROOT/'reports/v5/CXV') and not output.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
stable=lambda v:json.dumps(v,sort_keys=True,separators=(',',':'))
def stats(values):
 v=sorted(x for x in values if math.isfinite(x))
 return dict(samples=len(v),median=v[len(v)//2],p95=v[min(len(v)-1,math.floor(len(v)*.95))],max=v[-1]) if v else dict(samples=0)
raw=json.loads((base/'report.json').read_text())
rules=json.loads((base/'rules-verification.json').read_text())
timelines=[json.loads((base/r['mode']/'timeline.json').read_text()) for r in raw['runs']]
plans=lambda t:[{k:v for k,v in p.items() if k!='wallMs'} for p in t['plans']]
parity=dict(initial=raw['initialBattleEqual'],result=raw['finalResultEqual'],logs=stable(timelines[0]['log'])==stable(timelines[1]['log']),presentations=stable(plans(timelines[0]))==stable(plans(timelines[1])),independentRules=rules['pass'])
result=dict(utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),sourceCommit=raw['servedSource'],indexSha256=raw['indexSha256'],url=raw['url'],viewport=raw['viewport'],roster=raw['artifactIdentity']['roster'],raw=dict(path=str(base/'report.json'),sha256=sha(base/'report.json')),rules=dict(path=str(base/'rules-verification.json'),sha256=sha(base/'rules-verification.json')),provenance=dict(path=str(base/'harness-provenance.json'),sha256=sha(base/'harness-provenance.json')),artifactVerification=dict(path=str(base/'artifact-verification.json'),sha256=sha(base/'artifact-verification.json')),hostLoad=dict(path=str(base/'host-load.txt'),sha256=sha(base/'host-load.txt')),browser=raw['browser'],hardware=raw['hardware'],parity=parity,runs=[],captures=[],reviewImages=[],visualReviewed=False,numericPass=False)
assert result['roster']==['mochi','clover','panko','mallow']
assert raw['viewport']==dict(width=1280,height=720) and raw['cpuRate']==1
review=base/'review';review.mkdir(exist_ok=True)
for run,timeline in zip(raw['runs'],timelines):
 end=run['final']['wallMs'];windows=[(c['before']['wallMs'],c['after']['wallMs']) for c in run['captures']]
 overlaps=lambda a,b:any(y>a and x<b for x,y in windows)
 clean=[f for i,f in enumerate(timeline['frames']) if i and 0<f['wallMs']<=end and f['frameMs']>0 and not overlaps(timeline['frames'][i-1]['wallMs'],f['wallMs'])]
 row=dict(mode=run['mode'],result=run['final']['result'],naturalResultMs=end,actions=run['actions'],ultimates={cat:sum(p['actorId']==cat and p['ultimate'] for p in timeline['plans']) for cat in result['roster']},frameMsWithoutCaptureWindows=stats([f['frameMs'] for f in clean]),renderCpuMsWithoutCaptureWindows=stats([f['cpuMs'] for f in clean]),intervalsOver50p5ms=sum(f['frameMs']>50.5 for f in clean),media={},timeline=dict(path=str(base/run['mode']/'timeline.json'),sha256=sha(base/run['mode']/'timeline.json')))
 audits=timeline['mediaAudits'];assert set(audits)=={'mochi','clover'}
 row['distinctVideoSources']=audits['mochi']['videoSrc']!=audits['clover']['videoSrc']
 for cat,audit in audits.items():
  samples=[s for s in audit['samples'] if s['fullAt'] is not None and 0<=s['fullAt']<=end]
  valid=[s for s in samples if not s.get('missing')]
  failures=[dict(at=s['fullAt'],state=s.get('state'),missing=s.get('missing'),sameMedia=s.get('sameMedia'),sameVideo=s.get('sameVideo')) for s in samples if s.get('missing') or s['source']!='media' or not s['state']['ready'] or s['state'].get('failure') or s['state']['disposed'] or not s['videoTextureActive'] or not s['sameMedia'] or not s['sameVideo']]
  callbacks=[d for d in audit['decoded'] if d['fullAt'] is not None and 0<=d['fullAt']<=end]
  events=[e for e in audit['events'] if e['fullAt'] is not None and 0<=e['fullAt']<=end]
  running=[s for s in valid if not s['state']['paused']];settled=[s for s in running if not s['state']['seeking']]
  drift=lambda s:abs(((s['state']['currentTime']-s['state']['desired']+15)%10)-5)
  decoded_clean=[];wraps=[]
  for a,b in zip(callbacks,callbacks[1:]):
   prior=[s for s in valid if s['fullAt']<=a['fullAt']];between=([prior[-1]] if prior else [])+[s for s in valid if a['fullAt']<s['fullAt']<=b['fullAt']]
   interrupted=any(a['fullAt']<=e['fullAt']<=b['fullAt'] and e['event'] in ('pause','seeking','waiting','stalled') for e in events)
   if between and not interrupted and all(not s['state']['paused'] and not s['state']['seeking'] for s in between) and not overlaps(a['fullAt'],b['fullAt']):decoded_clean.append(b['at']-a['at'])
   if a['mediaTime']>9.5 and b['mediaTime']<.5:wraps.append(dict(before=a['mediaTime'],after=b['mediaTime'],at=b['fullAt']))
  post=[s for s in audit['samples'] if s['fullAt'] is not None and s['screen']=='result']
  stable_post=[s for s in post if s['fullAt']>=post[0]['fullAt']+250 and not s.get('missing')]
  qualities=[s['quality'] for s in stable_post if s['quality']]
  post_callbacks=[d for d in audit['decoded'] if d['fullAt'] is not None and stable_post and d['fullAt']>=stable_post[0]['fullAt']]
  post_gates=dict(observed=len(stable_post)>=8,allPaused=bool(post) and all(not s.get('missing') and s['state']['paused'] for s in post),allSuspended=bool(post) and all(not s.get('missing') and s['state'].get('suspended') and not s['state']['disposed'] for s in post),stoppedClock=bool(stable_post) and max(s['state']['currentTime'] for s in stable_post)-min(s['state']['currentTime'] for s in stable_post)<=1e-6,stoppedDecoder=bool(qualities) and all(q==qualities[0] for q in qualities) and not post_callbacks)
  hp=[s for s in valid if s.get('hp') and s['hp']['alive'] and s['hp']['visible']]
  hp_fail=[dict(at=s['fullAt'],phase=s['phaseFrame'],hp=s['hp']) for s in hp if any(s['hp'][k]>1e-6 for k in ('bodyOverlapArea','faceOverlapArea','allBodyOverlapArea','otherLabelOverlapArea')) or s['hp']['propInside']]
  phases=[s for s in valid if s.get('phaseFrame') and s['phaseFrame']['actorId'] and s['phaseFrame']['elapsed']>=200]
  phase_fail=[dict(at=s['fullAt'],frame=s['phaseFrame'],phase=s['bossPhase']) for s in phases if s['bossPhase']['visible']]
  quality=[s['quality'] for s in valid if s['quality']]
  gates=dict(observed=bool(valid),noFailures=not failures,sampledThroughResult=bool(samples) and samples[-1]['fullAt']>=end-250,normalFramesAdvance=bool(callbacks) if run['mode']=='normal' else True,reducedClockStatic=bool(valid) and max(s['state']['currentTime'] for s in valid)<=1/30 if run['mode']=='reduced' else True,ownUltimateObserved=row['ultimates'][cat]>0,ownCastSamples=any(s.get('phaseFrame',{}).get('actorId')==cat for s in valid if s.get('phaseFrame')),hpObserved=bool(hp),hpClear=not hp_fail,bossPhaseActionClear=bool(phases) and not phase_fail,postResult=all(post_gates.values()))
  row['media'][cat]=dict(videoSrc=audit['videoSrc'],samples=len(samples),runningSamples=len(running),seekingSamples=sum(s['state']['seeking'] for s in valid),sampleGapsMs=stats([b['fullAt']-a['fullAt'] for a,b in zip(samples,samples[1:])]),nonseekingRunningClockDriftSeconds=stats([drift(s) for s in settled]),callbacks=len(callbacks),decodedIntervalsRunningWithoutCaptureMs=stats(decoded_clean),observedTenSecondWraps=wraps,events={n:sum(e['event']==n for e in events) for n in sorted({e['event'] for e in events})},qualityFirst=quality[0] if quality else None,qualityLast=quality[-1] if quality else None,failures=failures,hpSamples=len(hp),hpFailures=hp_fail,bossActionSamples=len(phases),bossPhaseFailures=phase_fail,postResult=dict(samples=len(post),stableSamples=len(stable_post),lateCallbacks=len(post_callbacks),gates=post_gates),gates=gates)
 row['pass']=run['reachedResult'] and run['final']['result']=='party' and not run['errors'] and not run['blockedRequests'] and row['distinctVideoSources'] and all(all(m['gates'].values()) for m in row['media'].values())
 result['runs'].append(row)
 for c in run['captures']:
  image=cv2.imread(c['path']);assert image.shape==(720,1280,3) and float(image.std())>10
  result['captures'].append(dict(mode=run['mode'],reason=c['reason'],path=c['path'],sha256=sha(c['path']),dimensions=[1280,720],utc=c['utc'],rgbMean=float(image.mean()),rgbStdDev=float(image.std())))
 for part in range(math.ceil(len(run['captures'])/4)):
  captures=run['captures'][part*4:part*4+4];tiles=[cv2.resize(cv2.imread(c['path']),(512,288),interpolation=cv2.INTER_AREA) for c in captures]
  tiles += [np.zeros((288,512,3),np.uint8)]*(4-len(tiles));sheet=np.vstack([np.hstack(tiles[:2]),np.hstack(tiles[2:])]);dest=review/f'{run["mode"]}-{part}.jpg';assert not dest.exists();cv2.imwrite(str(dest),sheet,[cv2.IMWRITE_JPEG_QUALITY,92])
  result['reviewImages'].append(dict(path=str(dest),sha256=sha(dest),dimensions=[1024,576],mode=run['mode'],reasons=[c['reason'] for c in captures],bytes=dest.stat().st_size,reviewed=False,views=0))
result['numericPass']=raw['pass'] and all(parity.values()) and all(r['pass'] for r in result['runs'])
result['limits']='Two sampled decoder lifecycles on local M3 Pro with recorded host load; seeded fixture, unchanged rules and speed1. DOM measurements and screenshots add overhead. Intervals are descriptive, not normal-laptop performance acceptance. Rectangle overlaps conservatively include transparent bounds. No continuous pixel/alpha/seam/anatomy claim. Initial hidden intro is excluded; its separate R2 failure/corrected evidence remain. Runtime source unpatched; commissioned registry override is explicit in the pinned descriptor.'
output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(dict(output=str(output),numericPass=result['numericPass'],parity=parity,runs=[dict(mode=r['mode'],actions=r['actions'],ultimates=r['ultimates'],passValue=r['pass'],gates={cat:m['gates'] for cat,m in r['media'].items()}) for r in result['runs']],reviewImages=result['reviewImages'])))
