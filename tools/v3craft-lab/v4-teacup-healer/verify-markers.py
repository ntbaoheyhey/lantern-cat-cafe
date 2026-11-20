"""Verify existing encoded movies against zero-based compositor marker telemetry."""
from pathlib import Path
import argparse, gzip, hashlib, json, subprocess
import numpy as np
p=argparse.ArgumentParser()
p.add_argument('--capture-root',default='reports/v3-feel/REVIEW/V4-A7-TEACUP')
p.add_argument('--out',default='reports/v4-art/REVIEW/A7/teacup-healer/encoded-markers.json')
p.add_argument('--fixtures',nargs='+',default=['wave1','wave3','boss'])
a=p.parse_args();root=Path(a.capture_root);rows=[]
for fixture in a.fixtures:
    video=root/(fixture+'.webm');meta=root/fixture/'capture.json.gz'
    d=json.loads(gzip.decompress(meta.read_bytes()))
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-vf','crop=128:8:0:0','-pix_fmt','gray','-f','rawvideo','pipe:1'])
    cells=np.frombuffer(raw,dtype=np.uint8).reshape(-1,8,32,4)
    bits=(cells[:,2:6,:,1:3].mean(axis=(1,3))>127).astype(np.uint64)
    words=(bits*(np.uint64(1)<<np.arange(31,-1,-1,dtype=np.uint64))).sum(axis=1)
    values=words>>8;checks=((values&255)^((values>>8)&255)^((values>>16)&255)^0xa5)&255
    valid=(values>0)&((words&255)==checks)
    decoded=np.where(valid,values.astype(np.int64)-1,-1)
    expected=np.array([s.get('renderFrame',-1) for s in d['resampled']],dtype=np.int64)
    assert len(decoded)==len(expected),'Encoded frame count differs'
    mismatches=np.flatnonzero(decoded!=expected).tolist()
    range_bad=[int(i) for i,v in enumerate(decoded) if v<0 or v>=len(d['frames'])]
    ordinal_bad=[int(i) for i,v in enumerate(decoded) if 0<=v<len(d['frames']) and d['frames'][v]['ordinal']!=v]
    hash_ok=hashlib.sha256(video.read_bytes()).hexdigest()==d['videoSha256']
    row={'fixture':fixture,'frames':len(decoded),'valid':int(valid.sum()),'mismatchCount':len(mismatches),'mismatchFirst10':mismatches[:10],'rangeInvalidCount':len(range_bad),'ordinalMismatchCount':len(ordinal_bad),'videoHashMatches':hash_ok,'videoSha256':d['videoSha256'],'captureSha256':hashlib.sha256(meta.read_bytes()).hexdigest(),'indexing':'zero-based; marker value minus one equals frames[index].ordinal'}
    row['pass']=hash_ok and bool(valid.all()) and not mismatches and not range_bad and not ordinal_bad
    rows.append(row);print(json.dumps({k:row[k] for k in ['fixture','frames','valid','mismatchCount','pass']}))
Path(a.out).parent.mkdir(parents=True,exist_ok=True)
Path(a.out).write_text(json.dumps(rows,indent=2)+'\n')
assert all(r['pass'] for r in rows),'Preserve failed marker verification'
