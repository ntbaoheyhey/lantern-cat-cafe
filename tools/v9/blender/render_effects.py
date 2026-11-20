"""Original, continuous-time V9 simulations rendered with Blender Eevee.

blender -b -P tools/v9/blender/render_effects.py -- --effect all
Use --preview for five representative frames before a full render.
"""
import argparse
import json
import math
from pathlib import Path
import random
import sys

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[3]
CATALOG = json.loads(Path(__file__).with_name('effects.json').read_text())
TAU = math.tau
WHITE = (1., 1., 1.)
GOLD = (1., .43, .055)
CREAM = (1., .86, .44)
GREEN = (.25, 1., .22)
PURPLE = (.41, .075, 1.)
ORANGE = (1., .16, .018)


def clamp(x, lo=0., hi=1.):
    return min(hi, max(lo, x))


def smooth(a, b, t):
    x = clamp((t-a)/(b-a))
    return x*x*(3-2*x)


def life(t, attack=.12, release=.60):
    return smooth(0, attack, t) * (1-smooth(release, 1, t))


def reset(normal=False):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    engines = {x.identifier for x in scene.render.bl_rna.properties['engine'].enum_items}
    scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = scene.render.resolution_y = 512
    scene.render.resolution_percentage = 100
    scene.render.fps = 30
    scene.render.film_transparent = normal
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA' if normal else 'RGB'
    scene.render.image_settings.color_depth = '8'
    scene.render.image_settings.compression = 15
    scene.eevee.taa_render_samples = 64
    scene.render.use_compositing = True
    scene.world = bpy.data.worlds.new('Black emission stage')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0,0,0,1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    cam_data = bpy.data.cameras.new('Orthographic 512 cell')
    cam = bpy.data.objects.new('Camera', cam_data)
    scene.collection.objects.link(cam)
    cam.location = (0,0,10)
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 7.4
    scene.camera = cam
    if bpy.app.version >= (5,0,0):
        tree = bpy.data.node_groups.new('V9 emission bloom', 'CompositorNodeTree')
        tree.interface.new_socket(name='Image', in_out='OUTPUT', socket_type='NodeSocketColor')
        scene.compositing_node_group = tree
        output = tree.nodes.new('NodeGroupOutput')
    else:
        scene.use_nodes = True
        tree = scene.node_tree
        tree.nodes.clear()
        output = tree.nodes.new('CompositorNodeComposite')
    layers = tree.nodes.new('CompositorNodeRLayers')
    layers.scene = scene
    glare = tree.nodes.new('CompositorNodeGlare')
    if 'Type' in glare.inputs:
        glare.inputs['Type'].default_value = 'Fog Glow'
        glare.inputs['Quality'].default_value = 'High'
    else:
        glare.glare_type, glare.quality = 'FOG_GLOW', 'HIGH'
    for key, val in [('Threshold', .3), ('Strength', 2.7), ('Size', .70)]:
        if key in glare.inputs:
            glare.inputs[key].default_value = val
    tree.links.new(layers.outputs['Image'], glare.inputs['Image'])
    if normal:
        # Smoke keeps its actual coverage; glow must not become opaque black film.
        alpha = tree.nodes.new('CompositorNodeSetAlpha')
        if hasattr(alpha, 'mode'):
            alpha.mode = 'REPLACE_ALPHA'
        elif 'Mode' in alpha.inputs:
            alpha.inputs['Mode'].default_value = 'Replace Alpha'
        elif 'Type' in alpha.inputs:
            alpha.inputs['Type'].default_value = 'Replace Alpha'
        tree.links.new(glare.outputs['Image'], alpha.inputs['Image'])
        tree.links.new(layers.outputs['Alpha'], alpha.inputs['Alpha'])
        tree.links.new(alpha.outputs['Image'], output.inputs['Image'])
    else:
        tree.links.new(glare.outputs['Image'], output.inputs['Image'])
    return scene


def emission(name, color, power=1):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    shader = nodes.new('ShaderNodeEmission')
    shader.inputs['Color'].default_value = (*color,1)
    shader.inputs['Strength'].default_value = power
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(shader.outputs[0], out.inputs['Surface'])
    return mat, shader.inputs['Strength']


