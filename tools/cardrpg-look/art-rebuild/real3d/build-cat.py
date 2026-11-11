"""Deterministic clean quad-cage cat pilot. Run with Blender 4.5 -b --python.
Units are meters/model units, Z up, front -Y. Export converts to glTF Y up.
All surfaces and animations authored here; existing raster is reference only.
"""
import bpy,math,sys,argparse,json
from pathlib import Path
from mathutils import Vector
P=argparse.ArgumentParser();P.add_argument('--out',required=True);P.add_argument('--render',action='store_true');P.add_argument('--views',type=int,default=1)
a=P.parse_args(sys.argv[sys.argv.index('--')+1:]);out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=720;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
scene.world.color=(.22,.22,.22);scene.view_settings.view_transform='AgX'
scene.render.fps=30
atlas=bpy.data.images.load(str(out/'atlas.png'))
materials=[]
for name,rough,metal,emission in [('Mochi_atlas',.74,0,0),('Mochi_eyes',.23,.03,0),('Mochi_glow',.3,.2,2.0)]:
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 tex=n.new('ShaderNodeTexImage');tex.image=atlas;m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
 if emission:m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=emission
 materials.append(m)
objects=[];bodyparts=[];blinkparts=[]
def tileuv(tile,u,v):
 if tile==16:x,y,size=0,0,512
 elif tile==8:x,y,size=512,0,256
 elif tile==6:x,y,size=768,0,256
 elif tile==3:x,y,size=512,256,512
 else:x,y,size=(tile%4)*128,512+(tile//4)*128,128
 return ((x+size*(.025+.95*u))/1024,1-(y+size*(.025+.95*(1-v)))/1024)
def activate(o):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
def mesh(name,verts,faces,tile=0,bone='head',sub=0,mat=0,uv=None,body=False,weights=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(materials[mat]);objects.append(ob)
 layer=me.uv_layers.new(name='Atlas')
 for poly in me.polygons:
  poly.use_smooth=True
  for li in poly.loop_indices:
   idx=me.loops[li].vertex_index;co=verts[idx]
   u,v=uv[idx] if uv else ((idx%11)/10,((idx//11)%11)/10)
   layer.data[li].uv=tileuv(tile,u,v)
 if weights:
  for i,ww in enumerate(weights):
   for group,w in ww.items():
    vg=ob.vertex_groups.get(group) or ob.vertex_groups.new(name=group);vg.add([i],w,'REPLACE')
 else:ob.vertex_groups.new(name=bone).add(list(range(len(verts))),1,'REPLACE')
 if sub:
  mod=ob.modifiers.new('Cage subdivision','SUBSURF');mod.levels=sub;mod.render_levels=sub;activate(ob);bpy.ops.object.modifier_apply(modifier=mod.name)
 if body:bodyparts.append(ob)
 return ob

def loft(name,rings,n=12,tile=0,bone='head',sub=1,body=False):
 # rings: xcenter,ycenter,z, xradius,yradius
 vs=[];uv=[]
 for k,(x,y,z,rx,ry) in enumerate(rings):
  for j in range(n):
   th=j*math.tau/n;vs.append((x+rx*math.cos(th),y+ry*math.sin(th),z));uv.append((j/n,k/(len(rings)-1)))
 fs=[]
 for k in range(len(rings)-1):
  for j in range(n):q=k*n+j;r=k*n+(j+1)%n;fs.append((q,r,r+n,q+n))
 fs.extend([tuple(reversed(range(n))),tuple((len(rings)-1)*n+j for j in range(n))])
 return mesh(name,vs,fs,tile,bone,sub,uv=uv,body=body)

def ellipsoid(name,c,r,tile=0,bone='head',n=16,k=9,mat=0,body=False,tilt=0):
 vs=[];uv=[]
 for i in range(k+1):
  ph=math.pi*(.001+(1-.002)*i/k)
  for j in range(n):
   th=j*math.tau/n;x=r[0]*math.sin(ph)*math.cos(th);z=r[2]*math.cos(ph);y=r[1]*math.sin(ph)*math.sin(th)
   vs.append((c[0]+x*math.cos(tilt)-z*math.sin(tilt),c[1]+y,c[2]+x*math.sin(tilt)+z*math.cos(tilt)));uv.append((j/n,1-i/k))
 fs=[]
 for i in range(k):
  for j in range(n):q=i*n+j;r0=i*n+(j+1)%n;fs.append((q,r0,r0+n,q+n))
 fs.extend([tuple(reversed(range(n))),tuple(k*n+j for j in range(n))])
 return mesh(name,vs,fs,tile,bone,mat=mat,uv=uv,body=body)

def sweep(name,path,radii,tile=0,bone='head',sides=8,sub=1,body=False,flat=1):
 vs=[];uv=[]
 for i,p0 in enumerate(path):
  p=Vector(p0);t=Vector(path[min(i+1,len(path)-1)])-Vector(path[max(i-1,0)]);t.normalize()
  ref=Vector((0,1,0));u=t.cross(ref).normalized()
  if u.length<.01:u=t.cross(Vector((1,0,0))).normalized()
  v=t.cross(u).normalized()
  for j in range(sides):
   th=j*math.tau/sides;pos=p+radii[i]*(math.cos(th)*u+math.sin(th)*v*flat);vs.append(tuple(pos));uv.append((j/sides,i/(len(path)-1)))
 fs=[]
 for i in range(len(path)-1):
  for j in range(sides):q=i*sides+j;r=i*sides+(j+1)%sides;fs.append((q,r,r+sides,q+sides))
 fs.extend([tuple(reversed(range(sides))),tuple((len(path)-1)*sides+j for j in range(sides))])
 return mesh(name,vs,fs,tile,bone,sub,uv=uv,body=body)

def line(name,points,r=.004,tile=7,bone='head',sides=5):return sweep(name,points,[r]*len(points),tile,bone,sides,0)

def plate(name,outline,y,depth,tile=5,bone='hand.R',bevel=.004):
 # perimeter in XZ; two supported faces with actual thickness
 vs=[(x,y-d,z) for d in (depth/2,-depth/2) for x,z in outline];n=len(outline)
 fs=[tuple(reversed(range(n))),tuple(n+i for i in range(n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 ob=mesh(name,vs,fs,tile,bone)
 if bevel:
  mod=ob.modifiers.new('Soft edge','BEVEL');mod.width=bevel;mod.segments=2;activate(ob);bpy.ops.object.modifier_apply(modifier=mod.name)
 return ob
# Continuous body cage: skin tree branches create closed joint loops.
verts=[(0,0,.22),(0,0,.32),(0,0,.43),(0,0,.515)];edges=[(0,1),(1,2),(2,3)];radii=[(.10,.08),(.137,.092),(.108,.08),(.065,.055)];groups=['hips','spine','chest','neck']
for s,suffix in [(-1,'L'),(1,'R')]:
 b=len(verts);verts.extend([(s*.13,0,.445),(s*.20,-.005,.375),(s*.248,-.025,.305),(s*.25,-.04,.278)]);edges.extend([(2,b),(b,b+1),(b+1,b+2),(b+2,b+3)]);radii.extend([(.056,.063),(.049,.054),(.049,.049),(.046,.044)]);groups.extend(['upperArm.'+suffix,'foreArm.'+suffix,'hand.'+suffix,'hand.'+suffix])
 b=len(verts);verts.extend([(s*.085,0,.18),(s*.097,-.005,.105),(s*.10,-.018,.045),(s*.10,-.065,.039)]);edges.extend([(0,b),(b,b+1),(b+1,b+2),(b+2,b+3)]);radii.extend([(.061,.064),(.049,.055),(.060,.070),(.061,.040)]);groups.extend(['thigh.'+suffix,'shin.'+suffix,'foot.'+suffix,'foot.'+suffix])
me=bpy.data.meshes.new('Continuous_cat_cage');me.from_pydata(verts,edges,[]);ob=bpy.data.objects.new('Continuous_cat_cage',me);bpy.context.collection.objects.link(ob);ob.data.materials.append(materials[0]);objects.append(ob);bodyparts.append(ob)
for i,g in enumerate(groups):(ob.vertex_groups.get(g) or ob.vertex_groups.new(name=g)).add([i],1,'REPLACE')
activate(ob);skin=ob.modifiers.new('Branch joint loops','SKIN');bpy.context.view_layer.update()
for i,r in enumerate(radii):me.skin_vertices[0].data[i].radius=r
me.skin_vertices[0].data[0].use_root=True
bpy.ops.object.modifier_apply(modifier=skin.name);sub=ob.modifiers.new('Level2 clean body cage','SUBSURF');sub.levels=2;activate(ob);bpy.ops.object.modifier_apply(modifier=sub.name)
for poly in ob.data.polygons:poly.use_smooth=True
layer=ob.data.uv_layers.new(name='Atlas')
for loop in ob.data.loops:
 co=ob.data.vertices[loop.vertex_index].co;layer.data[loop.index].uv=tileuv(0,(co.x+.3)/.6,co.z/.55)
# Hidden torso sides stay inside the fitted apron, preserving continuous arm loops.
for v in ob.data.vertices:
 co=v.co
 if .245<co.z<.355 and abs(co.x)<.185:
  q=math.sin((co.z-.245)/.11*math.pi);co.x*=1-.18*q;co.y*=1-.12*q
# Head cage: broad low cheeks, tapered brow, soft chin. Level2 baked.
head=loft('Head_cage',[(0,0,.495,.035,.03),(0,-.012,.515,.16,.12),(0,-.014,.56,.247,.161),(0,-.008,.63,.271,.176),(0,.003,.71,.249,.170),(0,.008,.785,.196,.151),(0,.008,.83,.115,.09),(0,0,.844,.016,.012)],12,0,'head',2,True)
# Continuous head UVs; seam lies on the plain back-side field.
for poly in head.data.polygons:
 values=[]
 for li in poly.loop_indices:
  co=head.data.vertices[head.data.loops[li].vertex_index].co;u=math.atan2(co.y,co.x)/math.tau%1;v=max(0,min(1,(co.z-.50)/.35));values.append((li,u,v))
 wrap=max(t[1] for t in values)-min(t[1] for t in values)>.5
 for li,u,v in values:head.data.uv_layers.active.data[li].uv=tileuv(16,u+1 if wrap and u<.5 else u,v)
# Sculpted cheek silhouette tufts, all closed smooth volumes.
for s in (-1,1):
 for idx,(z,x) in enumerate([(.58,.239),(.63,.257),(.685,.239)]):
  sweep('Cheek_fur',[(s*(x-.055),-.032,z+.028),(s*(x-.008),-.042,z),(s*(x+.034),-.035,z-.012),(s*(x+.047),-.025,z-.002)],[.042,.041,.014,.001],0,'head',6,1,True,.7)
 # Cupped ears with outer lip and inset inner skin.
 poly=[(s*.083,.760),(s*.102,.86),(s*.217,.982),(s*.249,.992),(s*.258,.868),(s*.232,.764)]
 center=(sum(x for x,z in poly)/len(poly),sum(z for x,z in poly)/len(poly))
 ev=[];euv=[];ef=[];n=len(poly)
 for factor,y,ti in [(1,.008,0),(.93,-.034,0),(.74,-.035,0),(.60,-.017,2),(.18,.009,2),(.02,.012,2)]:
  for x,z in poly:ev.append((center[0]+(x-center[0])*factor,y,center[1]+(z-center[1])*factor));euv.append((.5,.5))
 for k in range(5):
  for j in range(n):q=k*n+j;r=k*n+(j+1)%n;ef.append((q,r,r+n,q+n))
 ef.extend([tuple(reversed(range(n))),tuple(5*n+j for j in range(n))])
 ear=mesh('Cupped_ear',ev,ef,0,'ear.'+('L' if s<0 else 'R'),sub=1,body=True)
 for face in ear.data.polygons:
  # Recess gets the warm inner-ear field; rolled border stays cream.
  co=sum((ear.data.vertices[i].co for i in face.vertices),Vector())/len(face.vertices)
  inner=abs(co.x-center[0])<.048 and abs(co.z-center[1])<.065 and co.y<.014
  for li in face.loop_indices:ear.data.uv_layers.active.data[li].uv=tileuv(2 if inner else 0,.5,.5)
 # Toe divisions are warm grooves, not separated detached spheres.
 for dx in (-.015,.015):line('Toe_seam',[(s*.1+dx,-.098,.033),(s*.1+dx,-.102,.047),(s*.1+dx,-.095,.06)],.0014,13,'foot.'+('L' if s<0 else 'R'))
for s,suffix in [(-1,'L'),(1,'R')]:
 ellipsoid('Paw',(s*.248,-.033,.295),(.047,.046,.045),0,'hand.'+suffix,14,8,body=True)
 for offset in (-.018,0,.018):
  ellipsoid('Paw_toe',(s*.248+offset,-.061,.277),(.014,.026,.018),0,'hand.'+suffix,10,6,body=True)
 ellipsoid('Foot_pad',(s*.10,-.042,.037),(.063,.076,.036),0,'foot.'+suffix,16,8,body=True)
# Forelock swoops, retain one unmistakable curl.
sweep('Forelock_main',[(.01,-.075,.82),(.033,-.089,.851),(.079,-.076,.876),(.104,-.060,.896),(.095,-.05,.919)],[.064,.060,.034,.014,.001],0,'head',8,1,True,.55)
sweep('Forelock_lower',[(.04,-.12,.837),(.052,-.147,.814),(.034,-.161,.792),(.005,-.168,.773)],[.049,.043,.025,.001],1,'head',8,1,True,.4)
# Integrated muzzle volume, nose and W smile.
ellipsoid('Muzzle', (0,-.136,.604),(.134,.033,.054),0,'head',20,10,body=True)
plate('Nose',[(-.014,.657),(-.010,.665),(0,.667),(.013,.663),(.016,.657),(0,.644)],-.189,.016,10,'head',.004)
line('Smile_stem',[(0,-.207,.649),(0,-.208,.637)],.0021)
for s in (-1,1):line('Smile',[(0,-.207,.637),(s*.009,-.209,.628),(s*.025,-.211,.625),(s*.04,-.207,.630),(s*.047,-.2,.638)],.0021)
# Expressive real eyes; iris is a convex disk with its own UV radial paint.
for s in (-1,1):
 x=s*.104;z=.706;cy=-.125;rx=.059;rz=.067
 ellipsoid('Eye_white',(x,cy,z),(rx,.030,rz),9,'head',20,10,1)
 vs=[(x,-.160,z)];uv=[(.5,.5)];fs=[];n=24
 for ring in range(1,5):
  t=ring/4
  for j in range(n):
   th=j*math.tau/n;xx=math.cos(th)*.041*t;zz=math.sin(th)*.057*t
   vs.append((x+xx,-.156-.011*(1-t*t),z+zz));uv.append((.5+math.cos(th)*t*.5,.5+math.sin(th)*t*.5))
 for j in range(n):fs.append((0,1+j,1+(j+1)%n))
 for ring in range(3):
  for j in range(n):i=1+ring*n+j;k0=1+ring*n+(j+1)%n;fs.append((i,i+n,k0+n,k0))
 mesh('Iris',vs,fs,8,'head',mat=1,uv=uv)
 ellipsoid('Eye_glint',(x-.014,-.172,z+.025),(.012,.005,.015),9,'head',10,6,1)
 ellipsoid('Eye_glint_small',(x+.020,-.170,z-.022),(.004,.003,.005),9,'head',8,5,1)
 pts=[(x+math.cos(t)*rx,-.128-.015*math.sin(t),z+math.sin(t)*rz) for t in [j*math.pi/14 for j in range(15)]]
 line('Upper_eye_rim',pts,.0047,7)
 # A closing skin cap moves over the globe; iris never squashes to fake blink.
 lv=[];lu=[];closed=[];n=18;rows=4
 for i in range(rows):
  v=i/(rows-1)
  for j in range(n+1):
   u=-1+2*j/n;h=math.sqrt(max(0,1-u*u));zz=h*(1-.09*v);zc=h*(1-2*v)
   yy=math.sqrt(max(0,1-u*u-zz*zz));yc=math.sqrt(max(0,1-u*u-zc*zc))
   lv.append((x+u*rx,cy-.032*yy-.003,z+zz*rz));closed.append((x+u*rx,cy-.045*yc-.004,z+zc*rz));lu.append((j/n,v))
 lf=[]
 for i in range(rows-1):
  for j in range(n):q=i*(n+1)+j;lf.append((q,q+1,q+n+2,q+n+1))
 lid=mesh('Eyelid',lv,lf,0,'head',uv=lu);lid.shape_key_add(name='Basis');key=lid.shape_key_add(name='blink')
 for v,pos in zip(key.data,closed):v.co=pos
 blinkparts.append(lid)
 brow=[(x+s*t,-.113+abs(t)*.13,.798+(.013-abs(t)*.40)) for t in (-.035,-.017,0,.020,.04)]
 sweep('Eyebrow',brow,[.001,.004,.005,.003,.001],4,'head',5,0,.0)
# Thick tail with a directional, continuous curl and tapered tip.
tailpath=[(0,.075,.22),(-.12,.12,.21),(-.23,.10,.22),(-.34,.075,.28),(-.39,.05,.38),(-.38,.03,.46),(-.32,.015,.485),(-.29,.0,.46)]
tail=sweep('Tail',tailpath,[.035,.052,.06,.068,.067,.057,.035,.001],0,'tail.1',8,1,True)
for v in tail.data.vertices:
 w=max(0,min(1,(-v.co.x-.18)/.16));tail.vertex_groups['tail.1'].add([v.index],1-w,'REPLACE');vg=tail.vertex_groups.get('tail.2') or tail.vertex_groups.new(name='tail.2');vg.add([v.index],w,'REPLACE')
# Fitted apron shell, edge loops follow waist and flared hem, subtly scalloped folds.
rings=[]
for z,rx,ry in [(.145,.171,.116),(.152,.171,.116),(.19,.163,.108),(.265,.142,.100),(.32,.137,.098),(.335,.133,.094),(.38,.127,.092),(.465,.106,.080),(.472,.105,.079)]:rings.append((0,0,z,rx,ry))
apron=loft('Apron',rings,16,3,'spine',1)
for v in apron.data.vertices:
 co=v.co;th=math.atan2(co.y,co.x);wave=.004*math.cos(th*7+co.z*10)*max(0,1-abs(co.z-.23)/.1);co.y+=wave
# Fit cloth to the continuous body, preventing shoulder/waist penetration.
for v in apron.data.vertices:
 co=v.co;z=co.z
 if z>.32:
  co.x*=1.16;co.y*=1.20
 elif z>.26:
  co.x*=1.23;co.y*=1.15
# Sleeve/bib neck edge and waist sash use closed tubes.
for z,rx,ry,tile,r in [(.158,.172,.117,12,.0016),(.328,.139,.100,3,.008)]:
 pts=[(rx*math.cos(j*math.tau/64),ry*math.sin(j*math.tau/64),z) for j in range(65)];line('Apron_hem' if tile==12 else 'Waist_sash',pts,r,tile,'spine',5)
# Shoulder leather straps curve round to back, not flat colored rectangles.
for s in (-1,1):
 sweep('Leather_strap',[(s*.079,-.085,.405),(s*.084,-.080,.45),(s*.092,-.047,.492),(s*.088,.02,.493),(s*.09,.067,.455),(s*.08,.087,.40)],[.016]*6,4,'chest',6,1,False,.27)
 ellipsoid('Strap_rivet',(s*.079,-.093,.41),(.008,.004,.008),5,'chest',10,6)
 # Gold rectangular loop.
 pts=[(s*.079-.016,-.095,.433),(s*.079+.016,-.095,.433),(s*.079+.016,-.095,.451),(s*.079-.016,-.095,.451),(s*.079-.016,-.095,.433)];line('Strap_buckle',pts,.003,5,'chest')
ellipsoid('Clasp',(0,-.090,.452),(.019,.007,.018),5,'chest',16,8)
line('Clasp_link',[(-.043,-.091,.451),(-.019,-.094,.451),(.018,-.094,.451),(.043,-.091,.451)],.004,5,'chest')
# Apron pocket and small actual hollow cup.
pocket=[(-.058,.338),(-.056,.286),(-.03,.272),(.03,.272),(.058,.286),(.058,.338)]
plate('Pocket',pocket,-.109,.012,3,'spine',.004)
for side in (-1,1):line('Pocket_stitch',[(side*.051,-.118,.33),(side*.05,-.12,.29),(side*.024,-.121,.282)],.0014,12,'spine')
line('Pocket_bottom_stitch',[(-.024,-.121,.282),(0,-.121,.279),(.024,-.121,.282)],.0014,12,'spine')
loft('Cup',[(0,-.112,.323,.026,.020),(0,-.112,.352,.028,.021),(0,-.112,.359,.030,.023),(0,-.112,.359,.024,.017),(0,-.112,.343,.021,.014)],12,9,'spine',0)
line('Cup_handle',[(.027,-.11,.352),(.039,-.112,.354),(.042,-.114,.345),(.037,-.115,.335),(.028,-.114,.333)],.0035,9,'spine')
# Back knot and hanging apron ties, visible around the full turntable.
ellipsoid('Apron_knot',(0,.106,.328),(.018,.014,.018),3,'spine',12,7)
for s in (-1,1):
 sweep('Bow_loop',[(0,.106,.33),(s*.032,.119,.354),(s*.071,.112,.347),(s*.049,.116,.326),(s*.008,.111,.322)],[.009,.018,.018,.012,.006],3,'spine',6,1,False,.35)
 sweep('Sash_tail',[(s*.01,.113,.324),(s*.027,.118,.29),(s*.043,.122,.245)],[.014,.019,.012],3,'spine',6,1,False,.2)
# Shield is fitted curved wood with metal rim; the lantern has cage struts.
cx=.292;cz=.248
outline=[(cx-.10,cz-.17),(cx-.12,cz-.11),(cx-.125,cz+.07),(cx-.099,cz+.166),(cx-.055,cz+.20),(cx+.025,cz+.207),(cx+.075,cz+.178),(cx+.099,cz+.12),(cx+.109,cz-.08),(cx+.075,cz-.16),(cx-.015,cz-.195)]
shield=plate('Shield_rim',outline,-.079,.037,5,'hand.R',.009)
inner=[(cx+(x-cx)*.86,cz+(z-cz)*.91) for x,z in outline];plate('Shield_wood',inner,-.102,.020,6,'hand.R',.008)
for x in (cx-.068,cx-.026,cx+.016,cx+.058):line('Wood_plank_seam',[(x,-.115,cz-.14),(x,-.119,cz),(x,-.116,cz+.15)],.0016,4,'hand.R')
line('Shield_crossbrace',[(cx-.105,-.127,cz-.075),(cx,-.134,cz-.061),(cx+.087,-.127,cz-.05)],.013,4,'hand.R',6)
for x,z in outline[::1]:ellipsoid('Shield_rivet',(cx+(x-cx)*.925,-.106,cz+(z-cz)*.955),(.0055,.004,.0055),5,'hand.R',8,5)
# Physical palm/grip anchors on back shield, keeps props attached when the hand moves.
line('Shield_grip',[(cx-.06,-.047,.302),(cx-.05,-.008,.301),(cx+.012,-.008,.29),(cx+.025,-.047,.28)],.009,4,'hand.R',6)
# Attached lantern at center upper third, rod/hook goes through a metal loop.
lx=cx+.024;ly=-.154;lz=.255
line('Lantern_hook',[(lx-.016,-.128,.402),(lx-.013,-.16,.422),(lx+.009,-.16,.425),(lx+.020,-.161,.411),(lx+.01,-.161,.397),(lx,-.162,.388)],.004,5,'hand.R',6)
ring=[(lx+.013*math.cos(t),ly-.012,lz+.115+.014*math.sin(t)) for t in [j*math.tau/18 for j in range(19)]];line('Lantern_ring',ring,.0035,5,'hand.R',5)
loft('Lantern_roof',[(lx,ly,lz+.068,.052,.043),(lx,ly,lz+.076,.051,.042),(lx,ly,lz+.099,.020,.019),(lx,ly,lz+.111,.007,.007)],12,5,'hand.R',0)
loft('Lantern_base',[(lx,ly,lz-.024,.037,.032),(lx,ly,lz-.016,.042,.036),(lx,ly,lz-.006,.035,.030)],12,5,'hand.R',0)
loft('Lantern_light',[(lx,ly,lz-.007,.026,.024),(lx,ly,lz+.062,.033,.028)],8,11,'hand.R',0).data.materials[0]=materials[2]
for th in [j*math.tau/6 for j in range(6)]:line('Lantern_cage',[(lx+.032*math.cos(th),ly+.029*math.sin(th),lz-.01),(lx+.04*math.cos(th),ly+.034*math.sin(th),lz+.068)],.003,5,'hand.R',5)
# Armature and exact immutable skeleton schema.
armdata=bpy.data.armatures.new('Cat_base_v1');rig=bpy.data.objects.new('CatRig',armdata);bpy.context.collection.objects.link(rig);activate(rig);bpy.ops.object.mode_set(mode='EDIT')
bones={}
def bone(name,h,t,parent=None):
 b=armdata.edit_bones.new(name);b.head=h;b.tail=t
 if parent:b.parent=armdata.edit_bones[parent]
 bones[name]=(h,t,parent)
bone('root',(0,0,0),(0,0,.1));bone('hips',(0,0,.20),(0,0,.30),'root');bone('spine',(0,0,.30),(0,0,.405),'hips');bone('chest',(0,0,.405),(0,0,.49),'spine');bone('neck',(0,0,.49),(0,0,.535),'chest');bone('head',(0,0,.535),(0,0,.79),'neck')
for s,suffix in [(-1,'L'),(1,'R')]:
 bone('upperArm.'+suffix,(s*.13,0,.445),(s*.20,-.005,.375),'chest');bone('foreArm.'+suffix,(s*.20,-.005,.375),(s*.248,-.025,.305),'upperArm.'+suffix);bone('hand.'+suffix,(s*.248,-.025,.305),(s*.25,-.04,.278),'foreArm.'+suffix)
 bone('thigh.'+suffix,(s*.085,0,.18),(s*.097,-.005,.105),'hips');bone('shin.'+suffix,(s*.097,-.005,.105),(s*.10,-.018,.045),'thigh.'+suffix);bone('foot.'+suffix,(s*.10,-.018,.045),(s*.10,-.065,.039),'shin.'+suffix)
 bone('ear.'+suffix,(s*.18,.008,.81),(s*.225,.008,.965),'head')
bone('tail.1',(0,.075,.22),(-.23,.1,.22),'hips');bone('tail.2',(-.23,.1,.22),(-.38,.03,.46),'tail.1')
bpy.ops.object.mode_set(mode='OBJECT')
# Join body surfaces to one designated semantic rest bounding box; accessories retain ownership.
def join_parts(parts,name):
 activate(parts[0])
 for ob in parts:ob.select_set(True)
 bpy.ops.object.join();joined=bpy.context.object;joined.name=name;return joined
body=join_parts(bodyparts,'body')
# Collect after joining (deleted source meshes are invalid references).
existing=[o for o in bpy.context.scene.objects if o.type=='MESH']
# Recalculate all normals for closed surfaces and keep skinned hierarchy under root.
for ob in existing:
 activate(ob);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT')
 mod=ob.modifiers.new('Cat skin','ARMATURE');mod.object=rig;ob.parent=rig
# Consolidate draw calls, preserving body bounds and live eyelid morphs.
for name,parts in [('costume',[o for o in existing if o!=body and o not in blinkparts and o.data.materials[0]==materials[0]]),('eyes',[o for o in existing if o.data.materials[0]==materials[1]]),('glow',[o for o in existing if o.data.materials[0]==materials[2]])]:
 if parts:join_parts(parts,name)
# GPU topology reduction preserves normals, UVs and weights from the baked cages.
for ob in [o for o in scene.objects if o.type=='MESH' and not o.data.shape_keys]:
 if ob.name in ('costume','body'):
  mod=ob.modifiers.new('Runtime density','DECIMATE');mod.ratio=.49 if ob.name=='costume' else .61
  activate(ob);bpy.ops.object.modifier_apply(modifier=mod.name)
# Bone-attached sockets: world positions converted to parent bone rest frame.
sockets={'head':('head',(0,-.02,.87)),'hpAnchor':('head',(0,0,1.08)),'chest':('chest',(0,-.10,.41)),'feet':('root',(0,0,0)),'mainHand':('hand.R',(lx,ly,lz+.04)),'offHand':('hand.L',(-.25,-.04,.28)),'vfxOrigin':('hand.R',(lx,ly-.04,lz+.04))}
for name,(parent,pos) in sockets.items():
 ob=bpy.data.objects.new('socket_'+name,None);bpy.context.collection.objects.link(ob);ob.parent=rig;ob.parent_type='BONE';ob.parent_bone=parent;ob.matrix_world.translation=Vector(pos)
 bpy.context.view_layer.update();ob.matrix_world.translation=Vector(pos)
# Eight reusable, deliberately authored clips. Rotation channels in bone local axes.
for pbone in rig.pose.bones:pbone.rotation_mode='XYZ'
def pose(frame,rot=None,loc=None):
 for pb in rig.pose.bones:
  pb.rotation_euler=(0,0,0);pb.location=(0,0,0);pb.scale=(1,1,1)
 for name,v in (rot or {}).items():rig.pose.bones[name].rotation_euler=tuple(math.radians(x) for x in v)
 for name,v in (loc or {}).items():rig.pose.bones[name].location=v
 for pb in rig.pose.bones:
  pb.keyframe_insert('rotation_euler',frame=frame,group=pb.name);pb.keyframe_insert('location',frame=frame,group=pb.name)
clips={
 'idle':[(1,{},{}),(31,{'chest':(2,0,0),'head':(-2,0,0),'tail.1':(0,0,-4),'tail.2':(0,6,0),'ear.L':(1,0,2),'ear.R':(-1,0,-2)},{}),(61,{}, {})],
 'run-in':[(1,{'thigh.L':(-22,0,0),'thigh.R':(22,0,0),'upperArm.L':(18,0,0),'upperArm.R':(-18,0,0),'chest':(8,0,0)},{}),(9,{'thigh.L':(22,0,0),'thigh.R':(-22,0,0),'upperArm.L':(-18,0,0),'upperArm.R':(18,0,0),'chest':(8,0,0)},{}),(17,{}, {})],
 'basic':[(1,{},{}),(9,{'chest':(-8,0,-10),'upperArm.R':(-20,5,-16),'foreArm.R':(0,0,-18),'head':(2,0,8)},{}),(13,{'chest':(11,0,10),'upperArm.R':(24,0,9),'foreArm.R':(0,0,12),'head':(-5,0,-5)},{'root':(0,-.035,0)}),(18,{'chest':(5,0,4),'foreArm.R':(0,0,5)},{}),(29,{}, {})],
 'signature':[(1,{},{}),(12,{'upperArm.R':(-28,12,-20),'foreArm.R':(-10,0,-26),'upperArm.L':(-12,0,12),'head':(-6,0,-6)},{}),(20,{'upperArm.R':(-18,5,-16),'foreArm.R':(-12,0,-20),'chest':(4,0,0)},{}),(32,{}, {})],
 'ultimate':[(1,{},{}),(13,{'chest':(-7,0,-6),'head':(-8,0,6),'upperArm.R':(-35,8,-28),'foreArm.R':(-12,0,-20),'upperArm.L':(-18,0,20)},{}),(22,{'chest':(-7,0,-6),'head':(-8,0,6),'upperArm.R':(-35,8,-28),'foreArm.R':(-12,0,-20),'upperArm.L':(-18,0,20)},{}),(27,{'chest':(12,0,8),'head':(-3,0,-5),'upperArm.R':(12,0,8),'foreArm.R':(-8,0,8)},{}),(36,{'chest':(-3,0,-2)},{}),(46,{}, {})],
 'hit':[(1,{},{}),(5,{'chest':(-14,0,-8),'head':(9,0,8),'upperArm.L':(-10,0,-12),'upperArm.R':(-15,0,10)},{}),(10,{'chest':(5,0,3),'head':(-4,0,-3)},{}),(20,{}, {})],
 'KO':[(1,{},{}),(10,{'chest':(12,0,0),'head':(15,0,5),'thigh.L':(-20,0,0),'shin.L':(35,0,0),'thigh.R':(-20,0,0),'shin.R':(35,0,0)},{'root':(0,0,-.045)}),(26,{'chest':(24,0,0),'head':(28,0,8),'thigh.L':(-36,0,0),'shin.L':(65,0,0),'thigh.R':(-36,0,0),'shin.R':(65,0,0)},{'root':(0,0,-.08)}),(40,{'chest':(24,0,0),'head':(28,0,8),'thigh.L':(-36,0,0),'shin.L':(65,0,0),'thigh.R':(-36,0,0),'shin.R':(65,0,0)},{'root':(0,0,-.08)})],
 'victory':[(1,{},{}),(12,{'upperArm.L':(-35,0,45),'foreArm.L':(-10,0,20),'head':(-5,0,-9),'tail.2':(0,-15,0)},{}),(22,{'upperArm.L':(-25,0,35),'foreArm.L':(-8,0,-8),'head':(-4,0,6)},{}),(32,{'upperArm.L':(-35,0,45),'foreArm.L':(-10,0,20),'head':(-5,0,-9)},{}),(48,{}, {})]
}
rig.animation_data_create()
for name,keys in clips.items():
 action=bpy.data.actions.new(name);rig.animation_data.action=action
 for fr,rot,loc in keys:pose(fr,rot,loc)
 action.use_fake_user=True
 track=rig.animation_data.nla_tracks.new();track.name=name;strip=track.strips.new(name,1,action);track.mute=True
rig.animation_data.action=None
for pb in rig.pose.bones:pb.rotation_euler=(0,0,0);pb.location=(0,0,0)
rig['lookReal3D']=True;rig['rigVersion']='cat-clean-v1';rig['unitId']='mochi'
# Measure evaluated semantic body rest bounds and normalize whole skeleton uniformly.
bpy.context.view_layer.update();coords=[body.matrix_world@v.co for v in body.data.vertices];minz=min(v.z for v in coords);maxz=max(v.z for v in coords)
# Feet cage stays grounded, ears designate the standard (hat/prop excluded).
scale=1/(maxz-minz)
for ob in [o for o in scene.objects if o.type=='MESH']:
 for v in ob.data.vertices:v.co.z-=minz
 # Morph keys include basis; adjust every key only for eyelids.
 if ob.data.shape_keys:
  for key in ob.data.shape_keys.key_blocks:
   for v in key.data:v.co.z-=minz
rig.scale=(scale,)*3
rig.location.z=0
# Master plus glTF export. Keep all refs and raw artifact outside Git.
activate(rig)
for ob in scene.objects:ob.select_set(ob==rig or ob.parent==rig)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'mochi.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'mochi-raw.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='NLA_TRACKS',export_nla_strips=True,export_force_sampling=True,export_frame_range=False,export_skins=True,export_morph=True,export_morph_animation=False,export_materials='EXPORT',export_extras=True)
tri=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in scene.objects if o.type=='MESH')
(out/'build.json').write_text(json.dumps({'id':'mochi','triangles':tri,'scale':scale,'rawRestHeight':maxz-minz,'bodyNodes':['body'],'clips':list(clips),'materials':len(materials),'accepted':False},indent=2))
print('D3_BUILD',tri,'triangles',scale,'scale')
if a.render:
 floor_mat=bpy.data.materials.new('Preview_ground');floor_mat.diffuse_color=(.22,.25,.25,1)
 bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.006));bpy.context.object.data.materials.append(floor_mat)
 def light(name,pos,power,size,color):
  data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color;o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.5))-o.location).to_track_quat('-Z','Y').to_euler()
 light('Key',(-2,-3,4),260,3,(1,.88,.72));light('Fill',(2,-2,2),125,2,(.76,.88,1));light('Rim',(1,2,3),330,2,(1,.82,.57))
 camera_data=bpy.data.cameras.new('Preview_camera');camera=bpy.data.objects.new('Preview_camera',camera_data);bpy.context.collection.objects.link(camera);scene.camera=camera;camera_data.type='ORTHO';camera_data.ortho_scale=1.32
 for i in range(a.views):
  yaw=math.radians(i*45 if a.views>1 else -12);camera.location=(2.7*math.sin(yaw),-2.7*math.cos(yaw),1.0);camera.rotation_euler=(Vector((-.015,0,.49))-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/f'view-{i:02}.png');bpy.ops.render.render(write_still=True)
