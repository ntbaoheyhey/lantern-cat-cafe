"""Neutral 3D geometry/texture review of an external image-to-3D result.

No runtime acceptance claim: this shows actual front/side/back mesh geometry.
"""
import argparse
import json
import math
import sys
from pathlib import Path
import bpy
from mathutils import Vector

p = argparse.ArgumentParser()
p.add_argument('--model', required=True)
p.add_argument('--out', required=True)
p.add_argument('--yaw', type=float, default=0)
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=a.model)
scene = bpy.context.scene
meshes = [o for o in scene.objects if o.type == 'MESH']
points = [o.matrix_world @ Vector(p) for o in meshes for p in o.bound_box]
low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
group = bpy.data.objects.new('Original generated model', None)
scene.collection.objects.link(group)
for o in list(scene.objects):
    if o is not group and o.parent is None:
        o.parent = group
scale = 2 / (high.z - low.z)
group.scale = (scale,) * 3
group.location = (-(low.x + high.x) / 2 * scale,
                  -(low.y + high.y) / 2 * scale, -low.z * scale)
scene.render.engine = 'CYCLES'
scene.cycles.samples = 20
scene.cycles.use_denoising = True
scene.cycles.seed = 20261109
scene.render.resolution_x = scene.render.resolution_y = 640
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

def rgb(h):
    a = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in a)

scene.world = bpy.data.worlds.new('Neutral blue cafe ambient')
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes['Background']
bg.inputs[0].default_value = (*rgb('#BACDD0'), 1)
bg.inputs[1].default_value = .30
bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object
mat = bpy.data.materials.new('Neutral slate'); mat.diffuse_color = (*rgb('#485E62'), 1)
mat.use_nodes = True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = mat.diffuse_color
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 1
floor.data.materials.append(mat)
target = Vector((0, 0, 1.0))
for name, pos, color, power, size in [
    ('Warm key', (-3,-4,6), '#FFE1B5', 650, 4),
    ('Soft fill', (4,-2,3), '#BDD7DF', 180, 4),
    ('Cafe rim', (2,3,4), '#91C3CB', 600, 3)]:
    light = bpy.data.lights.new(name, 'AREA'); light.energy = power; light.size = size; light.color = rgb(color)
    obj = bpy.data.objects.new(name, light); scene.collection.objects.link(obj); obj.location = pos
    obj.rotation_euler = (target - obj.location).to_track_quat('-Z', 'Y').to_euler()
camera = bpy.data.objects.new('Review camera', bpy.data.cameras.new('Review'))
scene.collection.objects.link(camera); camera.data.type = 'ORTHO'; camera.data.ortho_scale = 2.7
scene.camera = camera
original = [[m for m in o.data.materials] for o in meshes]
clay = bpy.data.materials.new('Geometry inspection clay'); clay.use_nodes = True
clay.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.38,.42,.43,1)
clay.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .85
for label, angle, solid in [('front',0,False), ('three-quarter',35,False),
                           ('side',90,False), ('back',180,False),
                           ('other-side',270,False), ('geometry',35,True)]:
    theta = math.radians(angle + a.yaw)
    camera.location = (5 * math.sin(theta), -5 * math.cos(theta), 2.15)
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    if solid:
        for o in meshes:
            for i in range(len(o.data.materials)): o.data.materials[i] = clay
    scene.render.filepath = str(out / (label + '.png'))
    bpy.ops.render.render(write_still=True)
    if solid:
        for o, saved in zip(meshes, original):
            for i, m in enumerate(saved): o.data.materials[i] = m
(out / 'render.json').write_text(json.dumps(dict(source=a.model, renderer=bpy.app.version_string,
    samples=20, seed=20261109, size=640, sourceBounds=[list(low), list(high)],
    scale=scale, neutralLighting=True, runtimeAcceptance=False), indent=2) + '\n')
