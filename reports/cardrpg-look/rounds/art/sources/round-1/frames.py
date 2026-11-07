"""Unrendered L6 scratch: original bevelled rarity lighting plates.

Transparent centre and border are retained. No imported artwork or glyphs.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--round', type=int, default=1)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
TOKENS = ROOT / 'apps/web/src/game/cardrpg/look-tokens.json'
rarities = json.loads(TOKENS.read_text())['rarities']
OUT = HERE / f'frames-round-{args.round}'
OUT.mkdir(exist_ok=True)


def rgb(color):
    values = [int(color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values)


def material(name, color, metal, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes['Principled BSDF']
    node.inputs['Base Color'].default_value = (*rgb(color), 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Coat Weight'].default_value = .25
    return mat


def perimeter(x, z, radius, depth):
    points = []
    for cx, cz, angle in [(x - radius, z - radius, 0),
                          (-x + radius, z - radius, 90),
                          (-x + radius, -z + radius, 180),
                          (x - radius, -z + radius, 270)]:
        for step in range(13):
            a = math.radians(angle + step * 90 / 12)
            points.append((cx + math.cos(a) * radius, depth, cz + math.sin(a) * radius))
    return points


def ring(name, outer, inner, mat):
    # Four loops make actual bevel faces, sidewalls and a clear central opening.
    rings = [perimeter(*outer, .015),
             perimeter(outer[0] - .009, outer[1] - .009, outer[2] - .009, -.025),
             perimeter(inner[0] + .009, inner[1] + .009, inner[2] + .009, -.025),
             perimeter(*inner, .015)]
    count = len(rings[0])
    vertices = [point for loop in rings for point in loop]
    faces = []
    for index in range(4):
        next_index = (index + 1) % 4
        for i in range(count):
            j = (i + 1) % count
            faces.append((index * count + i, index * count + j,
                          next_index * count + j, next_index * count + i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(mat)
    return obj


for index, (rarity, colors) in enumerate(rarities.items()):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples, scene.cycles.seed = 64, 711070 + index
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1024, 1280
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.world = bpy.data.worlds.new('Original atelier frame studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (*rgb('#9aaeae'), 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .24
    body = material('brushed rarity enamel', colors['body'], [.2, .4, .6, .75][index], .32)
    edge = material('warm glancing edge', colors['edge'], .55, .22)
    ring('enamel frame', (.92, 1.17, .105), (.835, 1.085, .065), body)
    ring('outer light rail', (.925, 1.175, .11), (.906, 1.156, .091), edge)
    ring('inner light rail', (.85, 1.10, .080), (.833, 1.083, .063), edge)
    for x in (-.884, .884):
        for z in (-1.131, 1.131):
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=.026,
                                                location=(x, -.035, z))
            obj = bpy.context.object
            obj.name = 'hand-set corner rivet'
            obj.scale.y = .40
            obj.data.materials.append(edge)
            for face in obj.data.polygons:
                face.use_smooth = True
    for name, position, color, power, size in [
        ('warm key', (-3, -4, 4), '#ffe2ae', 420, 3),
        ('cool glancing edge', (3, -1, 1), '#9bcbda', 360, 2),
        ('soft fill', (1, -4, -2), '#bbcdd2', 100, 4),
    ]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color, data.size = power, rgb(color), size
        light = bpy.data.objects.new(name, data)
        scene.collection.objects.link(light)
        light.location = position
        light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()
    camera = bpy.data.objects.new('frame camera', bpy.data.cameras.new('frame camera'))
    scene.collection.objects.link(camera)
    camera.location = (0, -6, 0)
    camera.rotation_euler = Vector((0, 1, 0)).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type, camera.data.ortho_scale = 'ORTHO', 2.5
    scene.camera = camera
    path = OUT / f'{rarity}.png'
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    receipt = {'rarity': rarity, 'round': args.round, 'original': True,
               'status': 'scratch render; alpha and visual inspection required',
               'renderer': bpy.app.version_string, 'samples': 64, 'seed': scene.cycles.seed,
               'renderSize': [1024, 1280], 'displaySize': [256, 320],
               'deliverySizes': [[256, 320], [512, 640]],
               'scriptSha256': sha(Path(__file__)), 'tokensSha256': sha(TOKENS),
               'colors': colors, 'cameraOrthoScale': camera.data.ortho_scale,
               'file': str(path.relative_to(ROOT)), 'sha256': sha(path)}
    (OUT / f'{rarity}.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'rarity': rarity, 'reviewRequired': True}))