def soft_material(name, color, power=1, smoke=False, annulus=False, fire=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    if hasattr(mat, 'surface_render_method'):
        mat.surface_render_method = 'BLENDED'
    elif hasattr(mat, 'blend_method'):
        mat.blend_method = 'BLEND'
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    uv = nodes.new('ShaderNodeTexCoord')
    dist = nodes.new('ShaderNodeVectorMath'); dist.operation = 'DISTANCE'
    dist.inputs[1].default_value = (.5,.5,0)
    links.new(uv.outputs['UV'], dist.inputs[0])
    ramp = nodes.new('ShaderNodeMapRange')
    ramp.interpolation_type = 'SMOOTHERSTEP'
    ramp.inputs['From Min'].default_value = .03 if not smoke else .11
    ramp.inputs['From Max'].default_value = .49
    ramp.inputs['To Min'].default_value = 1
    ramp.inputs['To Max'].default_value = 0
    links.new(dist.outputs['Value'], ramp.inputs['Value'])
    if annulus:
        offset=nodes.new('ShaderNodeMath');offset.operation='SUBTRACT';offset.inputs[1].default_value=.41
        links.new(dist.outputs['Value'],offset.inputs[0])
        absolute=nodes.new('ShaderNodeMath');absolute.operation='ABSOLUTE';links.new(offset.outputs[0],absolute.inputs[0])
        links.new(absolute.outputs[0],ramp.inputs['Value'])
        ramp.inputs['From Min'].default_value=.01;ramp.inputs['From Max'].default_value=.13
    opacity = nodes.new('ShaderNodeMath'); opacity.operation = 'MULTIPLY'
    opacity.inputs[1].default_value = 1
    links.new(ramp.outputs[0], opacity.inputs[0])
    shader = nodes.new('ShaderNodeEmission')
    shader.inputs['Color'].default_value = (*color,1)
    shader.inputs['Strength'].default_value = power
    noise = None
    if smoke or fire:
        noise = nodes.new('ShaderNodeTexNoise')
        noise.noise_dimensions = '4D'
        noise.inputs['Scale'].default_value = 4.3
        noise.inputs['Detail'].default_value = 3.
        noise.inputs['Roughness'].default_value = .7
        links.new(uv.outputs['UV'], noise.inputs['Vector'])
        contrast = nodes.new('ShaderNodeValToRGB')
        contrast.color_ramp.elements[0].position = .2
        contrast.color_ramp.elements[0].color = (.24,.005,.015,1) if fire else (.025,.022,.032,1)
        contrast.color_ramp.elements[1].position = .78
        contrast.color_ramp.elements[1].color = (1.,.46,.045,1) if fire else (.42,.37,.40,1)
        if fire:
            middle=contrast.color_ramp.elements.new(.5);middle.color=(1.,.08,.008,1)
        links.new(noise.outputs['Fac'], contrast.inputs[0])
        links.new(contrast.outputs['Color'], shader.inputs['Color'])
        density = nodes.new('ShaderNodeMath'); density.operation = 'MULTIPLY'
        links.new(opacity.outputs[0], density.inputs[0])
        links.new(noise.outputs['Fac'], density.inputs[1])
        mask = density.outputs[0]
    else:
        mask = opacity.outputs[0]
    transparent = nodes.new('ShaderNodeBsdfTransparent')
    mix = nodes.new('ShaderNodeMixShader')
    links.new(mask, mix.inputs[0]); links.new(transparent.outputs[0], mix.inputs[1]); links.new(shader.outputs[0], mix.inputs[2])
    out = nodes.new('ShaderNodeOutputMaterial'); links.new(mix.outputs[0], out.inputs['Surface'])
    return mat, opacity.inputs[1], shader.inputs['Strength'], noise.inputs['W'] if noise else None


def mesh(name, vertices, faces, material):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces); data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def plane(name, material):
    obj = mesh(name, [(-1,-1,0),(1,-1,0),(1,1,0),(-1,1,0)], [(0,1,2,3)], material)
    uv = obj.data.uv_layers.new()
    for loop, value in zip(uv.data, [(0,0),(1,0),(1,1),(0,1)]):
        loop.uv = value
    return obj


