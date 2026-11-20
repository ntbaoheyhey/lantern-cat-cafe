// D4: replay offline-authored original paint. No battle route imports this drill.
// Methods were selected in LEARN/Q3.md, X11/X12; no per-frame crop/scale fitting.
export async function createD4(T:any,loadTexture:any,rootPath:string,revision:number){
 const base=rootPath+'tools/v3craft-drills/assets/';
 const recipe=await fetch(base+`d4-r${revision}.json`).then(r=>{if(!r.ok)throw new Error('D4 atlas metadata missing');return r.json();});
 const texture=await loadTexture(base+recipe.atlas);
 texture.generateMipmaps=false;texture.minFilter=texture.magFilter=T.LinearFilter;
 texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;texture.premultiplyAlpha=false;texture.needsUpdate=true;
 const root=new T.Group();root.renderOrder=5;
 const uniforms={uAtlas:{value:texture},uAtlasSize:{value:new T.Vector2(recipe.width,recipe.height)},uCell:{value:recipe.cell},uPadding:{value:recipe.padding},uColumns:{value:recipe.columns},uFrame:{value:0},uNext:{value:0},uBlend:{value:0}};
 const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,toneMapped:false,uniforms,
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D uAtlas;uniform vec2 uAtlasSize;uniform float uCell;uniform float uPadding;uniform float uColumns;uniform float uFrame;uniform float uNext;uniform float uBlend;varying vec2 vUv;
vec4 frameAt(float frame){
 float stride=uCell+2.*uPadding;float column=mod(frame,uColumns);float row=floor(frame/uColumns);
 vec2 origin=vec2(column*stride+uPadding,uAtlasSize.y-row*stride-uPadding-uCell);
 vec2 px=origin+clamp(vUv*uCell,vec2(.5),vec2(uCell-.5));
 return texture2D(uAtlas,px/uAtlasSize);
}
void main(){
 vec4 a=frameAt(uFrame),b=frameAt(uNext);
 // Texture upload decodes sRGB; interpolate coverage-weighted linear colour.
 vec4 premult=mix(vec4(a.rgb*a.a,a.a),vec4(b.rgb*b.a,b.a),uBlend);
 if(premult.a<.001)discard;
 gl_FragColor=vec4(premult.rgb/premult.a,premult.a);
 #include <colorspace_fragment>
}`});
 const mesh=new T.Mesh(new T.PlaneGeometry(recipe.crop.right-recipe.crop.left,recipe.crop.top-recipe.crop.bottom),material);
 mesh.position.set(recipe.pivot[0],recipe.pivot[1],0);root.add(mesh);
 let state:any={};const startMs=200;
 function draw(ms:number){
  const age=ms-startMs,position=Math.max(0,Math.min(recipe.count-1,age*recipe.fps/1000));
  const frame=Math.floor(position),next=Math.min(recipe.count-1,frame+1);
  uniforms.uFrame.value=frame;uniforms.uNext.value=next;uniforms.uBlend.value=position-frame;
  mesh.visible=age>=0&&age<recipe.durationMs;
  state={recipe:'D4',revision,method:'offline-padded-flipbook',sourceFps:recipe.fps,frame,next,blend:position-frame,ageMs:age,visible:mesh.visible,pivot:recipe.pivot,loop:false};
 }
 async function prepare(renderer:any,scene:any,camera:any){
  if(revision<2)return;
  // Q3-X14: do the first-use upload/compile before the sequence clock starts.
  renderer.initTexture(texture);
  await renderer.compileAsync(root,camera,scene);
 }
 return{root,draw,state:()=>state,material,mesh,texture,recipe,prepare};
}
