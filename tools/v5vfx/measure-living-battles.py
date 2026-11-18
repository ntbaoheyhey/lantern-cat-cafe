"""Verify natural-rule parity and measure production evidence before visual review."""
from pathlib import Path
import json,hashlib,datetime,math,subprocess,struct,collections,sys
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'work/v5/CXV/python'))
import cv2,numpy as np
cv2.setNumThreads(2)
base=root/'work/v5/CXV/films/M-native-nine-full-battle-R1'
out=root/'reports/v5/CXV/M-native-nine-full-battle-R1.json'
assert not out.exists(),'Never overwrite finalized evidence'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
stable=lambda v:json.dumps(v,sort_keys=True,separators=(',',':'))
stats=lambda a:dict(samples=len(a),median=sorted(a)[len(a)//2] if a else None,p95=sorted(a)[min(len(a)-1,math.floor(.95*len(a)))] if a else None,max=max(a) if a else None)
expected={'panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'}
report={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'groups':[],'reviewed':False,'pass':False,'scope':'Native9 natural seeded battles on current production at1280x720, normal/reduced motion, local1x descriptive frame intervals. Not calibrated laptop coverage, no optimization comparison, no cold-start or Mochi/Clover media acceptance.'}
provenance=base/'harness-provenance/provenance.json'
report['harnessProvenance']={'path':str(provenance),'sha256':sha(provenance),'detail':json.loads(provenance.read_text())}
covered=set()
for group in range(3):
    path=base/f'group-{group}'/'report.json';raw=json.loads(path.read_text())
    assert raw['pass'] and len(raw['runs'])==2 and raw['viewport']=={'width':1280,'height':720}
    assert raw['servedSource']=='85cb62233d016faf5c5235ffe178408df1682af3'
    assert raw['indexSha256']=='d75197ff94529a92091902510795dd1ec3000e516e8ef02ec13108b6a4d4ef84'
    roster=raw['artifactIdentity']['roster'];assert len(roster)==4 and set(roster)<=expected;covered.update(roster)
    timelines=[json.loads((path.parent/run['mode']/'timeline.json').read_text()) for run in raw['runs']]
    plans=lambda t:[{k:v for k,v in p.items() if k!='wallMs'} for p in t['plans']]
    parity={'initial':raw['initialBattleEqual'],'result':raw['finalResultEqual'],'logs':stable(timelines[0]['log'])==stable(timelines[1]['log']),'presentations':stable(plans(timelines[0]))==stable(plans(timelines[1])),'finalActors':stable(raw['runs'][0]['final']['actors'])==stable(raw['runs'][1]['final']['actors'])}
    assert all(parity.values()),parity
    g={'group':group,'roster':roster,'source':raw['servedSource'],'indexSha256':raw['indexSha256'],'url':raw['url'],'viewport':raw['viewport'],'cpuRate':raw['cpuRate'],'hardware':raw['hardware'],'browser':raw['browser'],'captureUTC':raw['utc'],'captureEnded':raw['ended'],'raw':{'path':str(path),'sha256':sha(path)},'harnessSha256':raw['harnessSha256'],'fixtureSha256':raw['productionFixtureSha256'],'runtimePatch':'No application-response substitution; fixture setup and descriptive render timer only.','parity':parity,'runs':[],'captures':[],'reviewImages':[]}
    review=path.parent/'review';review.mkdir(exist_ok=True)
    for run,timeline in zip(raw['runs'],timelines):
        assert not run['errors'] and not run['blockedRequests'] and run['reachedResult']
        assert run['identity']['indexSha256']==run['identityAfter']['indexSha256']==raw['indexSha256']
        assert run['identity']['roster']==roster and len(run['captures'])==8
        windows=[(c['before']['wallMs'],c['after']['wallMs']) for c in run['captures']]
        clean=[f for i,f in enumerate(timeline['frames']) if i and f['frameMs']>0 and not any(b>timeline['frames'][i-1]['wallMs'] and a<f['wallMs'] for a,b in windows)]
        actions=[p for p in timeline['plans'] if any(e['type'] in ['action_start','charge'] for e in p['events'])]
        assert all(p['fixedTiming'] and p['leadIn']==0 and p['duration']==(2200 if p['ultimate'] else 800) for p in actions)
        ultimates={cat:sum(p['actorId']==cat and p['ultimate'] for p in timeline['plans']) for cat in roster};assert all(ultimates.values()),ultimates
        if run['final']['result']=='party':
            crew=run['captures'][-1]['after']['crew'][0];assert crew['ready']=='true' and int(crew['drawn'])==int('panko' in roster) and not crew.get('loadError')
            if run['mode']=='reduced':assert crew['confetti']==0
        g['runs'].append({'mode':run['mode'],'result':run['final']['result'],'naturalResultMs':run['final']['wallMs'],'actions':run['actions'],'ultimates':ultimates,'logSha256':hashlib.sha256(stable(timeline['log']).encode()).hexdigest(),'frameMsWithoutCaptureWindows':stats([f['frameMs'] for f in clean]),'submissionMsWithoutCaptureWindows':stats([f['cpuMs'] for f in clean]),'excludedIntervals':len(timeline['frames'])-len(clean),'intervalsOver50p5ms':sum(f['frameMs']>50.5 for f in clean),'timeline':{'path':str(path.parent/run['mode']/'timeline.json'),'sha256':sha(path.parent/run['mode']/'timeline.json')},'errors':run['errors'],'blockedRequests':run['blockedRequests']})
        for c in run['captures']:
            p=Path(c['path']);data=p.read_bytes();assert struct.unpack('>II',data[16:24])==(1280,720)
            im=cv2.imread(str(p));assert im.shape==(720,1280,3) and float(im.std())>10
            g['captures'].append({'mode':run['mode'],'reason':c['reason'],'path':str(p),'sha256':sha(p),'dimensions':[1280,720],'utc':c['utc'],'bytes':len(data),'rgbMean':float(im.mean()),'rgbStdDev':float(im.std())})
        for part in range(2):
            images=run['captures'][part*4:part*4+4];dest=review/f'{run["mode"]}-{part}.jpg';assert not dest.exists()
            args=['ffmpeg','-v','error']
            for c in images:args+=['-i',c['path']]
            args+=['-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',str(dest)]
            subprocess.run(args,check=True,capture_output=True)
            info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=width,height','-of','json',str(dest)]))['streams'][0];assert [info['width'],info['height']]==[1024,576]
            g['reviewImages'].append({'path':str(dest),'sha256':sha(dest),'dimensions':[1024,576],'bytes':dest.stat().st_size,'mode':run['mode'],'captureReasons':[c['reason'] for c in images],'reviewed':False,'views':0})
    report['groups'].append(g)
assert covered==expected
report['numericPass']=True;report['coveredCats']=sorted(covered)
out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'report':str(out),'bytes':out.stat().st_size,'groups':3,'runs':6,'images':12,'numericPass':True}))
