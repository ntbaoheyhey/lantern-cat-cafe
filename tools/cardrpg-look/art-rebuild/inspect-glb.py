"""Read a generated GLB's structure before Blender cleanup and rigging.

No inference, writes to assets or dependence on renderer internals. Counts are
source geometry counts, not runtime draw/triangle measurements.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('model', type=Path)
p.add_argument('--out', required=True, type=Path)
a = p.parse_args()
data = a.model.read_bytes()
magic, version, length = struct.unpack_from('<III', data)
if magic != 0x46546C67 or version != 2 or length != len(data):
    raise ValueError('Invalid GLB v2 header or declared length')
chunk_length, chunk_type = struct.unpack_from('<II', data, 12)
if chunk_type != 0x4E4F534A:
    raise ValueError('First GLB chunk is not JSON')
g = json.loads(data[20:20 + chunk_length])
rows = []
for mi, mesh in enumerate(g.get('meshes', [])):
    for pi, prim in enumerate(mesh['primitives']):
        pos = g['accessors'][prim['attributes']['POSITION']]
        count = g['accessors'][prim['indices']]['count'] if 'indices' in prim else pos['count']
        mode = prim.get('mode', 4)
        rows.append(dict(mesh=mi, primitive=pi, mode=mode,
                         triangles=count // 3 if mode == 4 else None,
                         vertices=pos['count'], minimum=pos.get('min'), maximum=pos.get('max'),
                         hasUV='TEXCOORD_0' in prim['attributes'],
                         hasSkin='JOINTS_0' in prim['attributes'] and 'WEIGHTS_0' in prim['attributes'],
                         material=prim.get('material')))
external = [r['uri'] for key in ['buffers', 'images'] for r in g.get(key, [])
            if 'uri' in r and not r['uri'].startswith('data:')]
nodes = g.get('nodes', [])
rigs = [dict(name=skin.get('name'),
             joints=[dict(index=index, name=nodes[index].get('name'))
                     for index in skin.get('joints', [])])
        for skin in g.get('skins', [])]
result = dict(source=str(a.model), sha256=hashlib.sha256(data).hexdigest(), bytes=len(data),
              generator=g.get('asset', {}).get('generator'), primitives=rows,
              triangles=sum(r['triangles'] or 0 for r in rows),
              textures=len(g.get('textures', [])), materials=g.get('materials', []),
              skins=len(g.get('skins', [])), animations=len(g.get('animations', [])),
              rigs=rigs, nodeNames=[node.get('name') for node in nodes],
              animationNames=[clip.get('name') for clip in g.get('animations', [])],
              externalFiles=external, extensionsRequired=g.get('extensionsRequired', []),
              acceptance='STRUCTURE ONLY: appearance, motion, topology and runtime gates unverified')
a.out.parent.mkdir(parents=True, exist_ok=True)
a.out.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['bytes', 'triangles', 'textures', 'skins', 'animations', 'externalFiles']}))
