"""R1 bounded 3D+ prototype. Original procedural volumes; named transform rig.
Voxel-fused cheeks, smooth topology, curved cloth, glossy irises, vertex-painted
three-value shading; no external art/models except our existing pivot schema.
"""
import bpy, math, json, struct, sys, argparse, hashlib
from pathlib import Path
from mathutils import Vector, Quaternion
p=argparse.ArgumentParser();p.add_argument('--id',required=True);a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/cardrpg-look/v3-sculpt';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
def v(q):return Vector((q[0],-q[2],q[1]))
def linear(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
def color(h):return tuple(linear(int(h[i:i+2],16)/255) for i in (1,3,5))+(1,)
materials={}
for name,h,rough,metal in [('fur','#F4DFB8' if a.id=='mochi' else '#404451',.91,0),('cream','#FFF0D2',.85,0),('cloth','#254D50' if a.id=='mochi' else '#542944',.94,0),('inner','#D88771',.8,0),('ink','#172D36',.7,0),('brass','#CF974B',.35,.7),('eye','#448D83' if a.id=='mochi' else '#F3BB61',.12,.1),('glint','#FFF0D2',.12,0),('wine','#782B46',.83,0),('leather','#60362B',.8,0),('wood','#805039',.82,0)]:
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=color(h);b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 if name in ['eye','glint'] and a.id not in ['mochi','soot']:b.inputs['Emission Color'].default_value=color('#FFB647');b.inputs['Emission Strength'].default_value=2
 materials[name]=m
raw=(ROOT/f'assets/cardrpg2/models/{a.id}.glb').read_bytes();g=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]]);nodes=g['nodes'];rig={}
for n in nodes:
 if 'mesh' in n:continue
 o=bpy.data.objects.new(n['name'],None);bpy.context.collection.objects.link(o);o.location=v(n.get('translation',[0,0,0]));q=n.get('rotation',[0,0,0,1]);o.rotation_mode='QUATERNION';o.rotation_quaternion=Quaternion((q[3],q[0],-q[2],q[1]));rig[n['name']]=o
for n in nodes:
 if n.get('name') not in rig:continue
 for child in n.get('children',[]):
  if nodes[child].get('name') in rig:rig[nodes[child]['name']].parent=rig[n['name']]
role={'mochi':'guardian','soot':'witch','button-guard':'guard','yarn-giant':'yarn'}[a.id];rig[role]['lookV2']=True;rig[role]['lookProps']=True
objects=[]
def attach(o,name,part,mat,loc):
 o.name=name;o.parent=rig[role+'_'+part];o.location=v(loc);o.data.materials.append(materials[mat]);objects.append(o)
 for face in o.data.polygons:face.use_smooth=True
 return o
def ell(name,part,loc,scale,mat,segments=24,rings=14):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings);o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);return attach(o,name,part,mat,loc)
def path(name,part,points,radius,mat):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=5;c.bevel_depth=radius;c.bevel_resolution=2;s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for b,co in zip(s.bezier_points,points):b.co=v(co);b.handle_left_type=b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');return attach(bpy.context.object,name,part,mat,(0,0,0))
def fuse(parts):
 bpy.ops.object.select_all(action='DESELECT')
 for o in parts:o.select_set(True)
 bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=parts[0];bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 m=o.modifiers.new('Fused soft cheek volume','REMESH');m.mode='VOXEL';m.voxel_size=.034; m.use_smooth_shade=True;bpy.ops.object.modifier_apply(modifier=m.name)
 m=o.modifiers.new('Smooth cheek transitions','SMOOTH');m.factor=1.2;m.iterations=5;bpy.ops.object.modifier_apply(modifier=m.name)
 m=o.modifiers.new('Budget','DECIMATE');m.ratio=.55;bpy.ops.object.modifier_apply(modifier=m.name)
 return o
