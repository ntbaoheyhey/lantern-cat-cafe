// Optional diagnostic instrumentation. Never used for delivery gate captures.
export async function installCadenceProbe(page) {
  await page.evaluate(() => {
    const scene = window.__turn3dReview.scene;
    const gl = scene.renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const probe = window.__cadenceProbe = { gpuAvailable: !!ext, cpu: [], gpu: [], disjoint: 0 };
    const pending = [];
    const render = scene.render.bind(scene);
    let count = 0;
    scene.render = (...args) => {
      if (ext) {
        const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        if (disjoint) probe.disjoint++;
        while (pending.length && gl.getQueryParameter(pending[0].query, gl.QUERY_RESULT_AVAILABLE)) {
          const sample = pending.shift();
          if (!disjoint) probe.gpu.push({ at: sample.at, ms: gl.getQueryParameter(sample.query, gl.QUERY_RESULT) / 1e6, quality: sample.quality });
          gl.deleteQuery(sample.query);
        }
      }
      const at = performance.now(), quality = scene.stats.quality;
      const query = ext && ++count % 8 === 0 && pending.length < 8 ? gl.createQuery() : null;
      if (query) gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
      try { return render(...args); }
      finally {
        if (query) { gl.endQuery(ext.TIME_ELAPSED_EXT); pending.push({ query, at, quality }); }
        probe.cpu.push({ at, ms: performance.now() - at, quality, stage: window.__turn3dReview.controller.battle.run.stage, skill: args[0].frame?.plan.skillId });
      }
    };
  });
}
