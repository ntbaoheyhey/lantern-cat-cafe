"""Original Lantern café diorama. Blender headless; no imported artwork.
The world uses game +Y up / +Z facing coordinates. Static forms are baked into
one atlas, while glass/emission remain separate for runtime light response.
"""
import bpy, math, random, json, hashlib, sys, argparse, os
from pathlib import Path
from mathutils import Vector
p=argparse.ArgumentParser();p.add_argument('--round',type=int,default=1);p.add_argument('--bake',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
ROOT=Path(os.environ.get('LOOK_ROOT','/Users/bao/taskbar-hero-cardrpg-look'));OUT=ROOT/'assets/cardrpg-look/stage';OUT.mkdir(exist_ok=True,parents=True)
random.seed(20261107);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def v(q):return Vector((q[0],-q[2],q[1]))
def rgba(h):
 def lin(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
 return tuple(lin(int(h[i:i+2],16)/255) for i in (1,3,5))+(1,)
M={};objects=[]
def material(name,color,rough=.8,metal=0,grain=None,emit=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=rgba(color);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 if emit:bs.inputs['Emission Color'].default_value=rgba(color);bs.inputs['Emission Strength'].default_value=emit
 if grain:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=4 if grain=='wood' else 110;tex.inputs['Detail'].default_value=2.5
  coord=n.new('ShaderNodeTexCoord');mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(6,.25,2) if grain=='wood' else (1,1,1);l.new(coord.outputs['Object'],mapping.inputs[0]);l.new(mapping.outputs[0],tex.inputs[0]);ramp=n.new('ShaderNodeValToRGB');c=rgba(color);ramp.color_ramp.elements[0].color=tuple(x*.80 for x in c[:3])+(1,);ramp.color_ramp.elements[1].color=c;l.new(tex.outputs['Fac'],ramp.inputs[0]);l.new(ramp.outputs[0],bs.inputs['Base Color']);bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.12;bump.inputs['Distance'].default_value=.012 if grain=='wood' else .009;l.new(tex.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs[0],bs.inputs['Normal'])
 if grain=='cloth':
  a=n.new('ShaderNodeTexWave');a.wave_type='BANDS';a.bands_direction='X';a.inputs['Scale'].default_value=145
  b=n.new('ShaderNodeTexWave');b.wave_type='BANDS';b.bands_direction='Y';b.inputs['Scale'].default_value=145
  l.new(coord.outputs['Object'],a.inputs['Vector']);l.new(coord.outputs['Object'],b.inputs['Vector']);multiply=n.new('ShaderNodeMath');multiply.operation='MULTIPLY';l.new(a.outputs['Fac'],multiply.inputs[0]);l.new(b.outputs['Fac'],multiply.inputs[1]);l.new(multiply.outputs[0],bump.inputs['Height'])
 M[name]=m;return m
for args in [('wall','#28454C',.92,0,None),('panel','#354F51',.85,0,None),('trim','#53645C',.72,0,None),('wood','#865F49',.62,0,'wood'),('woodLight','#AA8161',.66,0,'wood'),('woodDark','#5A4238',.68,0,'wood'),('mint','#7CA48D',.91,0,'cloth'),('inkCloth','#315F63',.95,0,'cloth'),('coral','#A96F62',.95,0,'cloth'),('ivory','#EEDDC0',.26,0,None),('clay','#BA806B',.42,0,None),('glaze','#678D86',.22,0,None),('gold','#B99A62',.35,.6,None),('leaf','#5E8B77',.91,0,None),('leafLight','#8AAC87',.9,0,None),('paper','#DBCEA9',.94,0,None),('tea','#80513B',.16,0,None),('glass','#163E53',.16,.25,None)]:material(*args)
material('light','#FFD3A0',.5,0,None,3);material('skyglow','#78A5BA',.6,0,None,.3)
material('lampPaper','#FFD7A1',.8,0,'cloth',.6)
def add(o,name,mat,loc=(0,0,0)):
 o.name=name;o.location=v(loc);o.data.materials.append(M[mat]);objects.append(o)
 for poly in o.data.polygons:poly.use_smooth=True
 return o
def box(name,loc,dim,mat,bevel=.025):
 bpy.ops.mesh.primitive_cube_add();o=bpy.context.object;o.scale=(dim[0]/2,dim[2]/2,dim[1]/2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('Soft crafted edges','BEVEL');m.width=bevel;m.segments=2;m2=o.modifiers.new('Weighted corners','WEIGHTED_NORMAL');m2.keep_sharp=True
 return add(o,name,mat,loc)
def ell(name,loc,dim,mat,seg=12,rings=8):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,radius=1);o=bpy.context.object;o.scale=(dim[0],dim[2],dim[1]);return add(o,name,mat,loc)
def cyl(name,loc,radius,depth,mat,vertices=20,r2=None):
 bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius if r2 is None else r2,radius2=radius,depth=depth);return add(bpy.context.object,name,mat,loc)
def curve(name,pts,rad,mat,res=1):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=5;c.bevel_depth=rad;c.bevel_resolution=res;c.use_fill_caps=True;s=c.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for b,q in zip(s.bezier_points,pts):b.co=v(q);b.handle_left_type=b.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return add(bpy.context.object,name,mat)
def torus(name,loc,r,thick,mat):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=thick,major_segments=28,minor_segments=6);return add(bpy.context.object,name,mat,loc)
def lathe(name,loc,profile,mat,segments=24):
 verts=[];faces=[]
 for y,r in profile:
  for j in range(segments):t=j*math.tau/segments;verts.append(v((r*math.cos(t),y,r*math.sin(t))))
 for i in range(len(profile)-1):
  for j in range(segments):k=i*segments+j;n=i*segments+(j+1)%segments;faces.append((k,n,n+segments,k+segments))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return add(o,name,mat,loc)
def leaf(name,start,end,width,mat):
 direction=v(end)-v(start);side=direction.cross(Vector((0,0,1))).normalized()*width;verts=[]
 for t,w in [(0,0),(.25,.8),(.55,1),(.82,.6),(1,0)]:
  middle=v(start)+direction*t+Vector((0,0,math.sin(t*math.pi)*.10));verts.extend([middle-side*w,middle+Vector((0,0,.025*math.sin(t*math.pi))),middle+side*w])
 faces=[]
 for i in range(4):
  for j in range(2):k=i*3+j;faces.append((k,k+1,k+4,k+3))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);add(o,name,mat);s=o.modifiers.new('Leaf shell','SOLIDIFY');s.thickness=.009;sub=o.modifiers.new('Curved leaf','SUBSURF');sub.levels=1
 return o