if a.id in ['mochi','soot']:
 head=fuse([ell('soft-head','head',(0,.01,.02),(.47,.37,.32),'fur'),ell('cheekL','head',(-.30,-.12,.12),(.22,.18,.21),'fur'),ell('cheekR','head',(.30,-.12,.12),(.22,.18,.21),'fur')])
 # Four expression morphs retained in the source candidate, plus rig-based live eyelids.
 head.shape_key_add(name='Basis')
 for name,sy,sx in [('idle',1,1),('happy',.96,1.04),('hurt',.91,1.03),('determined',.98,1)]:
  k=head.shape_key_add(name=name)
  for point in k.data:point.co.x*=sx;point.co.z*=sy
 ell('pear-body','body',(0,-.04,0),(.29,.40,.23),'fur')
 ell('apron','body',(0,-.04,.14),(.30,.36,.17),'cloth')
 for sign,side in [(-1,'L'),(1,'R')]:
  # Soft triangular ear shell with rounded bevel.
  verts=[v((-.14,-.06,-.04)),v((.14,-.06,-.04)),v((sign*.055,.33,-.01)),v((-.12,-.06,.06)),v((.12,-.06,.06)),v((sign*.055,.31,.055))]
  me=bpy.data.meshes.new('ear');me.from_pydata(verts,[],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(2,5,3,0)]);o=bpy.data.objects.new('fur-ear',me);bpy.context.collection.objects.link(o);attach(o,'fur-ear'+side,'ear'+side,'fur',(0,0,0));b=o.modifiers.new('Soft ear edge','BEVEL');b.width=.04;b.segments=3
  ell('ear-inner','ear'+side,(sign*.02,.09,.067),(.07,.14,.018),'inner')
  ell('gloss-eye','eyes',(sign*.205,0,.015),(.15,.174,.07),'cream')
  ell('iris','eyes',(sign*.205,0,.078),(.112,.144,.03),'eye')
  ell('pupil','eyes',(sign*.198,.008,.102),(.060,.119,.016),'ink')
  ell('glint','eyes',(sign*.205-.032,.074,.116),(.038,.045,.012),'glint',16,10)
  ell('glint-small','eyes',(sign*.205+.033,-.057,.12),(.015,.018,.008),'glint',12,8)
  ell('muzzle','head',(sign*.075,-.145,.31),(.105,.07,.05),'cream')
  path('brow','brow'+side,[(-.095,0,.01),(0,.026,.03),(.095,0,.01)],.014,'fur')
  ell('paw','foot'+side,(0,0,.035),(.145,.13,.21),'fur')
  ell('soft-arm','arm'+side,(sign*.018,-.19,.035),(.13,.29,.14),'fur')
  for j in range(3):ell('tuft','head',(sign*(.43+j*.018),-.07-j*.045,.09),(.09-j*.016,.038,.065),'fur',12,8)
 path('smile','mouth',[(-.11,0,0),(-.06,-.035,.015),(0,0,.02),(.06,-.035,.015),(.11,0,0)],.007,'ink')
 ell('nose','head',(0,-.075,.372),(.036,.025,.022),'inner')
 path('curled-tail','tail',[(0,0,0),(.28,.11,-.1),(.36,.45,-.08),(.20,.56,.02)],.085,'fur')
 for j in range(5):path('cloth-fold','body',[(-.26+j*.13,-.35,.23),(-.23+j*.115,-.13,.30),(-.18+j*.09,.18,.23)],.013,'cloth')
 ell('brass-clasp','body',(0,.21,.27),(.065,.055,.026),'brass')
 if a.id=='mochi':
  ell('door-shield','armR',(.13,-.16,.20),(.27,.43,.075),'wood');path('brass-shield-rim','armR',[(-.08,-.47,.27),(-.10,.13,.25),(.13,.28,.25),(.36,.13,.25),(.34,-.47,.27),(-.08,-.47,.27)],.025,'brass')
 else:
  ell('hood','head',(0,.04,-.12),(.53,.39,.25),'cloth');path('brass-lantern-hook','armR',[(.05,-.12,.12),(.18,.22,.14),(.32,.26,.14),(.34,.12,.14)],.022,'brass')
  ell('lantern-brass','armR',(.35,-.15,.14),(.12,.19,.12),'brass');ell('lantern-core','armR',(.35,-.14,.23),(.09,.12,.035),'glint')
