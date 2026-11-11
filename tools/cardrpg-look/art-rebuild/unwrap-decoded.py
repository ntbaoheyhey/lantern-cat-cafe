"""Blender UV recovery; retain positions/unique faces and remove exact duplicates."""
import argparse
import math
import sys
from pathlib import Path
import bpy
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('--checkpoint', required=True)
parser.add_argument('--out', required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(args.out)
if output.exists():
    raise ValueError('Preserve existing UV output')
with np.load(args.checkpoint, allow_pickle=False) as source:
    vertices, faces = source['vertices'], source['faces']
_, original_face = np.unique(np.sort(faces, axis=1), axis=0, return_index=True)
original_face.sort()
duplicate_faces = len(faces) - len(original_face)
faces = faces[original_face]
print(f'Remove {duplicate_faces} exact duplicate triangles; preserve unique surface', flush=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
mesh = bpy.data.meshes.new('Decoded surface')
mesh.from_pydata(vertices.tolist(), [], faces.tolist())
mesh.update()
obj = bpy.data.objects.new('Decoded surface', mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.0001, margin_method='FRACTION',
                         area_weight=.25, correct_aspect=True, scale_to_bounds=True)
bpy.ops.object.mode_set(mode='OBJECT')
mesh.calc_loop_triangles()
uv = mesh.uv_layers.active.data
loop_ids = np.asarray([t.loops[:] for t in mesh.loop_triangles], dtype=np.int64).reshape(-1)
mapping = np.asarray([mesh.loops[int(i)].vertex_index for i in loop_ids], dtype=np.int64)
uvs = np.asarray([uv[int(i)].uv[:] for i in loop_ids], dtype=np.float32)
if len(loop_ids) != faces.size or not np.isfinite(uvs).all():
    raise ValueError('UV recovery changed triangle count or produced invalid UVs')
triangle_uv = uvs.reshape(-1, 3, 2)
du, dv = triangle_uv[:, 1] - triangle_uv[:, 0], triangle_uv[:, 2] - triangle_uv[:, 0]
uv_area = float(np.abs(du[:, 0] * dv[:, 1] - du[:, 1] * dv[:, 0]).sum() * .5)
if not .15 <= uv_area <= 1.01:
    raise ValueError(f'Unusable UV coverage {uv_area:.5f}; preserve source, do not bake')
# Per-loop vertices preserve seams exactly. The normal source packer welds and
# simplifies only after review, never in this recovery stage.
np.savez(output, vertices=vertices[mapping], faces=np.arange(len(mapping), dtype=np.uint32).reshape(-1, 3),
         uvs=uvs, original_vertex=mapping, original_face=original_face, uv_area=np.asarray(uv_area))
print(f'UV recovery: {len(faces)} triangles; Blender {bpy.app.version_string}', flush=True)