# Real diorama slab, quieter narrow boards, inset play mats instead of one giant oval.
box('diorama-plinth',(0,-.30,0),(13.6,.5,9.0),'woodDark',.12)
for i in range(16):
 x=-6.35+i*.845;box('individual-oiled-board',(x,-.045,0),(.827,.13,8.8),'wood',.018)
for x,mat in [(-2.85,'inkCloth'),(2.85,'coral')]:
 o=box('woven-service-mat',(x,.028,-.05),(3.8,.035,4.5),mat,.12)
 for z in [-2.19,2.09]:
  for i in range(18):curve('stitched-mat-fringe',[(x-1.75+i*.20,.055,z),(x-1.74+i*.20,.055,z+(.14 if z>0 else -.14))],.007,'paper',0)
 for side in [-1,1]:
  curve('mat-stitched-border',[(x+side*1.78,.052,-2.1),(x+side*1.82,.052,-1.95),(x+side*1.82,.052,1.94),(x+side*1.65,.052,2.02)],.009,'paper',0)
 for z in [-2.1,2.0]:curve('mat-short-stitched-border',[(x-1.65,.053,z),(x,.053,z),(x+1.65,.053,z)],.009,'paper',0)
# Paneled room, broad single arched window, windowsill and crown molding.
box('cafe-back-wall',(0,2.2,-4.82),(14,4.9,.22),'wall',.10)
box('wainscot',(0,.64,-4.64),(13.7,1.3,.16),'panel',.025)
for x in [-6.5,-5.2,-3.9,-2.6,-1.3,0,1.3,2.6,3.9,5.2,6.5]:box('wainscot-bead',(x,.65,-4.53),(.034,1.1,.035),'trim',.01)
box('chair-rail',(0,1.31,-4.48),(13.6,.065,.22),'woodLight',.02)
box('crown-molding',(0,4.28,-4.58),(13.9,.13,.32),'woodDark',.035)
# Arched window shape contains its own visible depth and softly colored sky.
def arch(name,x,y,z,w,h,mat):
 verts=[v((x-w/2,y,z)),v((x+w/2,y,z)),v((x+w/2,y+h-w/2,z))]
 for i in range(17):t=i*math.pi/16;verts.append(v((x+math.cos(t)*w/2,y+h-w/2+math.sin(t)*w/2,z)))
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],[tuple(range(len(verts)))]);o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);return add(o,name,mat)
arch('window-recess',0,1.15,-4.38,4.4,3.0,'woodDark');arch('night-glass',0,1.25,-4.32,4.15,2.78,'glass')
curve('arched-window-frame',[(-2.18,1.18,-4.25),(-2.18,2.1,-4.25),(-1.9,3.15,-4.25),(0,4.08,-4.25),(1.9,3.15,-4.25),(2.18,2.1,-4.25),(2.18,1.18,-4.25)],.045,'woodLight',1)
for x in [-.72,.72]:box('window-mullion',(x,2.48,-4.18),(.045,2.45,.07),'woodDark',.012)
box('window-horizontal',(0,2.25,-4.17),(4.2,.045,.07),'woodDark',.012);box('windowsill',(0,1.17,-4.12),(4.65,.12,.68),'woodLight',.035)
for i in range(0):
 x=random.uniform(-1.9,1.9);y=random.uniform(1.45,3.45)
 if abs(x)>1.5 and y>3.2:continue
 ell('distant-town-bokeh',(x,y,-4.27),(.025+random.random()*.025,.025+random.random()*.025,.01),'light' if i%3 else 'skyglow',8,5)
