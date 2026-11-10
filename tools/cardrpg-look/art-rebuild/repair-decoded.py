"""One bounded local surface repair; preserve original decoded data and colours."""
import argparse
import hashlib
import json
from pathlib import Path
import sys
import bpy
import numpy as np
from mathutils.kdtree import KDTree

p = argparse.ArgumentParser()
p.add_argument('--checkpoint', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
args = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
if args.out.exists():
    raise ValueError('Preserve existing repair output')
with np.load(args.checkpoint, allow_pickle=False) as data:
    source = {k: data[k] for k in data.files}
vertices, faces = source['vertices'], source['faces']
bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = bpy.data.meshes.new('Native surface repair')
mesh.from_pydata(vertices.tolist(), [], faces.tolist())
mesh.update()
obj = bpy.data.objects.new('Native surface repair', mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
obj.data.remesh_voxel_size = .003
obj.data.use_remesh_preserve_volume = True
bpy.ops.object.voxel_remesh()
smooth = obj.modifiers.new('Bounded surface relaxation', 'SMOOTH')
smooth.factor = .25
smooth.iterations = 2
bpy.ops.object.modifier_apply(modifier=smooth.name)
obj.data.calc_loop_triangles()
triangles = len(obj.data.loop_triangles)
if triangles > 100000:
    decimate = obj.modifiers.new('Source budget', 'DECIMATE')
    decimate.ratio = 100000 / triangles
    bpy.ops.object.modifier_apply(modifier=decimate.name)
obj.data.calc_loop_triangles()
out_vertices = np.asarray([v.co[:] for v in obj.data.vertices], dtype=np.float32)
out_faces = np.asarray([t.vertices[:] for t in obj.data.loop_triangles], dtype=np.uint32)
def sample_distances(a, b):
    tree = KDTree(len(b))
    for i, value in enumerate(b):
        tree.insert(value, i)
    tree.balance()
    sample = a[::max(1, len(a)//20000)]
    distances = np.asarray([tree.find(v)[2] for v in sample])
    return {'samples': len(sample), 'p95': float(np.quantile(distances, .95)), 'max': float(distances.max())}
before_after = sample_distances(vertices, out_vertices)
after_before = sample_distances(out_vertices, vertices)
if max(before_after['p95'], after_before['p95']) > .015:
    raise ValueError('Surface drift exceeds source-scale review bound')
repair = {'sourceCheckpointSha256': hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
          'method': 'Blender voxel .003, volume preserved, smooth .25 x2, source target100K',
          'tool': bpy.app.version_string, 'trianglesBefore': len(faces), 'trianglesAfter': len(out_faces),
          'beforeToAfterSampledVertexDistance': before_after,
          'afterToBeforeSampledVertexDistance': after_before,
          'geometryChanged': True, 'runtimeAccepted': False, 'modelRequests': 0}
source.update(vertices=out_vertices, faces=out_faces, surface_repair=np.asarray(json.dumps(repair)))
args.out.parent.mkdir(parents=True, exist_ok=True)
np.savez(args.out, **source)
args.out.with_suffix('.json').write_text(json.dumps(repair, indent=2)+'\n')
print(json.dumps(repair))
