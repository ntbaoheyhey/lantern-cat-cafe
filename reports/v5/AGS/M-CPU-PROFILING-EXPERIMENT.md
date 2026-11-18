# T-CXI-15: Read-only Profiling Method
- Method: Use Chrome DevTools (Performance tab) to capture a trace.
- Distinguish: JS (Scripting), Render (Style/Layout), Layout (Reflow/Repaint).
- Overhead: Sampling rate impacts performance metrics; limited frequency recommended.
- Note: CPU throttling (CPU 4x) reduces available headroom; GPU limits affect Rasterization/GPU work.
