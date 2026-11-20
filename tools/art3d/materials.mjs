// Original deterministic surface bakes. No canvas package, samples or downloaded textures.
import * as T from '../../apps/web/node_modules/three/build/three.module.js';
import {deflateSync} from 'node:zlib';
const SIZE=128;
const noise=(x,y)=>{let n=Math.imul(x+17,374761393)^Math.imul(y+71,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295};
function height(kind,x,y){x=(x+SIZE)%SIZE;y=(y+SIZE)%SIZE;
 const n=noise(x,y),u=x/SIZE,v=y/SIZE;
 if(kind==='knit'){const row=Math.floor(v*8),phase=u*8+row%2*.5;return .5+.25*Math.cos((phase+Math.sin(v*16*Math.PI)*.14)*Math.PI*2)+.13*Math.sin(v*16*Math.PI)+n*.1}
 if(kind==='brass')return .5+.15*Math.sin(v*64*Math.PI)+n*.13;
 if(kind==='ceramic'||kind==='gloss')return .7+n*.05;
 return .6+n*.18+.06*Math.sin(u*64*Math.PI)*Math.sin(v*64*Math.PI);
}
const materials=new Map();
export function bakedMaterial(kind){
 if(materials.has(kind))return materials.get(kind);
 const albedo=new Uint8Array(SIZE*SIZE*4),normal=new Uint8Array(SIZE*SIZE*4);
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const at=(y*SIZE+x)*4,h=height(kind,x,y),v=Math.round(218+h*35);
  albedo.set([v,v,v,255],at);
  const nx=(height(kind,x-1,y)-height(kind,x+1,y))*(kind==='knit'?1.1:.38),ny=(height(kind,x,y-1)-height(kind,x,y+1))*.7;
  const n=new T.Vector3(nx,ny,1).normalize();normal.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],at);
 }
 const tex=(data,name)=>{const t=new T.DataTexture(data,SIZE,SIZE,T.RGBAFormat);t.name=`original_${kind}_${name}_128`;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t};
 const map=tex(albedo,'albedo');map.colorSpace=T.SRGBColorSpace;
 const m=new T.MeshStandardMaterial({name:`original_${kind}_baked`,vertexColors:true,map,normalMap:tex(normal,'normal'),normalScale:new T.Vector2(.45,.45),roughness:kind==='brass'?.37:kind==='ceramic'?.23:kind==='gloss'?.14:.91,metalness:kind==='brass'?.62:0});
 materials.set(kind,m);return m;
}
export function materialKind(node){
 const name=node.name;
 if(/eyes/.test(name))return 'gloss';
 if(/yarn|flanker/.test(name))return 'knit';
 if(/healer/.test(name))return 'ceramic';
 if(/shield|ladle|lantern|launcher|guard_body|elite_body|elite_head|knot/.test(name))return 'brass';
 return 'felt';
}
// A minimal, explicit DataTexture → PNG adapter for GLTFExporter in Node.
// Only putImageData is supported; unexpected drawing fails rather than producing a blank bake.
const crc32=data=>{let c=0xffffffff;for(const b of data){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^0xffffffff)>>>0};
const chunk=(name,data)=>{const type=Buffer.from(name),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length,0);type.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([type,data])),8+data.length);return out};
export function pngBytes(data,width,height){const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4).copy(rows,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows,{level:9})),chunk('IEND',Buffer.alloc(0))])}
export function installTextureExport(){
 globalThis.ImageData=class{constructor(data,width,height){Object.assign(this,{data,width,height})}};
 globalThis.OffscreenCanvas=class{constructor(width,height){Object.assign(this,{width,height})}getContext(){return{putImageData:image=>{this.image=image},translate:()=>{},scale:()=>{throw Error('Unexpected flipped bake')}}}async convertToBlob(){return new Blob([pngBytes(this.image.data,this.width,this.height)],{type:'image/png'})}};
}
export const BAKE_PARAMETERS={size:SIZE,seed:'integer hash x+17,y+71',surfaces:['felt','knit','brass','ceramic','gloss'],channels:'embedded albedo + finite-difference tangent normal PNG',vertexAO:'analytic neighboring-bound sphere occlusion, capped at 20%; downward ambient at 7%',compression:'PNG deflate level 9'};
