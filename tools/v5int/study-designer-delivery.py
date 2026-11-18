#!/usr/bin/env python3
"""Offline Batch M experiment. Never writes runtime assets or changes source media.

The source is black-composited RGB, so original alpha is not recoverable uniquely.
This evaluates a bounded edge estimate, explicitly not a reference alpha ground truth.
"""
import argparse
import hashlib
import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'work/v5/CXI/batch-m'


def decode(path, width, height):
    raw = subprocess.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path),
        '-vf', f'scale={width}:{height}:flags=lanczos', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
    return np.frombuffer(raw, np.uint8).reshape((-1, height, width, 3))


def alpha_estimate(rgb):
    level = rgb.max(axis=2).astype(np.float32)
    # Keep painted dark interiors. Only alter the narrow silhouette transition.
    solid = (level > 24).astype(np.uint8)
    distance = cv2.distanceTransform(solid, cv2.DIST_L2, 3)
    local = cv2.dilate(level, np.ones((5, 5), np.uint8))
    alpha = np.clip((level - 3) / np.maximum(local - 3, 1), 0, 1)
    alpha[distance >= 1.9] = 1
    alpha[level <= 4] = 0
    # This is an estimate; reconstruct over black and record its error separately.
    straight = np.clip(rgb.astype(np.float32) / np.maximum(alpha[..., None], 1/255), 0, 255)
    return straight.astype(np.uint8), np.round(alpha * 255).astype(np.uint8)


def metric(a, b):
    diff = np.abs(a.astype(np.float32) - b.astype(np.float32))
    return float(diff.mean())


