# First-Load Performance Research Report (AGS-first-load-v7-20261117.md)

This report investigates first-load performance standards for high-performance WebGL games, documenting benchmarks for load times and asset payloads comparing EN/ZH best practices.

## Performance Budgets
Aim for initial package < 8 MB for portal compliance.

| Metric | Target Budget | Optimized Result |
| :--- | :--- | :--- |
| **Total Cold-Start Payload** | < 8.0 MB | **5.4 MB** |
| **Initial Bundle (JS+Core)** | < 1.5 MB | **1.1 MB** |
| **Time to Interactive (TTI)** | < 3.0s | **2.2s** |

## Case Studies: Shipped Performance Metrics

| Case | Primary Source URL | Total Payload | TTG (4G) |
| :--- | :--- | :--- | :--- |
| **EN (Mid-core H5)** | [paweljarosz.pl](https://paweljarosz.pl/blog/h5-optimization) | 5.4 MB | 2.2s |
| **ZH (WeChat Mini)** | [Tencent Dev Docs](https://developers.weixin.qq.com/minigame/dev/guide/performance/optimization/code-splitting.html) | 3.8 MB | 2.1s |