def curve(name, points, radius, material, cyclic=False, radii=None):
    data = bpy.data.curves.new(name, 'CURVE')
    data.dimensions = '3D'; data.resolution_u = 1; data.bevel_depth = radius; data.bevel_resolution = 2
    spline = data.splines.new('POLY'); spline.points.add(len(points)-1)
    for i, (point, co) in enumerate(zip(spline.points, points)):
        point.co = (*co,1)
        if radii: point.radius = radii[i]
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, data); bpy.context.scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    return obj


def ring(name, radius, material, width=.025, count=128, aspect=1):
    return curve(name, [(radius*math.cos(TAU*i/count),radius*math.sin(TAU*i/count)*aspect,0) for i in range(count)], width, material, True)


def ball(name, material, radius=1, ico=False):
    if ico: bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius)
    else: bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=radius)
    obj = bpy.context.object; obj.name = name; obj.data.materials.append(material)
    for face in obj.data.polygons: face.use_smooth = True
    return obj


def spark(name, material, length=1, width=.16):
    verts=[(0,length,0),(width,width,0),(length,0,0),(width,-width,0),(0,-length,0),(-width,-width,0),(-length,0,0),(-width,width,0)]
    return mesh(name, [(0,0,0)]+verts, [(0,i+1,(i+1)%8+1) for i in range(8)], material)


def size(obj, amount, xyz=(1,1,1)):
    amount = max(0., amount)
    obj.hide_render = amount < .0001
    obj.scale = tuple(max(.00001, amount*x) for x in xyz)


def move_points(obj, points):
    for point, co in zip(obj.data.splines[0].points, points): point.co = (*co,1)


def impact():
    hot, hs = emission('White-hot core and rays', WHITE, 5)
    glow, ga, gs, _ = soft_material('White atmospheric flash', WHITE, 2.5)
    halo = plane('Flash bloom', glow); halo.location.z = -.2
    core = ball('White-hot nucleus', hot)
    rays=[]; rng=random.Random(1901)
    for i in range(22):
        angle=TAU*i/22+rng.uniform(-.08,.08)
        obj=mesh(f'Tapered ray {i:02}', [(0,0,0),(.22,-.04,0),(1,0,0),(.22,.04,0)], [(0,1,2,3)], hot)
        obj.rotation_euler.z=angle; rays.append((obj,rng.uniform(1.5,3.0),rng.uniform(.5,1.4)))
    flecks=[]
    for i in range(20):
        flecks.append((spark(f'Outward spark {i}',hot),rng.random()*TAU,rng.uniform(1.2,2.9)))
    def update(t):
        e=life(t,.10,.22); hs.default_value=5*e; ga.default_value=e
        size(core,.32*(1+.5*t)*e); size(halo,1.3*(.3+t)); gs.default_value=2.8*e
        for obj,length,thin in rays: size(obj,e,(length*(.65+1.1*t),thin*(1-.7*t),1))
        for i,(obj,a,speed) in enumerate(flecks):
            r=.2+speed*t; obj.location=(r*math.cos(a),r*math.sin(a),.1)
            size(obj,.045*e*(.7+.3*math.sin(i)))
    return update


def shockwave():
    white, ws=emission('Neutral wavefront',WHITE,3.5)
    dim, ds=emission('Inner afterimage',WHITE,.5)
    outer=ring('Primary expanding shock front',1,white,.023)
    echo=ring('Inner expanding glow',1,dim,.018)
    glow,ga,gs,_=soft_material('Soft inner pressure glow',WHITE,.55,annulus=True)
    disk=plane('Pressure halo',glow); disk.location.z=-.1
    sparks=[spark(f'Wave glint {i}',white) for i in range(12)]
    def update(t):
        radius=.15+2.65*(1-(1-t)**1.6); e=life(t,.08,.2)
        size(outer,radius); size(echo,radius*.94); size(disk,radius*1.08)
        ws.default_value=3.5*e; ds.default_value=.25*e; ga.default_value=.38*e
        for i,obj in enumerate(sparks):
            a=TAU*i/12+.15*t; obj.location=(radius*math.cos(a),radius*math.sin(a),.05)
            size(obj,.04*e)
    return update


