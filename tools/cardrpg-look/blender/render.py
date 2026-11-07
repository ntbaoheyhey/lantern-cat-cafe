"""Render the exported game GLB, not a separate high-poly beauty model.
Portrait: 256x320 display, render1024x1280(4x), deliver512x640(2x).
Turntable: 48 actual rendered frames at12fps; no frame synthesis.
"""
import bpy,sys,argparse,math,json,hashlib
from pathlib import Path
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--cat',required=True);p.add_argument('--turntable',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
ROOT=Path(__file__).resolve().parents[3];src=ROOT/f'assets/cardrpg-look/models/{a.cat}.glb'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False);bpy.ops.import_scene.gltf(filepath=str(src))
turn=bpy.data.objects.new('Turntable',None);bpy.context.collection.objects.link(turn)
for o in list(bpy.context.scene.objects):
 if o is not turn and o.parent is None:o.parent=turn
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16 if a.turntable else 64;scene.cycles.use_denoising=True
scene.render.resolution_x=384 if a.turntable else 1024;scene.render.resolution_y=480 if a.turntable else 1280;scene.render.resolution_percentage=100;scene.render.film_transparent=True;scene.view_settings.view_transform='AgX';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.file_format='PNG'
def color(h):
 def lin(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
 return tuple(lin(int(h[i:i+2],16)/255) for i in (1,3,5))
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=(*color('#9AAEAE'),1);scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
for name,pos,h,power,size in [('key',(-3.5,-4,5),'#FFE2AE',650,3.2),('rim',(3,3,3.5),'#9BCBDA',800,3),('fill',(3,-4,2),'#BBCDD2',120,4)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color(h);data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
camera=bpy.data.objects.new('GameModelCamera',bpy.data.cameras.new('GameModelCamera'));bpy.context.collection.objects.link(camera);camera.location=(2.4,-5.6,2.0);target=Vector((0,0,1.02 if a.cat!='soot' else 1.2));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.22 if a.cat!='soot' else 2.75;scene.camera=camera
out=ROOT/(f'reports/cardrpg-look/turntables/{a.cat}/frames' if a.turntable else 'assets/cardrpg-look/portraits/source');out.mkdir(parents=True,exist_ok=True)
count=48 if a.turntable else 1
for frame in range(count):
 turn.rotation_euler.z=math.tau*frame/count if a.turntable else 0
 scene.render.filepath=str(out/(f'{frame:03}.png' if a.turntable else f'{a.cat}.png'));bpy.ops.render.render(write_still=True)
receipt={'cat':a.cat,'source':str(src.relative_to(ROOT)),'sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'renderer':bpy.app.version_string,'samples':scene.cycles.samples,'frames':count,'resolution':[scene.render.resolution_x,scene.render.resolution_y],'display':[256,320],'delivered':[384,480] if a.turntable else [512,640],'supersampling':1.5 if a.turntable else 4,'fps':12 if a.turntable else None,'original':True}
(out.parent/f'{a.cat}-render.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('RENDER_RECEIPT '+json.dumps(receipt))
