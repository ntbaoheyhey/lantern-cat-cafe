"""Blender budget and unchanged surface-distance guard for voxel-shell repair."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import bpy
import numpy as np

p = argparse.ArgumentParser()
p.add_argument('--checkpoint', type=Path, required=True)
p.add_argument('--shell', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
args = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
if args.out.exists():
    raise ValueError('Preserve prior repair')
sha = hashlib.sha256(args.checkpoint.read_bytes()).hexdigest()
with np.load(args.checkpoint, allow_pickle=False) as data:
    source = {k: data[k] for k in data.files}
with np.load(args.shell, allow_pickle=False) as data:
    vertices, faces = data['vertices'], data['faces']
    metrics = json.loads(data['metrics'].item())
if metrics['checkpointSha256'] != sha:
    raise ValueError('Shell belongs to a different original source')
bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = bpy.data.meshes.new('Native oriented voxel shell')
mesh.from_pydata(vertices.tolist(), [], faces.tolist())
mesh.update()
obj = bpy.data.objects.new(mesh.name, mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
if len(faces) > 100000:
    decimate = obj.modifiers.new('Source budget', 'DECIMATE')
    decimate.ratio = 100000 / len(faces)
    bpy.ops.object.modifier_apply(modifier=decimate.name)
obj.data.calc_loop_triangles()
vertices = np.asarray([v.co[:] for v in obj.data.vertices], dtype=np.float32)
faces = np.asarray([t.vertices[:] for t in obj.data.loop_triangles], dtype=np.uint32)
spec = importlib.util.spec_from_file_location('distance', Path(__file__).with_name('surface-distance.py'))
distance = importlib.util.module_from_spec(spec)
spec.loader.exec_module(distance)
before_after = distance.sample_surface_distances(source['vertices'], vertices, faces)
after_before = distance.sample_surface_distances(vertices, source['vertices'], source['faces'])
passed = max(before_after['p95'], after_before['p95']) <= .015
repair = dict(sourceCheckpointSha256=sha, method='native occupancy closing1/fill/sigma.65, marching cubes, Blender100K',
              tool=bpy.app.version_string, shell=metrics, trianglesBefore=len(source['faces']), trianglesAfter=len(faces),
              beforeToAfterSampledSurfaceDistance=before_after, afterToBeforeSampledSurfaceDistance=after_before,
              geometryChanged=True, runtimeAccepted=False, modelRequests=0,
              surfaceDriftBound=.015, surfaceDriftPass=passed)
source.update(vertices=vertices, faces=faces, surface_repair=np.asarray(json.dumps(repair)))
np.savez(args.out, **source)
args.out.with_suffix('.json').write_text(json.dumps(repair, indent=2) + '\n')
print(json.dumps(repair))
if not passed:
    raise ValueError('Shell repair fails original drift bound; preserve and reject')
