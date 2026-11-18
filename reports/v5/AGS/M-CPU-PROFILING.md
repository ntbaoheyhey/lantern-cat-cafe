# WebGL CPU Profiling & Performance Analysis

## Overview
WebGL performance requires balancing JavaScript execution on the CPU with rendering commands processed by the GPU. Bottlenecks often arise from misinterpreting CPU-side script overhead as GPU-side rendering limits.

## 1. Key Sources
### English
* [Wonderland Engine: WebGL Bottlenecks](https://wonderlandengine.com) - Comprehensive overview of draw call overhead vs. GPU limitations.
* [Chrome DevTools: Performance Analysis](https://web.dev) - Standard methodology for tracing main-thread tasks.
* [Three.js Performance Docs](https://threejs.org) - Practical advice on monitoring WebGL applications.

### Chinese
* [CSDN: WebGL 性能瓶颈排查](https://csdn.net) - Detailed breakdown of JS thread overhead and render pipeline bottlenecks.
* [掘金: WebGL 性能优化实战](https://juejin.cn) - In-depth guide on texture compression, overdraw, and memory management.
* [Tencent: WebGL 渲染管线与布局交互](https://tencent.com) - Analysis of DOM/layout interactions affecting Canvas rendering.

## 2. Distinguishing Hotspots (Experimental Design)
To distinguish between JS, Render (Pipeline), and Layout hotspots, use the following observational approach in a browser (e.g., Chrome/Firefox DevTools):

### Methodology: Browser Performance Tracing
1. **Prepare Environment:** Open the WebGL application in a private tab (minimize extensions).
2. **Setup Profiling:** Open DevTools > **Performance** tab.
3. **Capture:** Click "Record", interact with the game (e.g., gameplay for 5s), then click "Stop".
4. **Analysis:**
   * **JS Hotspots:** Examine the "Main" thread flame chart. Look for long-running yellow bars (Script evaluation). If high, investigate Scene Graph traversal, physics, or GC churn.
   * **Layout/Style Hotspots:** Look for purple/brown bars labeled "Recalculate Style" or "Layout". If present during interaction, the WebGL canvas is forcing layout thrashing.
   * **Render Pipeline Hotspots:** If the frame rate is low but CPU script time is minimal, the bottleneck is likely in the GPU pipeline (Vertex-Bound or Fragment-Bound).
     * **Validation Test:** Shrink the canvas to 1x1 pixels. If performance significantly improves, it is **Fragment Bound** (GPU/Fill-rate). If it does not, it is likely **Vertex Bound** or **CPU-side Draw Call overhead**.
   * **Forcing Synchronization (Advanced):** To expose actual GPU rendering intervals, you can force a read-back (e.g., `gl.readPixels()`). *Warning: This will artificially stall the pipeline.*

## 3. Summary of Bottlenecks
| Bottleneck Type | Primary Symptom | Investigation Point |
| :--- | :--- | :--- |
| **JS Execution** | Unstable FPS, High CPU usage | Long Tasks, GC, Scene Graph traversal |
| **Layout/DOM** | Interaction jitter/lag | Recalculate Style, Layout, DOM updates |
| **GPU (Fragment)** | Slow rendering in high complexity | Resolution test, Overdraw, Shader cost, Textures |
| **GPU (Vertex)** | Low FPS regardless of resolution | High polygon count, Vertex shader complexity |
