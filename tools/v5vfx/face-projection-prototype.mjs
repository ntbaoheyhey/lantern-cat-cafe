/** Diagnostic browser override only; application sources are left unchanged. */
export async function installFaceProjectionPrototype(page){
 return page.evaluate(()=>{
  const s=window.__depthScene;
  const drawings=[...s.actors.values()].flatMap(e=>e.craftPose?.drawing?[e.craftPose.drawing]:[]);
  const original=drawings[0].point,originalWeights=drawings[0].weightsFor;
  const anchor='const projected = depth.offset(x, y, frame.face, this.faceOffset);';
  const source=String(original);if(!source.includes(anchor))throw Error('Face prototype source anchor changed');
  const body=source.replace(anchor,'const shapeOffset=offset+7+overlaps.length; const projected=weights?depth.__cxvProject(x-fx-fw*.55,y-fy-fh*.52,weights[shapeOffset],weights[shapeOffset+1],this.faceOffset):depth.offset(x,y,frame.face,this.faceOffset);');
  const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
  const point=new Function('smooth','NO_OVERLAP','return ({'+body+'}).point;')(smooth,[]);
  const project=function(dx,dy,dome,depth,out){out.x=out.y=0;if(this.yaw===0&&this.pitch===0)return out;if(dome===0&&depth===0)return out;out.x=dx*(this.yawCos-1)*dome+depth*this.yawSin;out.y=dy*(this.pitchCos-1)*dome-depth*this.pitchSin;return out;};
  for(const d of drawings){
   const cache=new Map();d.__cxvFaceWeights=cache;
   d.point=point;d.faceDepth.__cxvProject=project;d.seekFaceDepth.__cxvProject=project;
   d.weightsFor=function(key){
    const cached=cache.get(key);if(cached)return cached;
    const base=originalWeights.call(this,key),stride=base.stride+2,m=this.set.manifest;
    const data=new Float64Array(this.source.length/3*stride),[fx,fy,w,h]=m.poses[key].face;
    for(let i=0;i<this.source.length/3;i++){
     data.set(base.data.subarray(i*base.stride,(i+1)*base.stride),i*stride);
     const x=this.source[i*3]+m.canvas[0]/2,y=m.canvas[1]/2-this.source[i*3+1],dx=x-fx-w*.55,dy=y-fy-h*.52;
     const dome=smooth(1-(dx/(w*.62))**2-(dy/(h*.78))**2),muzzle=smooth(1-((x-fx-w*.60)/(w*.22))**2-((y-fy-h*.64)/(h*.28))**2);
     const at=i*stride+base.stride;data[at]=dome;data[at+1]=w*(.22*dome+.06*muzzle);
    }
    const result={data,stride};cache.set(key,result);return result;
   };
  }
  return {drawings:drawings.length,slots:2,note:'Tool-only compact override. Builds extended arrays lazily and retains baseline arrays; cold copy overhead and retained duplicate memory are diagnostic, not proposed runtime startup or memory.'};
 });
}
