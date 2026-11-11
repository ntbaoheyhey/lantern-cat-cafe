"""Repair only the empty UV gutters from the native KDTree baker.

The upstream dilation averages against black unfilled pixels. Reconstruct its
triangle coverage and extend the nearest occupied texel into gutters without
touching authored texels, geometry, UVs or indices. No model inference.
"""
import argparse
import hashlib
import io
import json
import struct
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


def pad(source, output):
    if output.exists():
        raise ValueError('Preserve prior output')
    raw = source.read_bytes()
    n = struct.unpack_from('<I', raw, 12)[0]
    doc = json.loads(raw[20:20+n])
    if not doc['asset'].get('extras', {}).get('laneBNativeUV'):
        raise ValueError('Requires corrected native KDTree UVs')
    if doc['asset']['extras'].get('laneBNativeGutters'):
        raise ValueError('Gutters already repaired')
    binary = bytearray(raw[28+n:])

    def accessor(index):
        a = doc['accessors'][index]; view = doc['bufferViews'][a['bufferView']]
        dtype = {5126:'<f4',5125:'<u4',5123:'<u2'}[a['componentType']]
        size = {'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']]
        stride = view.get('byteStride', np.dtype(dtype).itemsize*size)
        return np.ndarray((a['count'],size), dtype, buffer=binary,
            offset=view.get('byteOffset',0)+a.get('byteOffset',0),
            strides=(stride,np.dtype(dtype).itemsize)).copy()

    rows = []
    for image_index, image in enumerate(doc['images']):
        view = doc['bufferViews'][image['bufferView']]
        start = view.get('byteOffset',0)
        original = np.array(Image.open(io.BytesIO(binary[start:start+view['byteLength']])).convert('RGB'))
        height, width = original.shape[:2]
        mask = np.zeros((height,width), bool)
        for mesh in doc['meshes']:
            for prim in mesh['primitives']:
                uv = accessor(prim['attributes']['TEXCOORD_0'])*[width-1,height-1]
                indices = accessor(prim['indices']).reshape(-1,3)
                for tri in indices:
                    q = uv[tri]; lo = np.maximum(np.floor(q.min(axis=0)).astype(int),0)
                    hi = np.minimum(np.ceil(q.max(axis=0)).astype(int),[width-1,height-1])
                    if np.any(hi<lo): continue
                    dx,dy = q[1]-q[0],q[2]-q[0]
                    det = dx[0]*dy[1]-dy[0]*dx[1]
                    if abs(det)<1e-10: continue
                    x,y = np.meshgrid(np.arange(lo[0],hi[0]+1),np.arange(lo[1],hi[1]+1))
                    px,py = x-q[0,0],y-q[0,1]
                    a = (px*dy[1]-dy[0]*py)/det
                    b = (dx[0]*py-px*dx[1])/det
                    mask[y,x] |= (a>=-.001)&(b>=-.001)&(1-a-b>=-.001)
        if not mask.any(): raise ValueError('No occupied UV texels')
        nearest = distance_transform_edt(~mask, return_distances=False, return_indices=True)
        repaired = original.copy()
        repaired[~mask] = original[nearest[0,~mask],nearest[1,~mask]]
        assert np.array_equal(original[mask],repaired[mask])
        png = io.BytesIO(); Image.fromarray(repaired).save(png,format='PNG')
        data = png.getvalue(); binary.extend(b'\0'*(-len(binary)%4))
        view_index = len(doc['bufferViews'])
        doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(data)})
        binary.extend(data); image['bufferView']=view_index; image['mimeType']='image/png'
        rows.append({'image':image_index,'coverage':float(mask.mean()),'occupiedTexelsUnchanged':True})
    binary.extend(b'\0'*(-len(binary)%4)); doc['buffers'][0]['byteLength']=len(binary)
    doc['asset']['extras']['laneBNativeGutters']='nearest occupied UV texel; no black dilation'
    chunk = json.dumps(doc,separators=(',',':')).encode(); chunk+=b' '*(-len(chunk)%4)
    output.write_bytes(struct.pack('<IIIII',0x46546c67,2,28+len(chunk)+len(binary),len(chunk),0x4e4f534a)
        +chunk+struct.pack('<II',len(binary),0x004e4942)+binary)
    receipt={'source':str(source),'sourceSha256':hashlib.sha256(raw).hexdigest(),
        'model':str(output),'modelSha256':hashlib.sha256(output.read_bytes()).hexdigest(),
        'images':rows,'geometryUVIndicesUnchanged':True}
    output.with_suffix('.gutters.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return receipt


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source',type=Path);parser.add_argument('output',type=Path)
    args=parser.parse_args();print(json.dumps(pad(args.source,args.output)))
