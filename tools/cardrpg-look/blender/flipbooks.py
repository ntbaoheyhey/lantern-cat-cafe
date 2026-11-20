"""Original Blender volume/particle/cloth flipbooks.

One family/range per process permits <=six-frame lock windows. Outputs are real
Blender frames; motion is analytic and deterministic, never interpolated images.
Seed and exact source hashes are recorded for every six-frame render batch.
"""
import argparse
import hashlib
import json
import math
import os
import random
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--family', choices=['smoke', 'steam', 'flame', 'sparkle', 'yarn-dust', 'ribbon'], required=True)
parser.add_argument('--first', type=int, default=0)
parser.add_argument('--count', type=int, default=6)
parser.add_argument('--round', type=int, default=1)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
ROOT = Path(os.environ['LOOK_ROOT'])
OUT = Path(os.environ.get('LOOK_FLIPBOOK_OUT', str(ROOT / 'assets/cardrpg-look/flipbooks/source')))
out = OUT / args.family
out.mkdir(parents=True, exist_ok=True)
seed = 71107 + ['smoke', 'steam', 'flame', 'sparkle', 'yarn-dust', 'ribbon'].index(args.family) * 131
rng = random.Random(seed)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.cycles.seed = seed
scene.cycles.max_bounces = 4
scene.cycles.volume_bounces = 1
scene.render.resolution_x = scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.3, .36, .42, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .18


def link_object(name, data):
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return obj


