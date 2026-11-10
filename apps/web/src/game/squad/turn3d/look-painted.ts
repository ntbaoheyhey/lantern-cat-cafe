/** Six articulated paint layers in the existing 3D cafe. Source/provenance in v3-painted. */
import * as T from 'three';
import rigs from '../../../../../../assets/cardrpg-look/v3-painted/rigs.json';
const files = import.meta.glob('../../../../../../assets/cardrpg-look/v3-painted/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string,string>;
const urls = Object.fromEntries(Object.entries(files).map(([path,url])=>[path.split('/').at(-1)!,url]));
type Rig = {role:string;height:number;aspect:number;face:number[];layers:{part:string;pivot:number[];rect:number[];file:string;depth:number}[]};
const catalog = rigs as Record<string,Rig>;
export const hasPaintedModel = (id:string) => !!catalog[id];
export async function loadPaintedModel(id:string) {
  const data=catalog[id]!;const model=new T.Group();model.userData={lookV2:true,lookPainted:true,paintedRig:data};
  const rig=new T.Group();rig.name=data.role;rig.userData.lookProps=true;model.add(rig);
  const soles=data.layers.filter(layer=>/feet|foot/.test(layer.part));
  if(soles.length)rig.position.y=-(1-Math.max(...soles.map(layer=>layer.rect[1]!+layer.rect[3]!)))*data.height;
  const width=data.height*data.aspect;
  const loader=new T.TextureLoader();
  await Promise.all(data.layers.map(async layer=>{
    const texture=await loader.loadAsync(urls[layer.file]!);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8;
    const [x,y,w,h]=layer.rect as [number,number,number,number];const [px,py]=layer.pivot as [number,number];
    const group=new T.Group();group.name=`paint_${layer.part}`;group.position.set((px-.5)*width,(1-py)*data.height,layer.depth);group.userData.paintRest=group.position.toArray();rig.add(group);
    const geometry=new T.PlaneGeometry(w*width,h*data.height,8,8);
    // A gentle convex surface lets the lamp key and rim respond to scene light.
    const pos=geometry.attributes.position!;
    for(let i=0;i<pos.count;i++) { const u=pos.getX(i)/(w*width)*2,v=pos.getY(i)/(h*data.height)*2;pos.setZ(i,.018*(1-u*u)*(1-v*v)); }
    geometry.computeVertexNormals();
    const material=new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:0xffffff,emissiveIntensity:.82,color:0x666666,roughness:.95,metalness:0,transparent:true,alphaTest:.025,depthWrite:true,side:T.DoubleSide});
    material.userData.lookPainted=true;material.userData.paintId=id;material.userData.paintRect=layer.rect;material.userData.paintPart=layer.part;
    const mesh=new T.Mesh(geometry,material);mesh.name=`painted_${id}_${layer.part}`;
    mesh.position.set((x+w/2-px)*width,(py-y-h/2)*data.height,0);mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);
  }));
  // Equipment keeps its existing semantic sockets instead of falling back to the feet.
  for(const [name,part,dx,dy] of [['armR','armR',0,0],['body','body',0,0],['socket_mainHand','armR',0,-.08],['socket_offHand','armL',0,-.08],['socket_neck','body',0,.30],['socket_back','body',0,.05],['socket_tail','tail',0,0]] as const){
    const anchor=new T.Group();anchor.name=`${data.role}_${name}`;anchor.position.set(dx,dy,.06);(rig.getObjectByName(`paint_${part}`)??rig).add(anchor);
  }
  const head=new T.Group();head.name=`${data.role}_head`;
  // Existing protected-face and effect anchors use the painted face centroid.
  head.position.set((data.face[0]!-.5)*width,(1-data.face[1]!)*data.height-.20,.10);
  const headLayer=rig.getObjectByName('paint_head');
  if(headLayer){head.position.sub(headLayer.position);headLayer.add(head);}else rig.add(head);
  model.userData.paintMaterialReady=false;
  return {scene:model,animations:[] as T.AnimationClip[]};
}
const relative=new T.Quaternion();
const eyeSets:Record<string,number[][]>={mochi:[[.423,.302,.075,.058],[.640,.312,.054,.055]],soot:[[.489,.272,.069,.047],[.670,.251,.045,.05]]};
/** Install after cloning: uniforms belong to this actor, never to the cached template. */
export function installPaintedMaterial(material:T.MeshStandardMaterial) {
  if(!material.userData.lookPainted || material.userData.paintPart!=='head')return;
  const eyes=eyeSets[material.userData.paintId as string];if(!eyes)return;
  const rect=material.userData.paintRect as number[];
  const open={value:1};material.userData.paintEyeOpen=open;
  material.onBeforeCompile=shader=>{
    shader.uniforms.paintEyeOpen=open;
    shader.uniforms.paintRect={value:new T.Vector4(...rect as [number,number,number,number])};
    shader.uniforms.paintEyes={value:eyes.map(e=>new T.Vector4(...e as [number,number,number,number]))};
    shader.fragmentShader='uniform float paintEyeOpen; uniform vec4 paintRect; uniform vec4 paintEyes[2];\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      vec2 paintXY=vec2(paintRect.x+vMapUv.x*paintRect.z,paintRect.y+(1.-vMapUv.y)*paintRect.w);
      vec3 paintEmission=vec3(0.);float paintClosure=0.;
      for(int eye=0;eye<2;eye++) {
        vec4 e=paintEyes[eye];vec2 p=(paintXY-e.xy)/e.zw;
        float region=1.-smoothstep(.82,1.,length(p));
        float lid=region*smoothstep(paintEyeOpen-.12,paintEyeOpen+.03,abs(p.y));
        vec2 furXY=vec2(paintXY.x,e.y-e.w*1.28);
        vec2 furUV=vec2((furXY.x-paintRect.x)/paintRect.z,1.-(furXY.y-paintRect.y)/paintRect.w);
        vec3 fur=texture2D(map,furUV).rgb;
        diffuseColor.rgb=mix(diffuseColor.rgb,fur*diffuse,lid);
        paintEmission+=fur*lid;paintClosure+=lid;
      }
    `);
    // Painted light lives in emissive as well as diffuse; close both layers together.
    shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`
      #include <emissivemap_fragment>
      totalEmissiveRadiance=totalEmissiveRadiance*(1.-paintClosure)+paintEmission*emissive;
    `);
  };
  material.customProgramCacheKey=()=> 'painted-eyelids-v1';
}

/** Same event clock/root travel as 3D; bounded cutout motion, no per-frame allocations. */
export function animatePainted(model:T.Object3D,camera:T.Camera,time:number,clip:string,progress:number|undefined,reduced:boolean,acting=false) {
  if(!model.userData.lookPainted)return;
  // Face the active camera in both axes; root travel still follows battle formations.
  model.parent!.getWorldQuaternion(relative).invert();model.quaternion.copy(relative).multiply(camera.quaternion);
  // The event owns the whole gesture: travel/recovery clips can be step/idle.
  const attack=acting||/attack|skill|cast|ultimate|special|button-guard|yarn-giant|telegraph/.test(clip),hit=/hit|stagger/.test(clip),happy=/victory|heal/.test(clip);
  const t=Math.max(0,Math.min(1,progress??.5)),beat=Math.sin(Math.PI*t);
  const strike=t<.30?-.45*Math.sin(t/.30*Math.PI/2):t<.55?-.45+1.45*Math.sin((t-.30)/.25*Math.PI/2):Math.cos((t-.55)/.45*Math.PI/2);
  const breathe=reduced?0:Math.sin(time*2.4)*.012;
  const cycle=time%5.3,blink=reduced?1:1-.96*Math.exp(-Math.pow((cycle-4.85)/.065,2));
  const expression=hit?.45:happy?.62:clip==='KO'?.05:1;
  model.traverse(node=>{if(node instanceof T.Mesh){const m=node.material as T.MeshStandardMaterial;if(m.userData.paintEyeOpen)m.userData.paintEyeOpen.value=blink*expression;}});
  const rig=model.children[0]!;rig.scale.set(1-breathe+(hit?.04*beat:0),1+breathe-(hit?.06*beat:0),1);
  rig.rotation.z=reduced?0:hit?-.07*beat:attack?-.035*strike:Math.sin(time*1.2)*.008;
  for(const layer of rig.children){
    if(!layer.name.startsWith('paint_'))continue;
    const part=layer.name.slice(6);layer.rotation.set(0,0,0);layer.scale.set(1,1,1);
    const rest=layer.userData.paintRest as number[];layer.position.fromArray(rest);
    if(reduced)continue;
    if(part==='head')layer.rotation.z=hit?-.07*beat:attack?.035*strike:Math.sin(time*1.2)*.018;
    if(part==='tail')layer.rotation.z=Math.sin(time*1.5)*.09;
    if(part==='armR')layer.rotation.z=attack?-.18*strike:happy?-.16:Math.sin(time*1.9)*.028;
    if(part==='armL')layer.rotation.z=attack?.13*strike:happy?.16:-Math.sin(time*1.9)*.028;
    if(part==='footL'||part==='footR'){
      const side=part==='footL'?1:-1;
      layer.rotation.z=attack?side*.04*strike:Math.sin(time*1.2)*side*.008;
      layer.position.y+=attack?Math.max(0,strike*side)*.025:0;
    }
  }
}