# Pleated curtains leave the center clear; woven fabric is physically thick.
for side in [-1,1]:
 verts=[];faces=[]
 for j in range(9):
  y=1.18+j*.36
  for i in range(11):
   x=side*(2.08+i*.092+.22*math.sin(j/8*math.pi));z=-4.03+.06*math.cos(i*math.pi);verts.append(v((x,y,z)))
 for j in range(8):
  for i in range(10):k=j*11+i;faces.append((k,k+1,k+12,k+11))
 me=bpy.data.meshes.new('curtain');me.from_pydata(verts,[],faces);o=bpy.data.objects.new('curtain',me);bpy.context.collection.objects.link(o);add(o,'linen-curtain','mint');sub=o.modifiers.new('Soft fabric folds','SUBSURF');sub.levels=1;solid=o.modifiers.new('Woven thickness','SOLIDIFY');solid.thickness=.015
 curve('curtain-tie',[(side*2.18,2.03,-3.9),(side*2.66,1.97,-3.87),(side*3.02,2.05,-3.95)],.025,'gold',1)
# Left shelves full of small ceramics and books. Right window seat and cat tree.
for x in [-4.65,4.65]:
 for y in [1.55,2.70]:
  box('floating-shelf',(x,y,-4.10),(2.85,.12,.75),'woodLight',.025)
  for i in range(5):
   px=x-.95+i*.43
   if y<2:
    lathe('tea-tin',(px,y+.07,-4.06),[(0,.16),(.02,.18),(.29+(i%3)*.04,.17),(.32+(i%3)*.04,.14)],['glaze','clay','ivory'][i%3],16);cyl('tin-lid',(px,y+.41+(i%3)*.04,-4.06),.18,.06,'gold',16)
   else:
    o=box('book-cover',(px,y+.28+(i%3)*.035,-4.06),(.20+(i%3)*.025,.45+(i%3)*.07,.39),['coral','inkCloth','mint'][i%3],.02);o.rotation_euler.y=(i-2)*.045;box('book-pages',(px+.022,y+.28+(i%3)*.035,-3.85),(.14+(i%3)*.025,.39+(i%3)*.07,.015),'paper',.008)
