"""Reverse a diagnosed inward native source without changing its surface or atlas.

Only uncompressed, untransformed triangle sources are supported. Existing
sources are immutable; runtime packing and visual review remain separate.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

import numpy as np


def fix(source, output):
    if output.exists():
        raise ValueError('Preserve existing output')
    raw = source.read_bytes()
    if struct.unpack_from('<III', raw) != (0x46546C67, 2, len(raw)):
        raise ValueError('Expected GLB2')
    size, kind = struct.unpack_from('<II', raw, 12)
    if kind != 0x4E4F534A:
        raise ValueError('Expected JSON chunk')
    doc = json.loads(raw[20:20+size])
    length, kind = struct.unpack_from('<II', raw, 20+size)
    if kind != 0x004E4942 or 28+size+length != len(raw):
        raise ValueError('Expected one embedded BIN chunk')
    if doc.get('skins') or doc.get('animations') or doc.get('extensionsRequired'):
        raise ValueError('Expected static uncompressed native source')
    if doc.get('asset', {}).get('extras', {}).get('laneBWindingCorrected'):
        raise ValueError('Winding already corrected')
    for node in doc.get('nodes', []):
        for key, default in [('translation', [0,0,0]), ('rotation', [0,0,0,1]),
                             ('scale', [1,1,1]), ('matrix', [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])]:
            if node.get(key, default) != default:
                raise ValueError('Source transforms must be identity')
    binary = bytearray(raw[28+size:])

    def array(index):
        accessor = doc['accessors'][index]
        if accessor.get('sparse') or accessor.get('normalized'):
            raise ValueError('Expected dense source attributes')
        view = doc['bufferViews'][accessor['bufferView']]
        if view.get('buffer', 0) != 0:
            raise ValueError('Expected embedded buffer')
        dtype = np.dtype({5121:'u1', 5123:'<u2', 5125:'<u4', 5126:'<f4'}[accessor['componentType']])
        width = {'SCALAR':1, 'VEC2':2, 'VEC3':3}[accessor['type']]
        return np.ndarray((accessor['count'], width), dtype=dtype, buffer=binary,
                          offset=view.get('byteOffset', 0)+accessor.get('byteOffset', 0),
                          strides=(view.get('byteStride', width*dtype.itemsize), dtype.itemsize))

    rows, indices_done, normals_done = [], set(), set()
    for mesh in doc.get('meshes', []):
        for primitive in mesh['primitives']:
            if primitive.get('mode', 4) != 4 or 'indices' not in primitive or primitive.get('targets'):
                raise ValueError('Expected indexed source triangles')
            if 'TANGENT' in primitive['attributes']:
                raise ValueError('Tangent source needs a separate reviewed correction')
            index = primitive['indices']
            if index in indices_done:
                raise ValueError('Shared source indices need an explicit review')
            indices = array(index).reshape(-1, 3)
            positions = array(primitive['attributes']['POSITION'])
            triangles = positions[indices].astype(np.float64)
            triangles -= positions.mean(axis=0)
            volume = float(np.einsum('ij,ij->i', triangles[:,0],
                           np.cross(triangles[:,1], triangles[:,2])).sum()/6)
            if volume >= -1e-12:
                raise ValueError('Source is not demonstrably inward; do not flip it')
            indices[:,[1,2]] = indices[:,[2,1]]
            indices_done.add(index)
            normal = primitive['attributes'].get('NORMAL')
            if normal is not None and normal not in normals_done:
                values = array(normal)
                values *= -1
                accessor = doc['accessors'][normal]
                if 'min' in accessor and 'max' in accessor:
                    accessor['min'], accessor['max'] = [-v for v in accessor['max']], [-v for v in accessor['min']]
                normals_done.add(normal)
            rows.append({'triangles':len(indices), 'signedVolumeBefore':volume, 'signedVolumeAfter':-volume})
    if not rows:
        raise ValueError('No source surface')
    doc['asset'].setdefault('extras', {})['laneBWindingCorrected'] = True
    chunk = json.dumps(doc, separators=(',', ':')).encode()
    chunk += b' '*(-len(chunk)%4)
    data = struct.pack('<III', 0x46546C67, 2, 28+len(chunk)+len(binary))
    data += struct.pack('<II', len(chunk), 0x4E4F534A)+chunk
    data += struct.pack('<II', len(binary), 0x004E4942)+binary
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(data)
    return {'source':str(source), 'sourceSha256':hashlib.sha256(raw).hexdigest(),
            'model':str(output), 'modelSha256':hashlib.sha256(data).hexdigest(), 'primitives':rows,
            'method':'Reverse triangle winding and vertex normals only; positions, UVs and images byte-exact',
            'modelRequests':0, 'runtimeAccepted':False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    receipt = fix(args.source, args.output)
    args.output.with_suffix('.winding.json').write_text(json.dumps(receipt, indent=2)+'\n')
    print(json.dumps(receipt))
