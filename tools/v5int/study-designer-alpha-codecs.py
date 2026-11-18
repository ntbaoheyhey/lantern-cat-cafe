#!/usr/bin/env python3
"""Offline VP9-alpha and explicitly tagged H264 comparison, no shipped assets."""
import json,subprocess
from pathlib import Path
import numpy as np
import cv2
root=Path(__file__).resolve().parents[2]
for cat in ['mochi','clover']:
    folder=root/'work/v5/CXI/batch-m/experiments'/f'{cat}-384'
    data=json.loads((folder/'measurements.json').read_text());w,h=data['deliveryCanvas']
    frames=np.memmap(folder/'estimated.rgba',dtype=np.uint8,mode='r',shape=(300,h,w,4))
    w2=round(w*2/3/2)*2;h2=round(h*2/3/2)*2
    variants=[('bt709-srgb','mp4','rgb24',h2*2,['-vf','scale=out_color_matrix=bt709:out_range=tv','-c:v','libx264','-preset','slow','-crf','28','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-color_range','tv','-movflags','+faststart']),
      ('vp9-alpha','webm','rgba',h2,['-c:v','libvpx-vp9','-pix_fmt','yuva420p','-b:v','0','-crf','32','-deadline','good','-cpu-used','3','-row-mt','1'])]
    results=[]
    for variant,ext,fmt,eh,options in variants:
        out=folder/f'premul-mask-256-crf28-{variant}.{ext}'
        p=subprocess.Popen(['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format',fmt,'-video_size',f'{w2}x{eh}','-framerate','30','-i','-','-an']+options+[str(out)],stdin=subprocess.PIPE)
        for frame in frames:
            a=frame[:,:,3].astype(np.float32)/255
            color=cv2.resize((frame[:,:,:3]*a[...,None]).astype(np.uint8),(w2,h2),interpolation=cv2.INTER_AREA)
            alpha=cv2.resize(a,(w2,h2),interpolation=cv2.INTER_AREA)
            if variant=='vp9-alpha':
                straight=np.clip(color/np.maximum(alpha[...,None],1/255),0,255).astype(np.uint8)
                output=np.dstack([straight,np.round(alpha*255).astype(np.uint8)])
            else:output=np.concatenate([color,np.repeat(np.round(alpha[...,None]*255).astype(np.uint8),3,axis=2)],axis=0)
            p.stdin.write(output.tobytes())
        p.stdin.close();assert p.wait()==0
        results.append({'cat':cat,'variant':variant,'bytes':out.stat().st_size,'path':str(out)})
    (folder/'alpha-codecs.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(results),flush=True)