def cup(x,y,z,mat='ivory',scale=1):
 lathe('glazed-teacup',(x,y,z),[(0,.16*scale),(.035*scale,.20*scale),(.36*scale,.24*scale),(.38*scale,.235*scale),(.36*scale,.205*scale),(.04*scale,.17*scale)],mat,24)
 cyl('tea-surface',(x,y+.33*scale,z),.202*scale,.012,'tea',24)
 curve('cup-handle',[(x+.22*scale,y+.30*scale,z),(x+.39*scale,y+.29*scale,z),(x+.39*scale,y+.13*scale,z),(x+.21*scale,y+.10*scale,z)],.04*scale,mat,1)
 lathe('saucer',(x,y+.015,z),[(0,.0),(0,.31*scale),(.03,.35*scale),(.06,.33*scale)],mat,24)
# A quiet asymmetric stack of glazed plates breaks the shelf repetition.
for j in range(3):lathe('stacked-ceramic-plate',(-3.6,2.79+j*.045,-4.03),[(0,.05),(0,.23),(.025,.28),(.045,.27)],'ivory',24)
# Tea and ceramic vignette away from formation slots.
for side in [-1,1]:
 x=side*5.1;z=2.5 if side>0 else -2.9
 cyl('serving-tray',(x,.07,z),.77,.10,'woodLight',36)
 cup(x-.25,.13,z+.08,'ivory',.85);cup(x+.35,.13,z-.13,'glaze',.7)
 lathe('little-teapot',(x+.08,.14,z-.37),[(0,.10),(.1,.19),(.30,.22),(.40,.15),(.42,.10)],'clay',20);cyl('teapot-lid',(x+.08,.58,z-.37),.13,.035,'gold',16);ell('lid-knob',(x+.08,.63,z-.37),(.04,.04,.04),'gold',10,6)
 curve('tea-spout',[(x+.25,.34,z-.37),(x+.37,.40,z-.37),(x+.45,.48,z-.37)],.043,'clay',1)
# Low upholstered bench at right, small cat tree at left.
box('window-bench',(4.3,.25,-3.52),(2.8,.5,.85),'woodDark',.06);box('bench-cushion',(4.3,.55,-3.48),(2.65,.22,.78),'coral',.12)
for x in [3.55,4.95]:
 o=box('linen-pillow',(x,.87,-3.65),(.68,.62,.22),'mint',.14);o.rotation_euler.y=(x-4.3)*.1
for y,x,z,r in [(.48,-5.5,-2.55,.66),(1.45,-5.55,-3.05,.59),(2.1,-5.65,-3.6,.48)]:
 cyl('rope-post',(x,y/2,z),.12,y,'paper',16);cyl('cat-tree-shelf',(x,y,z),r,.12,'woodLight',28);cyl('soft-tree-pad',(x,y+.08,z),r*.9,.10,'inkCloth',28)
 for j in range(int(y/.09)):torus('wound-yarn',(x,.08+j*.09,z),.12,.013,'paper')
# Perimeter greenery; curved leaf shells rather than low-poly spheres.
for x,z,scale in [(-5.95,2.85,1.1),(5.95,-2.6,1),(-3.0,-4.05,.55),(3.1,-4.05,.5)]:
 lathe('plant-pot',(x,0 if abs(z)<4 else 1.38,z),[(0,.22*scale),(.5*scale,.34*scale),(.55*scale,.35*scale),(.56*scale,.30*scale)],'clay',20)
 base=.5*scale+(0 if abs(z)<4 else 1.38)
 for i in range(9):
  angle=i*2.399;end=(x+math.cos(angle)*(.35+i%3*.08)*scale,base+(.4+i%3*.21)*scale,z+math.sin(angle)*(.35+i%3*.08)*scale)
  start=(x,base-.06,z);curve('plant-stem',[start,((x+end[0])/2,base+.25*scale,(z+end[2])/2),end],.008*scale,'leaf',0);leaf('broad-leaf',((x+end[0])/2,base+.20*scale,(z+end[2])/2),end,.15*scale,'leafLight' if i%3 else 'leaf')
