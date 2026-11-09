"""Original sewn, wound and glazed opponents; geometry from authored parameters."""
import math
import bpy


def spec(role, fur, cloth, accent='#BD6C55', boss=False):
    return dict(role=role, fur=fur, patch='#735A50', cloth=cloth, accent=accent,
                inner='#C88971', eye='#C9A36A', boss=boss)


PALETTES = {
    'button-guard': spec('guard', '#B88B65', '#77757D'),
    'sock-skipper': spec('flanker', '#AA7C82', '#D1B5A0'),
    'spool-ram': spec('charger', '#9A898C', '#B5785C'),
    'needle-moth': spec('ranger', '#A4A1AA', '#976B78'),
    'teacup-healer': spec('healer', '#C1B8AA', '#8A9694'),
    'crumb-sentinel': spec('guard', '#C39B69', '#996C58'),
    'pollen-scout': spec('ranger', '#B6A476', '#827D65'),
    'rain-spool': spec('charger', '#8097A4', '#8D766C'),
    'binding-thread': spec('thread', '#9C809A', '#C29F8B'),
    'practice-cushion': spec('dummy', '#BC9A88', '#847783'),
    'yarn-giant': spec('yarn', '#907B99', '#B17F72', boss=True),
    'kettle-knight': spec('elite', '#AD9381', '#7B8A8B', '#C48760', True),
    'pantry-crown': spec('yarn', '#A19C8A', '#9D7476', '#C69765', True),
}