else:
 if a.id=='button-guard':
  ell('button-shell','body',(0,-.03,.07),(.43,.43,.18),'wine');ell('helm','head',(0,.04,.02),(.40,.22,.27),'wine')
  path('brass-helm','head',[(-.37,0,.19),(0,.04,.29),(.37,0,.19)],.025,'brass')
  for x,y in [(-.12,-.12),(.12,-.12),(-.12,.12),(.12,.12)]:ell('button-hole','body',(x,y,.246),(.073,.073,.025),'ink',16,10)
  for s in [-1,1]:path('brass-stitch','body',[(-.12,s*.12,.27),(0,0,.31),(.12,-s*.12,.27)],.027,'brass')
  for s,side in [(-1,'L'),(1,'R')]:ell('cloth-arm','arm'+side,(s*.025,-.15,0),(.13,.25,.13),'leather');ell('boot','foot'+side,(0,.04,.07),(.18,.19,.24),'leather')
  ell('button-buckler','armL',(-.12,-.24,.19),(.24,.27,.055),'wine');path('brass-needle','armR',[(.13,-.40,.10),(.13,.70,.10)],.018,'brass')
 else:
  ell('yarn-body','body',(0,-.12,0),(.70,.76,.52),'wine');ell('yarn-head','head',(0,0,-.08),(.43,.37,.28),'wine')
  for j in range(18):
   y=-.70+j*.078;r=math.sqrt(max(.05,1-(y/.85)**2));path('yarn-course','body',[(-.65*r,y,-.08),(-.42*r,y+.07,.38),(.13*r,y+.06,.53),(.64*r,y,.12)],.042,'wine')
  for s,side in [(-1,'L'),(1,'R')]:
   ell('yarn-arm','arm'+side,(s*.10,-.28,0),(.28,.43,.30),'wine');ell('yarn-fist','arm'+side,(s*.22,-.55,.10),(.34,.30,.32),'wine');ell('yarn-foot','foot'+side,(0,0,.11),(.27,.22,.34),'wine')
   for j in range(5):path('fist-wrap','arm'+side,[(s*.22-.29,-.38-j*.065,.13),(s*.22,-.35-j*.065,.42),(s*.22+.29,-.39-j*.065,.13)],.035,'wine')
  path('brass-crown','head',[(-.34,.22,-.06),(-.34,.56,-.06),(-.15,.34,-.06),(0,.65,-.06),(.16,.34,-.06),(.34,.54,-.06),(.34,.22,-.06),(-.34,.22,-.06)],.045,'brass')
 for sign in [-1,1]:
  ell('glowing-eye','eyes',(sign*.15,0,.02),(.106,.062,.025),'eye',20,12)
  path('hostile-brow','head',[(sign*.03,.085,.23),(sign*.27,.16,.21)],.045,'wine')
# Merge only identical pivot/material groups: retain semantic material names for runtime palette.
for parent in list(rig.values()):
 for mat in materials.values():
  group=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.parent==parent and o.data.materials and o.data.materials[0]==mat and not o.data.shape_keys]
  if len(group)<2:continue
  bpy.ops.object.select_all(action='DESELECT')
  for o in group:o.select_set(True)
  bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();group[0].name=mat.name+'_'+parent.name
out=OUT/f'{a.id}.glb';bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_yup=True,export_extras=True,export_animations=False)
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];receipt={'id':a.id,'tool':bpy.app.version_string,'seed':0,'meshes':len(meshes),'triangles':sum(sum(len(f.vertices)-2 for f in o.data.polygons) for o in meshes),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'method':'voxel-fused head, procedural smooth volumes and curved cloth; transform rig; unbaked bounded prototype'}
(OUT/f'{a.id}.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