# Pendant lamps: ceramic caps, folded paper shades, internal emissive bulbs.
for x in [-3.7,3.7]:
 curve('pendant-cord',[(x,4.3,-2.9),(x,3.4,-2.9)],.018,'gold',1)
 lathe('pendant-shade',(x,2.84,-2.9),[(0,.45),(.10,.55),(.35,.44),(.51,.21),(.55,.13)],'lampPaper',32)
 lathe('ceramic-lamp-crown',(x,3.35,-2.9),[(0,.2),(.08,.14),(.10,.08)],'glaze',24)
 ell('pendant-bulb',(x,2.94,-2.9),(.22,.16,.22),'light',16,8)
 torus('lamp-rim',(x,2.87,-2.9),.46,.025,'gold')
# Original 512px night painting: quiet gradient, distant roof silhouettes and defocused town lights.
import numpy as np
N=512;yy,xx=np.mgrid[0:N,0:N];u=xx/(N-1);vv=yy/(N-1)
bottom=np.array([.035,.075,.11]);top=np.array([.012,.027,.055]);sky=bottom[None,None,:]*(1-vv[:,:,None])+top[None,None,:]*vv[:,:,None]
for i in range(15):
 left=i/15;roof=.18+.035*math.sin(i*1.7);mask=(u>=left)&(u<(i+1)/15)&(vv<roof);sky[mask]*=.45
for i in range(34):
 cx=random.uniform(.04,.96);cy=random.uniform(.06,.48);radius=random.uniform(.003,.009);d=((u-cx)**2+(vv-cy)**2)/radius**2;glow=np.exp(-d*.38)*.42+np.exp(-d*2.2)*.65
 tint=np.array([1.,.63,.27]) if i%4 else np.array([.4,.68,.85]);sky+=glow[:,:,None]*tint[None,None,:]
moon=np.exp(-((u-.72)**2+(vv-.76)**2)/.002);sky+=moon[:,:,None]*np.array([.22,.32,.40])[None,None,:]
pixels=np.ones((N,N,4));pixels[:,:,:3]=np.clip(sky,0,1);im=bpy.data.images.new('original-night-cafe',N,N,alpha=False);im.pixels[:]=pixels.ravel();im.filepath_raw=str(OUT/'night.png');im.file_format='PNG';im.save()
m=M['glass'];n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');tex=n.new('ShaderNodeTexImage');tex.image=im;l.new(tex.outputs['Color'],bs.inputs['Base Color']);l.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.6;bs.inputs['Metallic'].default_value=0
for o in objects:
 if o.name.startswith('night-glass'):
  uv=o.data.uv_layers.new(name='NightUV')
  for poly in o.data.polygons:
   for loop_index in poly.loop_indices:
    co=o.data.vertices[o.data.loops[loop_index].vertex_index].co;uv.data[loop_index].uv=(co.x/4.15+.5,(co.z-1.25)/2.78)
