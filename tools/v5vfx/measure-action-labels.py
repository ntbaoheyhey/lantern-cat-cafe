"""Measure frozen legal-action attribution before any new contact sheet is viewed."""
from pathlib import Path
import datetime
import hashlib
import json
import math
import sys
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/v5/CXV/python'))
import cv2
import numpy as np
cv2.setNumThreads(2)
CATS=('mochi','clover','panko','mallow')
MEDIA=('mochi','clover')
THRESHOLDS=(0,1,2,4)
VARIANTS=('baseline','baseline-repeat','labels-hidden','labels-hidden-repeat',*(f'without-{c}' for c in CATS),'restored')


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def delta(a,b):return np.abs(a.astype(np.int16)-b.astype(np.int16)).max(axis=2).astype(np.uint8)


def stats(mask):
    pts=np.argwhere(mask)
    return {'count':len(pts),'bbox':None if not len(pts) else [int(pts[:,1].min()),int(pts[:,0].min()),int(pts[:,1].max()+1),int(pts[:,0].max()+1)]}


def area(a,b):
    return max(0,min(a['x']+a['width'],b['x']+b['width'])-max(a['x'],b['x']))*max(0,min(a['y']+a['height'],b['y']+b['height'])-max(a['y'],b['y']))


def stable(state,initial,fixed):
    gates={'paused':state['paused'],'samePlan':state['plan']==initial['plan'],
           'rules':state['battle']==initial['battle'],'labels':state['labels']==initial['labels'],
           'paint':state['labelPaintState']==initial['labelPaintState'],
           'clock':state['sceneTime']==initial['sceneTime'] and state['renderTime']==fixed,
           'hudPaint':state.get('hudPaintState')==initial.get('hudPaintState'),'host':state['host']==initial['host'],'anchors':state['anchors']==initial['anchors'],'hud':state['hud']==initial['hud'],
           'animations':state['animations']==initial['animations'],
           'totalBadge':state.get('totalBadge')==initial.get('totalBadge') and state.get('totalBadge',{'hidden':True})['hidden']}
    for cat in MEDIA:
        a,b=state['media'][cat],initial['media'][cat]
        gates[cat]=bool(a['state']['ready'] and not a['state'].get('failure') and not a['state']['disposed'] and not a['state']['seeking'] and a['planeVisible'] and a['rootVisible'] and a['state']['currentTime']==b['state']['currentTime'] and a['decoded']['mediaTime']==b['decoded']['mediaTime'])
    return gates


