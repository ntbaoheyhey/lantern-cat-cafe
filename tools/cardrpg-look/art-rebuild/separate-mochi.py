"""Separate the reviewed Mochi surface at existing rig regions in Blender.

One topology repair, not another blended-weight-mask experiment. The original
source, UVs and prior failed rigs remain immutable. Rigid pieces have no skin;
the body retains its head/feet/tail skin and painted-eye morph.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path
import bpy
import bmesh

p = argparse.ArgumentParser()
p.add_argument('--source', type=Path, required=True)
p.add_argument('--out', type=Path, required=True)
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
if a.out.exists():
    raise ValueError('Preserve previous topology attempts; use a new output')
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(a.source))
arm = bpy.data.objects['guardian']
source = bpy.data.objects['mochi_generated_surface']
# Blender's importer creates an unlinked custom bone-shape mesh. It is not art.
for obj in list(bpy.context.scene.objects):
    if obj.type == 'MESH' and obj is not source:
        bpy.data.objects.remove(obj, do_unlink=True)

labels = []
counts = {}
for face in source.data.polygons:
    sums = {}
    for vi in face.vertices:
        for membership in source.data.vertices[vi].groups:
            name = source.vertex_groups[membership.group].name.removeprefix('guardian_')
            sums[name] = sums.get(name, 0) + membership.weight / len(face.vertices)
    dominant = max(sums, key=sums.get)
    if dominant in ('shield', 'lantern'):
        label = 'shield'
    elif dominant in ('armL', 'armR'):
        label = dominant
    else:
        # Isolate the central front apron below its bib. The mask cannot pick
        # arms/props because their existing rig regions were classified first.
        x, depth, height = face.center
        label = ('apron' if dominant == 'body' and .24 < height < .76
                 and -.29 < x < .23 and depth < -.065 else 'body')
    labels.append(label)
    counts[label] = counts.get(label, 0) + 1

parts = []
for label in ('body', 'apron', 'armL', 'armR', 'shield'):
    if not counts.get(label):
        raise ValueError('Empty expected part: ' + label)
    obj = source.copy()
    obj.data = source.data.copy()
    obj.name = 'mochi_' + label + '_surface'
    bpy.context.collection.objects.link(obj)
    if label != 'body':
        obj.shape_key_clear()
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if labels[f.index] != label], context='FACES')
    # Weld geometry across UV seams (loop UVs remain separate). This exposes
    # actual cut borders instead of treating every texture seam as a hole.
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.000002)
    border = [e for e in bm.edges if e.is_boundary]
    caps = bmesh.ops.holes_fill(bm, edges=border, sides=0)['faces'] if border else []
    uv_layer = bm.loops.layers.uv.active
    for cap in caps:
        # Continue neighbouring source colors across hidden cut closures.
        if uv_layer:
            for loop in cap.loops:
                neighbour = next((other for other in loop.vert.link_loops
                                  if other.face not in caps), None)
                if neighbour:
                    loop[uv_layer].uv = neighbour[uv_layer].uv
        cap.smooth = True
    if caps:
        bmesh.ops.triangulate(bm, faces=list(caps))
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    boundary_after = sum(e.is_boundary for e in bm.edges)
    bm.to_mesh(obj.data)
    bm.free()
    if label == 'body':
        # No surviving torso vertex follows an arm across the disconnected seam.
        ids = [g.index for g in obj.vertex_groups if g.name in
               ('guardian_armL', 'guardian_armR', 'guardian_shield', 'guardian_lantern')]
        for vertex in obj.data.vertices:
            moved = sum(g.weight for g in vertex.groups if g.group in ids)
            if moved:
                current = next((g.weight for g in vertex.groups
                                if g.group == obj.vertex_groups['guardian_body'].index), 0)
                obj.vertex_groups['guardian_body'].add([vertex.index], current + moved, 'REPLACE')
                for index in ids:
                    obj.vertex_groups[index].remove([vertex.index])
    else:
        for modifier in list(obj.modifiers):
            if modifier.type == 'ARMATURE':
                obj.modifiers.remove(modifier)
        obj.vertex_groups.clear()
        world = obj.matrix_world.copy()
        obj.parent = arm
        obj.parent_type = 'BONE'
        obj.parent_bone = 'guardian_' + ('body' if label == 'apron' else label)
        bpy.context.view_layer.update()
        obj.matrix_world = world
    parts.append(dict(name=label, sourceFaces=counts[label], vertices=len(obj.data.vertices),
                      faces=len(obj.data.polygons), cutBorderEdges=len(border),
                      boundaryAfter=boundary_after, rigid=label != 'body'))
bpy.data.objects.remove(source, do_unlink=True)
arm['rigVersion'] = 'mochi-image3d-separated1'
arm['lookGenerated'] = True
arm['lookProps'] = True
arm['lookV2'] = True
bpy.context.view_layer.update()
a.out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(a.out.with_suffix('.blend')))
bpy.ops.export_scene.gltf(filepath=str(a.out), export_format='GLB', export_extras=True,
                         export_animations=False, export_yup=True,
                         export_image_format='AUTO', export_texcoords=True,
                         export_normals=True, export_skins=True, export_morph=True)
receipt = dict(method='Blender topology separation using existing rig regions; capped cuts; rigid bone parenting',
               source=str(a.source), sourceSha256=hashlib.sha256(a.source.read_bytes()).hexdigest(),
               output=str(a.out), sha256=hashlib.sha256(a.out.read_bytes()).hexdigest(),
               blender=bpy.app.version_string, parts=parts, acceptance='REVIEW_REQUIRED')
a.out.with_suffix('.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt))