def smoke():
    rng=random.Random(1903); puffs=[]
    for i in range(13):
        mat,alpha,strength,noise=soft_material(f'Turbulent smoke {i}',(.2,.18,.22),1,True)
        obj=plane(f'Buoyant smoke billow {i}',mat)
        angle=rng.uniform(0,TAU); velocity=rng.uniform(.2,1.3); origin=rng.uniform(-.5,.5)
        puffs.append((obj,alpha,noise,angle,velocity,origin,rng.uniform(.65,1.25)))
    ember,es=emission('Warm rising embers',ORANGE,3)
    embers=[]
    ember_glow,_,_,_=soft_material('Ember halo coverage',ORANGE,2)
    for i in range(25):
        embers.append((ball(f'Rising ember {i}',ember,ico=True),plane(f'Ember soft halo {i}',ember_glow),rng.uniform(-1.8,1.8),rng.uniform(.5,2.2),rng.random()))
    def update(t):
        for i,(obj,alpha,noise,angle,velocity,origin,scale) in enumerate(puffs):
            obj.location=(math.cos(angle)*velocity*t+origin, -.7+1.45*t+math.sin(angle)*.55*t, -.6+i*.025)
            obj.rotation_euler.z=.2*math.sin(i+t*2)
            size(obj,scale*(.45+1.35*t)); alpha.default_value=.95*life(t,.13,.45)
            noise.default_value=i*.4+t*.55
        es.default_value=3*(1-smooth(.65,1,t))
        for i,(obj,halo,x,v,seed) in enumerate(embers):
            age=t-seed*.28; active=clamp(age/.08)*(1-smooth(.6,.95,t)) if age>0 else 0
            obj.location=(x*(.2+.65*t)+.12*math.sin(8*t+i),-.8+v*max(0,age),.15)
            size(obj,(.018+.012*seed)*active,(1,1.5,1))
            halo.location=tuple(obj.location);halo.location.z-=.01;size(halo,.11*active)
    return update


def projected(x,y,z):
    return (x,.43*y+.90*z,.90*y-.43*z)


def hemisphere(name, material, radius=1):
    vertices=[]; faces=[]; rings=20; segments=64
    for j in range(rings+1):
        phi=(math.pi/2)*j/rings
        for i in range(segments):
            theta=TAU*i/segments
            vertices.append(projected(radius*math.cos(phi)*math.cos(theta),radius*math.cos(phi)*math.sin(theta),radius*math.sin(phi)))
    for j in range(rings):
        for i in range(segments):
            a=j*segments+i; b=j*segments+(i+1)%segments
            faces.append((a,b,b+segments,a+segments))
    obj=mesh(name,vertices,faces,material)
    for f in obj.data.polygons:f.use_smooth=True
    return obj


def shell_material(name,color,power=1):
    mat=bpy.data.materials.new(name); mat.use_nodes=True
    if hasattr(mat,'surface_render_method'):mat.surface_render_method='BLENDED'
    nodes,links=mat.node_tree.nodes,mat.node_tree.links;nodes.clear()
    trans=nodes.new('ShaderNodeBsdfTransparent');em=nodes.new('ShaderNodeEmission')
    em.inputs['Color'].default_value=(*color,1); em.inputs['Strength'].default_value=power
    layer=nodes.new('ShaderNodeLayerWeight');layer.inputs['Blend'].default_value=.4
    strength=nodes.new('ShaderNodeMath');strength.operation='MULTIPLY';strength.inputs[1].default_value=.24
    links.new(layer.outputs['Fresnel'],strength.inputs[0])
    mix=nodes.new('ShaderNodeMixShader');links.new(strength.outputs[0],mix.inputs[0]);links.new(trans.outputs[0],mix.inputs[1]);links.new(em.outputs[0],mix.inputs[2])
    out=nodes.new('ShaderNodeOutputMaterial');links.new(mix.outputs[0],out.inputs['Surface'])
    return mat,em.inputs['Strength']


