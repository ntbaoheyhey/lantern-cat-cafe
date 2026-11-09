"""Simplify a copy of the reviewed generated Mochi mesh, retaining its UVs.

The provider source is immutable. This is local geometry processing only.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import bpy
import bmesh

p = argparse.ArgumentParser()
p.add_argument('--source', required=True)
p.add_argument('--out', required=True)
p.add_argument('--triangles', type=int, default=16000)
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
source, out = Path(a.source), Path(a.out)
if out.exists():
    raise ValueError('Preserve prior output; use a new attempt path')
out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
if len(meshes) != 1:
    raise ValueError('This reviewed prototype expects one source mesh')
obj = meshes[0]
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
before = sum(len(f.vertices) - 2 for f in obj.data.polygons)
# UV loops remain attached to their faces when duplicate positions are welded.
bm = bmesh.new()
bm.from_mesh(obj.data)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(obj.data)
bm.free()
dec = obj.modifiers.new('Reviewed source simplification', 'DECIMATE')
dec.ratio = min(1.0, a.triangles / before)
dec.use_collapse_triangulate = True
bpy.ops.object.modifier_apply(modifier=dec.name)
for face in obj.data.polygons:
    face.use_smooth = True
obj.data.update()
after = sum(len(f.vertices) - 2 for f in obj.data.polygons)
bpy.ops.export_scene.gltf(filepath=str(out), export_format='GLB',
                          export_animations=False, export_extras=True,
                          export_image_format='AUTO')
receipt = dict(source=str(source), sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
               output=str(out), sha256=hashlib.sha256(out.read_bytes()).hexdigest(),
               beforeTriangles=before, afterTriangles=after, requested=a.triangles,
               blender=bpy.app.version_string, weldDistance=.00001,
               status='SIMPLIFIED_COPY_NOT_ACCEPTED')
out.with_suffix('.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
