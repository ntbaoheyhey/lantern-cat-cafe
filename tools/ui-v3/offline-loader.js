// Local modules preserve lazy loading; every asset restores to its original bytes.
(async () => {
  const loading=document.getElementById('loading'),progress=document.getElementById('opening-progress');
  const manifest=JSON.parse(document.getElementById('asset-manifest').textContent);
  const assets=window.__cardAssets=Object.create(null);
  const timing=window.__b2Load={started:performance.now(),assets:[],scriptStarted:0};
  progress.max=manifest.length+1;
  async function unpack(element){
    const encoded=element.textContent.trim();
    // Decode the transport locally; avoid creating and fetching a data URL per asset.
    const bytes=typeof Uint8Array.fromBase64==='function'
      ? Uint8Array.fromBase64(encoded) : Uint8Array.from(atob(encoded),char=>char.charCodeAt(0));
    const blob=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).blob();
    element.remove();return blob;
  }
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const dictionary=new Uint8Array(await(await unpack(document.getElementById('model-dictionary'))).arrayBuffer());
  const entries=JSON.parse(document.getElementById('model-dictionary-index').textContent);
  document.getElementById('model-dictionary-index').remove();
  let lastAssetYield=performance.now();
  // Decode eight independent transport entries at a time. Restore and publish in
  // manifest order, retaining every existing key, byte and progress observation.
  for(let batch=0;batch<manifest.length;batch+=8){
   const blobs=await Promise.all(manifest.slice(batch,batch+8).map((_,i)=>unpack(document.getElementById('asset-'+(batch+i)))));
   for(let i=0;i<blobs.length;i++){
    const index=batch+i,asset=manifest[index],blob=blobs[i];
    let restored=blob;
    if(asset.patches){
      restored=new Uint8Array(await blob.arrayBuffer());
      for(const [offset,id]of asset.patches){const [from,length]=entries[id];restored.set(dictionary.subarray(from,from+length),offset);}
    }
    assets[asset.key]=URL.createObjectURL(new Blob([restored],{type:asset.mime}));
    loading.textContent=`Opening the cafe… ${index+1}/${manifest.length}`;progress.value=index+1;
    timing.assets.push({index,at:performance.now()});
    // Keep the UI responsive without paying a minimum timer delay per small asset.
    if(performance.now()-lastAssetYield>=8){await new Promise(resolve=>setTimeout(resolve,0));lastAssetYield=performance.now();}
  }
  }
  document.getElementById('asset-manifest').remove();
  const payload=await unpack(document.getElementById('payload'));
  const {entry,modules,css}=JSON.parse(await payload.text());
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  const imports=Object.fromEntries(modules.map(module=>[module.id,URL.createObjectURL(new Blob([module.code],{type:'text/javascript'}))]));
  // These URLs remain alive for later lazy imports and are released with the page.
  window.__cardModuleUrls=imports;
  const map=document.createElement('script');map.type='importmap';map.textContent=JSON.stringify({imports});document.head.append(map);
  const script=document.createElement('script');script.type='module';script.src=imports[entry];
  loading.textContent='Setting the table…';progress.value=manifest.length+1;
  await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  timing.scriptStarted=performance.now();
  await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(new Error('The cafe could not load.'));document.body.append(script);});
  timing.scriptLoaded=performance.now();
})().catch(error=>{document.getElementById('loading').textContent='The demo could not open. '+error.message;});
