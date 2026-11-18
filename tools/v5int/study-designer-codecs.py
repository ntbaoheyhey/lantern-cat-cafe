#!/usr/bin/env python3
"""Compare delivery encodings using the same measured, estimated alpha frames."""
import json
import subprocess
from pathlib import Path
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT/'work/v5/CXI/batch-m/experiments'

for cat in ['mochi','clover']:
    folder=WORK/f'{cat}-384'
    measurement=json.loads((folder/'measurements.json').read_text())
    w,h=measurement['deliveryCanvas']
    frames=np.memmap(folder/'estimated.rgba',dtype=np.uint8,mode='r',shape=(300,h,w,4))
    results=[]
    for height in [256,384]:
        width=round(w*height/384/2)*2;canvas_height=round(h*height/384/2)*2
        for crf in [23,28,32]:
            path=folder/f'premul-mask-{height}-crf{crf}.mp4'
            p=subprocess.Popen(['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','rgb24',
                '-video_size',f'{width}x{canvas_height*2}','-framerate','30','-i','-','-an','-c:v','libx264',
                '-preset','slow','-crf',str(crf),'-pix_fmt','yuv420p','-movflags','+faststart',str(path)],stdin=subprocess.PIPE)
            for frame in frames:
                a=frame[:,:,3].astype(np.float32)/255
                color=(frame[:,:,:3]*a[...,None]).astype(np.uint8)
                if height!=384:
                    color=cv2.resize(color,(width,canvas_height),interpolation=cv2.INTER_AREA)
                    a=cv2.resize(a,(width,canvas_height),interpolation=cv2.INTER_AREA)
                mask=np.repeat(np.round(a[...,None]*255).astype(np.uint8),3,axis=2)
                p.stdin.write(np.concatenate([color,mask],axis=0).tobytes())
            p.stdin.close();assert p.wait()==0
            results.append({'path':str(path),'catHeight':height,'canvas':[width,canvas_height],'crf':crf,'bytes':path.stat().st_size,
              'format':'H264 premultiplied RGB top, alpha grayscale bottom; alpha estimate, no seam repair'})
    (folder/'codec-trials.json').write_text(json.dumps(results,indent=2)+'\n')
    print(cat,json.dumps(results),flush=True)
