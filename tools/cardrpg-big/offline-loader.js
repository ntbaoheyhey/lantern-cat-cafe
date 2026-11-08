// Local modules preserve lazy loading; every asset restores to its original bytes.
(async () => {
  const loading=document.getElementById('loading'),progress=document.getElementById('opening-progress');
  const manifest=JSON.parse(document.getElementById('asset-manifest').textContent);
  const assets=window.__cardAssets=Object.create(null);
  const timing=window.__b2Load={started:performance.now(),assets:[],scriptStarted:0};
  progress.max=manifest.length+1;
  async function unpack(element){
    const response=await fetch('data:application/gzip;base64,'+element.textContent);
    const blob=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).blob();
    element.remove();return blob;
  }
  await new Promise(resolve=>requestAnimationFrame(resolve));
  const dictionary=new Uint8Array(await(await unpack(document.getElementById('model-dictionary'))).arrayBuffer());
  const entries=JSON.parse(document.getElementById('model-dictionary-index').textContent);
  document.getElementById('model-dictionary-index').remove();
  for(const [index,asset]of manifest.entries()){
    const blob=await unpack(document.getElementById('asset-'+index));
    let restored=blob;
    if(asset.patches){
      restored=new Uint8Array(await blob.arrayBuffer());
      for(const [offset,id]of asset.patches){const [from,length]=entries[id];restored.set(dictionary.subarray(from,from+length),offset);}
    }
    assets[asset.key]=URL.createObjectURL(new Blob([restored],{type:asset.mime}));
    loading.textContent=`Opening the cafe… ${index+1}/${manifest.length}`;progress.value=index+1;
    timing.assets.push({index,at:performance.now()});await new Promise(resolve=>setTimeout(resolve,0));
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