def main():
    base=Path(sys.argv[1]).resolve();output=Path(sys.argv[2]).resolve();assert base.is_relative_to(ROOT/'work/v5/CXV') and not output.exists()
    raw_path=base/'report.json';raw=json.loads(raw_path.read_text());artifact_path=base/'artifact-verification.json';artifact=json.loads(artifact_path.read_text())
    assert raw['sourceCommit']==artifact['sourceCommit'] and raw['indexSha256']==artifact['indexSha256'] and raw['url']==artifact['url'] and raw['viewport']==[1280,720]
    provenance_path=base/'harness-provenance.json';provenance=json.loads(provenance_path.read_text())
    for item in provenance:assert sha(base/item['name'])==item['sha256']
    review=base/('action-review-'+datetime.datetime.now(datetime.timezone.utc).strftime('%H%M%S%f'));review.mkdir()
    result={'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':raw['url'],'sourceCommit':raw['sourceCommit'],'indexSha256':raw['indexSha256'],'viewport':[1280,720],
            'raw':{'path':str(raw_path),'sha256':sha(raw_path)},'artifactVerification':{'path':str(artifact_path),'sha256':sha(artifact_path)},'provenance':{'path':str(provenance_path),'sha256':sha(provenance_path)},
            'harness':{'path':str(Path(__file__)),'sha256':sha(__file__)},'runtimeDiagnostic':raw['runtimeDiagnostic'],'actions':len(raw['actions']),'geometryRows':len(raw['rows']),
            'capturePass':raw['pass'],'captureFailure':raw.get('failure'),'rulesEqual':bool(raw['actions']) and all(a['rulesEqual'] and a['observedBattle']==a['expectedBattle'] for a in raw['actions']),
            'cases':[],'geometryFailures':[],'reviewImages':[],'imagesViewed':0,'productionAcceptance':False,
            'limits':['Seeded setup modifies HP/charge/queue,then real legalChoices/act and model.tick;not a naturally reached state.','Pixel isolation hides the commissioned media plane or native actor root,excluding native shadows and separate VFX.','Unchanged application source plus explicit Clover(-12,+19) diagnostic. No ordinary-play,seam,matte or laptop acceptance.']}
    for row in raw['rows']:
        s=row['snapshot']
        for label in s['labels']:
            if label['id'] not in MEDIA:continue
            overlaps=[{'id':a['id'],'area':area(label['rect'],a['body'])} for a in s['anchors'] if a['visible'] and a.get('body') and area(label['rect'],a['body'])>0]
            if overlaps:result['geometryFailures'].append({k:row[k] for k in ('mode','cat','skill','ms')}|{'labelId':label['id'],'bodies':overlaps})
    images_to_make=[]
    for case in raw['cases']:
        initial=case['before'];images={};state_gates=[]
        for item in case['precondition']:assert sha(item['path'])==item['sha256']
        for cap in case['captures']:
            p=Path(cap['path']);assert p.is_relative_to(base) and sha(p)==cap['sha256']
            img=cv2.imread(str(p));assert img.shape==(720,1280,3);assert cap['variant'] not in images;images[cap['variant']]=img
            for when in ('before','after'):state_gates.append({'variant':cap['variant'],'when':when,'gates':stable(cap[when],initial,case['fixedTime'])})
        row={k:case[k] for k in ('key','mode','cat','skill','ms','frame','fixedTime','expectedFrames')};row.update(totalLifecycle=case.get('totalLifecycle'),hudPortraitPause=case.get('hudPortraitPause',[]),controls={},stateGates=state_gates,complete=set(images)==set(VARIANTS),labels=[]);result['cases'].append(row)
        if not row['complete']:row['valid']=False;continue
        for name,a,b in [('baselineRepeat','baseline','baseline-repeat'),('hiddenRepeat','labels-hidden','labels-hidden-repeat'),('restored','baseline','restored')]:row['controls'][name]=stats(delta(images[a],images[b])>0)
        row['valid']=all(x['count']==0 for x in row['controls'].values()) and all(all(s['gates'].values()) for s in state_gates)
        row['decodedExact']=all(abs(initial['media'][cat]['decoded']['mediaTime']-case['expectedFrames'][cat]/30)<1e-5 for cat in MEDIA);row['valid']&=row['decodedExact']
        paint=delta(images['baseline'],images['labels-hidden']);contributions={cat:delta(images['labels-hidden'],images['without-'+cat]) for cat in CATS};union=np.zeros((720,1280),bool)
        masks=review/(case['key']+'-differences.npz');np.savez_compressed(masks,labelPaint=paint,**{cat+'Contribution':v for cat,v in contributions.items()});row['pixelDifferences']={'path':str(masks),'sha256':sha(masks)}
        for label in initial['labels']:
            if label['id'] not in MEDIA:continue
            box=label['rect'];x0,y0,x1,y1=max(0,math.floor(box['x'])),max(0,math.floor(box['y'])),min(1280,math.ceil(box['x']+box['width'])),min(720,math.ceil(box['y']+box['height']))
            region=np.zeros((720,1280),bool);region[y0:y1,x0:x1]=True;item={'id':label['id'],'rect':box,'thresholds':{}}
            for threshold in THRESHOLDS:
                hits={}
                for cat,contribution in contributions.items():
                    mask=(paint>threshold)&region&(contribution>threshold);hits[cat]=stats(mask)
                    if threshold==0:union|=mask
                item['thresholds'][str(threshold)]=hits
            row['labels'].append(item)
        row['commissionedLabelsAgainstAllFourBodies']=stats(union)
        images_to_make.append((case,row,images['baseline'],images['labels-hidden'],union))
    result['attributionValid']=bool(raw['pass'] and not raw['errors'] and not raw['blockedRequests'] and [c['key'] for c in raw['cases']]==[c['key'] for c in raw['plannedPixelCases']] and all(c.get('valid') for c in result['cases']))
    result['sampledPaintClear']=result['attributionValid'] and all(c['commissionedLabelsAgainstAllFourBodies']['count']==0 for c in result['cases'])
    output.write_text(json.dumps(result,indent=2)+'\n')
    for case,row,baseline,hidden,union in sorted(images_to_make,key=lambda x:(-x[1]['commissionedLabelsAgainstAllFourBodies']['count'],x[0]['key']))[:4]:
        sheet=np.zeros((600,1024,3),np.uint8)
        title='Diagnostic Mochi below body; Clover(-12,+19)' if raw.get('runtimeDiagnostic',{}).get('lowerBodyLabel') else 'Diagnostic Clover dx-12 dy+19px'
        for img,left,title in [(baseline,0,title),(hidden,512,'Diagnostic: labels hidden')]:
            sheet[26:314,left:left+512]=cv2.resize(img,(512,288),interpolation=cv2.INTER_AREA);cv2.putText(sheet,title,(left+8,18),cv2.FONT_HERSHEY_SIMPLEX,.45,(240,240,240),1)
        annotated=baseline.copy();annotated[union]=(255,0,255);pts=np.argwhere(union)
        if len(pts):y0,x0=np.maximum(pts.min(axis=0)-24,0);y1,x1=np.minimum(pts.max(axis=0)+25,[720,1280])
        else:x0,y0,x1,y1=0,0,1280,720
        for img,left in [(baseline,0),(annotated,512)]:
            crop=img[y0:y1,x0:x1];factor=min(496/crop.shape[1],236/crop.shape[0],2);w,h=max(1,round(crop.shape[1]*factor)),max(1,round(crop.shape[0]*factor));sheet[344:344+h,left+8:left+8+w]=cv2.resize(crop,(w,h),interpolation=cv2.INTER_NEAREST)
        cv2.putText(sheet,f"{case['key']} | controls {row['valid']} | M/C label paint intersects4bodies: {int(union.sum())}",(8,334),cv2.FONT_HERSHEY_SIMPLEX,.43,(240,240,240),1)
        dest=review/(case['key']+'.png');assert not dest.exists() and cv2.imwrite(str(dest),sheet);result['reviewImages'].append({'path':str(dest),'sha256':sha(dest),'dimensions':[1024,600],'caseKey':case['key'],'views':0,'reviewed':False})
    output.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:result[k] for k in ('actions','geometryRows','rulesEqual','attributionValid','sampledPaintClear','captureFailure')}))


if __name__=='__main__':main()
