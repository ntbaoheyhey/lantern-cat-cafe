"""Render actual game GLBs; keep inherited models labelled until L5 replaces them."""
import argparse
import hashlib
import json
import sys
from pathlib import Path

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--owners', required=True)
parser.add_argument('--round', type=int, default=1)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'reports/cardrpg-look/rounds/art/portraits' / f'round-{args.round}'
OUT.mkdir(parents=True, exist_ok=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def linear(hex_color):
    values = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values)


for owner in args.owners.split(','):
    authored = ROOT / f'assets/cardrpg-look/models/{owner}.glb'
    source = authored if authored.exists() else ROOT / f'assets/cardrpg2/models/{owner}.glb'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.seed = 20261107
    scene.cycles.use_denoising = True
    scene.render.resolution_x, scene.render.resolution_y = 1024, 1280
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.world = bpy.data.worlds.new('Original atelier studio')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (*linear('#9aaeae'), 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .26
    bpy.context.view_layer.update()
    meshes = [obj for obj in scene.objects if obj.type == 'MESH']
    corners = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    assert corners, owner
    low = Vector(tuple(min(v[axis] for v in corners) for axis in range(3)))
    high = Vector(tuple(max(v[axis] for v in corners) for axis in range(3)))
    target = (low + high) * .5
    # Common scale: bounds may only enlarge the field to avoid clipping a hat.
    camera = bpy.data.objects.new('Actual game portrait', bpy.data.cameras.new('Actual game portrait'))
    scene.collection.objects.link(camera)
    camera.location = target + Vector((1.25, -5.8, .65))
    camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = 1.85
    scene.camera = camera
    for _ in range(24):
        bpy.context.view_layer.update()
        projected = [world_to_camera_view(scene, camera, point) for point in corners]
        if all(.055 <= p.x <= .945 and .055 <= p.y <= .945 for p in projected):
            break
        camera.data.ortho_scale *= 1.04
    else:
        raise RuntimeError(f'Cannot safely frame {owner}')
    for name, position, color, energy, size in [
        ('honey key', (-4.5, -2.8, 5), '#ffe2ae', 620, 3.8),
        ('sky rim', (3, 3, 3.5), '#9bcbda', 800, 3),
        ('soft fill', (2, -4, 2), '#bbcdd2', 235, 4),
        ('warm table bounce', (-1, -3, -.5), '#ead8b9', 90, 3),
    ]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color, data.size, data.shape = energy, linear(color), size, 'DISK'
        light = bpy.data.objects.new(name, data)
        scene.collection.objects.link(light)
        light.location = position
        light.rotation_euler = (target - light.location).to_track_quat('-Z', 'Y').to_euler()
    path = OUT / f'{owner}.png'
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    receipt = {
        'owner': owner, 'original': True, 'round': args.round,
        'status': 'scratch render; visual review and packing required',
        'tier': 'look-slice-model' if source == authored else 'inherited-model-new-studio-portrait',
        'source': str(source.relative_to(ROOT)), 'sourceSha256': sha(source),
        'scriptSha256': sha(Path(__file__)), 'renderer': bpy.app.version_string,
        'seed': 20261107, 'samples': 64, 'renderSize': [1024, 1280],
        'displaySize': [256, 320], 'deliverySizes': [[256, 320], [512, 640]],
        'camera': {'orthoScale': camera.data.ortho_scale, 'target': list(target),
                   'position': list(camera.location), 'minimumBorder': .055},
        'colorManagement': {'transform': scene.view_settings.view_transform, 'look': scene.view_settings.look},
        'projectedBounds': [min(p.x for p in projected), min(p.y for p in projected),
                            max(p.x for p in projected), max(p.y for p in projected)],
        'modelBounds': [list(low), list(high)],
        'file': str(path.relative_to(ROOT)), 'sha256': sha(path),
    }
    (OUT / f'{owner}.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps({'portrait': owner, 'sourceTier': receipt['tier'], 'reviewRequired': True}))
