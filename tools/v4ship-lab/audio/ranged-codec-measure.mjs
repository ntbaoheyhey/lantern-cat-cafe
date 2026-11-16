/** Browser-decoded sample comparison, independent of runtime playback. */
export async function measureSprites(page,bytes,variants,rate=48000){
 return page.evaluate(async({base64,variants,rate})=>{
  const ctx=new OfflineAudioContext(1,1,rate),decoded=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer),actual=decoded.getChannelData(0),pcm=window.__originalPCM;
  const rows=variants.map(v=>{
   const start=Math.round(v.sample.start*rate),length=Math.round(v.sample.duration*rate);let best={lag:0,correlation:-Infinity};
   for(let lag=-4096;lag<=4096;lag++){
    let xx=0,yy=0,xy=0;
    for(let i=64;i<Math.min(length,4096);i+=16){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;}
    const correlation=xy/Math.sqrt(xx*yy);if(correlation>best.correlation)best={lag,correlation};
   }
   const measure=lag=>{let xx=0,yy=0,xy=0,error=0;for(let i=0;i<length;i++){const x=pcm[start+i],y=actual[start+i+lag]??0;xx+=x*x;yy+=y*y;xy+=x*y;error+=(y-x)**2;}return {correlation:xy/Math.sqrt(xx*yy),rmsDeltaDb:10*Math.log10(yy/xx),errorToSignalDb:10*Math.log10(error/xx),complete:start+lag>=0&&start+lag+length<=actual.length};};
   return {variantId:v.sample.variantId,lagSamples:best.lag,lagMs:best.lag/rate*1000,prefixCorrelation:best.correlation,canonical:measure(0),aligned:measure(best.lag)};
  });
  return {decodedFrames:actual.length,originalFrames:pcm.length,sampleRate:decoded.sampleRate,channels:decoded.numberOfChannels,lagSamples:[...new Set(rows.map(r=>r.lagSamples))],minimumCanonicalCorrelation:Math.min(...rows.map(r=>r.canonical.correlation)),minimumAlignedCorrelation:Math.min(...rows.map(r=>r.aligned.correlation)),maximumAlignedRmsDeltaDb:Math.max(...rows.map(r=>Math.abs(r.aligned.rmsDeltaDb))),allComplete:rows.every(r=>r.aligned.complete),variants:rows};
 },{base64:bytes.toString('base64'),variants,rate});
}