camera = link_object('Original flipbook orthographic camera', bpy.data.cameras.new('Camera'))
camera.location = (0, -7, 1.4)
camera.rotation_euler = (Vector((0, 0, 1.4)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 3.4
scene.camera = camera
for name, pos, energy, color, size in [
    ('honey key', (-3, -3, 5), 50 if args.family == 'flame' else 300, (1, .85, .68), 3),
    ('cool rim', (2, 1, 3), 30 if args.family == 'flame' else 170, (.82, .9, 1), 3),
]:
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.color, data.size = energy, color, size
    obj = link_object(name, data)
    obj.location = pos
    obj.rotation_euler = (Vector((0, 0, 1)) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def surface(name, color, emission=0, roughness=.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get('Principled BSDF')
    node.inputs['Base Color'].default_value = (*color, 1)
    node.inputs['Roughness'].default_value = roughness
    node.inputs['Emission Color'].default_value = (*color, 1)
    node.inputs['Emission Strength'].default_value = emission
    return mat


def volume(name, density, emission):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    output = nodes.new('ShaderNodeOutputMaterial')
    node = nodes.new('ShaderNodeVolumePrincipled')
    node.inputs['Color'].default_value = (.95, .30, .045, 1) if args.family == 'flame' else (.74, .78, .82, 1)
    node.inputs['Anisotropy'].default_value = .15
    node.inputs['Emission Color'].default_value = (1, .045, .002, 1)
    coord = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.noise_dimensions = '4D'
    noise.inputs['Scale'].default_value = 4.5
    noise.inputs['Detail'].default_value = 3
    links.new(coord.outputs['Generated'], noise.inputs['Vector'])
    subtract = nodes.new('ShaderNodeVectorMath'); subtract.operation = 'SUBTRACT'
    subtract.inputs[1].default_value = (.5, .5, .5)
    links.new(coord.outputs['Generated'], subtract.inputs[0])
    length = nodes.new('ShaderNodeVectorMath'); length.operation = 'LENGTH'
    links.new(subtract.outputs[0], length.inputs[0])
    edge = nodes.new('ShaderNodeMapRange')
    edge.clamp = True
    edge.inputs['From Min'].default_value = .20
    edge.inputs['From Max'].default_value = .50
    edge.inputs['To Min'].default_value = 1
    edge.inputs['To Max'].default_value = 0
    links.new(length.outputs['Value'], edge.inputs['Value'])
    multiply = nodes.new('ShaderNodeMath'); multiply.operation = 'MULTIPLY'
    links.new(edge.outputs[0], multiply.inputs[0]); links.new(noise.outputs['Fac'], multiply.inputs[1])
    weight = nodes.new('ShaderNodeMath'); weight.operation = 'MULTIPLY'
    weight.inputs[1].default_value = density
    links.new(multiply.outputs[0], weight.inputs[0]); links.new(weight.outputs[0], node.inputs['Density'])
    glow = nodes.new('ShaderNodeMath'); glow.operation = 'MULTIPLY'
    glow.inputs[1].default_value = emission
    links.new(multiply.outputs[0], glow.inputs[0]); links.new(glow.outputs[0], node.inputs['Emission Strength'])
    links.new(node.outputs['Volume'], output.inputs['Volume'])
    return mat, noise, weight, glow


if args.family in ['smoke', 'steam', 'flame']:
    scene.use_nodes = True
    nodes = scene.node_tree.nodes
    nodes.clear()
    render = nodes.new('CompositorNodeRLayers')
    blur = nodes.new('CompositorNodeBlur')
    blur.filter_type = 'GAUSS'
    blur.size_x = blur.size_y = 2
    output = nodes.new('CompositorNodeComposite')
    scene.node_tree.links.new(render.outputs['Image'], blur.inputs['Image'])
    scene.node_tree.links.new(blur.outputs['Image'], output.inputs['Image'])

objects = []
volumes = []
if args.family in ['smoke', 'steam', 'flame']:
    for index in range(9 if args.family != 'steam' else 6):
        mat, noise, weight, glow = volume('soft original volume ' + str(index), 3.2, 2 if args.family == 'flame' else 0)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1)
        obj = bpy.context.object
        obj.name = args.family + ' density lobe ' + str(index)
        obj.data.materials.append(mat)
        volumes.append((obj, noise, weight, glow, rng.uniform(0, math.tau), rng.uniform(.8, 1.2)))
elif args.family in ['sparkle', 'yarn-dust']:
    mat = surface('glazed light' if args.family == 'sparkle' else 'woven warm fibre', (1, .72, .36) if args.family == 'sparkle' else (.72, .48, .22), .65 if args.family == 'sparkle' else .03)
    for index in range(22):
        if args.family == 'sparkle':
            # Bevelled four-point glints give a deliberate silhouette, not a dot cloud.
            verts = []
            for k in range(8):
                angle = k * math.pi / 4
                radius = .14 if k % 2 == 0 else .028
                verts.append((math.cos(angle) * radius, 0, math.sin(angle) * radius))
            mesh = bpy.data.meshes.new('four point light')
            mesh.from_pydata(verts, [], [tuple(range(8))]); mesh.update()
            obj = link_object('glint ' + str(index), mesh)
            bevel = obj.modifiers.new('round glint edges', 'BEVEL'); bevel.width = .009; bevel.segments = 2
            solid = obj.modifiers.new('glint thickness', 'SOLIDIFY'); solid.thickness = .012
        else:
            curve = bpy.data.curves.new('curled yarn filament', 'CURVE')
            curve.dimensions = '3D'; curve.bevel_depth = .010 + .008 * (index % 4) / 3; curve.bevel_resolution = 2
            spline = curve.splines.new('POLY'); spline.points.add(8)
            for k, point in enumerate(spline.points):
                t = k / 8
                point.co = (.12 * math.cos(t * 4.5), .025 * math.sin(t * 5), .2 * (t - .5), 1)
            obj = link_object('fibre ' + str(index), curve)
        obj.data.materials.append(mat)
        objects.append((obj, rng.uniform(0, math.tau), rng.uniform(.65, 1.2), rng.uniform(0, .18)))
else:
    ribbon_mat = surface('silken lantern ribbon', (.9, .62, .29), .08, .48)
    for strand in range(3):
        vertices, faces = [], []
        for index in range(49):
            vertices.extend([(0, 0, 0), (0, 0, 0)])
            if index < 48:
                i = index * 2; faces.append((i, i + 1, i + 3, i + 2))
        mesh = bpy.data.meshes.new('tapered ribbon strip')
        mesh.from_pydata(vertices, [], faces); mesh.update()
        obj = link_object('original silk strand ' + str(strand), mesh)
        obj.data.materials.append(ribbon_mat)
        solid = obj.modifiers.new('cloth thickness', 'SOLIDIFY'); solid.thickness = .006
        objects.append((obj, strand * math.tau / 3, 1, 0))

rows = []
for frame in range(args.first, min(36, args.first + args.count)):
    t = frame / 35
    envelope = math.sin(math.pi * t) ** .65
    for index, (obj, noise, weight, glow, angle, speed) in enumerate(volumes):
        phase = (t * .8 + index * .09) % 1
        if args.family == 'smoke':
            age = max(0, t - index * .035)
            radius = (.13 + math.sqrt(age) * .37) * speed
            obj.location = (math.cos(angle) * age * .85 + math.sin(t * 4 + index) * .10, math.sin(angle) * .24, .55 + age * 1.35 + index * .04)
            obj.scale = (radius, radius * .65, radius * (1 + .25 * math.sin(index)))
        elif args.family == 'steam':
            radius = .10 + phase * .23
            obj.location = (.3 * math.sin(phase * 7 + angle), math.cos(angle) * .16, .45 + phase * 2)
            obj.scale = (radius, radius * .6, radius * 1.2)
        else:
            phase = (t * 1.6 + index * .085) % 1
            radius = (.06 + (1 - phase) * .20) * speed
            obj.location = (.14 * math.sin(phase * 6 + angle) * (1 - phase), math.cos(angle) * .13, .48 + phase * 1.8)
            obj.scale = (radius, radius * .6, radius * 1.7)
        noise.inputs['W'].default_value = t * 1.5 + index * 2.17
        weight.inputs[1].default_value = envelope * (3.8 * (1 - phase) ** .65 if args.family == 'steam' else 4. if args.family == 'flame' else 2.3 * (1 - .65 * t))
        glow.inputs[1].default_value = envelope * 4.2 * (1 - phase) if args.family == 'flame' else 0
    for index, (obj, angle, speed, delay) in enumerate(objects):
        if args.family == 'ribbon':
            obj.hide_render = envelope < .001
            for vertex in obj.data.vertices:
                u = (vertex.index // 2) / 48
                sweep = u * math.tau * .8 + angle + t * 3.5
                width = .085 * math.sin(math.pi * u) ** .7 * envelope
                side = -1 if vertex.index % 2 == 0 else 1
                vertex.co = (math.cos(sweep) * (.68 + .08 * index) + side * width * math.cos(u * 5 + angle), math.sin(sweep) * .3 + side * width * math.sin(u * 5 + angle), .5 + u * 1.65 + .16 * math.sin(t * 6 + u * 8 + angle))
            obj.data.update()
        else:
            phase = max(0, (t - delay) / (1 - delay))
            radius = math.sqrt(phase) * 1.18 * speed * (.18 + .82 * ((index * 7) % 23) / 22)
            obj.location = (math.cos(angle) * radius, math.sin(angle) * .25, 1.4 + math.sin(angle) * radius - phase * phase * .1)
            obj.rotation_euler = (.12 * math.sin(angle), angle + phase * (2 if args.family == 'sparkle' else 5), .15 * math.sin(index * 1.7))
            size = math.sin(math.pi * phase) ** .6 if phase < 1 else 0
            size *= .65 + .55 * ((index * 11) % 23) / 22
            obj.scale = (size, size, size)
    file = out / f'{frame:03}.png'
    scene.render.filepath = str(file)
    bpy.ops.render.render(write_still=True)
    rows.append({'frame': frame, 'file': str(file), 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
receipt = {'family': args.family, 'round': args.round, 'seed': seed, 'renderer': bpy.app.version_string,
           'engine': scene.render.engine, 'samples': scene.cycles.samples, 'resolution': [256, 256],
           'frames': 36, 'grid': [6, 6], 'range': [args.first, args.first + len(rows)],
           'sourceSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'rows': rows,
           'alpha': 'Blender PNG straight alpha; packer will explicitly premultiply encoded RGB.',
           'original': True, 'method': 'Analytic volume/particle/cloth geometry rendered per frame; no image interpolation or generative models.'}
(out / f'receipt-{args.first:03}.json').write_text(json.dumps(receipt, indent=2) + '\n')
print('FLIPBOOK_RECEIPT ' + json.dumps(receipt))