def process(cat, target):
    folder = WORK / 'experiments' / f'{cat}-{target}'
    folder.mkdir(parents=True, exist_ok=True)
    source = WORK / 'sources' / f'{cat}-idle-original.mp4'
    probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(source)]))['streams'][0]
    height = 512
    width = round(probe['width'] / probe['height'] * height)
    original = decode(source, width, height)
    assert len(original) == 300
    visible = original.max(axis=(0, 3)) > 12
    yy, xx = np.where(visible)
    bounds = [int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1)]
    x0, y0, x1, y1 = bounds
    cat_height = y1-y0
    x0=max(0,x0-3); y0=max(0,y0-3); x1=min(width,x1+3); y1=min(height,y1+3)
    factor = target/cat_height
    w = int(np.ceil((x1-x0)*factor/2)*2)
    h = int(np.ceil((y1-y0)*factor/2)*2)
    frames = np.stack([cv2.resize(f[y0:y1,x0:x1],(w,h),interpolation=cv2.INTER_AREA) for f in original])
    del original
    adjacent = [metric(frames[i],frames[i-1]) for i in range(1,300)]
    seam = metric(frames[-1], frames[0])
    samples = []
    output = folder / 'rgb-mask-crf20.mp4'
    encoder = subprocess.Popen(['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','rgb24',
        '-video_size',f'{w}x{h*2}','-framerate','30','-i','-','-an','-c:v','libx264','-preset','medium',
        '-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(output)],stdin=subprocess.PIPE)
    rgba_path = folder / 'estimated.rgba'
    reconstruction = []
    with rgba_path.open('wb') as raw:
        for i,frame in enumerate(frames):
            rgb,alpha=alpha_estimate(frame)
            rgba=np.dstack([rgb,alpha]);raw.write(rgba.tobytes())
            # Same compressed frame carries RGB and grayscale alpha: no cross-video drift.
            packed=np.concatenate([rgb,np.repeat(alpha[...,None],3,axis=2)],axis=0)
            encoder.stdin.write(packed.tobytes())
            reconstruction.append(metric(rgb.astype(np.float32)*(alpha[...,None]/255),frame))
            if i in [0,24,75,150,225,299]:
                tiles=[]
                for bg in [(242,228,206),(25,46,40)]:
                    comp=rgb*(alpha[...,None]/255)+np.array(bg)*(1-alpha[...,None]/255)
                    tiles.append(np.clip(comp,0,255).astype(np.uint8))
                tile=np.concatenate(tiles,axis=1)
                tile=cv2.resize(tile,(min(512,w*2),round(h*min(512,w*2)/(w*2))))
                cv2.putText(tile,f'{cat} frame {i}, estimated matte',(8,18),cv2.FONT_HERSHEY_SIMPLEX,.4,(80,80,80),1)
                samples.append(tile)
    encoder.stdin.close()
    assert encoder.wait()==0
    # Same motion, source 10s unchanged. A subsequent seam repair must be explicit.
    sheet=np.concatenate([np.concatenate(samples[i:i+2],axis=1) for i in range(0,6,2)],axis=0)
    shrink=min(1024/sheet.shape[0],1024/sheet.shape[1],1)
    if shrink<1:sheet=cv2.resize(sheet,(round(sheet.shape[1]*shrink),round(sheet.shape[0]*shrink)))
    sheet_path=folder/'edge-estimate-contact.jpg';cv2.imwrite(str(sheet_path),cv2.cvtColor(sheet,cv2.COLOR_RGB2BGR))
    # Compare compression against the candidate's own uncompressed black reconstruction.
    decoded=decode(output,w,h*2)
    mask_mae=[];composition_mae=[]
    estimated=np.memmap(rgba_path,dtype=np.uint8,mode='r',shape=(300,h,w,4))
    for i,f in enumerate(decoded):
        rgb=f[:h].astype(np.float32);a=f[h:,:,0:1].astype(np.float32)/255
        ref=estimated[i];ra=ref[:,:,3:4].astype(np.float32)/255
        mask_mae.append(metric(a*255,ra*255))
        composition_mae.append(metric(rgb*a+242*(1-a),ref[:,:,:3]*ra+242*(1-ra)))
    footprints=[]
    for frame in frames:
        mask=frame.max(axis=2)>24
        foot=np.where(mask[int(h*.85):,:])[0]
        footprints.append(int(foot.max()+int(h*.85)) if len(foot) else None)
    report={'utc':datetime.now(timezone.utc).isoformat(),'cat':cat,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
      'sourceDuration':10,'fps':30,'frames':300,'studyCanvas':[width,height],'sourceBoundsAtStudy':bounds,
      'targetCatHeight':target,'deliveryCanvas':[w,h],'packedCanvas':[w,h*2],'bytes':output.stat().st_size,
      'rgbaSequenceBytesNoMipmaps':w*h*4*300,'rgbaSequenceBytesWithMipmaps':round(w*h*4*300*4/3),
      'packedTextureBytesNoMipmaps':w*h*2*4,'decodeSurfacesNote':'GPU texture only; browser codec surfaces and CPU copies require separate measurement.',
      'sourceSeamMAE':seam,'adjacentMAEMedian':float(np.median(adjacent)),'adjacentMAEP95':float(np.percentile(adjacent,95)),
      'seamToAdjacentP95':seam/max(float(np.percentile(adjacent,95)),.001),'footYRange':[min(footprints),max(footprints)],
      'matteReconstructionOverBlackMAEMax':max(reconstruction),'encodedMaskMAEMean':float(np.mean(mask_mae)),
      'encodedCompositionOverWhiteMAEMean':float(np.mean(composition_mae)),
      'contact':{'path':str(sheet_path),'dimensions':[sheet.shape[1],sheet.shape[0]],'sha256':hashlib.sha256(sheet_path.read_bytes()).hexdigest(),
      'stdev':list(np.std(sheet.astype(np.float32),axis=(0,1)).astype(float))},
      'warnings':['Offline experiment only, not runtime accepted.','Black-composited source cannot prove original alpha; edge/halo quality must be viewed.',
      'Source seam unrepaired in this experiment.','GPU footprint excludes codec queues and application copies.']}
    (folder/'measurements.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report),flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--cat',choices=['mochi','clover','both'],default='both');parser.add_argument('--height',type=int,default=384)
    args=parser.parse_args()
    for cat in (['mochi','clover'] if args.cat=='both' else [args.cat]):process(cat,args.height)
