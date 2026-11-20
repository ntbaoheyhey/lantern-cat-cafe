"""One bounded local surface repair; preserve original decoded data and colours."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import bpy
import numpy as np
spec = importlib.util.spec_from_file_location('surface_distance', Path(__file__).with_name('surface-distance.py'))
surface_distance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(surface_distance)

p = argparse.ArgumentParser()
p.add_argument('--checkpoint', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
p.add_argument('--voxel', type=float, default=.003)
p.add_argument('--smooth', type=float, default=.25)
p.add_argument('--iterations', type=int, default=2)
args = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
if not .001 <= args.voxel <= .003 or not 0 <= args.smooth <= .25 or not 0 <= args.iterations <= 2:
    raise ValueError('Surface repair parameters exceed bounded local range')
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
obj.data.remesh_voxel_size = args.voxel
obj.data.use_remesh_preserve_volume = True
bpy.ops.object.voxel_remesh()
smooth = obj.modifiers.new('Bounded surface relaxation', 'SMOOTH')
smooth.factor = args.smooth
smooth.iterations = args.iterations
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
before_after = surface_distance.sample_surface_distances(vertices, out_vertices, out_faces)
after_before = surface_distance.sample_surface_distances(out_vertices, vertices, faces)
within_bound = max(before_after['p95'], after_before['p95']) <= .015
repair = {'sourceCheckpointSha256': hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
          'method': f'Blender voxel {args.voxel}, volume preserved, smooth {args.smooth} x{args.iterations}, source target100K',
          'tool': bpy.app.version_string, 'trianglesBefore': len(faces), 'trianglesAfter': len(out_faces),
          'beforeToAfterSampledSurfaceDistance': before_after,
          'afterToBeforeSampledSurfaceDistance': after_before,
          'geometryChanged': True, 'runtimeAccepted': False, 'modelRequests': 0,
          'surfaceDriftBound': .015, 'surfaceDriftPass': within_bound}
source.update(vertices=out_vertices, faces=out_faces, surface_repair=np.asarray(json.dumps(repair)))
args.out.parent.mkdir(parents=True, exist_ok=True)
np.savez(args.out, **source)
args.out.with_suffix('.json').write_text(json.dumps(repair, indent=2)+'\n')
print(json.dumps(repair))
if not within_bound:
    raise ValueError('Surface drift exceeds source-scale review bound; diagnostics preserved, source rejected')
