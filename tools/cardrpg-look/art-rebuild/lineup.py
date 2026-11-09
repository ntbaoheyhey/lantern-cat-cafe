"""Equal-world-scale review of uncompressed source models used by the game packer; no beauty substitutes."""
import argparse, hashlib, json, math, sys
from pathlib import Path
import bpy
from mathutils import Vector

p = argparse.ArgumentParser()
p.add_argument('--kind', choices=['cats', 'opponents'], required=True)
p.add_argument('--models', default='assets/cardrpg-look/models')
p.add_argument('--out', required=True)
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
root = Path(__file__).resolve().parents[3]
out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
cats = ['mochi','soot','clover','panko','mallow','cinnamon','velvet','biscuit','brioche','marigold','sorrel','inkcap']
foes = ['button-guard','sock-skipper','teacup-healer','spool-ram','binding-thread','practice-cushion','pollen-scout','crumb-sentinel','needle-moth','rain-spool','yarn-giant','kettle-knight','pantry-crown']
ids = cats if a.kind == 'cats' else foes
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'; scene.cycles.samples = 24; scene.cycles.seed = 20261109
scene.cycles.use_denoising = True
scene.render.resolution_x = 1440; scene.render.resolution_y = 900; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
rows = []
columns = 6 if a.kind == 'cats' else 7
for i, name in enumerate(ids):
    source = root / a.models / (name + '.glb')
    before = set(scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    imported = set(scene.objects) - before
    group = bpy.data.objects.new(name + '-lineup', None); scene.collection.objects.link(group)
    for obj in imported:
        if obj.parent not in imported: obj.parent = group
    group.location = ((i % columns - (columns - 1)/2) * 2.65, (1 - i//columns) * 4.2, 0)
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(v) for obj in imported if obj.type == 'MESH' for v in obj.bound_box]
    rows.append({'id': name, 'position': list(group.location), 'worldScale': 1,
                 'source': str(source.relative_to(root)), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                 'height': max(v.z for v in points) - min(v.z for v in points)})

def rgb(h):
    values = [int(h[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in values)

bpy.ops.mesh.primitive_plane_add(size=200)
floor = bpy.context.object; floor.name = 'Neutral cafe floor'
mat = bpy.data.materials.new('Quiet warm floor'); mat.use_nodes = True
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*rgb('#546668'),1)
mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .94
floor.data.materials.append(mat)
scene.world = bpy.data.worlds.new('Original studio'); scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (*rgb('#BBCDD2'),1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .35
target = Vector((0,2.1,1.0))
for name, position, color, power, size in [
    ('Honey key',(-8,-5,12),'#FFE2AE',2400,10),
    ('Cool rim',(7,8,9),'#9BCBDA',2600,10),
    ('Soft fill',(7,-8,5),'#BBCDD2',1000,10)]:
    data = bpy.data.lights.new(name,'AREA'); data.energy = power; data.color = rgb(color); data.size = size
    obj = bpy.data.objects.new(name,data); scene.collection.objects.link(obj); obj.location = position
    obj.rotation_euler = (target-obj.location).to_track_quat('-Z','Y').to_euler()
camera = bpy.data.objects.new('Fixed equal-scale lineup',bpy.data.cameras.new('Lineup'))
scene.collection.objects.link(camera); camera.location = (0,-24,21)
camera.rotation_euler = (target-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'; camera.data.ortho_scale = 20.8; scene.camera = camera
scene.render.filepath = str(out/(a.kind+'-lineup.png')); bpy.ops.render.render(write_still=True)
receipt = {'kind':a.kind,'models':rows,'worldScale':1,'renderer':bpy.app.version_string,'samples':24,
           'seed':20261109,'camera':{'position':list(camera.location),'orthoScale':20.8},
           'method':'Uncompressed source GLBs, all at one world scale on neutral cafe floor; runtime material overrides and texture packing are not represented.'}
(out/(a.kind+'-lineup.json')).write_text(json.dumps(receipt,indent=2)+'\n')
