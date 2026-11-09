import * as T from 'three';
/** A fixed uniform pair per loaded puppet; pulses never create materials or programs. */
export class LookEffectRim {
  private readonly pulses=new WeakMap<T.Object3D,{power:T.IUniform<number>;color:T.IUniform<T.Color>}>();
  private readonly faces={value:Array.from({length:12},()=>new T.Vector4())};
  private readonly count={value:0};
  private readonly resolution={value:new T.Vector2(1,1)};
  install(model:T.Object3D){
    const pulse={power:{value:0},color:{value:new T.Color('#ffd395')}};
    this.pulses.set(model,pulse);
    model.traverse(node=>{
      if(!(node instanceof T.Mesh))return;
      for(const material of Array.isArray(node.material)?node.material:[node.material]){
        if(!(material instanceof T.MeshStandardMaterial))continue;
        const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
        material.onBeforeCompile=(shader,renderer)=>{
          previous.call(material,shader,renderer);
          Object.assign(shader.uniforms,{v5RimPower:pulse.power,v5RimColor:pulse.color,v5RimFaces:this.faces,v5RimCount:this.count,v5RimResolution:this.resolution});
          shader.fragmentShader='uniform float v5RimPower;uniform vec3 v5RimColor;uniform vec4 v5RimFaces[12];uniform int v5RimCount;uniform vec2 v5RimResolution;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
            float v5Safe=1.;vec2 v5Point=gl_FragCoord.xy/v5RimResolution;
            for(int i=0;i<12;i++){if(i>=v5RimCount)break;vec4 f=v5RimFaces[i];vec2 q=(v5Point-f.xy)/max(f.zw,vec2(.00001));v5Safe*=smoothstep(1.,1.6,dot(q,q));}
            totalEmissiveRadiance+=v5RimColor*v5RimPower*pow(1.-abs(dot(normal,normalize(vViewPosition))),4.)*v5Safe;
          `);
        };
        material.customProgramCacheKey=()=>key+'-v5-pulse-1';
      }
    });
  }
  protect(faces:T.Vector4[],count:number,width:number,height:number){this.faces.value=faces;this.count.value=count;this.resolution.value.set(width,height);}
  update(model:T.Object3D,power:number,color:string){const pulse=this.pulses.get(model);if(pulse){pulse.power.value=power;pulse.color.value.set(color);}}
}
