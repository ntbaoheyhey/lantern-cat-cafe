"""Original miniature object bodies for L6 review round two.

No imported meshes, textures or fonts. Geometry dimensions are in icon units.
The existing VFX outline vocabulary remains visible as handles and secondary
objects; these authored bodies provide the missing material and volume.
"""
import math
import bpy


def build_solid(kind, mat, accent, root, mesh, lathe, tube):
    def attach(obj, material):
        obj.parent = root
        obj.data.materials.append(material)
        for face in obj.data.polygons:
            face.use_smooth = True
        return obj

    def ball(name, position, scale, material=mat):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=position)
        obj = attach(bpy.context.object, material)
        obj.name, obj.scale = name, scale
        return obj

    def box(name, position, size, material=mat, bevel=.04):
        x, y, z = (n / 2 for n in size)
        vertices = [(a*x,b*y,c*z) for a,b,c in [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]]
        faces = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
        obj = mesh(name,vertices,faces,material,root)
        obj.location = position
        modifier = obj.modifiers.new('Rounded handcrafted edge','BEVEL')
        modifier.width, modifier.segments = bevel, 3
        obj.modifiers.new('Weighted broad face normals','WEIGHTED_NORMAL')
        return obj

    def plate(name, polygon, material=mat, depth=.12, bevel=.025, y=0):
        vertices = [(x,y-depth/2,z) for x,z in polygon]+[(x,y+depth/2,z) for x,z in polygon]
        n=len(polygon)
        faces=[tuple(range(n-1,-1,-1)),tuple(range(n,2*n))]
        faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
        obj=mesh(name,vertices,faces,material,root)
        for face in obj.data.polygons:
            face.use_smooth=False
        mod=obj.modifiers.new('Soft cut edge','BEVEL');mod.width,mod.segments=bevel,3
        obj.modifiers.new('Weighted panel normals','WEIGHTED_NORMAL')
        return obj

    def line(name, points, radius=.025, material=accent):
        return tube(name,points,radius,material,root)

    def star(name,cx,cz,r,points=5,material=accent,y=-.08):
        poly=[(cx+math.sin(i*math.pi/points)*r*(1 if i%2==0 else .46),
               cz+math.cos(i*math.pi/points)*r*(1 if i%2==0 else .46)) for i in range(points*2)]
        return plate(name,poly,material,depth=.16,bevel=.02,y=y)

    def leaf(name, cx=0, cz=0, size=1, material=mat, lean=0):
        vertices=[]
        for row in range(17):
            t=row/16
            half=.28*math.sin(math.pi*t)**.8*size
            for column in range(9):
                u=column/4-1
                vertices.append((cx+u*half+lean*t,-.12*(1-u*u)*math.sin(math.pi*t)*size,cz+(t-.5)*size))
        faces=[(j*9+i,j*9+i+1,(j+1)*9+i+1,(j+1)*9+i) for j in range(16) for i in range(8)]
        obj=mesh(name,vertices,faces,material,root)
        solid=obj.modifiers.new('Leaf thickness','SOLIDIFY');solid.thickness=.025
        line(name+' vein',[(cx+lean*t,-.13*math.sin(math.pi*t)*size-.012,cz+(t-.5)*size) for t in [0,.25,.5,.75,1]],.018)
        return obj

    if kind=='door':
        arch=[(-.36,-.48),(.36,-.48),(.36,.15)]+[(.36*math.cos(a),.15+.36*math.sin(a)) for a in [i*math.pi/16 for i in range(17)]]
        plate('Arched wooden door',arch,depth=.2,bevel=.035)
        for x in [-.18,0,.18]:
            line('Inlaid door board',[(x,-.115,-.43),(x,-.115,.17+math.sqrt(max(0,.32**2-x*x)))],.012)
        for z in [-.27,.21]:
            box('Bronze hinge',(-.28,-.14,z),(.12,.06,.045),accent,.01)
        ball('Door knob',(.20,-.20,-.04),(.065,.055,.065),accent)
        line('Door surround',[(x,-.04,z) for x,z in arch],.025)
    elif kind in {'roof','greenhouse','oven'}:
        glass=kind=='greenhouse'
        if kind=='oven':
            body=box('Rounded ceramic oven',(0,0,-.02),(.85,.45,.82),mat,.16)
            plate('Dark inset oven door',[(-.29,-.31),(.29,-.31),(.29,.12),(.18,.28),(-.18,.28),(-.29,.12)],accent,depth=.08,y=-.27)
            for x in [-.16,0,.16]:
                line('Oven heat coil',[(x-.04,-.33,-.19),(x+.04,-.33,-.04),(x-.02,-.33,.11)],.025,mat)
            for x in [-.30,.30]:ball('Oven knob',(x,-.29,.29),(.05,.04,.05),accent)
        else:
            plate('Cafe gable',[(-.4,-.43),(.4,-.43),(.4,.17),(0,.53),(-.4,.17)],mat,.34,.03)
            for sign in [-1,1]:
                beam=box('Tiled roof',(sign*.23,0,.35),(.60,.58,.10),accent,.02)
                beam.rotation_euler.y=sign*math.radians(40)
            for x in [-.23,.23]:
                box('Glazed window pane',(x,-.196,-.04),(.27,.045,.36),accent,.035)
                line('Window mullion',[(x,-.23,-.2),(x,-.23,.13)],.018,mat)
            line('Cross sill',[(-.38,-.23,-.05),(.38,-.23,-.05)],.022,mat)
            box('Foundation',(0,0,-.46),(.94,.48,.08),accent,.025)
            if glass:
                for x in [-.38,0,.38]:line('Greenhouse uprights',[(x,-.24,-.4),(x,-.24,.2 if x else .5)],.025)
                leaf('Greenhouse sprout',.05,-.17,.38,mat,.12)
            else:
                for z in [-.27,-.35]:line('Wood cladding',[(-.35,-.18,z),(.35,-.18,z)],.012)
    elif kind in {'apron','apron-cloth','blanket','veil'}:
        apron=kind.startswith('apron')
        verts=[]
        for j in range(21):
            t=j/20;half=(.24+.18*t) if apron else .42
            for i in range(17):
                u=i/8-1
                verts.append((u*half,-.055*math.cos(u*math.pi*3)*(t*.65+.35),.48-t*.96+.025*math.cos(u*math.pi)))
        faces=[(j*17+i,j*17+i+1,(j+1)*17+i+1,(j+1)*17+i) for j in range(20) for i in range(16)]
        obj=mesh('Folded sewn cloth',verts,faces,mat,root)
        mod=obj.modifiers.new('Actual cloth hem thickness','SOLIDIFY');mod.thickness=.045
        for i in range(11):
            x=(i/10-.5)*.72
            line('Hem stitch',[(x,-.09,-.40),(x+.025,-.09,-.36)],.008)
        if apron:
            line('Neck strap',[(-.18,0,.45),(-.19,0,.65),(.19,0,.65),(.18,0,.45)],.035)
            box('Sewn front pocket',(0,-.08,-.17),(.35,.07,.22),accent,.05)
            for sign in [-1,1]:line('Apron waist tie',[(sign*.30,0,.03),(sign*.51,0,.06)],.025)
        else:
            line('Blanket border',[(-.38,-.05,.43),(-.38,-.05,-.43),(.38,-.05,-.43)],.018)
            if kind=='veil':
                for i in range(7):ball('Pearl veil hem',(-.36+i*.12,-.055,-.46),(.027,.02,.027),accent)
    elif kind in {'ember','flame'}:
        outline=[(-.03,-.47),(-.30,-.28),(-.31,-.03),(-.17,.19),(-.08,.06),(.12,.58),(.24,.27),(.19,.10),(.33,.29),(.36,-.04),(.26,-.30),(.08,-.46)]
        plate('Sculpted curling flame',outline,mat,.23,.06)
        plate('Warm flame heart',[(-.06,-.35),(-.16,-.17),(-.06,.02),(.03,-.07),(.13,.19),(.19,-.17),(.07,-.34)],accent,.11,.045,y=-.17)
        if kind=='ember':ball('Charcoal ember',(0,.02,-.42),(.29,.18,.10),mat)
    elif kind in {'star','spice-star','constellation','crumb-crown'}:
        if kind=='constellation':
            positions=[(-.3,-.25),(0,.38),(.34,.05),(.14,-.36)]
            line('Constellation wire',[(x,0,z) for x,z in positions],.027)
            for i,(x,z) in enumerate(positions):star('Cast stellar bead',x,z,.18 if i==1 else .12,5,mat)
        elif kind=='crumb-crown':
            plate('Crown body',[(-.42,-.24),(.42,-.24),(.44,.30),(.16,.08),(0,.45),(-.16,.08),(-.44,.30)],mat,.2,.035)
            for x in [-.28,0,.28]:ball('Crown jewel',(x,-.15,-.08),(.065,.045,.08),accent)
            box('Crown rim',(0,-.01,-.25),(.85,.25,.08),accent,.025)
        else:
            star('Carved star',0,0,.53,8 if kind=='spice-star' else 5,mat,y=0)
            ball('Faceted star centre',(0,-.14,0),(.15,.10,.15),accent)
            for i in range(5):
                a=i*math.tau/5
                line('Star engraved ray',[(math.sin(a)*.17,-.10,math.cos(a)*.17),(math.sin(a)*.39,-.10,math.cos(a)*.39)],.014)
    elif kind=='leaf':
        leaf('Curled botanical leaf',0,0,1.1,mat,.15)
        for t in [.25,.45,.65,.8]:
            for sign in [-1,1]:line('Fine leaf vein',[(.15*t,-.13*math.sin(math.pi*t)-.012,t*1.1-.55),(sign*.20*math.sin(math.pi*t)+.15*t,-.035,t*1.1-.42)],.009)
    elif kind=='wave':
        points=[(-.5,0,-.25),(-.25,0,-.23),(-.12,0,.08),(.12,0,.33),(.40,0,.27),(.49,0,.08),(.35,0,.02)]
        line('Flowing glazed water curl',points,.12,mat)
        for offset in [-.15,.15]:line('Flow trail',[(x,y+.03,z+offset-.16) for x,y,z in points[:4]],.045,accent)
        for x,z in [(-.25,-.2),(.1,.31),(.4,.26)]:ball('Water glint',(x,-.105,z),(.055,.045,.055),accent)
    elif kind in {'pan','tray','shield-facet'}:
        if kind=='shield-facet':
            plate('Curved enamel guard',[(-.42,.34),(0,.51),(.42,.34),(.34,-.24),(0,-.49),(-.34,-.24)],mat,.24,.07)
            plate('Inset guard enamel',[(-.27,.25),(0,.35),(.27,.25),(.22,-.15),(0,-.32),(-.22,-.15)],accent,.08,.04,y=-.17)
            ball('Shield boss',(0,-.25,.02),(.09,.08,.09),mat)
        else:
            dish=lathe('Shallow spun metal dish',[(0,-.08),(.37,-.08),(.46,-.02),(.47,.07),(.43,.10),(.39,.01),(0,.01)],mat,root)
            dish.rotation_euler.x=math.radians(60)
            if kind=='tray':dish.scale.x=1.3
            else:
                handle=box('Wood pan grip',(0,0,-.49),(.14,.12,.48),accent,.055)
                ball('Grip rivet',(0,-.07,-.36),(.025,.02,.025),mat)
    elif kind=='bread':
        ball('Rounded baked loaf',(0,0,0),(.46,.28,.34),mat)
        box('Bread base',(0,0,-.18),(.69,.40,.27),mat,.10)
        for x in [-.22,0,.22]:line('Scored golden crust',[(x-.04,-.16,.18),(x,-.22,.30),(x+.07,-.16,.32)],.03,accent)
        for x,z in [(-.3,-.1),(.2,.04),(.34,-.06)]:ball('Bread crumb',(x,-.26,z),(.022,.014,.018),accent)
    elif kind in {'whisk','spoon','roller','spindle'}:
        box('Rounded utensil handle',(0,0,-.29),(.14,.13,.59),mat,.06)
        if kind=='whisk':
            for i in range(5):
                a=math.pi*i/5
                line('Whisk wire loop',[(0,0,-.05),(.27*math.cos(a),.17*math.sin(a),.28),(0,0,.52),(-.27*math.cos(a),-.17*math.sin(a),.28),(0,0,-.05)],.023)
        elif kind=='spoon':ball('Deep spoon bowl',(0,0,.26),(.24,.085,.32),accent)
        elif kind=='roller':
            roller=lathe('Rounded rolling pin',[(0,-.36),(.13,-.36),(.18,-.28),(.18,.28),(.13,.36),(0,.36)],accent,root)
            roller.rotation_euler.y=math.pi/2
            for sign in [-1,1]:box('Pin grip',(sign*.48,0,0),(.28,.13,.13),mat,.05)
        else:
            for z in [i*.065-.12 for i in range(6)]:line('Wound spindle yarn',[(.21*math.cos(a),.21*math.sin(a),z) for a in [j*math.tau/24 for j in range(25)]],.028,accent)
            ball('Spindle top',(0,0,.44),(.10,.10,.10),accent)
    elif kind in {'ink-stain','knot','ink-cap','paper-cat','collar','seed-pod','shears','watering-can','serving-bell','night-bell','flower-bell'}:
        if kind=='ink-stain':
            for i in range(7):
                a=i*math.tau/7
                ball('Glazed ink puddle',(.28*math.cos(a),0,.24*math.sin(a)),(.20,.07,.18),mat)
            ball('Puddle light',(0,-.06,0),(.21,.055,.20),accent)
        elif kind=='knot':
            for i in range(5):
                line('Looped yarn',[(x,-.025*i,z+.014*i) for x,z in [(0,-.02),(-.43,.28),(-.35,.43),(.0,.0),(.36,.40),(.46,.24),(0,-.02),(-.25,-.43)]],.025,mat if i%2 else accent)
        elif kind=='ink-cap':
            lathe('Mushroom cap',[(0,.4),(.18,.37),(.38,.20),(.47,.05),(.43,-.02),(0,-.02)],mat,root)
            lathe('Mushroom stem',[(0,-.43),(.12,-.43),(.09,-.04),(0,-.04)],accent,root)
            for x,z in [(-.2,.17),(.15,.25),(.3,.08)]:ball('Cap spot',(x,-.30,z),(.055,.018,.04),accent)
        elif kind=='paper-cat':
            plate('Folded paper cat',[(-.37,-.34),(.37,-.34),(.32,.15),(.40,.51),(.10,.32),(-.10,.32),(-.40,.51),(-.32,.15)],mat,.16,.02)
            for x in [-.14,.14]:ball('Paper cat bead eye',(x,-.105,.10),(.035,.024,.045),accent)
            line('Origami folded seam',[(-.32,-.095,-.29),(0,-.12,-.07),(.32,-.095,-.29)],.012)
            ball('Folded cat nose',(0,-.13,-.02),(.032,.02,.025),accent)
        elif kind=='collar':
            line('Padded velvet collar',[(-.4,0,.28),(-.27,0,-.05),(0,0,-.27),(.27,0,-.05),(.4,0,.28)],.10,mat)
            ball('Collar clasp',(0,-.05,-.27),(.13,.08,.13),accent)
        elif kind=='seed-pod':
            ball('Split seed pod',(0,0,0),(.28,.19,.47),mat)
            for z in [-.24,-.07,.10,.27]:ball('Inset seed',(.03,-.19,z),(.10,.045,.085),accent)
            line('Pod seam',[(.16,-.17,-.35),(.20,-.2,0),(.12,-.12,.39)],.025)
        elif kind=='shears':
            for sign in [-1,1]:
                line('Padded shear loop',[(sign*.17+.12*math.cos(a),0,-.27+.14*math.sin(a)) for a in [i*math.tau/24 for i in range(25)]],.04,mat)
                plate('Forged shear blade',[(sign*.06,-.1),(sign*.40,.52),(sign*.13,.34),(-sign*.03,-.07)],accent,.08,.02)
            ball('Shear pivot',(0,-.07,-.02),(.065,.045,.065),mat)
        elif kind=='watering-can':
            lathe('Glazed can body',[(0,-.35),(.30,-.35),(.34,-.29),(.32,.27),(.23,.32),(0,.32)],mat,root)
            line('Can handle',[(-.27,0,.23),(-.57,0,.32),(-.61,0,-.17),(-.29,0,-.21)],.055)
            line('Can spout',[(.28,0,-.19),(.49,0,.02),(.64,0,.30)],.075,mat)
            ball('Sprinkler rose',(.65,0,.31),(.12,.11,.075),accent)
            lathe('Can lip',[(.18,.30),(.20,.34),(.16,.37),(.15,.34)],accent,root)
        else:
            lathe('Spun rounded bell',[(0,-.30),(.40,-.30),(.40,-.22),(.29,-.05),(.23,.26),(.13,.38),(0,.40)],mat,root)
            lathe('Bell rim',[(.37,-.30),(.42,-.28),(.42,-.23),(.38,-.21)],accent,root)
            ball('Bell crown',(0,0,.44),(.07,.07,.07),accent)
            if kind=='serving-bell':lathe('Service bell tray',[(0,-.37),(.48,-.37),(.47,-.32),(0,-.32)],accent,root)
            if kind=='flower-bell':
                for i in range(5):
                    a=i*math.tau/5;leaf('Bell petal',.24*math.cos(a),-.12+.1*math.sin(a),.35,accent)
    else:
        return False
    return True
