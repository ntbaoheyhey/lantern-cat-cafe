"""UV density for an uncompressed authored GLB. Units are atlas pixels/model-unit.
Triangle UV areas are exact; scene nodes are unscaled authoring transforms. Heatmap
is an atlas occupancy visualization, not a claim of perceptual texture sharpness.
"""
import sys,json,struct,math
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
p=Path(sys.argv[1]);b=p.read_bytes();n=struct.unpack_from('<I',b,12)[0];g=json.loads(b[20:20+n]);data=b[28+n:];size=int(sys.argv[2]) if len(sys.argv)>2 else 1024
ct={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1',5122:'<i2',5120:'i1'};dim={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}
def get(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dt=np.dtype(ct[a['componentType']]);w=dim[a['type']];return np.ndarray((a['count'],w),dtype=dt,buffer=data,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*w),dt.itemsize))
rows=[];im=Image.new('RGB',(512,512),'#102129');draw=ImageDraw.Draw(im)
for mesh in g.get('meshes',[]):
 for part in mesh['primitives']:
  if 'TEXCOORD_0' not in part['attributes']:continue
  xyz=get(part['attributes']['POSITION']);uv=get(part['attributes']['TEXCOORD_0']);ids=get(part['indices']).ravel().reshape(-1,3);v=xyz[ids];t=uv[ids];world=np.linalg.norm(np.cross(v[:,1]-v[:,0],v[:,2]-v[:,0]),axis=1)/2;u=t[:,1]-t[:,0];w=t[:,2]-t[:,0];area=np.abs(u[:,0]*w[:,1]-u[:,1]*w[:,0])/2;valid=world>1e-10;density=np.sqrt(area[valid]/world[valid])*size;rows.append({'mesh':mesh.get('name'),'triangles':len(ids),'p10':float(np.percentile(density,10)),'p50':float(np.percentile(density,50)),'p90':float(np.percentile(density,90))})
  for tri,d in zip(t[valid],density):
   f=max(0,min(1,float(d)/1000));draw.polygon([(float(u)*511,(1-float(w))*511) for u,w in tri],fill=(int(233*f),int(130+100*f),int(220-150*f)))
out=p.with_suffix('.density.json');out.write_text(json.dumps({'atlasSize':size,'units':'pixels per model-unit; original game mesh UVs','rows':rows},indent=2)+'\n');im.save(p.with_suffix('.density.png'));print(out)
