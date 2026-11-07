"""Unrendered L6 scratch: miniature objects with the original VFX vocabulary.

Real curved ceramic/metal bodies replace outline-only cup/teapot/lantern forms.
Other forms use exact authored game geometry, not an external glyph/font set.
Promote into tools only after L4 publication and an L6 ownership claim.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

parser = argparse.ArgumentParser()
parser.add_argument('--first', type=int, default=0)
parser.add_argument('--count', type=int, default=6)
parser.add_argument('--round', type=int, default=1)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
ROOT = Path(__file__).resolve().parents[4]
HERE = Path(__file__).resolve().parent
compositions = json.loads((HERE / 'icon-compositions.json').read_text())
forms = json.loads((HERE / 'icon-forms.json').read_text())
OUT = HERE / f'round-{args.round}'
OUT.mkdir(exist_ok=True)


def rgb(hex_color):
    def linear(value):
        return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4
    return tuple(linear(int(hex_color[i:i + 2], 16) / 255) for i in (1, 3, 5))


def material(name, color, metal=0, roughness=.35, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes['Principled BSDF']
    node.inputs['Base Color'].default_value = (*rgb(color), 1)
    node.inputs['Metallic'].default_value = metal
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Coat Weight'].default_value = .25 if not metal else .05
    node.inputs['Emission Color'].default_value = (*rgb(color), 1)
    node.inputs['Emission Strength'].default_value = emission
    # Subtle authored glaze grain; it must survive as shading, never random pixels.
    noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 55
    bump = mat.node_tree.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = .12
    bump.inputs['Distance'].default_value = .007
    mat.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
    mat.node_tree.links.new(bump.outputs['Normal'], node.inputs['Normal'])
    return mat


def mesh(name, vertices, faces, mat, parent):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    for face in data.polygons:
        face.use_smooth = True
    return obj


def lathe(name, profile, mat, parent):
    vertices = [(r * math.cos(i * math.tau / 64), r * math.sin(i * math.tau / 64), z)
                for r, z in profile for i in range(64)]
    faces = [(row * 64 + i, row * 64 + (i + 1) % 64,
              (row + 1) * 64 + (i + 1) % 64, (row + 1) * 64 + i)
             for row in range(len(profile) - 1) for i in range(64)]
    return mesh(name, vertices, faces, mat, parent)


def tube(name, points, radius, mat, parent):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'
    data.bevel_depth, data.bevel_resolution, data.resolution_u = radius, 3, 16
    spline = data.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for vertex, position in zip(spline.bezier_points, points):
        vertex.co = position
        vertex.handle_left_type = vertex.handle_right_type = 'AUTO'
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def form(kind, mat, accent, scale, position, tilt):
    root = bpy.data.objects.new('original icon ' + kind, None)
    bpy.context.collection.objects.link(root)
    if kind == 'cup':
        lathe('thick glazed cup', [(0, -.4), (.25, -.4), (.35, -.3), (.42, .28),
                                  (.41, .34), (.35, .34), (.31, -.25), (0, -.3)], mat, root)
        tube('cup handle', [(.36, 0, .21), (.65, 0, .17), (.65, 0, -.18), (.31, 0, -.24)], .075, accent, root)
        lathe('tea', [(0, .23), (.35, .23)], accent, root)
    elif kind == 'teapot':
        lathe('glazed pot', [(0, -.39), (.27, -.39), (.45, -.16), (.44, .12),
                            (.28, .31), (.25, .34), (0, .34)], mat, root)
        lathe('lid', [(0, .34), (.29, .34), (.25, .40), (.07, .44), (.07, .51), (0, .53)], accent, root)
        tube('handle', [(-.3, 0, .22), (-.66, 0, .28), (-.68, 0, -.18), (-.37, 0, -.22)], .065, accent, root)
        tube('spout', [(.33, 0, -.14), (.58, 0, .04), (.70, 0, .30)], .10, mat, root)
    elif kind == 'lantern':
        lathe('paper lantern body', [(0, -.4), (.2, -.4), (.32, -.2), (.32, .2), (.20, .4), (0, .4)], mat, root)
        for a in range(4):
            angle = math.tau * a / 4
            tube('bronze rib', [(r * math.cos(angle), r * math.sin(angle), z)
                               for r, z in [(.2, -.4), (.33, -.2), (.33, .2), (.2, .4)]], .035, accent, root)
        tube('lantern loop', [(-.1, 0, .4), (-.13, 0, .62), (.13, 0, .62), (.1, 0, .4)], .032, accent, root)
    else:
        data = forms['forms'][kind]
        points = data['positions']
        vertices = [(points[i], -points[i + 2], points[i + 1]) for i in range(0, len(points), 3)]
        obj = mesh(kind, vertices, [tuple(range(i, i + 3)) for i in range(0, len(vertices), 3)], mat, root)
        # Preserve panel edges; import the authored normals under Y-up→Z-up rotation.
        normals = data['normals']
        obj.data.normals_split_custom_set([(normals[i], -normals[i + 2], normals[i + 1]) for i in range(0, len(normals), 3)])
    root.scale = (scale,) * 3
    root.location = position
    root.rotation_euler.z = tilt
    return root


rows = []
for row in compositions['rows'][args.first:args.first + args.count]:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.cycles.seed = 71107 + compositions['rows'].index(row)
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 256
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'AgX'
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (*rgb('#90aeb8'), 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .22
    paper = row['main'] in {'apron', 'apron-cloth', 'blanket', 'veil', 'leaf', 'paper-cat', 'roof', 'bread'}
    metal = row['main'] in {'pan', 'tray', 'whisk', 'spoon', 'shears', 'night-bell', 'serving-bell'}
    main = material('cat keyed surface', row['color'], metal=.65 if metal else 0,
                    roughness=.78 if paper else .24 if metal else .32,
                    emission=.18 if row['main'] in {'lantern', 'ember', 'flame', 'star'} else 0)
    if paper:
        main.node_tree.nodes['Principled BSDF'].inputs['Coat Weight'].default_value = 0
    accent = material('honey metal accent', row['accent'], metal=.32, roughness=.25)
    form(row['main'], main, accent, 1.45, (-.16, 0, .07), -.10)
    form(row['secondary'], accent, main, .68, (.55, -.4, -.47), .24)
    for name, pos, color, power, size in [('warm key', (-3, -4, 5), '#ffe2ae', 420, 3),
                                        ('cool edge', (3, 1, 3), '#91c7d3', 520, 2),
                                        ('soft fill', (2, -4, 1), '#b4c9cd', 70, 4)]:
        data = bpy.data.lights.new(name, 'AREA')
        data.energy, data.color, data.size = power, rgb(color), size
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = pos
        obj.rotation_euler = (-obj.location).to_track_quat('-Z', 'Y').to_euler()
    camera = bpy.data.objects.new('icon camera', bpy.data.cameras.new('icon camera'))
    bpy.context.collection.objects.link(camera)
    camera.location = (1.15, -5, 2.1)
    camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
    camera.data.type, camera.data.ortho_scale = 'ORTHO', 2.7
    scene.camera = camera
    # Original primitives have different extents; protect real alpha borders
    # without rescaling one part relative to the rest of its composition.
    bpy.context.view_layer.update()
    corners = [obj.matrix_world @ Vector(corner)
               for obj in scene.objects if obj.type in {'MESH', 'CURVE'}
               for corner in obj.bound_box]
    for _ in range(20):
        bpy.context.view_layer.update()
        projected = [world_to_camera_view(scene, camera, point) for point in corners]
        if all(.06 <= point.x <= .94 and .06 <= point.y <= .94 for point in projected):
            break
        camera.data.ortho_scale *= 1.04
    else:
        raise RuntimeError(f'Cannot frame icon {row["id"]}')
    image = OUT / (row['id'] + '.png')
    scene.render.filepath = str(image)
    bpy.ops.render.render(write_still=True)
    rows.append({'id': row['id'], 'file': str(image.relative_to(ROOT)), 'sha256': hashlib.sha256(image.read_bytes()).hexdigest(),
                 'seed': scene.cycles.seed, 'cameraOrthoScale': camera.data.ortho_scale,
                 'projectedBounds': [min(v.x for v in projected), min(v.y for v in projected),
                                     max(v.x for v in projected), max(v.y for v in projected)],
                 'composition': row})
receipt = {'original': True, 'status': 'scratch render, review required', 'renderer': bpy.app.version_string,
           'samples': 64, 'renderSize': [256, 256], 'intendedDisplay': [64, 64],
           'scriptSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
           'formsSha256': hashlib.sha256((HERE / 'icon-forms.json').read_bytes()).hexdigest(), 'rows': rows}
(OUT / f'receipt-{args.first:02}.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'scratchIconsRendered': len(rows), 'reviewRequired': True}))
