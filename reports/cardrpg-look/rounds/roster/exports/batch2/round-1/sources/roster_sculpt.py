"""Original L5 costume sculptures; no imported art and no rig-pivot changes."""
import math
import bpy
from mathutils import Matrix


def spec(role, fur, patch, cloth, accent, eye, body, head):
    return dict(role=role, fur=fur, patch=patch, cloth=cloth, accent=accent,
                inner='#C99386', eye=eye, bodyScale=body, headScale=head)


PALETTES = {
    'panko': spec('guardian', '#CAA47D', '#8E6850', '#547D77', '#E3B86F', '#718769', (1.09, .94, 1.04), (1.03, .98, 1)),
    'mallow': spec('witch', '#E6D2B9', '#B69271', '#82657E', '#D5A268', '#8A7D9D', (1.08, .94, 1.04), (1.05, 1.06, 1.02)),
    'cinnamon': spec('alchemist', '#BE8759', '#895943', '#6C9D8F', '#D6A16C', '#769D86', (.94, .97, .94), (.97, .98, .98)),
    'biscuit': spec('guardian', '#D9BC86', '#A28152', '#987650', '#DBC58B', '#8B784A', (1.13, .94, 1.07), (1.09, .96, 1.02)),
    'inkcap': spec('witch', '#494D5D', '#858392', '#635C7E', '#B9A6CA', '#AAC09A', (.93, 1.07, .94), (.98, 1.02, 1)),
    'sorrel': spec('alchemist', '#A6B08C', '#747F5D', '#C6B58D', '#D4AE70', '#727F60', (.97, 1.01, 1), (.99, 1.03, .99)),
    'brioche': spec('guardian', '#E5CC93', '#AF8757', '#716273', '#DCB272', '#8A7C5D', (1.03, 1.05, 1), (1.01, 1, 1.02)),
    'velvet': spec('witch', '#A792A9', '#78677F', '#686077', '#D4B89E', '#C9A789', (1.08, .92, 1.08), (1.05, .96, 1)),
    'marigold': spec('alchemist', '#D0A46E', '#9E754F', '#72917A', '#E3BA70', '#7A9567', (1.01, .99, 1.02), (1.02, 1.01, 1)),
}