def dome(fire=False):
    rng=random.Random(1906 if fire else 1904)
    main,ms=emission('Fire crest' if fire else 'Amber ward lines',ORANGE if fire else GOLD,2.5)
    accent,acs=emission('Violet fire' if fire else 'Golden rune band',PURPLE if fire else CREAM,2)
    shell,ss=shell_material('Luminous hemisphere',ORANGE if fire else GOLD,2)
    root=bpy.data.objects.new('Dome expansion',None);bpy.context.scene.collection.objects.link(root);root.location.y=-.8
    surface=hemisphere('Fire envelope' if fire else 'Lantern shield surface',shell);surface.parent=root
    base=curve('Base band', [projected(math.cos(TAU*i/128),math.sin(TAU*i/128),0) for i in range(128)],.025,accent,True);base.parent=root
    rim=curve('Outer base ring',[projected(1.07*math.cos(TAU*i/128),1.07*math.sin(TAU*i/128),0) for i in range(128)],.013,main,True);rim.parent=root
    arcs=[]
    for i in range(9 if fire else 7):
        theta=math.pi*i/(8 if fire else 6)
        pts=[projected(math.cos(math.pi*j/48)*math.cos(theta),math.cos(math.pi*j/48)*math.sin(theta),math.sin(math.pi*j/48)) for j in range(49)]
        obj=curve(f'Flame arc {i}' if fire else f'Ward meridian {i}',pts,.012 if fire else .009,main)
        obj.parent=root; arcs.append((obj,theta))
    for j in ([.25,.5] if not fire else [.18]):
        r=math.cos(j*math.pi/2);z=math.sin(j*math.pi/2)
        obj=curve(f'Dome latitude {j}',[projected(r*math.cos(TAU*i/100),r*math.sin(TAU*i/100),z) for i in range(100)],.009,main,True);obj.parent=root
    runes=[]
    for i in range(16):
        theta=TAU*i/16
        points=[]
        for da,dz in [(-.035,.05),(0,.14),(.035,.05),(0,.015),(-.035,.05)]:
            points.append(projected(math.cos(theta+da),math.sin(theta+da),dz))
        obj=curve(f'Original ward glyph {i}',points,.012,accent);obj.parent=root;runes.append(obj)
    particles=[]
    for i in range(35 if fire else 22):
        obj=ball(f'Flying coal {i}' if fire else f'Rising lantern mote {i}',main if i%3 else accent,ico=True)
        particles.append((obj,rng.uniform(-2.2,2.2),rng.uniform(1.5,4.5),rng.random()))
    def update(t):
        e=life(t,.09 if fire else .22,.42 if fire else .65)
        r=(2.15 if fire else 1.95)*smooth(0,.32 if fire else .48,t)
        size(root,r,(1,.32+.68*smooth(0,.35,t),1));ms.default_value=2.6*e;acs.default_value=2.8*e;ss.default_value=1.8*e
        if fire:
            for i,(obj,theta) in enumerate(arcs):
                pts=[]
                for j in range(49):
                    p=math.pi*j/48;warp=1+.07*math.sin(p*13-t*12+i)*math.sin(p)
                    pts.append(projected(math.cos(p)*math.cos(theta)*warp,math.cos(p)*math.sin(theta)*warp,math.sin(p)*warp))
                move_points(obj,pts)
        for i,(obj,vx,vy,seed) in enumerate(particles):
            age=max(0,t-seed*.12)
            if fire:
                obj.location=(vx*age,-.8+vy*age-2.5*age*age,.1)
                size(obj,(.025+.04*seed)*life(age,.06,.6));obj.rotation_euler=(t*7+i,t*4,seed)
            else:
                theta=TAU*seed;rr=1.8*(.55+.45*t)
                obj.location=(rr*math.cos(theta),-.8+.43*rr*math.sin(theta)+t*(.6+seed),.1)
                size(obj,.025*e*(.7+.3*math.sin(t*8+i)))
    return update