# Prepare original geometry for deterministic UV atlas.
for o in objects:
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for mod in list(o.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
# Static color/AO/roughness atlas preserves per-material glaze and cloth response.
static=[o for o in objects if o.data.materials[0].name not in ['light','skyglow','glass']]
bpy.ops.object.select_all(action='DESELECT')
for o in static:o.select_set(True)
bpy.context.view_layer.objects.active=static[0];bpy.ops.object.join();body=bpy.context.object;body.name='atelier-cafe-static'
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=1.15,island_margin=.006);bpy.ops.object.mode_set(mode='OBJECT')
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.bake.margin=8;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgba('#A8C0C5');scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.22
for name,pos,color,power,size in [('key',(-4,7,5),'#FFE2AE',1450,5),('rim',(4,6,-1.8),'#9BCBDA',850,5)]:
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=rgba(color)[:3];data.size=size;data.use_shadow=name!='rim';o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=v(pos);o.rotation_euler=(v((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
for x in [-3.7,3.7]:
 data=bpy.data.lights.new('lantern','POINT');data.energy=145;data.color=rgba('#FFD3A0')[:3];data.shadow_soft_size=.4;o=bpy.data.objects.new('lantern',data);bpy.context.collection.objects.link(o);o.location=v((x,2.65,-2.9))
images={}
if a.bake:
 nodes=[]
 for m in body.data.materials:
  n=m.node_tree.nodes.new('ShaderNodeTexImage');m.node_tree.nodes.active=n;nodes.append(n)
 for kind,typ in [('color','DIFFUSE'),('ao','AO'),('roughness','ROUGHNESS'),('normal','NORMAL'),('irradiance','DIFFUSE')]:
  im=bpy.data.images.new('cafe-'+kind,2048,2048,alpha=False);im.colorspace_settings.name='sRGB' if kind in ['color','irradiance'] else 'Non-Color'
  for n in nodes:n.image=im
  scene.render.bake.use_pass_direct=kind=='irradiance';scene.render.bake.use_pass_indirect=kind=='irradiance';scene.render.bake.use_pass_color=kind!='irradiance';bpy.ops.object.bake(type=typ,use_clear=True);im.filepath_raw=str(OUT/(kind+'.png'));im.file_format='PNG';im.save();images[kind]=im
 import numpy as np
 color=np.array(images['color'].pixels[:]).reshape(-1,4);ao=np.array(images['ao'].pixels[:]).reshape(-1,4)[:,0];color[:,:3]*=.55+.45*ao[:,None];images['color'].pixels[:]=color.ravel();images['color'].save()
 atlas=bpy.data.materials.new('atelier-stage-baked');atlas.use_nodes=True;n=atlas.node_tree.nodes;l=atlas.node_tree.links;bs=n.get('Principled BSDF')
 for kind,target in [('color','Base Color'),('roughness','Roughness')]:
  tex=n.new('ShaderNodeTexImage');tex.image=images[kind];l.new(tex.outputs['Color'],bs.inputs[target])
 tex=n.new('ShaderNodeTexImage');tex.image=images['normal'];normal=n.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.22;l.new(tex.outputs['Color'],normal.inputs['Color']);l.new(normal.outputs[0],bs.inputs['Normal'])
 body.data.materials.clear();body.data.materials.append(atlas)
 for poly in body.data.polygons:poly.material_index=0
# Merge only equal materials; four static draw calls including glass and lights.
for mat in ['light','skyglow','glass']:
 group=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0].name==mat]
 if len(group)>1:
  bpy.ops.object.select_all(action='DESELECT')
  for o in group:o.select_set(True)
  bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();bpy.context.object.name='atelier-cafe-'+mat
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];triangles=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
bpy.ops.object.select_all(action='DESELECT')
for o in meshes:o.select_set(True)
dest=OUT/'cafe.glb';bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_animations=False)
# Same model render is the phase's first art review; runtime screenshots follow.
camera=bpy.data.objects.new('DioramaCamera',bpy.data.cameras.new('DioramaCamera'));bpy.context.collection.objects.link(camera);camera.location=v((0,6.3,12.8));target=v((0,1.15,0));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=16.8;scene.camera=camera;scene.render.resolution_x=1440;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.film_transparent=False;scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG'
rounddir=ROOT/'reports/cardrpg-look/rounds/stage';rounddir.mkdir(parents=True,exist_ok=True);scene.render.filepath=str(rounddir/f'round-{a.round}-blender.png');bpy.ops.render.render(write_still=True)
receipt={'tool':bpy.app.version_string,'seed':20261107,'round':a.round,'triangles':triangles,'drawMeshes':len(meshes),'atlas':2048,'samples':24,'baked':list(images),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'bytes':dest.stat().st_size,'sourceSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest()};(OUT/'author.json').write_text(json.dumps(receipt,indent=2)+'\n');(rounddir/f'round-{a.round}-receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print('STAGE_RECEIPT '+json.dumps(receipt))