def dress(owner, role, config, rig, objects, ell, path, patch, attach, materials, v):
    """Thick sewn clothing and held objects in the existing animated sockets."""
    root = rig[role]
    root['lookProps'] = True
    root['lookTier'] = 'improved-roster-sculpture'
    root['originalDesign'] = owner
    bpy.context.view_layer.update()

    # Deform only meshes in rest space. Existing rig nodes, rotations and parent
    # chains remain exact; their motion is verified separately in the browser.
    for part, scale in [('body', config['bodyScale']), ('head', config['headScale'])]:
        joint = rig[role + '_' + part]
        pivot = joint.matrix_world.translation.copy()
        deformation = (Matrix.Translation(pivot) @ Matrix.Diagonal((scale[0], scale[2], scale[1], 1))
                       @ Matrix.Translation(-pivot))
        for obj in objects:
            parent = obj.parent
            while parent and parent is not joint:
                parent = parent.parent
            if parent is joint:
                obj.matrix_world = deformation @ obj.matrix_world

    def lathe(name, part, profile, material, loc=(0, 0, 0), segments=28, pleats=0):
        vertices, faces = [], []
        for y, radius in profile:
            for i in range(segments):
                t = math.tau * i / segments
                r = radius * (1 + pleats * math.cos(t * 12))
                vertices.append(v((r * math.cos(t), y, r * math.sin(t))))
        for j in range(len(profile)-1):
            for i in range(segments):
                q = j * segments + i
                n = j * segments + (i+1) % segments
                faces.append((q, n, n+segments, q+segments))
        faces += [tuple(reversed(range(segments))), tuple(range((len(profile)-1)*segments, len(vertices)))]
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(vertices, [], faces)
        mesh.update()
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        attach(obj, name, part, material, loc)
        bevel = obj.modifiers.new('Rounded crafted edge', 'BEVEL')
        bevel.width, bevel.segments = .008, 2
        return obj

    def ring(name, part, center, rx, rz, radius=.012, material='gold', ripple=0):
        x, y, z = center
        return path(name, part, [(x+rx*math.cos(t), y+ripple*math.cos(8*t), z+rz*math.sin(t))
                                for t in [math.tau*i/32 for i in range(33)]], radius, material, 1)

    def leaf(name, part, center, size, tilt, material='cloth'):
        x, y, z = center
        obj = patch(name, part, [[(x-.025*size, y-.09*size, z), (x, y-.12*size, z+.025), (x+.025*size, y-.09*size, z)],
                                 [(x-.065*size, y, z), (x, y, z+.045), (x+.065*size, y, z)],
                                 [(x, y+.13*size, z), (x+.001, y+.13*size, z+.003), (x+.002, y+.13*size, z)]],
                    material, .012, 1)
        # Rotate the mesh around its own leaf centre; no empty/rig transform edit.
        pivot = v(center)
        obj.matrix_basis = Matrix.Translation(pivot) @ Matrix.Rotation(tilt, 4, 'Y') @ Matrix.Translation(-pivot) @ obj.matrix_basis
        return obj

    # Every jacket has a thick back panel; the original L1 script remains intact.
    bx, by, bz = config['bodyScale']
    rows = []
    for j in range(9):
        y = .29-j*.072
        r = math.sqrt(max(.1, 1-(y/.46)**2))
        rows.append([(.342*bx*r*math.sin(t), y*by, -.281*bz*r*math.cos(t))
                     for t in [-1.35+i*2.7/12 for i in range(13)]])
    patch('tailored-back', 'body', rows, 'cloth', .018, 1)
    path('tailored-back-seam', 'body', [(0,.26,-.242*bz),(0,.08,-.292*bz),(0,-.12,-.282*bz),(0,-.27,-.225*bz)], .006, 'patch', 1)
    ring('waist-piping', 'body', (0, -.20, 0), .30*bx, .255*bz, .013, 'patch')

    if role == 'guardian':
        # An apron hangs over the rounded stomach, with separate stitched edges.
        patch('baker-apron', 'body', [[(-.20,.20,.29),(0,.22,.335),(.20,.20,.29)],
                                     [(-.25,-.04,.292),(0,-.06,.355),(.25,-.04,.292)],
                                     [(-.23,-.32,.24),(0,-.35,.29),(.23,-.32,.24)]], 'cream', .020, 2)
        for sign in [-1, 1]:
            path('apron-sewn-edge', 'body', [(sign*.16,.15,.322),(sign*.21,-.06,.327),(sign*.18,-.29,.282)], .006, 'patch', 1)
        if owner == 'panko':
            lathe('pleated-bread-cap', 'head', [(-.02,.23),(.025,.27),(.12,.295),(.23,.27),(.30,.20),(.335,.10),(.345,.012)], 'cream', (0,.32,-.055), 48, .045)
            ring('cap-band', 'head', (0,.323,-.055), .255,.255,.022,'cloth')
            for sign in [-1, 1]:
                ell('toasted-cheek-patch', 'head', (sign*.32,-.03,.262),(.053,.07,.018),'patch',14,10)
        elif owner == 'biscuit':
            bonnet = ell('soft-baker-bonnet', 'head', (0,.32,-.09),(.43,.135,.285),'cream',28,14)
            ring('bonnet-gathered-rim', 'head', (0,.295,-.075),.42,.28,.022,'cloth',.015)
            for i in range(9):
                t=i*math.tau/9
                path('bonnet-fold', 'head', [(.34*math.cos(t),.36,-.075+.22*math.sin(t)),(.22*math.cos(t),.42,-.075+.15*math.sin(t))],.008,'patch',1)
        else:
            for i in range(9):
                x=(i-4)*.055
                patch('service-collar-pleat','body',[[(x-.025,.29,.19),(x,.32,.23),(x+.025,.29,.19)],[(x-.024,.16,.29),(x,.13,.325),(x+.024,.16,.29)]],'cream',.012,1)
            ell('service-medallion','body',(0,.1,.338),(.037,.047,.012),'gold',16,10)
        # Three visibly different hand silhouettes, all seated in real sockets.
        hand = 'socket_offHand'
        width = .235 if owner != 'biscuit' else .27
        profile=[(-.025,.02),(0,width*.8),(.025,width),(.055,width),(.07,width*.92),(.075,.03)]
        shield=lathe('ceramic-serving-shield',hand,profile,'ceramic',(0,-.05,.04),36, .045 if owner=='biscuit' else 0)
        shield.rotation_euler.x=math.pi/2
        # Gold rim follows the shield plane (+Z in game coordinates).
        path('serving-shield-rim',hand,[(width*math.cos(t),-.05+width*math.sin(t),.102)
                                      for t in [i*math.tau/36 for i in range(37)]],.012,'gold',1)
        ell('shield-bread-seal',hand,(0,-.05,.13),(.07,.09,.017),'gold',16,10)
        if owner=='biscuit':
            path('rolling-pin-spindle','socket_mainHand',[(0,-.20,0),(0,.37,0)],.026,'gold',1)
            lathe('rolling-pin-body','socket_mainHand',[(-.04,.035),(-.02,.085),(.23,.085),(.25,.035)],'patch',segments=24)
        elif owner=='brioche':
            path('serving-spoon-handle','socket_mainHand',[(0,-.13,0),(.02,.30,0)],.019,'gold',1)
            ell('serving-spoon-bowl','socket_mainHand',(.02,.38,.015),(.11,.15,.034),'ceramic',20,12)
        else:
            path('bread-paddle-handle','socket_mainHand',[(0,-.14,0),(0,.29,0)],.023,'patch',1)
            ell('bread-paddle-head','socket_mainHand',(0,.36,0),(.13,.12,.035),'ceramic',22,12)
            for x in [-.04,.04]:path('bread-paddle-score','socket_mainHand',[(x,.30,.036),(x+.02,.41,.036)],.005,'gold',1)

    elif role == 'witch':
        # Two overlapping folded panels sit over the shoulders, leaving the
        # jacket visible below instead of reading as a flat belly patch.
        for sign in [-1,1]:
            patch('folded-shawl','body',[[(sign*.32,.29,.20),(sign*.16,.29,.31),(0,.23,.365)],
                                        [(sign*.31,.11,.26),(sign*.13,.10,.365),(0,.055,.38)]],'patch',.022,2)
        path('shawl-piping','body',[(-.29,.27,.25),(0,.22,.365),(.29,.27,.25)],.012,'gold',1)
        if owner=='mallow':
            lathe('toasted-hat-brim','head',[(-.018,.34),(0,.43),(.025,.42),(.038,.30)],'cloth',(0,.31,-.07),40)
            path('curled-felt-cap','head',[(0,.34,-.07),(.015,.52,-.08),(.10,.66,-.09),(.22,.67,-.08),(.255,.59,-.05)],.22,'cloth',3,[1,.88,.57,.30,.04])
            ring('hat-braid','head',(0,.36,-.07),.25,.24,.015,'gold')
            path('whisk-handle','socket_mainHand',[(0,-.16,0),(0,.22,0)],.022,'patch',1)
            for i in range(4):
                t=i*math.pi/4
                x,z=.135*math.cos(t),.135*math.sin(t)
                path('whisk-wire','socket_mainHand',[(0,.20,0),(x,.38,z),(0,.54,0),(-x,.38,-z),(0,.20,0)],.011,'gold',1)
        elif owner=='inkcap':
            hat=ell('drooping-mushroom-hat','head',(-.04,.405,-.05),(.44,.16,.32),'cloth',30,16)
            hat.rotation_euler.y=-.13
            ring('mushroom-hat-edge','head',(-.04,.35,-.05),.43,.31,.018,'patch',.02)
            for x,y,z in [(-.24,.49,.09),(.02,.54,.15),(.21,.48,.04)]:ell('hat-stitch-dot','head',(x,y,z),(.035,.012,.025),'cream',12,8)
            path('ink-wand-shaft','socket_mainHand',[(0,-.15,0),(0,.34,0)],.019,'gold',1)
            lathe('ink-bottle-wand','socket_mainHand',[(-.04,.03),(0,.09),(.13,.085),(.16,.04),(.20,.04)],'ceramic',(0,.28,0),24)
            ring('bottle-seal','socket_mainHand',(0,.48,0),.045,.045,.012,'gold')
        else:
            path('velvet-draped-nightcap','head',[(0,.32,-.1),(-.14,.46,-.1),(-.29,.43,-.1),(-.40,.27,-.1)],.23,'cloth',3,[1,.8,.45,.08])
            ell('nightcap-tassel','head',(-.40,.24,-.1),(.05,.067,.05),'gold',14,10)
            ring('nightcap-seam','head',(0,.315,-.10),.25,.24,.012,'cream')
            path('bell-wand-shaft','socket_mainHand',[(0,-.13,0),(0,.32,0)],.02,'gold',1)
            lathe('rounded-bell-wand','socket_mainHand',[(0,.13),(.025,.135),(.13,.07),(.18,.02)],'ceramic',(0,.30,0),28)
            ell('bell-clapper','socket_mainHand',(0,.29,0),(.035,.05,.035),'gold',14,8)
    else:
        patch('folded-apron','body',[[(-.19,.22,.27),(0,.25,.32),(.19,.22,.27)],
                                    [(-.23,-.02,.30),(0,-.03,.36),(.23,-.02,.30)],
                                    [(-.23,-.30,.24),(0,-.34,.29),(.23,-.30,.24)]],'cream',.019,2)
        patch('rounded-apron-pocket','body',[[(-.12,-.08,.35),(0,-.07,.375),(.12,-.08,.35)],
                                           [(-.12,-.17,.335),(0,-.18,.36),(.12,-.17,.335)],
                                           [(-.10,-.26,.31),(0,-.28,.335),(.10,-.26,.31)]],'cloth',.018,1)
        if owner=='cinnamon':
            path('asymmetric-scarf-roll','body',[(-.28,.27,.11),(-.12,.27,.26),(.16,.27,.24),(.28,.25,.12)],.043,'cloth',2)
            patch('tied-scarf-tail','body',[[(-.21,.23,.23),(-.11,.23,.30)],
                                         [(-.26,.06,.29),(-.15,.06,.33)],
                                         [(-.20,-.08,.31),(-.14,-.03,.34)]],'cloth',.018,2)
            for sign in [-1,1]:
                for i in range(3):ell('spice-freckle','head',(sign*(.27+.023*i),-.10+.022*(i%2),.29-.014*i),(.008,.009,.006),'patch',10,6)
        elif owner=='sorrel':
            for i in range(5):leaf('herb-folded-collar','body',((i-2)*.09,.20,.24+(.04 if i==2 else 0)),.85,(i-2)*-.25)
            for i in range(3):leaf('hatless-herb-sprig','head',(-.25+i*.035,.25,.21),.65,-.5+i*.45)
        else:
            for i in range(7):
                t=math.pi*(.12+i*.76/6)
                petal=ell('scalloped-flower-collar','body',(.27*math.cos(t),.19+.07*math.sin(t),.23+.06*math.sin(t)),(.07,.11,.024),'gold',16,10)
                petal.rotation_euler.y=t-math.pi/2
            leaf('flower-head-leaf','head',(-.24,.24,.20),.85,-.6)
            for i in range(5):
                t=i*math.tau/5
                ell('head-flower-petal','head',(-.25+.045*math.cos(t),.29+.045*math.sin(t),.235),(.035,.045,.015),'gold',12,8)
        # Real rounded flask, spoon and satchel replace all legacy added props.
        part='armR_flask' if role+'_armR_flask' in rig else 'socket_mainHand'
        lathe('rounded-tea-flask',part,[(-.11,.045),(-.07,.10),(.065,.115),(.14,.055),(.23,.045)],'ceramic',segments=28)
        ring('flask-copper-neck',part,(0,.20,0),.05,.05,.012,'gold')
        ell('flask-stopper',part,(0,.245,0),(.056,.033,.056),'patch',16,10)
        path('tea-spoon-handle','socket_offHand',[(0,-.13,0),(0,.26,0)],.015,'gold',1)
        ell('tea-spoon-bowl','socket_offHand',(0,.32,.01),(.06,.085,.019),'gold',18,10)
        satchel='satchel' if role+'_satchel' in rig else 'body'
        center=(0,0,.02) if satchel=='satchel' else (-.34,-.15,.1)
        ell('seed-pod-satchel',satchel,center,(.14,.17,.095),'patch',22,14)
        x,y,z=center
        path('satchel-stitched-flap',satchel,[(x-.12,y+.06,z+.05),(x,y-.01,z+.115),(x+.12,y+.06,z+.05)],.008,'cream',1)
        path('satchel-shoulder-strap','body',[(-.21,.27,.15),(-.31,.02,.18),(-.35,-.17,.16)],.017,'patch',1)

    # Lower held tools within the original sockets so static tools leave a
    # visible gap from the cheek. Runtime skill poses still need inspection.
    if owner in ['panko', 'mallow']:
        hand = rig[role+'_socket_mainHand']
        for obj in objects:
            if obj.parent is hand:
                obj.location += v((.035,-.095,.015))