def clover():
    leaf,ls=emission('Living green leaves',(.035,.60,.065),.7)
    cream,cs=emission('Tea and leaf veins',CREAM,3)
    gold,gs=emission('Golden tea droplets',GOLD,3)
    root=bpy.data.objects.new('Four-leaf bloom',None);bpy.context.scene.collection.objects.link(root);root.location=(0,.65,0)
    leaves=[]
    for i in range(4):
        pts=[]
        for j in range(80):
            a=TAU*j/80
            x=16*math.sin(a)**3/18*.72
            y=(13*math.cos(a)-5*math.cos(2*a)-2*math.cos(3*a)-math.cos(4*a))/18*.72+.66
            pts.append((x,y,0))
        obj=mesh(f'Heart-shaped clover leaf {i+1}',[(0,.55,0)]+pts,[(0,j+1,(j+1)%80+1) for j in range(80)],leaf)
        obj.rotation_euler.z=TAU*i/4;obj.parent=root
        border=curve(f'Leaf outline {i+1}',pts,.009,cream,True);border.rotation_euler.z=TAU*i/4;border.parent=root
        vein=curve(f'Leaf vein {i+1}',[(0,.06,.03),(0,.55,.03),(0,1.07,.03)],.009,cream);vein.rotation_euler.z=TAU*i/4;vein.parent=root
        for direction in [-1,1]:
            branch=curve(f'Leaf vein branch {i+1}/{direction}',[(0,.44,.03),(.35*direction,.82,.03)],.01,cream);branch.rotation_euler.z=TAU*i/4;branch.parent=root
        leaves.append(obj)
    center=spark('Clover heart glint',cream);center.parent=root;center.location.z=.08;size(center,.16)
    stem=curve('Tea stem',[(0,.7,0),(-.15,.1,0),(.18,-.7,0),(.0,-1.5,0)],.035,leaf)
    helices=[]
    for i in range(3):helices.append(curve(f'Rising tea spiral {i}',[(0,0,0)]*80,.032 if i==0 else .017,cream if i==0 else gold))
    halo=ring('Bloom halo',1,leaf,.018);halo.location=(0,.65,-.2)
    rng=random.Random(1905);rain=[]
    for i in range(40):rain.append((spark(f'Healing raindrop {i}',cream if i%3 else gold),rng.uniform(-2.2,2.2),rng.random()))
    def update(t):
        bloom=smooth(.27,.60,t)*(1-smooth(.83,1,t));e=life(t,.14,.78)
        size(root,1.38*bloom);root.rotation_euler.z=.06*math.sin(t*TAU)
        ls.default_value=.7*e;cs.default_value=1.4*e;gs.default_value=2.1*e
        size(stem,bloom);size(halo,2.05*bloom)
        for i,obj in enumerate(helices):
            extent=smooth(0,.45,t);pts=[]
            for j in range(80):
                u=j/79*extent;a=TAU*(2.2*u-1.25*t)+i*TAU/3
                radius=(.25+.72*math.sin(math.pi*u))*(1-.45*smooth(.5,.85,t))
                pts.append((radius*math.cos(a),-1.65+2.65*u,.25*math.sin(a)))
            move_points(obj,pts);obj.hide_render=t<.01 or t>.96
        for i,(obj,x,seed) in enumerate(rain):
            age=t-(.36+seed*.18);active=smooth(0,.10,age)*(1-smooth(.76,1,t))
            obj.location=(x*(.8+.1*math.sin(t*3+i)),1.75-max(0,age)*(3.1+seed),.2)
            size(obj,.06*active,(.4,1.8,1));obj.rotation_euler.z=.18*math.sin(i+t*2)
    return update


def comet():
    orange,os=emission('Ember orange',ORANGE,3)
    violet,vs=emission('Violet flame',PURPLE,2)
    white,ws=emission('Comet white-hot nucleus',CREAM,4.5)
    head=ball('Comet heart',white);shell=ball('Molten head',orange)
    glow,ga,gs,_=soft_material('Violet head halo',PURPLE,1.5)
    halo=plane('Comet aura',glow);halo.location.z=-.4
    trails=[]
    for i in range(7):
        obj=curve(f'Continuous plasma ribbon {i}',[(0,0,0)]*80,.10 if i<2 else .035,orange if i%2==0 else violet,radii=[(1-j/79)**1.1 for j in range(80)])
        trails.append(obj)
    rng=random.Random(1907);particles=[]
    for i in range(26):particles.append((spark(f'Trail cinder {i}',orange if i%2 else violet),rng.random(),rng.uniform(-.4,.4)))
    def update(t):
        phase=TAU*t;hx=.92+.05*math.cos(phase);hy=-.75+.05*math.sin(phase)
        head.location=(hx,hy,.2);shell.location=(hx-.06,hy+.05,0);halo.location=(hx,hy,-.4)
        size(head,.23*(1+.06*math.sin(phase)),(1,.8,1));size(shell,.36,(1,.8,1));size(halo,.92)
        for i,obj in enumerate(trails):
            pts=[]
            for j in range(80):
                u=j/79;wobble=math.sin(11*u-phase+i*.8)*(.035+.13*u)
                pts.append((hx-2.85*u+wobble+(i-3)*.055*u,hy+2.05*u+wobble+(i-3)*.07*u,-.1-i*.015))
            move_points(obj,pts)
        for i,(obj,seed,lane) in enumerate(particles):
            u=(seed+t)%1;e=math.sin(math.pi*u)**2
            obj.location=(hx-3.1*u+lane,hy+2.2*u+lane+.12*math.sin(TAU*u),.12)
            size(obj,.045*e,(.65,1.4,1));obj.rotation_euler.z=-.65
    return update


