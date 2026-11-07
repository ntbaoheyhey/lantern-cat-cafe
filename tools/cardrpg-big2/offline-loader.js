// Embedded assets decode through browser streams, outside the application script.
// Each asset yields to the browser so opening progress and input can paint.
(async () => {
  const loading = document.getElementById('loading');
  const progress = document.getElementById('opening-progress');
  const manifest = JSON.parse(document.getElementById('asset-manifest').textContent);
  const assets = window.__cardAssets = Object.create(null);
  const timing = window.__b2Load = { started: performance.now(), assets: [], scriptStarted: 0 };
  progress.max = manifest.length + 1;

  async function unpack(element) {
    const response = await fetch('data:application/gzip;base64,' + element.textContent);
    const stream = response.body.pipeThrough(new DecompressionStream('gzip'));
    const blob = await new Response(stream).blob();
    element.remove();
    return blob;
  }

  await new Promise(resolve => requestAnimationFrame(resolve));
  for (const [index, asset] of manifest.entries()) {
    const blob = await unpack(document.getElementById('asset-' + index));
    assets[asset.key] = URL.createObjectURL(new Blob([blob], { type: asset.mime }));
    loading.textContent = `Opening the cafe… ${index + 1}/${manifest.length}`;
    progress.value = index + 1;
    timing.assets.push({ index, at: performance.now() });
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  document.getElementById('asset-manifest').remove();
  const payload = await unpack(document.getElementById('payload'));
  const { js, css } = JSON.parse(await payload.text());
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const script = document.createElement('script');
  // An inline append synchronously compiles the entire game on the main thread.
  // A local asynchronous script lets the browser schedule compilation separately.
  const application = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
  script.src = application;
  script.async = true;
  loading.textContent = 'Setting the table…';
  progress.value = manifest.length + 1;
  await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
  timing.scriptStarted = performance.now();
  try {
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = () => reject(new Error('The application script could not load.'));
      document.body.append(script);
    });
    timing.scriptLoaded = performance.now();
  } finally {
    URL.revokeObjectURL(application);
  }
})().catch(error => {
  document.getElementById('loading').textContent = 'The demo could not open. ' + error.message;
});
