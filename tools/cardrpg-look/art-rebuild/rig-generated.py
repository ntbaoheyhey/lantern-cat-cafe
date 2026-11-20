"""Author a Mochi rig on the actual reviewed image-to-3D surface.

Prototype weights are explicit spatial masks, not an automatic-rig claim. The
source and each earlier attempt remain intact; pose review is mandatory.
"""
import argparse
import hashlib
import io
import json
import struct
from pathlib import Path
import numpy as np
from PIL import Image

p = argparse.ArgumentParser()
p.add_argument('--source', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
p.add_argument('--revision', type=int, choices=[1, 2, 3], default=3)
a = p.parse_args()
if a.out.exists():
    raise ValueError('Preserve earlier attempts; choose a new output')
blob = a.source.read_bytes()
length = struct.unpack_from('<I', blob, 12)[0]
g = json.loads(blob[20:20 + length])
binary = bytearray(blob[28 + length:])
if len(g['meshes']) != 1 or len(g['meshes'][0]['primitives']) != 1:
    raise ValueError('Expected one reviewed mesh primitive')
for node in g.get('nodes', []):
    if any(k in node for k in ['matrix', 'rotation', 'scale', 'translation']):
        raise ValueError('Bake source node transforms before assigning weights')
pr = g['meshes'][0]['primitives'][0]

def read(index):
    ac = g['accessors'][index]
    view = g['bufferViews'][ac['bufferView']]
    count = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[ac['type']]
    dtype = {5126: '<f4', 5125: '<u4', 5123: '<u2'}[ac['componentType']]
    item = np.dtype(dtype).itemsize
    return np.ndarray((ac['count'], count), dtype=dtype, buffer=binary,
                      offset=view.get('byteOffset', 0) + ac.get('byteOffset', 0),
                      strides=(view.get('byteStride', count * item), item)).copy()

def add(array, kind, component=5126, target=None):
    while len(binary) % 4:
        binary.append(0)
    view = dict(buffer=0, byteOffset=len(binary), byteLength=array.nbytes)
    if target:
        view['target'] = target
    g['bufferViews'].append(view)
    ac = dict(bufferView=len(g['bufferViews']) - 1, componentType=component,
              count=len(array), type=kind)
    if kind == 'VEC3':
        ac.update(min=array.min(0).tolist(), max=array.max(0).tolist())
    binary.extend(array.tobytes())
    g['accessors'].append(ac)
    return len(g['accessors']) - 1

positions = read(pr['attributes']['POSITION'])
source_low, source_high = positions.min(0), positions.max(0)
scale = 1.55 / (source_high[1] - source_low[1])
positions[:, 1] -= source_low[1]
positions *= scale
pr['attributes']['POSITION'] = add(positions.astype('<f4'), 'VEC3', target=34962)
# Rest axes are the game axes, so existing quaternion clip offsets retain their
# meaning. All joints use translation-only rest transforms and explicit IBMs.
spec = [
    ('motion', None, (0, 0, 0)),
    ('body', 'motion', (0, .55, 0)),
    ('head', 'body', (-.045, .88, 0)),
    ('armL', 'body', (.235, .79, .065)),
    ('armR', 'body', (-.28, .76, .06)),
    ('footL', 'motion', (.14, .19, .05)),
    ('footR', 'motion', (-.18, .19, .05)),
    ('tail', 'body', (-.18, .34, -.25)),
    ('tailMid', 'tail', (-.48, .41, -.33)),
    ('tailTip', 'tailMid', (-.51, .65, -.28)),
    ('earL', 'head', (.23, 1.29, -.015)),
    ('earR', 'head', (-.31, 1.29, -.015)),
    ('shield', 'armL', (.32, .75, .275)),
    ('lantern', 'shield', (.50, .59, .40)),
]
if a.revision >= 2:
    # Hard props and shoulders inherit root motion, not torso squash/stretch.
    spec = [(name, 'motion' if name in ['armL', 'armR'] else parent, location)
            for name, parent, location in spec]
world = {name: np.array(position, dtype=np.float32) for name, _, position in spec}
ids = {name: index for index, (name, _, _) in enumerate(spec)}
weights = np.zeros((len(positions), len(spec)), dtype=np.float32)
weights[:, ids['body']] = 1
x, y, z = positions.T

def smooth(lo, hi, value):
    t = np.clip((value - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)

def layer(name, amount):
    amount = np.clip(amount, 0, 1)
    weights[:] *= (1 - amount[:, None])
    weights[:, ids[name]] += amount

# Head and ears blend at actual neck/ear bases. Feet remain planted when the
# body breathes; torso stretch does not move the foot joints.
layer('footL', (1 - smooth(.16, .29, y)) * smooth(-.055, .045, x))
layer('footR', (1 - smooth(.16, .29, y)) * (1 - smooth(-.055, .045, x)))
layer('armR', smooth(.23, .36, -x) * smooth(.30, .44, y)
      * (1 - smooth(.80, .89, y)) * smooth(-.23, -.10, z))
layer('armL', smooth(.16, .29, x) * smooth(.41, .57, y)
      * (1 - smooth(.83, .89, y)) * smooth(-.18, -.04, z))
# The shield and lantern stay rigid. The upper transition belongs to the paw,
# and a small positional blend at their join avoids opening a source seam.
shield = smooth(.13, .19, x) * smooth(.14, .24, z) * (1 - smooth(.76, .82, y))
layer('shield', shield)
if a.revision >= 2:
    # Measured texture and coordinates distinguish cream paws from the dark
    # apron in this fused source. Broad x-only masks dragged cloth into arms.
    uv = read(pr['attributes']['TEXCOORD_0'])
    tex = g['textures'][g['materials'][pr['material']]['pbrMetallicRoughness']['baseColorTexture']['index']]
    image_index = tex.get('source', tex.get('extensions', {}).get('EXT_texture_webp', {}).get('source'))
    view = g['bufferViews'][g['images'][image_index]['bufferView']]
    start = view.get('byteOffset', 0)
    texture = Image.open(io.BytesIO(binary[start:start + view['byteLength']])).convert('RGB')
    colors = np.asarray(texture)[np.clip((uv[:, 1] * texture.height).astype(int), 0, texture.height - 1),
                                 np.clip((uv[:, 0] * texture.width).astype(int), 0, texture.width - 1)] / 255
    fur = smooth(.38, .60, colors.mean(1))
    weights[:, :] = 0
    weights[:, ids['body']] = 1
    layer('footL', (1 - smooth(.16, .29, y)) * smooth(-.055, .045, x))
    layer('footR', (1 - smooth(.16, .29, y)) * (1 - smooth(-.055, .045, x)))
    layer('armR', smooth(.23, .32, -x) * smooth(.32, .40, y)
          * (1 - smooth(.77, .85, y)) * smooth(-.16, -.06, z) * fur)
    layer('armL', smooth(.17, .27, x) * smooth(.60, .70, y)
          * (1 - smooth(.84, .88, y)) * smooth(-.14, -.03, z) * fur)
    # A hard mask keeps the actual wooden door and brass lantern rigid. No
    # blend across their broad surface; only the paw/shoulder deform.
    shield = ((x > .165) & (z > .105) & (y < .807)).astype(np.float32)
    layer('shield', shield)
if a.revision >= 3:
    # Continuous geometry masks avoid texture speckles turning into sharp skin
    # weight changes. A measured forelimb capsule excludes the apron below it.
    weights[:, :] = 0
    weights[:, ids['body']] = 1
    layer('footL', (1 - smooth(.16, .29, y)) * smooth(-.055, .045, x))
    layer('footR', (1 - smooth(.16, .29, y)) * (1 - smooth(-.055, .045, x)))
    def capsule(start, end):
        start, end = np.array(start), np.array(end)
        axis = end - start
        t = np.clip(((positions - start) @ axis) / (axis @ axis), 0, 1)
        return np.linalg.norm(positions - start - t[:, None] * axis, axis=1)
    free_arm = 1 - smooth(.075, .13, capsule((-.30, .71, .095), (-.43, .44, .205)))
    layer('armR', free_arm * (1 - smooth(.74, .83, y)))
    layer('armL', (1 - smooth(.08, .15, capsule((.235, .76, .02), (.285, .805, .22))))
          * smooth(.64, .72, y))
    # Door's diagonal rear plane and lower edge exclude Mochi's right foot.
    shield = ((x > .17) & (z > .22 - .16 * x) & (y < .807)
              & (y > .24 - .25 * x)).astype(np.float32)
    layer('shield', shield)
tail = np.maximum(smooth(.27, .34, -z),
                  smooth(.32, .43, -x) * smooth(.13, .23, -z))
tail *= (1 - smooth(.76, .84, y)) * smooth(.20, .30, y)
layer('tail', tail)
layer('tailMid', tail * smooth(.24, .42, -x) * (1 - smooth(.50, .69, y)))
layer('tailTip', tail * smooth(.48, .69, y))
layer('head', smooth(.82, .94, y))
layer('earL', smooth(1.27, 1.40, y) * smooth(.13, .24, x))
layer('earR', smooth(1.27, 1.40, y) * smooth(.21, .31, -x))
joint_indices = np.argsort(weights, axis=1)[:, -4:][:, ::-1].copy()
skin_weights = np.take_along_axis(weights, joint_indices, axis=1)
skin_weights /= skin_weights.sum(axis=1, keepdims=True)
pr['attributes']['JOINTS_0'] = add(joint_indices.astype('<u2'), 'VEC4', 5123, 34962)
pr['attributes']['WEIGHTS_0'] = add(skin_weights.astype('<f4'), 'VEC4', target=34962)

# Mesh-derived green-iris centers were measured on the source texture. This
# prototype morph narrows the painted eyes; it does not add replacement eyes.
blink = np.zeros_like(positions)
for cx, cy in [(-.195, 1.096), (.100, 1.103)]:
    radius = ((x - cx) / .105) ** 2 + ((y - cy) / .112) ** 2
    mask = (1 - smooth(.55, 1.25, radius)) * smooth(.21, .26, z)
    blink[:, 1] += (cy - y) * .96 * mask
pr['targets'] = [dict(POSITION=add(blink.astype('<f4'), 'VEC3', target=34962))]
g['meshes'][0]['weights'] = [0]
g['meshes'][0]['extras'] = dict(targetNames=['blink'])
nodes = [dict(name='guardian', children=[1, 2], extras=dict(
    lookV2=True, lookProps=True, lookGenerated=True, rigVersion=f'mochi-image3d-rig{a.revision}')),
    dict(name='mochi_generated_surface', mesh=0, skin=0)]
for name, parent, location in spec:
    local = world[name] - world[parent] if parent else world[name]
    nodes.append(dict(name='guardian_' + name, translation=local.tolist()))
for index, (name, parent, _) in enumerate(spec):
    if parent:
        nodes[2 + ids[parent]].setdefault('children', []).append(2 + index)
# Existing gear/status anchors stay semantic even though the surface is skinned.
for name, parent, point in [
    ('socket_weapon', 'armR', (-.40, .47, .19)),
    ('socket_body', 'body', (-.045, .63, .25)),
    ('socket_neck', 'head', (-.045, .88, .20)),
    ('socket_back', 'body', (0, .63, -.21)),
    ('socket_tail', 'tail', (-.23, .35, -.28)),
]:
    nodes[2 + ids[parent]].setdefault('children', []).append(len(nodes))
    nodes.append(dict(name=name, translation=(np.array(point) - world[parent]).tolist()))
ibm = np.repeat(np.eye(4, dtype='<f4')[None, :, :], len(spec), axis=0)
for i, (name, _, _) in enumerate(spec):
    ibm[i, :3, 3] = -world[name]
g['nodes'] = nodes
g['scenes'] = [dict(nodes=[0])]
g['scene'] = 0
g['skins'] = [dict(name='Mochi reviewed source rig', skeleton=2,
    joints=list(range(2, 2 + len(spec))),
    inverseBindMatrices=add(ibm.transpose(0, 2, 1).copy().reshape(-1, 16), 'MAT4'))]
g.pop('animations', None)
g['asset']['generator'] = f'Taskbar Hero local reviewed-source rig prototype{a.revision}'
g['buffers'] = [dict(byteLength=len(binary))]
j = json.dumps(g, separators=(',', ':')).encode()
j += b' ' * (-len(j) % 4)
binary += b'\0' * (-len(binary) % 4)
out = struct.pack('<III', 0x46546C67, 2, 28 + len(j) + len(binary))
out += struct.pack('<II', len(j), 0x4E4F534A) + j
out += struct.pack('<II', len(binary), 0x004E4942) + binary
a.out.parent.mkdir(parents=True, exist_ok=True)
a.out.write_bytes(out)
receipt = dict(source=str(a.source), sourceSha256=hashlib.sha256(blob).hexdigest(),
    output=str(a.out), sha256=hashlib.sha256(out).hexdigest(), bytes=len(out),
    revision=a.revision,
    joints=[v[0] for v in spec], vertices=len(positions), height=1.55,
    maxWeightSumError=float(np.abs(skin_weights.sum(1) - 1).max()),
    weightCounts={name: int((weights[:, i] > .05).sum()) for i, (name, _, _) in enumerate(spec)},
    acceptance='PROTOTYPE: explicit weights, requires pose and battle review')
a.out.with_suffix('.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
