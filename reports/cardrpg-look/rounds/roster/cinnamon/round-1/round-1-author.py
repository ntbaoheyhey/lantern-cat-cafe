"""L5 roster sculpture fork. Preserves the accepted L1 author.py byte-for-byte.
Original procedural art; reusable anatomy/bake pipeline, distinct roster costumes.
Usage: Blender --background --threads 4 --python roster-author.py -- --cat panko --round 1 --output-root reports/cardrpg-look/rounds/roster/exports/round-1
The existing game's named transform rig is the sole source input; all mesh art is rebuilt.
"""
import bpy, math, json, struct, argparse, sys, hashlib, random
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix
SCRIPT_SOURCE=Path(__file__).read_text()
p=argparse.ArgumentParser(); p.add_argument('--cat',default='panko');p.add_argument('--round',type=int,default=1);p.add_argument('--bake',action='store_true');p.add_argument('--render',action='store_true');p.add_argument('--size',type=int,default=640);p.add_argument('--output-root',required=True)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/a.output_root;TMP=Path('/tmp/cardrpg-look-roster-author')/a.cat/f'round-{a.round}';OUT.mkdir(exist_ok=True,parents=True);TMP.mkdir(exist_ok=True,parents=True)
random.seed(20261107);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
# Coordinates below use the game's +Y-up/+Z-facing frame, converted at author time.
def v(q): return Vector((q[0],-q[2],q[1]))
def lin(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
def rgba(h):return tuple(lin(int(h[i:i+2],16)/255) for i in (1,3,5))+(1,)
sys.path.insert(0,str(Path(__file__).resolve().parent))
from roster_sculpt import PALETTES, dress

C=PALETTES[a.cat];role=C['role'];objects=[];materials={};rig={}
def material(name,color,rough=.86,metal=0,noise=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;links=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba(color);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if noise:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=105 if name=='cloth' else 45;tex.inputs['Detail'].default_value=2.3
  ramp=n.new('ShaderNodeValToRGB');base=rgba(color);ramp.color_ramp.elements[0].color=tuple(x*.83 for x in base[:3])+(1,);ramp.color_ramp.elements[1].color=base
  links.new(tex.outputs['Fac'],ramp.inputs[0]);links.new(ramp.outputs[0],bs.inputs['Base Color']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=noise;bump.inputs['Distance'].default_value=.006;links.new(tex.outputs['Fac'],bump.inputs['Height']);links.new(bump.outputs[0],bs.inputs['Normal'])
  if name=='cloth':
   wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='X';wave.inputs['Scale'].default_value=180;bump.inputs['Strength'].default_value=.14;links.new(wave.outputs[0],bump.inputs['Height'])
 materials[name]=m;return m
for name,color,rough,metal,noise in [('fur',C['fur'],.88,0,.17),('patch',C['patch'],.9,0,.13),('cloth',C['cloth'],.94,0,.24),('gold',C['accent'],.38,.5,.025),('inner',C['inner'],.92,0,.06),('cream','#FFF0D2',.5,0,0),('eye',C['eye'],.18,0,0),('ink','#26363A',.42,0,0),('glint','#FFF7E8',.12,0,0)]:material(name,color,rough,metal,noise)
material('ceramic',C['cloth'],.24,0,.035);material('ivory-glaze','#FFF0D2',.24,0,.025)
material('facefur','#767787' if a.cat=='inkcap' else C['fur'],.88,0,.17)
# Reproduce the exact authored pivot hierarchy, including gear sockets.
raw=(ROOT/f'assets/cardrpg2/models/{a.cat}.glb').read_bytes();length=struct.unpack_from('<I',raw,12)[0];gltf=json.loads(raw[20:20+length]);nodes=gltf['nodes']
for i,n in enumerate(nodes):
 if 'mesh' in n:continue
 o=bpy.data.objects.new(n['name'],None);bpy.context.collection.objects.link(o);o.location=v(n.get('translation',[0,0,0]));q=n.get('rotation',[0,0,0,1]);o.rotation_mode='QUATERNION';o.rotation_quaternion=Quaternion((q[3],q[0],-q[2],q[1]));sc=n.get('scale',[1,1,1]);o.scale=(sc[0],sc[2],sc[1]);rig[n['name']]=o
for n in nodes:
 if n.get('name') not in rig:continue
 for child in n.get('children',[]):
  if nodes[child].get('name') in rig:rig[nodes[child]['name']].parent=rig[n['name']]
root=rig[role];root['lookV2']=True;root['author']='Original Blender procedural sculpture';root['seed']=20261107;root['round']=a.round

def attach(o,name,part,mat,loc):
 o.name=name;o.parent=rig[role+'_'+part];o.location=v(loc);o.data.materials.append(materials[mat]);objects.append(o)
 for face in o.data.polygons:face.use_smooth=True
 return o

def ell(name,part,loc,scale,mat='fur',segments=20,rings=12):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1)
 o=bpy.context.object;o.scale=(scale[0],scale[2],scale[1]);return attach(o,name,part,mat,loc)

def path(name,part,points,radius,mat='fur',resolution=2,radii=None,tangents=None):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=6;c.bevel_depth=radius;c.bevel_resolution=resolution;s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for b,co in zip(s.bezier_points,points):b.co=v(co);b.handle_left_type=b.handle_right_type='AUTO'
 if radii:
  for b,r in zip(s.bezier_points,radii):b.radius=r
 if tangents:
  for index,direction in [(0,tangents[0]),(-1,tangents[1])]:
   if direction is None:continue
   b=s.bezier_points[index];b.handle_left_type=b.handle_right_type='FREE';d=v(direction)*.33
   b.handle_left=b.co-d;b.handle_right=b.co+d
 c.use_fill_caps=True
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o=bpy.context.object
 return attach(o,name,part,mat,(0,0,0))

def patch(name,part,rows,mat='cloth',thickness=.013,subdiv=1):
 # Quad patch with thickness and soft hems, no flat single-sided cloth.
 verts=[v(p) for row in rows for p in row];w=len(rows[0]);h=len(rows);faces=[(j*w+i,j*w+i+1,(j+1)*w+i+1,(j+1)*w+i) for j in range(h-1) for i in range(w-1)]
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);attach(o,name,part,mat,(0,0,0))
 if subdiv:
  sub=o.modifiers.new('Sculpted quad surface','SUBSURF');sub.levels=subdiv
 solid=o.modifiers.new('Fabric thickness','SOLIDIFY');solid.thickness=thickness
 bevel=o.modifiers.new('Soft edges','BEVEL');bevel.width=.007;bevel.segments=2;bevel.limit_method='ANGLE';bevel.angle_limit=.6
 return o

def ear(side):
 part='ear'+side;sign=-1 if side=='L' else 1
 verts=[];faces=[];steps=10
 for y,rx,rz,dx in [(-.07,.14,.07,0),(.025,.115,.072,0),(.13,.063,.044,sign*.022),(.205,.018,.017,sign*.04),(.222,.005,.005,sign*.043)]:
  for j in range(steps):t=j*math.tau/steps;verts.append(v((dx+rx*math.cos(t),y,rz*math.sin(t))))
 for ring in range(4):
  for j in range(steps):k=ring*steps+j;n=ring*steps+(j+1)%steps;faces.append((k,n,n+steps,k+steps))
 faces.append(tuple(range(40,50)))
 me=bpy.data.meshes.new('rounded-ear');me.from_pydata(verts,[],faces);o=bpy.data.objects.new('rounded-ear',me);bpy.context.collection.objects.link(o);attach(o,'rounded-ear-'+side,part,'fur',(0,0,0));sub=o.modifiers.new('Rounded ear volume','SUBSURF');sub.levels=1
 pad=ell('inner-velvet',part,(sign*.012,.047,.063),(.068,.107,.015),'inner',18,12);pad.rotation_euler[1]=sign*.16
 ell('ear-fluff',part,(sign*.105,-.05,.018),(.047,.052,.035),'fur',14,10)

# Main sculpture. Soft asymmetry and separate cheek tufts break the toy silhouette.
ell('pear-body','body',(0,.0,0),(.32,.43,.25),'fur',24,16)
ell('cheek-head','head',(0,0,0),(.43,.345,.315),'facefur',28,18)
for sign in [-1,1]:
 ell('cheek-mass','head',(sign*.29,-.10,.16),(.155,.145,.18),'facefur',18,12)
 for j in range(3):
  t=ell('cheek-tuft','head',(sign*(.362+.012*j),-.067-.034*j,.08),(.075-.012*j,.031,.052),'fur',12,8);t.rotation_euler[1]=sign*(-.25+j*.35)
 ell('muzzle','head',(sign*.079,-.137,.295),(.118,.076,.07),'cream',18,12)
 ell('blush','head',(sign*.28,-.112,.275),(.066,.032,.012),'inner',16,8)
 ear('L' if sign==-1 else 'R')
 # Fur orbital cushions seat the eyes and lids into the curved head from side views.
 ell('orbital-fur','head',(sign*.185,.042,.231),(.129,.167,.070),'facefur',20,14)
 # Iris rounded on porcelain sclera with separate glints; the whole eyes pivot blinks.
 x=sign*.185
 eye_start=len(objects)
 ell('porcelain-eye','eyes',(x,.018,-.035),(.100,.130,.024),'cream',20,14)
 ell('iris','eyes',(x,.013,-.013),(.078,.106,.019),'eye',20,14)
 ell('pupil','eyes',(x,.014,.004),(.044,.081,.011),'ink',18,12)
 ell('large-eye-glint','eyes',(x-.026,.063,.015),(.024,.032,.009),'glint',12,8)
 ell('small-eye-glint','eyes',(x+.028,-.032,.014),(.010,.014,.006),'glint',10,6)
 path('upper-lid','eyes',[(x-.095,.07,-.024),(x-.07,.13,-.025),(x+.055,.13,-.025),(x+.10,.07,-.028)],.009,'ink',1)
 # Conform the whole eye to the rounded face; outer lid recedes in side views.
 center=v((x,.018,-.035))
 eye_fit=Matrix.Translation(center) @ Matrix.Rotation(sign*.35,4,'Z') @ Matrix.Translation(-center)
 for eye_part in objects[eye_start:]:eye_part.matrix_basis=eye_fit @ eye_part.matrix_basis
 path('brow','brow'+('L' if sign==-1 else 'R'),[(-.065,0,-.075),(0,.025,-.075),(.065,.006,-.075)],.015,'patch',1)
 # Two fine whiskers; rounded tips, no thick black bars.
 for j in range(2):path('whisker','head',[(sign*.25,-.15+j*.043,.32),(sign*.37,-.15+j*.06,.345),(sign*(.49-j*.012),-.15+j*.088,.32)],.0043,'cream',1)
ell('nose','mouth',(0,.055,.005),(.041,.026,.022),'inner',16,10)
path('mouth-left','mouth',[(0,.037,.015),(-.024,.005,.02),(-.05,.021,.018)],.006,'ink',1)
path('mouth-right','mouth',[(0,.037,.015),(.024,.005,.02),(.05,.021,.018)],.006,'ink',1)
for side in ['L','R']:
 sign=-1 if side=='L' else 1
 ell('hind-paw','foot'+side,(0,0,.025),(.154,.13,.21),'fur',18,12)
 for x in [-.06,.02,.08]:path('toe-seam','foot'+side,[(x,.012,.206),(x,.05,.19)],.0035,'patch',1)
 ell('arm','arm'+side,(sign*.025,-.10,0),(.125,.225,.13),'fur',20,12)
 ell('soft-paw','arm'+side,(sign*.035,-.255,.024),(.137,.11,.145),'fur',18,12)
 ell('paw-pad','arm'+side,(sign*.035,-.265,.156),(.056,.046,.008),'inner',12,8)
# Curved tail portions follow the old articulated pivots.
path('tail-root','tail',[(0,0,0),(.16,.02,-.11),(.31,.21,-.25)],.084,'fur',2,[1,1,.071/.084],[None,(.15,.19,-.14)])
path('tail-mid','tailMid',[(0,0,0),(.06,.12,-.045),(-.10,.30,.02)],.071,'fur',2,[1,1,.057/.071],[(.15,.19,-.14),(-.16,.21,.065)])
path('tail-tip','tailTip',[(0,0,0),(-.09,.10,.04),(-.18,.10,.05),(-.22,.01,.045)],.057,'fur',2,[1,.9,.7,.08],[(-.16,.21,.065),None])
ell('tail-joint','tailMid',(0,0,0),(.067,.067,.067),'fur',12,8)
ell('tail-joint','tailTip',(0,0,0),(.053,.053,.053),'fur',12,8)
# Rounded cloth vest with actual curved hem and stitches.
for sign in [-1,1]:
 panel=patch('vest-panel','body',[[(sign*.02,.29,.205),(sign*.13,.28,.235),(sign*.25,.20,.19)],[(sign*.02,.02,.28),(sign*.17,.02,.26),(sign*.31,-.04,.10)],[(sign*.02,-.27,.26),(sign*.16,-.29,.23),(sign*.26,-.24,.13)]],'cloth',.018,2)
path('collar','body',[(-.27,.29,.1),(-.17,.30,.22),(0,.24,.29),(.17,.30,.22),(.27,.29,.1)],.025,'cloth',2)
if a.cat!='clover':
 for y in [.15,.03,-.09]:ell('brass-button','body',(0,y,.282),(.021,.021,.012),'gold',12,8)
# Sewing follows the actual visible hem rather than being a generic noise overlay.
for sign in [-1,1]:
 for i in range(5):
  x=sign*(.065+i*.032);path('hem-stitch','body',[(x,-.222,.273-abs(x)*.20),(x+sign*.01,-.233,.272-abs(x)*.20)],.0025,'cream',1)
dress(a.cat,role,C,rig,objects,ell,path,patch,attach,materials,v)
# Freeze modelling modifiers; UV-unwrapping includes all visible parts in one atlas.
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.select_set(True)
bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.005);bpy.ops.uv.pack_islands(rotate=True,margin=.008);bpy.ops.object.mode_set(mode='OBJECT')
triangles=sum(sum(len(poly.vertices)-2 for poly in o.data.polygons) for o in objects)
prebudget=triangles
# Preserve the shape-heavy face; reduce less visible cloth/limbs if over budget.
if triangles>11800:
 small=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects if len(o.data.polygons)<120)
 ratio=max(.12,(11800-small)/max(1,triangles-small))
 for o in objects:
  if len(o.data.polygons)<120:continue
  dec=o.modifiers.new('Game budget','DECIMATE');dec.ratio=ratio;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=dec.name)

