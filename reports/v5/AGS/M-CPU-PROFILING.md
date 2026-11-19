# Main-Thread CPU Profiling for WebGL Games

This report covers essential techniques and concepts for profiling the CPU usage of WebGL applications within a browser environment.

## 1. Primary Sources
- [Chrome DevTools - Performance Panel Documentation](https://developer.chrome.com/docs/devtools/performance/)
- [Unity WebGL Profiling Guide](https://docs.unity3d.com/Manual/webgl-profiling.html)
- [Web.dev - Performance](https://web.dev/explore/performance)
- [Wonderland Engine - Optimization Guide (Common WebGL bottlenecks)](https://wonderlandengine.com/documentation/optimization/)

## 2. Concepts

### Sampling Overhead
Browser profilers (like Chrome's) use **sampling** to record the call stack periodically (e.g., every 1-10ms).
- **The Trade-off:** High-frequency sampling provides better resolution (identifying shorter-lived functions) but imposes higher performance overhead, potentially altering the very behavior you are trying to measure (e.g., causing the game to drop frames it wouldn't otherwise).
- **Recommendation:** Start with default sampling rates. Only increase if you suspect very short-lived micro-stutters.

### CPU Throttle vs. GPU Limits
Distinguishing between these is key for optimization:
- **CPU Bound:** Framerate drops occur despite low GPU usage (check GPU panels or frame times). Often caused by heavy JS logic, too many draw calls, or GC pauses.
- **GPU Bound:** Framerate drops occur while the GPU is saturated (high usage percentage). Often caused by fragment shader complexity, high-resolution textures, or overdraw.

## 3. Browser Engine Hotspots
In a browser, the main thread handles:
- **JS Execution:** Custom game logic, input handling, physics simulations.
- **Style Calculation & Layout:** Recalculating CSS properties and DOM geometry. "Layout thrashing" happens when JS reads and writes layout properties in a tight loop.
- **Rendering:** Paint/Rasterization and synchronization with the GPU via the Compositor.

## 4. Experiment: Using Chrome DevTools

To trace a performance issue:

1. **Prepare:** Open the game in an Incognito window to avoid extension overhead.
2. **Setup:** Open Chrome DevTools -> **Performance** tab.
3. **Capture:** Click the "Record" (circle) button.
4. **Reproduce:** Perform the action that causes the stutter/low FPS for 5-10 seconds.
5. **Stop:** Click the "Stop" button.
6. **Analyze:**
   - Look at the **Flame Chart** to identify wide blocks in the main thread.
   - Zoom in on specific frames.
   - Check the **Summary** tab to see the breakdown of time spent on Scripting vs. Rendering.
   - Look for tall yellow blocks (often Garbage Collection).