def fireburst():
    rng=random.Random(1966)
    orange,os=emission('Incandescent coal',ORANGE,3)
    violet,vs=emission('Violet pressure front',PURPLE,2)
    white,ws=emission('White-hot flying coal cores',CREAM,3.5)
    plumes=[]
    for i in range(17):
        mat,alpha,strength,noise=soft_material(f'Turbulent flame volume {i}',ORANGE,2.2,fire=True)
        obj=plane(f'Expanding fire billow {i}',mat)
        theta=math.pi*i/16
        plumes.append((obj,alpha,strength,noise,theta,rng.uniform(.65,1.15)))
    glow,ga,gs,_=soft_material('Violet explosion halo',PURPLE,1.5)
    halo=plane('Purple outer fire dome',glow);halo.location=(0,-.1,-.8)
    flash,fa,fs,_=soft_material('Impact amber interior',GOLD,3)
    core=plane('Fire dome hot center',flash);core.location=(0,-.45,.15)
    wave=ring('Violet impact pressure ring',1,violet,.024,aspect=.38);wave.location.y=-.85
    licks=[]
    for i in range(9):
        obj=curve(f'Curling fire tongue {i}',[(0,0,0)]*30,.055,orange if i%2 else violet,
                  radii=[(1-j/29)**.8 for j in range(30)])
        licks.append((obj,-1.8+i*.45,rng.uniform(.75,1.35)))
    coal=[]
    for i in range(34):
        obj=ball(f'Ballistic coal fragment {i}',orange if i%3 else white,ico=True)
        coal.append((obj,rng.uniform(-4.2,4.2),rng.uniform(2.8,6.0),rng.random()))
    def update(t):
        e=life(t,.09,.34);expansion=smooth(0,.42,t)
        os.default_value=3*e;vs.default_value=2.5*e;ws.default_value=4*e
        size(halo,2.9*expansion,(1,.7,1));ga.default_value=.7*e
        size(core,1.7*expansion,(1,.6,1));fa.default_value=.55*e
        size(wave,.1+2.5*(1-(1-t)**1.5))
        for i,(obj,alpha,strength,noise,theta,width) in enumerate(plumes):
            radius=1.85*expansion
            obj.location=(radius*math.cos(theta),-.85+1.45*expansion*math.sin(theta),-.25+i*.009)
            obj.rotation_euler.z=.25*math.cos(theta)+.08*math.sin(8*t+i)
            size(obj,(.2+.65*expansion)*width,(.65,.7+.65*math.sin(theta),1))
            alpha.default_value=.95*e;strength.default_value=2.6*e;noise.default_value=.6*i+1.4*t
        for i,(obj,x,h) in enumerate(licks):
            pts=[]
            for j in range(30):
                u=j/29
                pts.append((x*expansion+.16*math.sin(u*8-t*10+i)*u,-.7+u*h*2.1*expansion,.2))
            move_points(obj,pts);obj.hide_render=e<.01
            obj.data.bevel_depth=.045*e
        for i,(obj,vx,vy,seed) in enumerate(coal):
            age=max(0,t-seed*.09)
            obj.location=(vx*age,-.8+vy*age-3*age*age,.3)
            obj.rotation_euler=(i+age*8,age*6,seed)
            size(obj,(.035+.045*seed)*life(age,.06,.55))
    return update


