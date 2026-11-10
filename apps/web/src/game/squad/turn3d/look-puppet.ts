/** Camera-facing, jointed concept art in the existing lit cafe and event clock. */
import * as T from 'three';
import { parsePuppetRig, puppetMotion, puppetPhase, puppetPose, plantedPuppetPivot, type PuppetRig } from './look-puppet-rig';
const raw=import.meta.glob('../../../../../../assets/cardrpg-look/v3-puppets/*.rig.json',{eager:true,import:'default'});
const files=import.meta.glob('../../../../../../assets/cardrpg-look/v3-puppets/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>;
const rigs=new Map(Object.values(raw).map(value=>{const rig=parsePuppetRig(value);return[rig.id,rig] as const;}));
const urls=Object.fromEntries(Object.entries(files).map(([p,u])=>[p.split('/').at(-1)!,u]));
export const hasPuppetModel=(id:string)=>rigs.has(id);
export async function loadPuppetModel(id:string){
  const data=rigs.get(id);if(!data)throw Error(`Unknown puppet ${id}`);
  const texture=await new T.TextureLoader().loadAsync(urls[data.atlas]!);
  texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
  const model=new T.Group(),rig=new T.Group();
  model.userData={lookV2:true,lookPainted:true,lookPuppet:true,paintedRig:data,puppetId:id};
  rig.name=data.role;rig.userData.lookProps=true;model.add(rig);
  const width=data.height*data.aspect;
  const bottom=Math.max(...data.layers.map(l=>l.rect[1]+l.rect[3]));
  rig.position.y=-(1-bottom)*data.height;rig.userData.restY=rig.position.y;
  for(const layer of data.layers){
    const [x,y,w,h]=layer.rect,[px,py]=layer.pivot,[ax,ay,aw,ah]=layer.atlasRect;
    const group=new T.Group();group.name=`puppet_${layer.part}`;
    group.position.set((px-.5)*width,(1-py)*data.height,layer.depth);group.userData.puppetRest=group.position.toArray();
    group.userData.puppetContact=[(x+w/2-px)*width,(py-y-h)*data.height];rig.add(group);
    const geometry=new T.PlaneGeometry(w*width,h*data.height,4,4),pos=geometry.attributes.position!,uv=geometry.attributes.uv!;
    for(let i=0;i<pos.count;i++){
      const u=uv.getX(i),v=uv.getY(i);
      pos.setZ(i,.012*Math.sin(u*Math.PI)*Math.sin(v*Math.PI));
      uv.setXY(i,ax+u*aw,1-ay-ah+v*ah);
    }
    geometry.computeVertexNormals();
    const material=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,
      emissiveIntensity:.72,color:0x858585,roughness:1,metalness:0,transparent:true,alphaTest:.035,depthWrite:true,side:T.DoubleSide});
    material.userData={lookPainted:true,lookPuppet:true,puppetPart:layer.part,puppetRect:layer.rect,puppetAtlas:layer.atlasRect,puppetEyes:data.eyes,puppetEyeStyle:data.eyeStyle};
    const mesh=new T.Mesh(geometry,material);mesh.name=`illustrated_${id}_${layer.part}`;
    mesh.position.set((x+w/2-px)*width,(py-y-h/2)*data.height,0);group.add(mesh);
    if(id==='inkcap'&&layer.part==='tail'){
      material.userData.puppetTailOrigin=[mesh.position.x,mesh.position.y];
      material.userData.puppetTailReach=Math.max(...[-1,1].flatMap(dx=>[-1,1].map(dy=>Math.hypot(mesh.position.x+dx*w*width/2,mesh.position.y+dy*h*data.height/2))));
    }
  }
  for(const [name,[part,x,y]] of Object.entries(data.sockets)){
    const socket=new T.Group();socket.name=`${data.role}_socket_${name}`;socket.position.set(x,y,.06);
    rig.getObjectByName(`puppet_${part}`)!.add(socket);
  }
  for(const [name,part,dy] of [['armR','armR',0],['body','body',0],['socket_neck','body',.3],['socket_back','body',.05],['socket_tail','tail',0]] as const){
    const socket=new T.Group();socket.name=`${data.role}_${name}`;socket.position.set(0,dy,.04);
    (rig.getObjectByName(`puppet_${part}`)??rig).add(socket);
  }
  const head=new T.Group(),parent=rig.getObjectByName('puppet_head')!;head.name=`${data.role}_head`;
  head.position.set((data.face[0]-.5)*width,(1-data.face[1])*data.height-.20,.1).sub(parent.position);parent.add(head);
  return{scene:model,animations:[] as T.AnimationClip[]};
}

