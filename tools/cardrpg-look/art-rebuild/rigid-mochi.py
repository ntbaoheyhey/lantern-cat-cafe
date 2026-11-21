"""Bounded fallback: rigid source modules, no skinning or new reconstruction.

Keep the fused torso/paws/apron/door as one rigid module. Head, ears and tail
articulate independently; existing body movement carries the door's bob.
This deliberately gives up large independent arm swings to retain the image.
"""
import argparse
import hashlib
import json
import struct
from pathlib import Path
import numpy as np

p = argparse.ArgumentParser()
p.add_argument('--source', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
a = p.parse_args()
if a.out.exists():
    raise ValueError('Preserve prior outputs')
blob = a.source.read_bytes()
size = struct.unpack_from('<I', blob, 12)[0]
g = json.loads(blob[20:20 + size])
binary = bytearray(blob[28 + size:])
pr = g['meshes'][0]['primitives'][0]

def read(index):
    ac = g['accessors'][index]
    bv = g['bufferViews'][ac['bufferView']]
    width = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[ac['type']]
    dtype = {5126: '<f4', 5125: '<u4', 5123: '<u2'}[ac['componentType']]
    item = np.dtype(dtype).itemsize
    return np.ndarray((ac['count'], width), dtype=dtype, buffer=binary,
                      offset=bv.get('byteOffset', 0) + ac.get('byteOffset', 0),
                      strides=(bv.get('byteStride', width * item), item)).copy()

def add(value, kind, component=5126):
    while len(binary) % 4:
        binary.append(0)
    g['bufferViews'].append(dict(buffer=0, byteOffset=len(binary), byteLength=value.nbytes))
    binary.extend(value.tobytes())
    ac = dict(bufferView=len(g['bufferViews'])-1, componentType=component,
              count=len(value), type=kind)
    if kind == 'VEC3':
        ac.update(min=value.min(0).tolist(), max=value.max(0).tolist())
    g['accessors'].append(ac)
    return len(g['accessors'])-1

positions = read(pr['attributes']['POSITION'])
indices = read(pr['indices']).reshape(-1, 3)
joint_ids = read(pr['attributes']['JOINTS_0'])
weights = read(pr['attributes']['WEIGHTS_0'])
skin = g['skins'][0]
nodes = g['nodes']
parents = {child: i for i, n in enumerate(nodes) for child in n.get('children', [])}
def world(index):
    return np.array(nodes[index].get('translation', [0, 0, 0])) + (world(parents[index]) if index in parents else 0)
joint_names = [nodes[i]['name'].removeprefix('guardian_') for i in skin['joints']]
# Hard modules use the already-reviewed partition. There is no fourth skin
# weighting attempt, vertex blending, geometric simplification or texture edit.
group_names = ['body', 'head', 'earL', 'earR', 'tail']
group_for_joint = np.array([group_names.index(n if n in group_names else
                       'tail' if n in ('tailMid', 'tailTip') else 'body') for n in joint_names])
group_weights = np.zeros((len(positions), len(group_names)))
for slot in range(4):
    np.add.at(group_weights, (np.arange(len(positions)), group_for_joint[joint_ids[:, slot]]), weights[:, slot])
labels = group_weights[indices].sum(1).argmax(1)
meshes = []
parts = []
for label, name in enumerate(group_names):
    faces = indices[labels == label]
    used, local_indices = np.unique(faces, return_inverse=True)
    bone = next(i for i, n in enumerate(nodes) if n.get('name') == 'guardian_' + name)
    attrs = {}
    for key, index in pr['attributes'].items():
        if key.startswith(('JOINTS', 'WEIGHTS')):
            continue
        values = read(index)[used]
        if key == 'POSITION':
            values = (values - world(bone)).astype('<f4')
        attrs[key] = add(values, g['accessors'][index]['type'])
    primitive = dict(attributes=attrs, indices=add(local_indices.astype('<u4').reshape(-1, 1), 'SCALAR', 5125),
                     material=pr['material'])
    mesh = dict(name='mochi_rigid_' + name, primitives=[primitive])
    if name == 'head':
        primitive['targets'] = [{k: add(read(v)[used], 'VEC3') for k, v in target.items()}
                                for target in pr.get('targets', [])]
        mesh.update(weights=[0], extras=dict(targetNames=['blink']))
    meshes.append(mesh)
    child = len(nodes)
    nodes.append(dict(name='mochi_rigid_' + name, mesh=len(meshes)-1))
    nodes[bone].setdefault('children', []).append(child)
    parts.append(dict(name=name, triangles=len(faces), vertices=len(used), rigid=True))
# Retain rig nodes/sockets and remove only the old skinned surface node binding.
for node in nodes[:len(nodes)-len(meshes)]:
    node.pop('mesh', None)
    node.pop('skin', None)
nodes[0]['extras'].update(rigVersion='mochi-image3d-rigid1', lookRigid=True)
# The light socket follows the physical door's rigid torso module exactly.
shield_node = next(i for i, n in enumerate(nodes) if n.get('name') == 'guardian_shield')
body_node = next(i for i, n in enumerate(nodes) if n.get('name') == 'guardian_body')
shield_world, body_world = world(shield_node), world(body_node)
nodes[parents[shield_node]]['children'].remove(shield_node)
nodes[body_node].setdefault('children', []).append(shield_node)
nodes[shield_node]['translation'] = (shield_world - body_world).tolist()
g['meshes'] = meshes
g.pop('skins', None)
g['asset']['generator'] = 'Lantern Cat Café rigid source-module fallback1'
g['buffers'] = [dict(byteLength=len(binary))]
j = json.dumps(g, separators=(',', ':')).encode()
j += b' ' * (-len(j) % 4)
binary += b'\0' * (-len(binary) % 4)
result = struct.pack('<III', 0x46546c67, 2, 28 + len(j) + len(binary))
result += struct.pack('<II', len(j), 0x4e4f534a) + j
result += struct.pack('<II', len(binary), 0x004e4942) + binary
a.out.parent.mkdir(parents=True, exist_ok=True)
a.out.write_bytes(result)
a.out.with_suffix('.json').write_text(json.dumps(dict(source=str(a.source),
    sourceSha256=hashlib.sha256(blob).hexdigest(), sha256=hashlib.sha256(result).hexdigest(),
    parts=parts, triangles=sum(p['triangles'] for p in parts), skins=0,
    knownIssue='Torso, apron, paws and shield move as one rigid module; independent arm reach is intentionally limited.',
    acceptance='REVIEW_REQUIRED'), indent=2)+'\n')
