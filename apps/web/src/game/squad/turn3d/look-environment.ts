/** Original analytic café reflection, never an external HDRI. */
import * as T from 'three';
import { loadingFrame } from './loading';
export async function createLookEnvironment(renderer:T.WebGLRenderer,cancelled:()=>boolean){
 const width=128,height=64,data=new Float32Array(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+.5)/width,v=(y+.5)/height,sky=Math.max(0,1-v*1.7),floor=Math.max(0,(v-.55)/.45);
  const lamp=(cx:number)=>Math.exp(-(((u-cx)/.035)**2)-((v-.33)/.10)**2);
  const warm=lamp(.18)+lamp(.67),window=Math.exp(-(((u-.43)/.13)**6)-((v-.47)/.19)**6);
  const i=(y*width+x)*4;data[i]=.10+sky*.08+floor*.11+warm*1.3+window*.06;data[i+1]=.13+sky*.13+floor*.06+warm*.79+window*.11;data[i+2]=.15+sky*.19+floor*.03+warm*.39+window*.18;data[i+3]=1;
 }
 const texture=new T.DataTexture(data,width,height,T.RGBAFormat,T.FloatType);texture.mapping=T.EquirectangularReflectionMapping;texture.needsUpdate=true;
 const generator=new T.PMREMGenerator(renderer);
 try{
  generator.compileEquirectangularShader();await loadingFrame();if(cancelled())return;
  renderer.initTexture(texture);await loadingFrame();if(cancelled())return;
  return generator.fromEquirectangular(texture);
 }finally{texture.dispose();generator.dispose();}
}
