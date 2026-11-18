#!/usr/bin/env python3
"""Prepare an unregistered, content-addressed Mochi candidate from the measured matte.

All media stays in ignored work until an explicit intake copies the three outputs.
Original designer files are read/hash-checked, never edited. No Clover seam is accepted.
"""
import hashlib,json,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone
import cv2
import numpy as np
cv2.setNumThreads(2)
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'work/v5/CXI/batch-m';OUT=BASE/'candidate-mochi';OUT.mkdir(exist_ok=True)
cat='mochi';w,h=468,390;crf=int(sys.argv[1]) if len(sys.argv)>1 else 28
source=BASE/'sources/mochi-idle-original.mp4'
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert digest(source)=='1912e17112ca1bc3c6ad3a44da52c8f7813ebfc74137299c477bead781170524'
raw=np.memmap(BASE/'matte-r2/mochi-premul.rgba',np.uint8,'r',shape=(300,h,w,4))
video=OUT/'packed.mp4'
command=['ffmpeg','-y','-nostdin','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{w}x{h*2}','-framerate','30','-i','-','-an','-vf','scale=out_color_matrix=bt601:out_range=tv','-c:v','libx264','-threads','2','-preset','slow','-crf',str(crf),'-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','smpte170m','-color_range','tv','-bsf:v','h264_metadata=colour_primaries=1:transfer_characteristics=13:matrix_coefficients=6:video_full_range_flag=0','-movflags','+faststart',str(video)]
p=subprocess.Popen(command,stdin=subprocess.PIPE)
for f in raw:p.stdin.write(np.concatenate([f[:,:,:3],np.repeat(f[:,:,3:4],3,axis=2)],axis=0).tobytes())
p.stdin.close();assert p.wait()==0
video_hash=digest(video);named_video=OUT/f'designer-idle-{video_hash[:16]}.mp4';video.replace(named_video)
first=raw[0].copy();a=first[:,:,3:4].astype(np.float32)/255;first[:,:,:3]=np.clip(first[:,:,:3]/np.maximum(a,1/255),0,255).round().astype(np.uint8)
poster=OUT/'poster.webp';assert cv2.imwrite(str(poster),cv2.cvtColor(first,cv2.COLOR_RGBA2BGRA),[cv2.IMWRITE_WEBP_QUALITY,90])
decoded=cv2.cvtColor(cv2.imread(str(poster),cv2.IMREAD_UNCHANGED),cv2.COLOR_BGRA2RGBA);assert np.array_equal(decoded[:,:,3],first[:,:,3])
poster_hash=digest(poster);named_poster=OUT/f'designer-idle-{poster_hash[:16]}.webp';poster.replace(named_poster)
payload_path=Path('/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-mochi-socket-delivery-R3.json')
payload=json.loads(payload_path.read_text());adapter_proof=json.loads((ROOT/'reports/v5/CXI/evidence/v8-m-socket-channel-adapter.json').read_text())
assert adapter_proof['pass'] and adapter_proof['payloadSha256']==digest(payload_path)
assert payload['sourceSha256']==digest(source) and payload['deliverySize']==[w,h] and payload['opaqueHeight']==384
partial=payload['partialManifest'];assert partial['socketChannels']=={'hip':'hip','main-hand':'shieldWrist','vfx-origin':'lantern'}
manifest={'version':1,'id':cat,'format':'h264-rgb-mask','video':f'/units/{cat}/{named_video.name}','poster':f'/units/{cat}/{named_poster.name}','width':w,'height':h,'opaqueHeight':384,'foot':[247.25,387],'opaqueBounds':[3,3,465,387],'faceROI':[150,48,197,133],'duration':10,'fps':30,'frames':300,'sourceSha256':digest(source),'videoSha256':video_hash,'posterSha256':poster_hash,'videoBytes':named_video.stat().st_size,'sockets':{'root':[247.25,387],'hip':[248,268],'head':[249,115],'hp-anchor':[249,-35],'vfx-origin':[424,254],'main-hand':[370,183],'off-hand':[143,254],**partial['sockets']},'socketTracks':partial['socketTracks'],'socketChannels':partial['socketChannels']}
encoded=json.dumps(manifest,separators=(',',':')).encode();manifest_hash=hashlib.sha256(encoded).hexdigest();named_manifest=OUT/f'designer-idle-{manifest_hash[:16]}.json';named_manifest.write_bytes(encoded)
report={'utc':datetime.now(timezone.utc).isoformat(),'status':'unregistered candidate; native quality/cold/performance gates pending','sourceSha256':digest(source),'matteSha256':digest(BASE/'matte-r2/mochi-premul.rgba'),'files':[{'path':str(p),'bytes':p.stat().st_size,'sha256':digest(p)} for p in [named_video,named_poster,named_manifest]],'encoding':command[:-1],'textureBytes':w*h*2*4,'sequenceEquivalentBytes':w*h*4*300,'duration':10,'frames':300,'sourceMotionRetained':True,'coordinateReview':'mochi-384-coordinate-review.png viewed once; face/foot plausible, native placement unaccepted'}
report['crf']=crf
report['socketPayload']={'path':str(payload_path),'sha256':digest(payload_path),'unresolved':payload['unresolved'],'acceptance':'Adapter arithmetic only; unresolved anatomy prevents registration.'}
(OUT/f'candidate-crf{crf}.json').write_text(json.dumps(report,indent=2)+'\n')
(ROOT/'reports/v5/CXI/evidence/v8-m-mochi-candidate.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