def bake_atlas():
 # Unwrap ONE combined mesh. Multi-object Smart Project packs each source
 # independently, producing overlapping islands and cross-material stains.
 # Preserve deterministic corner ranges to transfer this atlas back to the rig.
 bpy.context.view_layer.update();verts=[];faces=[];slots=[];mats=[];ranges=[]
 for o in objects:
  offset=len(verts);verts.extend([o.matrix_world @ vert.co for vert in o.data.vertices])
  for poly in o.data.polygons:
   faces.append(tuple(offset+i for i in poly.vertices));mat=o.data.materials[poly.material_index]
   if mat not in mats:mats.append(mat)
   slots.append(mats.index(mat))
  ranges.append((o,len(o.data.loops)))
 mesh=bpy.data.meshes.new('single-atlas');mesh.from_pydata(verts,[],faces);mesh.update()
 low=bpy.data.objects.new('bake-low',mesh);bpy.context.collection.objects.link(low)
 for mat in mats:mesh.materials.append(mat)
 for poly,slot in zip(mesh.polygons,slots):poly.material_index=slot;poly.use_smooth=True
 bpy.ops.object.select_all(action='DESELECT');low.select_set(True);bpy.context.view_layer.objects.active=low
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.008);bpy.ops.object.mode_set(mode='OBJECT')
 offset=0
 for o,count in ranges:
  uv=o.data.uv_layers.active or o.data.uv_layers.new(name='UVMap')
  for i in range(count):uv.data[i].uv=mesh.uv_layers.active.data[offset+i].uv
  offset+=count
 for o in objects:o.hide_render=True
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=False;scene.render.bake.margin=8
 bake_nodes=[]
 for mat in low.data.materials:
  if not mat:continue
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');mat.node_tree.nodes.active=node;bake_nodes.append(node)
 images={}
 for kind,typ in [('color','DIFFUSE'),('roughness','ROUGHNESS'),('ao','AO')]:
  image=bpy.data.images.new(a.cat+'-'+kind,1024,1024,alpha=False);image.colorspace_settings.name='sRGB' if kind=='color' else 'Non-Color'
  for node in bake_nodes:node.image=image
  scene.render.bake.use_pass_direct=False;scene.render.bake.use_pass_indirect=False;scene.render.bake.use_pass_color=True
  bpy.ops.object.bake(type=typ,use_clear=True);image.filepath_raw=str(TMP/f'{a.cat}-{kind}.png');image.file_format='PNG';image.save();images[kind]=image
 # Scalar channels use an emission bake so metal/glaze remain distinct in one draw material.
 for kind in ['metallic','curvature']:
  image=bpy.data.images.new(a.cat+'-'+kind,1024,1024,alpha=False);image.colorspace_settings.name='Non-Color'
  for node in bake_nodes:node.image=image
  restore=[]
  for mat in low.data.materials:
   n=mat.node_tree.nodes;l=mat.node_tree.links;out=n.get('Material Output');old=out.inputs['Surface'].links[0].from_socket
   emission=n.new('ShaderNodeEmission');emission.inputs['Strength'].default_value=1
   if kind=='metallic':
    value=n.get('Principled BSDF').inputs['Metallic'].default_value;emission.inputs['Color'].default_value=(value,value,value,1)
   else:
    geo=n.new('ShaderNodeNewGeometry');l.new(geo.outputs['Pointiness'],emission.inputs['Color'])
   l.new(emission.outputs[0],out.inputs['Surface']);restore.append((mat,old,emission))
  bpy.ops.object.bake(type='EMIT',use_clear=True);image.filepath_raw=str(TMP/f'{a.cat}-{kind}.png');image.file_format='PNG';image.save();images[kind]=image
  for mat,old,emission in restore:mat.node_tree.links.new(old,mat.node_tree.nodes.get('Material Output').inputs['Surface']);mat.node_tree.nodes.remove(emission)
 # Selected-to-active tangent normals from a physically subdivided displaced high mesh.
 high=low.copy();high.data=low.data.copy();bpy.context.collection.objects.link(high);high.name='bake-high';mod=high.modifiers.new('High sculpture','SUBSURF');mod.levels=2
 texture=bpy.data.textures.new('Original sculpt grain',type='CLOUDS');texture.noise_scale=.038;displace=high.modifiers.new('Sculpt grain','DISPLACE');displace.texture=texture;displace.strength=.004;displace.mid_level=.5
 image=bpy.data.images.new(a.cat+'-normal',1024,1024,alpha=False);image.colorspace_settings.name='Non-Color'
 for node in bake_nodes:node.image=image
 bpy.ops.object.select_all(action='DESELECT');low.select_set(True);high.select_set(True);bpy.context.view_layer.objects.active=low;scene.render.bake.use_selected_to_active=True;scene.render.bake.cage_extrusion=.035;scene.render.bake.max_ray_distance=.08
 bpy.ops.object.bake(type='NORMAL',use_clear=True);image.filepath_raw=str(TMP/f'{a.cat}-normal.png');image.file_format='PNG';image.save();images['normal']=image
 scene.render.bake.use_selected_to_active=False;bpy.data.objects.remove(high,do_unlink=True);bpy.data.objects.remove(low,do_unlink=True)
 # Bake AO into color subtly; retain AO source and corner colors for provenance.
 import numpy as np
 c=np.array(images['color'].pixels[:]).reshape(-1,4);ao=np.array(images['ao'].pixels[:]).reshape(-1,4)[:,0];c[:,:3]*=(.78+.22*ao[:,None]);images['color'].pixels[:]=c.ravel();images['color'].save()
 atlas=bpy.data.materials.new('atelier-baked');atlas.use_nodes=True;n=atlas.node_tree.nodes;l=atlas.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=.85
 for name,target in [('color','Base Color'),('roughness','Roughness'),('metallic','Metallic'),('normal','Normal')]:
  tex=n.new('ShaderNodeTexImage');tex.image=images[name]
  if name=='normal':
   normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.16;l.new(tex.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs['Normal'],bs.inputs[target])
  else:l.new(tex.outputs['Color'],bs.inputs[target])
 for o in objects:
  o.hide_render=False;o.data.materials.clear();o.data.materials.append(atlas)
  for poly in o.data.polygons:poly.material_index=0
  attr=o.data.color_attributes.new(name='BakedAO',type='BYTE_COLOR',domain='CORNER');uv=o.data.uv_layers.active
  for i,loop in enumerate(o.data.loops):
   u,w=uv.data[i].uv;idx=min(1023,max(0,int(w*1024)))*1024+min(1023,max(0,int(u*1024)));x=float(ao[idx]);attr.data[i].color=(x,x,x,1)
 return images
