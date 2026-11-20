// Isolated geometry mask plus the exact rendered floor behind each opponent.
export async function silhouetteContrast(page) {
 return page.evaluate(async()=>{
  const s=window.__depthScene,rows=[],canvas=s.renderer.domElement;
  const render=()=>s.post.render(s.scene,s.camera,0,0,'#ffffff',true);
  const pixels=()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const ctx=c.getContext('2d');ctx.drawImage(canvas,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
  const lum=(a,i)=>{const linear=v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4;return .2126*linear(a[i])+.7152*linear(a[i+1])+.0722*linear(a[i+2]);};
  for(const a of s.view().actors.filter(a=>a.side==='enemy')){
   const p=s.puppets.get(a.id);if(!p)continue;
   render();const full=pixels();const modelVisible=p.model.visible,shadowVisible=p.shadow.visible;
   p.model.visible=false;p.shadow.visible=false;render();const floor=pixels();p.model.visible=modelVisible;
   const visibility=new Map();s.scene.traverse(o=>visibility.set(o,o.visible));
   for(const o of s.scene.children)o.visible=o===p.root;
   for(const o of p.root.children)o.visible=o===p.model;
   const material=s.blobMaterial.clone();material.map=null;material.color.set('#ffffff');material.opacity=1;material.transparent=false;material.toneMapped=false;
   const previous=s.scene.overrideMaterial,background=s.scene.background;s.scene.background=null;s.scene.overrideMaterial=material;
   const clear=s.renderer.getClearColor(material.color.clone()),alpha=s.renderer.getClearAlpha();s.renderer.setClearColor('#000000',1);s.renderer.setRenderTarget(null);s.renderer.render(s.scene,s.camera);const mask=pixels();
   let count=0,foreground=0,behind=0;for(let i=0;i<mask.length;i+=4)if(mask[i]>200){count++;foreground+=lum(full,i);behind+=lum(floor,i);}
   rows.push({id:a.id,asset:p.asset,pixels:count,foreground:foreground/count,floor:behind/count,contrast:Math.abs(foreground-behind)/count});
   s.scene.overrideMaterial=previous;s.scene.background=background;s.renderer.setClearColor(clear,alpha);material.dispose();for(const [o,visible]of visibility)o.visible=visible;p.shadow.visible=shadowVisible;render();
  }
  return rows;
 });
}