def dress(owner, role, config, rig, objects, ell, path, patch, attach, materials, v):
    root=rig[role]
    root['lookProps']=True
    root['lookTier']='improved-opponent-sculpture'
    root['originalDesign']=owner

    def tube(name, part, pts, radius=.016, mat='gold', radii=None):
        return path(name,part,pts,radius,mat,1,radii)

    def ring(name, part, center, rx, ry, radius=.014, mat='gold', plane='xy'):
        x,y,z=center
        points=[]
        for i in range(25):
            t=math.tau*i/24
            points.append((x+rx*math.cos(t),y+ry*math.sin(t),z) if plane=='xy'
                          else (x+rx*math.cos(t),y,z+ry*math.sin(t)))
        return tube(name,part,points,radius,mat)

    def lathe(name,part,profile,mat='ceramic',loc=(0,0,0),segments=28):
        vertices=[v((r*math.cos(math.tau*i/segments),y,r*math.sin(math.tau*i/segments)))
                  for y,r in profile for i in range(segments)]
        faces=[]
        for j in range(len(profile)-1):
            for i in range(segments):
                q=j*segments+i;n=j*segments+(i+1)%segments
                faces.append((q,n,n+segments,q+segments))
        faces.extend([tuple(reversed(range(segments))),tuple(range((len(profile)-1)*segments,len(vertices)))])
        mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update()
        obj=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(obj)
        attach(obj,name,part,mat,loc)
        bevel=obj.modifiers.new('Soft machined rim','BEVEL');bevel.width=.006;bevel.segments=2
        return obj

    def pillow(name,part,loc,scale,mat='cloth'):
        bpy.ops.mesh.primitive_cube_add(size=1)
        obj=bpy.context.object;obj.scale=(scale[0],scale[2],scale[1]);attach(obj,name,part,mat,loc)
        bevel=obj.modifiers.new('Stuffed rounded edges','BEVEL');bevel.width=.16;bevel.segments=4
        sub=obj.modifiers.new('Soft cushion','SUBSURF');sub.levels=1
        return obj

    def wound(name, part, radius, height, depth, count=9):
        # Oblique courses intersect like wound yarn; every course is original.
        for j in range(count):
            angle=(j-count/2)*.13
            points=[]
            for i in range(33):
                t=math.tau*i/32
                x=radius*math.cos(t);y=height*math.sin(t)
                points.append((x*math.cos(angle)-y*math.sin(angle),
                               x*math.sin(angle)+y*math.cos(angle),depth*math.sin(t*.5+j*.4)))
            tube(name,part,points,.015 if not config['boss'] else .026,'cloth')

    boss=config['boss']
    # Weight-bearing feet and soft articulated arms stay at inherited pivots.
    for side,sign in [('L',-1),('R',1)]:
        ell('weighted-boot','foot'+side,(0,0,.05),(.21,.15,.29) if boss else (.14,.105,.18),'patch',20,12)
        if not boss:
            ell('connected-stuffed-leg','foot'+side,(0,.20,0),(.075,.18,.075),'cloth',16,10)
        if role=='yarn':
            ell('upper-sewn-arm','arm'+side,(sign*.18,-.12,.02),(.34,.23,.25),'fur',22,14)
            ell('wound-heavy-paw','forearm'+side,(0,-.08,.04),(.28,.28,.29),'cloth',22,14)
            ring('paw-seam','forearm'+side,(0,-.10,.28),.19,.16,.017,'patch')
        elif role!='ranger':
            ell('sewn-arm','arm'+side,(sign*.015,-.11,.01),(.095,.17,.105),'cloth',18,12)
            ell('mitten','arm'+side,(sign*.02,-.24,.04),(.12,.10,.13),'patch',18,10)

    if owner in ['button-guard','crumb-sentinel']:
        if owner=='button-guard':
            ell('four-hole-button-body','body',(0,-.015,.075),(.38,.38,.16),'ceramic',40,24)
            ring('button-body-rim','body',(0,-.015,.135),.36,.36,.020)
            for x in [-.09,.09]:
                for y in [-.10,.08]:ell('body-button-hole','body',(x,y,.225),(.054,.054,.009),'ink',16,10)
            tube('body-cross-stitch-a','body',[(-.09,.08,.245),(.09,-.10,.245)],.022,'cream')
            tube('body-cross-stitch-b','body',[(.09,.08,.255),(-.09,-.10,.255)],.022,'cream')
            ell('domed-button-helm','head',(0,0,.075),(.25,.24,.135),'patch',32,20)
            ring('button-helm-rim','head',(0,0,.12),.24,.23,.016)
            for x in [-.075,.075]:
                ell('helm-stitch-recess','head',(x,.11,.19),(.021,.025,.006),'ink',12,8)
            tube('helm-thread','head',[(-.075,.11,.205),(0,.15,.21),(.075,.11,.205)],.012,'cream')
        else:
            ell('toasted-biscuit-body','body',(0,0,.015),(.31,.36,.22),'cloth',32,20)
            pillow('biscuit-helmet','head',(0,0,.035),(.49,.40,.38),'fur')
            for x in [-.15,0,.15]:
                for y in [-.15,.03,.18]:
                    ell('toasted-biscuit-dimple','body',(x,y,.19 if x else .225),(.018,.018,.006),'patch',10,8)
            for x in [-.14,0,.14]:
                ell('baked-helm-dimple','head',(x,.13,.194),(.018,.018,.006),'patch',10,8)
            tube('broken-crust-brow','head',[(-.2,.19,.17),(-.05,.21,.19),(.08,.18,.20),(.22,.20,.16)],.025,'gold')
        ell('hostile-button-buckler','armL',(-.04,-.17,.19),(.27,.27,.07),'ceramic',32,20)
        for x,y in [(-.06,-.11),(.06,-.11),(-.06,-.23),(.06,-.23)]:
            ell('buckler-hole','armL',(x-.04,y,.26),(.027,.027,.008),'ink',12,8)
        tube('button-buckler-cross-a','armL',[(-.1,-.11,.274),(.02,-.23,.274)],.012,'gold')
        tube('button-buckler-cross-b','armL',[(.02,-.11,.282),(-.1,-.23,.282)],.012,'gold')
        tube('wooden-needle-baton','armR',[(0,-.35,.1),(0,.28,.1)],.023,'patch')
        ring('baton-eye','armR',(0,.30,.1),.04,.07,.014)
        if owner=='crumb-sentinel':tube('tabard-edge','body',[(-.26,.28,.205),(-.27,-.27,.22),(0,-.31,.23),(.27,-.27,.22),(.26,.28,.205)],.014,'gold')
    elif owner=='sock-skipper':
        tube('slouched-knitted-sock','body',[(0,-.37,0),(-.03,-.12,0),(.03,.19,-.01),(.07,.45,0)],.24,'fur',[.75,1,.85,.78])
        ell('rounded-sock-toe','body',(-.035,-.31,.055),(.22,.15,.24),'fur',28,16)
        lathe('ribbed-sock-cuff','head',[(-.12,.19),(-.08,.24),(.12,.24),(.15,.20)],'cloth')
        for i in range(12):
            t=i*math.tau/12
            tube('cuff-knit-rib','head',[(.242*math.cos(t),-.08,.242*math.sin(t)),(.242*math.cos(t),.11,.242*math.sin(t))],.009,'cream')
        pillow('heel-darning-patch','body',(-.15,-.22,.15),(.25,.20,.08),'patch')
        tube('loose-sock-thread','tail',[(0,0,0),(-.13,-.05,-.1),(-.17,.12,-.12),(-.05,.20,-.1)],.023,'gold')
        for x in [-.08,0,.08]:tube('heel-stitches','body',[(x-.18,-.18,.20),(x-.14,-.25,.21)],.006,'cream')
        for y in [-.12,-.02,.08]:
            tube('sock-darned-course','body',[(-.09,y,.205),(-.03,y+.025,.226),(.03,y,.226),(.09,y+.025,.205)],.006,'cloth')
    elif owner in ['spool-ram','rain-spool']:
        spindle=lathe('thread-spindle','body',[(-.30,.05),(-.29,.315),(.29,.315),(.30,.05)],'fur',segments=40)
        spindle.rotation_euler.y=math.pi/2
        for x in [-.31,.31]:
            ell('wood-spool-flange','body',(x,0,0),(.035,.36,.36),'patch',32,20)
        for i in range(10):
            x=-.27+i*.06
            tube('spool-winding','body',[(x,.325*math.cos(t),.325*math.sin(t)) for t in [math.tau*j/24 for j in range(25)]],.016,'cloth')
        ell('ram-face','head',(0,0,0),(.25,.22,.15),'cream' if owner=='spool-ram' else 'cloth',24,14)
        for side,sign in [('L',-1),('R',1)]:
            tube('curled-wood-horn','ear'+side,[(0,0,0),(sign*.12,.13,.01),(sign*.18,.03,.07),(sign*.11,-.07,.1),(sign*.03,-.03,.1)],.047,'patch',[1,1,.9,.65,.2])
        if owner=='rain-spool':
            for x in [-.12,0,.12]:
                ell('rain-enamel-drop','head',(x,.13,.14),(.023,.043,.012),'ceramic',14,10)
        tube('spool-unwinding-tail','tail',[(0,0,0),(.1,-.1,-.15),(.26,-.1,-.18),(.29,.02,-.13)],.025,'cloth')
    elif owner in ['needle-moth','pollen-scout']:
        ell('moth-abdomen','body',(0,-.08,0),(.16,.31,.16),'fur',24,16)
        for y in [-.15,-.04,.07]:
            tube('moth-sewn-course','body',[(-.10,y,.10),(0,y-.015,.157),(.10,y,.10)],.008,'patch')
        ell('moth-head','head',(0,0,0),(.21,.19,.16),'fur',24,16)
        for side,sign in [('L',-1),('R',1)]:
            rows=[[(0,-.13,0),(sign*.24,-.22,.035),(sign*.43,-.13,0)],
                  [(0,.13,.01),(sign*.35,.12,.09),(sign*.52,.26,.015)],
                  [(0,.21,0),(sign*.25,.43,.035),(sign*.39,.45,0)]]
            patch('folded-fabric-wing','wing'+side,rows,'cloth',.025,2)
            tube('wing-vein','wing'+side,[(0,-.1,.04),(sign*.25,.10,.11),(sign*.38,.40,.05)],.013,'gold')
            for y in [.02,.23]:
                ell('wing-eyelet','wing'+side,(sign*.29,y,.095),(.07,.085,.009),'patch',16,10)
                ell('wing-eyelet-inset','wing'+side,(sign*.29,y,.105),(.032,.047,.008),'cream',14,10)
            tube('curved-antenna','ear'+side,[(0,0,0),(sign*.07,.13,0),(sign*.12,.17,.03)],.013,'patch')
            ell('antenna-seed','ear'+side,(sign*.12,.17,.03),(.027,.03,.027),'gold',12,8)
            tube('moth-hand','arm'+side,[(0,0,0),(sign*.04,-.16,.08)],.027,'patch')
        if owner=='needle-moth':
            tube('sewing-needle','armR',[(.12,-.34,.10),(.12,.25,.10)],.012,'gold')
            ring('needle-eye','armR',(.12,.27,.1),.025,.05,.009)
        else:
            ell('pollen-basket','armL',(-.10,-.20,.12),(.16,.14,.12),'patch',20,12)
            for i in range(5):
                t=i*math.tau/5
                ell('pollen-seed','armL',(-.10+.07*math.cos(t),-.07,.12+.06*math.sin(t)),(.035,.035,.03),'gold',12,8)
    elif owner=='teacup-healer':
        lathe('hollow-glazed-teacup','body',[(-.29,.19),(-.25,.23),(.19,.33),(.30,.34),(.31,.30),(.21,.29),(-.19,.20)],'ceramic',segments=40)
        ring('cup-rolled-lip','body',(0,.30,0),.325,.325,.018,'gold','xz')
        ell('tea-surface','body',(0,.23,0),(.295,.012,.295),'patch',40,20)
        tube('cup-curved-handle','earL',[(0,.16,0),(.20,.17,0),(.25,0,0),(.16,-.18,0),(-.04,-.17,0)],.04,'ceramic')
        for x in [-.18,0,.18]:
            tube('cup-painted-vine','body',[(x,-.12,math.sqrt(.257**2-x*x)),(x+.02,.01,math.sqrt(.284**2-(x+.02)**2)),(x,.13,math.sqrt(.313**2-x*x))],.007,'gold')
        tube('folded-steam-plume','earR',[(0,-.20,0),(0,0,0),(-.04,.17,0),(.05,.30,.01),(0,.43,.01)],.035,'cream',[.8,1,.8,.5,.04])
        tube('tea-stirring-spoon','armR',[(0,-.3,.1),(0,.16,.1)],.019,'gold')
        ell('tea-spoon-bowl','armR',(0,.23,.1),(.065,.09,.025),'gold',18,12)
    elif owner=='binding-thread':
        lathe('binding-spool','body',[(-.36,.18),(-.34,.27),(-.27,.27),(-.24,.18),(.24,.18),(.27,.27),(.34,.27),(.36,.18)],'patch')
        for i in range(12):ring('thread-course','body',(0,-.22+i*.04,0),.20,.20,.019,'cloth','xz')
        ell('knotted-thread-head','head',(0,0,0),(.21,.16,.12),'cloth',24,14)
        for side,sign in [('L',-1),('R',1)]:
            tube('thread-bow','ear'+side,[(0,0,0),(sign*.16,.16,-.02),(sign*.23,.03,0),(0,0,.02)],.035,'cloth')
        tube('binding-long-tail','tail',[(0,0,0),(-.13,.04,.12),(.1,.05,.20),(.28,.02,.15)],.029,'cloth')
    elif owner=='practice-cushion':
        pillow('stuffed-practice-pillow','body',(0,.08,0),(.82,.72,.52),'cloth')
        tube('pillow-piped-edge','body',[(-.36,-.21,.23),(-.36,.36,.23),(.36,.36,.23),(.36,-.21,.23),(-.36,-.21,.23)],.019,'gold')
        for side,sign in [('L',-1),('R',1)]:
            tube('corner-tassel','ear'+side,[(0,0,0),(sign*.07,.04,0),(sign*.12,-.05,0)],.035,'patch')
        for x in [-.22,0,.22]:
            for y in [-.1,.22]:
                ell('tufted-pillow-button','body',(x,y,.275),(.028,.028,.010),'patch',12,8)
        tube('loose-pillow-seam','tail',[(0,0,0),(.12,0,-.05),(.15,.11,-.02)],.017,'gold')
    elif owner=='yarn-giant':
        ell('giant-wound-body','body',(0,0,0),(.72,.78,.60),'fur',36,24)
        wound('wound-yarn-layer','body',.70,.76,.59,16)
        ell('giant-knot-face','head',(0,0,0),(.39,.28,.19),'cloth',28,18)
        for side,sign in [('L',-1),('R',1)]:
            tube('giant-knotted-ear','ear'+side,[(0,0,0),(sign*.12,.19,0),(sign*.24,.15,.02),(sign*.13,0,.04)],.065,'cloth')
        ring('exposed-tied-knot','exposed_knot',(0,0,.03),.15,.13,.048,'gold')
        tube('launcher-yarn-loop','launcher',[(0,0,0),(.12,.20,.01),(.25,.18,.03),(.19,.03,.02)],.055,'patch')
        tube('giant-yarn-tail','tail',[(0,0,0),(-.20,-.20,-.06),(-.38,-.12,-.06),(-.31,.05,-.02)],.055,'cloth')
    elif owner=='kettle-knight':
        ell('glazed-copper-kettle','body',(0,0,0),(.43,.43,.39),'ceramic',36,24)
        lathe('kettle-rounded-lid','head',[(-.045,.08),(-.035,.39),(.025,.38),(.105,.21),(.12,.025)],'patch',segments=36)
        ell('kettle-lid-knob','earR',(0,0,0),(.09,.075,.08),'gold',20,14)
        tube('broad-kettle-handle','tail',[(-.34,0,-.10),(-.38,.50,-.10),(0,.72,-.12),(.38,.50,-.10),(.34,0,-.10)],.060,'patch')
        tube('curved-kettle-spout','armR',[(0,0,0),(.13,.09,.09),(.25,.27,.11),(.27,.40,.12)],.10,'ceramic',[1,.9,.65,.6])
        ring('kettle-base-band','body',(0,-.27,0),.34,.32,.025,'gold','xz')
        tube('kettle-chest-seam','body',[(-.28,-.18,.31),(0,-.24,.39),(.28,-.18,.31)],.012,'gold')
    else:
        # A tiered pantry monarch with a deliberately asymmetric ceramic crown.
        for y,rx in [(-.48,.53),(-.12,.66),(.26,.55)]:
            lathe('stacked-pantry-plate','body',[(-.07,.05),(-.03,rx*.88),(.03,rx),(.08,rx*.9),(.085,.02)],'ceramic',(0,y,0),36)
            ring('plate-gilded-rim','body',(0,y+.04,0),rx,rx,.018,'gold','xz')
        ell('pantry-porcelain-face','head',(0,0,0),(.39,.28,.19),'cream',28,18)
        lathe('pantry-crown-base','body',[(.48,.36),(.55,.39),(.60,.36)],'patch',segments=36)
        for i in range(7):
            t=i*math.tau/7;h=.22 if i%2 else .34
            x,z=.34*math.cos(t),.34*math.sin(t)
            lathe('asymmetric-crown-spire','body',[(0,.055),(h*.8,.038),(h,.005)],'gold',(x,.57,z),16)
            ell('crown-pearl','body',(x,.58+h,z),(.035,.035,.035),'cream',12,8)
        lathe('pantry-shoulder-cup','launcher',[(-.10,.08),(.10,.14),(.14,.13),(.12,.10),(-.07,.06)],'ceramic',segments=24)
        ring('pantry-front-seal','exposed_knot',(0,0,.03),.13,.13,.035,'gold')
        tube('pantry-apron-tie','tail',[(0,0,0),(-.1,-.17,-.08),(-.3,-.15,-.1)],.04,'cloth')

    # Hostile read uses small amber eyes under angular brows, never cat ears or
    # a copied character. Eyes stay in the existing animated expression node.
    spacing=.17 if boss else .09
    inset={'guard':-.025,'flanker':-.040,'ranger':-.035,'charger':-.025,'healer':-.065}.get(role,-.005)
    for sign in [-1,1]:
        ell('enemy-eye-rim','eyes',(sign*spacing,0,.015+inset),(.095,.075,.016) if boss else (.055,.066,.015),'patch',18,12)
        ell('amber-enemy-eye','eyes',(sign*spacing,0,.03+inset),(.068,.054,.015) if boss else (.039,.044,.012),'eye',18,12)
        ell('enemy-pupil','eyes',(sign*spacing,0,.044+inset),(.027,.041,.006) if boss else (.017,.032,.005),'ink',16,10)
        ell('enemy-eye-glint','eyes',(sign*spacing-.013,.021,.05+inset),(.012,.014,.006),'glint',10,8)
        tube('angled-enemy-brow','eyes',[(sign*(spacing-.05),.06,.044+inset),(sign*spacing,.085,.042+inset),(sign*(spacing+.05),.09,.03+inset)],.013,'patch')