images=bake_atlas() if a.bake else {}
# Merge by animated pivot and shared material, preserving every named socket.
for parent in list(rig.values()):
 group=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.parent==parent]
 if len(group)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:o.select_set(True)
 bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join()
objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
modeldir=OUT/'models';modeldir.mkdir(exist_ok=True);destination=modeldir/f'{a.cat}.glb'
bpy.ops.object.select_all(action='DESELECT')
for o in list(rig.values())+objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(destination),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False,export_all_vertex_colors=False,export_active_vertex_color_when_no_material=False)
receipt={'cat':a.cat,'round':a.round,'seed':20261107,'tool':bpy.app.version_string,'triangles':triangles,'prebudgetTriangles':prebudget,'drawMeshes':len(objects),'rig':[o.name for o in rig.values()],'baked':list(images),'highSubdivision':2,'highDisplacement':.004,'cageExtrusion':.035,'normalRay':.08,'atlas':1024,'samples':16,'glbBytes':destination.stat().st_size,'sha256':hashlib.sha256(destination.read_bytes()).hexdigest()}
receipt['authorScriptSha256']=hashlib.sha256(SCRIPT_SOURCE.encode()).hexdigest()
receipt['sculptScriptSha256']=hashlib.sha256(Path(__file__).with_name('roster_sculpt.py').read_bytes()).hexdigest()
receipt['rigSourceSha256']=hashlib.sha256(raw).hexdigest();receipt['spec']=C;receipt['lookProps']=True
receipt['status']='sculpture candidate; visual/rig/runtime checks required'
rounddir=ROOT/f'reports/cardrpg-look/rounds/roster/{a.cat}/round-{a.round}';rounddir.mkdir(parents=True,exist_ok=True)
(OUT/f'{a.cat}-author.json').write_text(json.dumps(receipt,indent=2)+'\n')
(rounddir/f'round-{a.round}-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
(rounddir/f'round-{a.round}-author.py').write_text(SCRIPT_SOURCE)
(rounddir/'roster_sculpt.py').write_bytes(Path(__file__).with_name('roster_sculpt.py').read_bytes())
if a.bake:
 import shutil
 maps=OUT/'source-maps'/a.cat;maps.mkdir(parents=True,exist_ok=True)
 for name in images:shutil.copyfile(TMP/f'{a.cat}-{name}.png',maps/f'{name}.png')
if a.render:
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True;scene.render.resolution_x=a.size;scene.render.resolution_y=int(a.size*1.25);scene.render.resolution_percentage=100;scene.render.film_transparent=True
 scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgba('#9AAEAE');scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22;scene.view_settings.view_transform='AgX';scene.render.image_settings.color_mode='RGBA'
 def area(name,position,color,power,size):
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=rgba(color)[:3];data.shape='DISK';data.size=size;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=v(position);o.rotation_euler=(v((0,1,0))-o.location).to_track_quat('-Z','Y').to_euler()
 area('warm-key',(-3.5,5,4),'#FFE2AE',650,3.2);area('cool-rim',(3,3.5,-3),'#9BCBDA',800,3);area('soft-fill',(3,2,4),'#BBCDD2',120,4)
 camera=bpy.data.objects.new('PortraitCamera',bpy.data.cameras.new('PortraitCamera'));bpy.context.collection.objects.link(camera);camera.location=v((2.4,2.0,5.6));target=v((0,1.02,0));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.22 if a.cat!='soot' else 2.75;scene.camera=camera
 dest=rounddir;dest.mkdir(parents=True,exist_ok=True);scene.render.filepath=str(dest/f'round-{a.round}-portrait.png');bpy.ops.render.render(write_still=True)
print('LOOK_RECEIPT '+json.dumps(receipt))
