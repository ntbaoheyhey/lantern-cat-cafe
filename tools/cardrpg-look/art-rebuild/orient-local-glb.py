"""Convert the native KDTree export from Z-up to glTF Y-up without re-inference.

Matches upstream o_voxel.postprocess's (x,z,-y) basis. UVs, images, indices
and material bytes stay unchanged. Never apply to the already-correct Metal
export or an animated/instanced model. Preserve the original as a separate file.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path


def orient(source, output):
    if output.exists():
        raise ValueError('Preserve existing output')
    raw = source.read_bytes()
    if struct.unpack_from('<III', raw) != (0x46546C67, 2, len(raw)):
        raise ValueError('Expected GLB2')
    n, kind = struct.unpack_from('<II', raw, 12)
    if kind != 0x4E4F534A:
        raise ValueError('Expected JSON chunk')
    doc = json.loads(raw[20:20+n])
    if doc.get('asset', {}).get('extras', {}).get('laneBSourceBasis'):
        raise ValueError('Source basis was already converted')
    bn, kind = struct.unpack_from('<II', raw, 20+n)
    if kind != 0x004E4942 or 28+n+bn != len(raw):
        raise ValueError('Expected one embedded BIN chunk')
    if doc.get('skins') or doc.get('animations') or doc.get('extensionsRequired'):
        raise ValueError('Only an uncompressed reconstruction source is supported')
    for node in doc.get('nodes', []):
        for key, default in [('translation', [0,0,0]), ('rotation', [0,0,0,1]),
                             ('scale', [1,1,1]), ('matrix', [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])]:
            if node.get(key, default) != default:
                raise ValueError('Source transforms must be identity')
    binary = bytearray(raw[28+n:])
    rotated = set()
    for mesh in doc.get('meshes', []):
        for prim in mesh['primitives']:
            for semantic in ['POSITION', 'NORMAL', 'TANGENT']:
                index = prim['attributes'].get(semantic)
                if index is None or index in rotated:
                    continue
                a = doc['accessors'][index]
                if a['componentType'] != 5126 or a.get('sparse') or a['type'] not in ['VEC3', 'VEC4']:
                    raise ValueError('Expected dense float32 geometric attributes')
                view = doc['bufferViews'][a['bufferView']]
                if view.get('buffer', 0) != 0:
                    raise ValueError('Expected the embedded buffer')
                width = 4 if a['type'] == 'VEC4' else 3
                stride = view.get('byteStride', width*4)
                start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
                low, high = [float('inf')]*3, [float('-inf')]*3
                for i in range(a['count']):
                    offset = start+i*stride
                    x, y, z = struct.unpack_from('<fff', binary, offset)
                    values = (x, z, -y)
                    struct.pack_into('<fff', binary, offset, *values)
                    for j, v in enumerate(values):
                        low[j], high[j] = min(low[j], v), max(high[j], v)
                if 'min' in a:
                    a['min'][:3] = low
                if 'max' in a:
                    a['max'][:3] = high
                rotated.add(index)
    doc.setdefault('asset', {}).setdefault('extras', {})['laneBSourceBasis'] = 'native Z-up -> glTF Y-up (x,z,-y)'
    chunk = json.dumps(doc, separators=(',', ':')).encode()
    chunk += b' '*((-len(chunk)) % 4)
    data = struct.pack('<III', 0x46546C67, 2, 28+len(chunk)+len(binary))
    data += struct.pack('<II', len(chunk), 0x4E4F534A)+chunk
    data += struct.pack('<II', len(binary), 0x004E4942)+binary
    output.write_bytes(data)
    return dict(source=str(source), sourceSha256=hashlib.sha256(raw).hexdigest(),
                output=str(output), sha256=hashlib.sha256(data).hexdigest(),
                basis='x,z,-y', geometryAccessors=len(rotated),
                method='Lossless rigid basis rotation; images/UVs/indices unchanged')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    receipt = orient(args.source, args.output)
    args.output.with_suffix('.orientation.json').write_text(json.dumps(receipt, indent=2)+'\n')
    print(json.dumps(receipt))