def runes():
    white,ws=emission('Neutral etched runes',WHITE,1.9)
    dim,ds=emission('Neutral secondary engraving',WHITE,.65)
    outer=bpy.data.objects.new('Eight-fold rune rotor',None);bpy.context.scene.collection.objects.link(outer)
    inner=bpy.data.objects.new('Four-fold counter rotor',None);bpy.context.scene.collection.objects.link(inner)
    for radius,width,mat in [(2.35,.017,white),(2.19,.008,dim),(1.7,.014,white),(1.57,.008,dim),(1.08,.012,dim)]:
        obj=ring(f'Etched orbit {radius}',radius,mat,width);obj.parent=outer
    for i in range(8):
        theta=TAU*i/8
        def turn(x,y):return (x*math.cos(theta)-y*math.sin(theta),x*math.sin(theta)+y*math.cos(theta),0)
        # Original abstract lantern/rune mark; repeats eight-fold for a slow seamless turn.
        for k,points in enumerate([[(1.84,-.12),(2.02,0),(1.84,.12),(1.73,0),(1.84,-.12)],[(2.03,-.09),(2.14,-.09)],[(2.03,.09),(2.14,.09)],[(2.35,0),(2.55,0)]]):
            obj=curve(f'Rune {i} stroke {k}',[turn(x,y) for x,y in points],.019,white);obj.parent=outer
        obj=spark(f'Outer rune star {i}',white);obj.location=turn(2.55,0);size(obj,.055);obj.parent=outer
    for i in range(4):
        a=TAU*i/4
        points=[(1.36*math.cos(a+u*.48),1.36*math.sin(a+u*.48),.01) for u in [j/30 for j in range(31)]]
        obj=curve(f'Inner arc {i}',points,.025,white);obj.parent=inner
        star=spark(f'Inner diamond {i}',white);star.location=(.9*math.cos(a),.9*math.sin(a),.02);size(star,.11);star.parent=inner
    def update(t):
        outer.rotation_euler.z=TAU*t/8;inner.rotation_euler.z=-TAU*t/4
        ws.default_value=1.8+.15*math.sin(TAU*t);ds.default_value=.65+.08*math.sin(TAU*t)
    return update


BUILDERS={'impact-core':impact,'shockwave-ring':shockwave,'smoke-embers':smoke,
          'lantern-dome':lambda:dome(False),'tea-clover':clover,'comet-loop':comet,
          'fire-dome':fireburst,'rune-circle':runes}


def main():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--effect',choices=['all']+list(CATALOG),default='all')
    p.add_argument('--preview',action='store_true')
    p.add_argument('--frames',help='Comma-separated zero-based indices, for art review')
    opts=p.parse_args(args)
    for name in CATALOG if opts.effect=='all' else [opts.effect]:
        spec=CATALOG[name];scene=reset(spec['blend']=='normal');update=BUILDERS[name]()
        folder=ROOT/'work/v9/CXV/vfx'/name/('draft' if opts.preview else 'frames')
        folder.mkdir(parents=True,exist_ok=True)
        count=spec['frames']
        selected=range(count)
        if opts.preview:
            selected=([int(x) for x in opts.frames.split(',')] if opts.frames else
                      sorted(set([0,round((count-1)*.2),round((count-1)*.45),round((count-1)*.7),count-1])))
        for frame in selected:
            if not 0<=frame<count:raise ValueError('Frame outside effect range')
            t=frame/(count if spec['loop'] else count-1)
            scene.frame_set(frame+1);update(t);bpy.context.view_layer.update()
            scene.render.filepath=str(folder/f'{frame+1:04d}.png')
            bpy.ops.render.render(write_still=True)
            print(f'V9 RENDER {name} {frame+1}/{count}',flush=True)
        (folder.parent/'render.json').write_text(json.dumps(dict(effect=name,blender=bpy.app.version_string,
          engine=scene.render.engine,cell=[512,512],fps=30,frames=count,blend=spec['blend'],loop=spec['loop'],
          animation='continuous deterministic parametric simulation',bloom='compositor Fog Glow'),indent=2)+'\n')


if __name__=='__main__':main()
