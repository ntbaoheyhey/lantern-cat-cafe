"""Matched, fixed-camera renders of actual exported GLBs. Original studio only."""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

p = argparse.ArgumentParser()
p.add_argument('--source', required=True)
p.add_argument('--out', required=True)
p.add_argument('--first', type=int, default=0)
p.add_argument('--count', type=int, default=3)
p.add_argument('--turntable', action='store_true')
p.add_argument('--boss', action='store_true')
a = p.parse_args(sys.argv[sys.argv.index('--')+1:])
ROOT = Path(__file__).resolve().parents[3]
source, out = ROOT/a.source, ROOT/a.out
assert 0 < a.count <= 6
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(source))
turn = bpy.data.objects.new('Original review turntable', None)
bpy.context.collection.objects.link(turn)
for obj in list(bpy.context.scene.objects):
    if obj is not turn and obj.parent is None:
        obj.parent = turn
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24 if a.turntable else 40
scene.cycles.use_denoising = True
scene.cycles.seed = 20261107
scene.render.resolution_x = 384 if a.turntable else 512
scene.render.resolution_y = 480 if a.turntable else 640
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'


def linear(h):
    values = [int(h[i:i+2], 16)/255 for i in (1, 3, 5)]
    return tuple(x/12.92 if x <= .04045 else ((x+.055)/1.055)**2.4 for x in values)


target = Vector((0, 0, 1.17 if a.boss else 1.09))
scene.world = bpy.data.worlds.new('Authored studio fill')
scene.world.use_nodes = True
background = scene.world.node_tree.nodes['Background']
background.inputs['Color'].default_value = (*linear('#9aaeae'), 1)
background.inputs['Strength'].default_value = .26
for name, position, color, power, size in [
    ('honey key', (-5,-1.4,5), '#ffe2ae',560,4.6),
    ('sky rim', (3,3,3.5), '#9bcbda',680,3),
    ('soft fill', (2,-4,2), '#bbcdd2',200,4),
    ('table bounce', (-1,-3,-.5), '#ead8b9',75,3),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color, data.size, data.shape = power, linear(color), size, 'DISK'
    light = bpy.data.objects.new(name, data)
    scene.collection.objects.link(light)
    light.location = position
    light.rotation_euler = (target-light.location).to_track_quat('-Z', 'Y').to_euler()
camera = bpy.data.objects.new('Fixed review camera', bpy.data.cameras.new('Fixed review camera'))
scene.collection.objects.link(camera)
camera.location = target + Vector((1.25,-5.8,.65))
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.4 if a.boss else 2.65
scene.camera = camera
rows = []
angles = [0, math.pi/2, math.pi] if not a.turntable else [math.tau*i/48 for i in range(48)]
assert a.first+a.count <= len(angles)
for index in range(a.first, a.first+a.count):
    turn.rotation_euler.z = angles[index]
    bpy.context.view_layer.update()
    corners = [obj.matrix_world @ Vector(corner) for obj in scene.objects if obj.type == 'MESH' for corner in obj.bound_box]
    projected = [world_to_camera_view(scene,camera,point) for point in corners]
    bounds = [min(v.x for v in projected),min(v.y for v in projected),max(v.x for v in projected),max(v.y for v in projected)]
    filename = f'{index:03}.png'
    scene.render.filepath = str(out/filename)
    bpy.ops.render.render(write_still=True)
    rows.append({'index':index,'yaw':angles[index],'file':filename,'projectedBounds':bounds,
                 'sha256':hashlib.sha256((out/filename).read_bytes()).hexdigest(),
                 'framingPass':all(.025 <= v <= .975 for v in bounds)})
receipt = {'source':a.source,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),
           'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'renderer':bpy.app.version_string,'seed':20261107,'samples':scene.cycles.samples,
           'size':[scene.render.resolution_x,scene.render.resolution_y],
           'camera':{'position':list(camera.location),'target':list(target),'orthoScale':camera.data.ortho_scale},
           'turntable':a.turntable,'rows':rows,'original':True,
           'method':'Fixed studio/camera/scale across before and after. Bounds are diagnostics, never used to reframe silently.'}
(out/f'capture-{a.first:03}.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('ROSTER_REVIEW '+json.dumps(receipt))