/** Clones get independent uniforms; shared atlas pixels never change. */
export function installPuppetMaterial(material:T.MeshStandardMaterial){
  const open={value:1},flash={value:0},glow={value:0},tailBend={value:0};
  material.userData.puppetEyeOpen=open;material.userData.puppetFlash=flash;material.userData.puppetGlow=glow;material.userData.puppetTailBend=tailBend;
  const eyes=material.userData.puppetPart==='head'?material.userData.puppetEyes as number[][]:[];
  const eyeGlow=material.userData.puppetEyeStyle==='glow';
  material.onBeforeCompile=shader=>{
    shader.uniforms.puppetEyeOpen=open;shader.uniforms.puppetFlash=flash;shader.uniforms.puppetGlow=glow;
    shader.fragmentShader='uniform float puppetEyeOpen; uniform float puppetFlash; uniform float puppetGlow;\n'+shader.fragmentShader;
    if(material.userData.puppetTailOrigin){
      shader.uniforms.puppetTailBend=tailBend;
      shader.uniforms.puppetTailOrigin={value:new T.Vector2(...material.userData.puppetTailOrigin as [number,number])};
      shader.uniforms.puppetTailReach={value:material.userData.puppetTailReach as number};
      shader.vertexShader='uniform float puppetTailBend; uniform vec2 puppetTailOrigin; uniform float puppetTailReach;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`
        #include <begin_vertex>
        vec2 tailPoint=transformed.xy+puppetTailOrigin;
        float tailWeight=clamp(length(tailPoint)/puppetTailReach,0.,1.);
        tailWeight=tailWeight*tailWeight*(3.-2.*tailWeight);
        float tailAngle=puppetTailBend*tailWeight;
        float tc=cos(tailAngle),ts=sin(tailAngle);
        transformed.xy=mat2(tc,ts,-ts,tc)*tailPoint-puppetTailOrigin;
      `);
    }
    if(eyes.length===2){
      shader.uniforms.puppetRect={value:new T.Vector4(...material.userData.puppetRect as [number,number,number,number])};
      shader.uniforms.puppetAtlas={value:new T.Vector4(...material.userData.puppetAtlas as [number,number,number,number])};
      shader.uniforms.puppetEyes={value:eyes.map(e=>new T.Vector4(...e as [number,number,number,number]))};
      shader.fragmentShader='uniform vec4 puppetRect; uniform vec4 puppetAtlas; uniform vec4 puppetEyes[2];\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
        #include <map_fragment>
        vec2 localUV=vec2((vMapUv.x-puppetAtlas.x)/puppetAtlas.z,(1.-vMapUv.y-puppetAtlas.y)/puppetAtlas.w);
        vec2 sourceXY=puppetRect.xy+localUV*puppetRect.zw;
        vec3 lidEmission=vec3(0.);float lidClosure=0.;
        for(int eye=0;eye<2;eye++){
          vec4 e=puppetEyes[eye];vec2 p=(sourceXY-e.xy)/e.zw;
          float lid=(1.-smoothstep(1.0,1.18,length(p)))*smoothstep(puppetEyeOpen*1.6-.16,puppetEyeOpen*1.6-.04,abs(p.y));
          vec2 furXY=vec2(e.x,e.y+e.w*1.25);
          vec2 furLocal=(furXY-puppetRect.xy)/puppetRect.zw;
          vec2 furUV=vec2(puppetAtlas.x+furLocal.x*puppetAtlas.z,1.-puppetAtlas.y-furLocal.y*puppetAtlas.w);
          vec3 fur=texture2D(map,furUV).rgb;
          float crease=(1.-smoothstep(.025,.07,abs(p.y-.12-.20*p.x*p.x)))*(1.-smoothstep(.7,.95,abs(p.x)))*(1.-smoothstep(.10,.4,puppetEyeOpen));
          fur=mix(fur,fur*.22,crease);
          diffuseColor.rgb=mix(diffuseColor.rgb,fur*diffuse,lid);lidEmission+=fur*lid;lidClosure+=lid;
        }
      `).replace('#include <emissivemap_fragment>',`
        #include <emissivemap_fragment>
        totalEmissiveRadiance=totalEmissiveRadiance*(1.-lidClosure)+lidEmission*emissive;
      `);
    }
    if(eyeGlow&&eyes.length===2){
      shader.fragmentShader=shader.fragmentShader.replace('float lid=(1.', 'float lid=0.*(1.').replace('lidEmission+=fur*lid;lidClosure+=lid;', `lidEmission+=fur*lid;lidClosure+=lid;
          float eyeMask=1.-smoothstep(.65,1.1,length(p));
          float eyeStrength=max(0.,puppetGlow)*9.;
          diffuseColor.rgb*=1.-eyeMask*(1.-puppetEyeOpen)*.6;
          lidEmission+=texture2D(map,vMapUv).rgb*eyeMask*eyeStrength;`);
    }
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      outgoingLight=mix(outgoingLight*(1.+puppetGlow),vec3(1.),puppetFlash);
      #include <opaque_fragment>
    `);
  };
  material.customProgramCacheKey=()=>`puppet-v5-${material.userData.puppetTailOrigin?'tail-flex':'rigid'}-${eyes.length===2?eyeGlow?'glow-eyes':'eyes':'plain'}`;
}
const relative=new T.Quaternion();
export function animateIllustrated(model:T.Object3D,camera:T.Camera,time:number,clip:string,progress:number|undefined,reduced:boolean,acting=false,ultimate=false,phaseFlash=0){
  if(!model.userData.lookPuppet)return;
  if(model.parent)model.parent.getWorldQuaternion(relative).invert();else relative.identity();
  model.quaternion.copy(relative).multiply(camera.quaternion);
  const data=model.userData.paintedRig as PuppetRig,rig=model.children[0]!;
  const phase=puppetPhase(model.userData.puppetActorId??data.id);
  const pose=puppetPose(puppetMotion(clip,acting,ultimate,data.boss),time,progress??.5,reduced,phase,data.id);
  rig.scale.set(1-pose.breathe+pose.hit*.025,1+pose.breathe-pose.hit*.035-pose.collapse,1);rig.rotation.set(0,0,pose.lean);
  rig.position.y=(rig.userData.restY as number)-pose.collapse*.3;
  for(const layer of rig.children){
    if(!layer.name.startsWith('puppet_'))continue;
    layer.position.fromArray(layer.userData.puppetRest as number[]);layer.rotation.set(0,0,0);
    const part=layer.name.slice(7);
    if(part==='head')layer.rotation.z=pose.head;
    if(part==='tail')layer.rotation.z=pose.tail;
    if(part==='wingL'||part==='wingR')layer.rotation.z=pose.wing*(part==='wingL'?1:-1);
    if(part==='armR'||part==='prop')layer.rotation.z=pose.prop;
    if(part==='armL')layer.rotation.z=pose.offhand;
    if(part==='footL'||part==='footR')layer.rotation.z=pose.gesture*(part==='footL'?.025:-.025);
    if(part==='cape'||part==='scarf')layer.rotation.z=pose.cloth;
    if(pose.plant&&['armR','armL','footR','footL'].includes(part)){
      const [x,y]=plantedPuppetPivot(layer.userData.puppetRest,layer.userData.puppetContact,layer.rotation.z,pose.lean,[rig.scale.x,rig.scale.y]);
      layer.position.x=x;layer.position.y=y;
    }
    for(const mesh of layer.children)if(mesh instanceof T.Mesh){
      const material=mesh.material as T.MeshStandardMaterial;
      if(material.userData.puppetEyeOpen)material.userData.puppetEyeOpen.value=pose.eyeOpen;
      if(material.userData.puppetFlash)material.userData.puppetFlash.value=reduced?0:Math.max(pose.flash,phaseFlash);
      if(material.userData.puppetGlow)material.userData.puppetGlow.value=pose.glow;
      if(material.userData.puppetTailBend)material.userData.puppetTailBend.value=pose.tailBend;
    }
  }
}
