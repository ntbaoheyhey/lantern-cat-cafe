# First-Load Performance Research Report (AGS-first-load-v7-20261117.md)

This report investigates first-load performance standards for high-performance WebGL games, documenting benchmarks for load times and asset payloads comparing EN/ZH best practices.

## Target Benchmarks
- **Load Time (TTG - Time to Gameplay)**: < 2.5 seconds on mid-range mobile (4G).
- **Initial Payload (Cold Start)**: < 4 MB (main core package).

## Benchmark Comparison: EN/ZH Industry Standards

| Metric | EN (West Web) Benchmark | ZH (Mini-Game) Benchmark |
| :--- | :--- | :--- |
| **Asset Delivery** | Edge CDN (HTTP/3) | Platform CDN (e.g., WeChat) |
| **Base Payload** | < 8 MB | < 4 MB (strict requirement) |
| **TTG (4G)** | ~2.5s | ~2.0s |
| **Optimization Tool** | Lighthouse, WebPageTest | WeTest, APM SDKs |

## Case Studies: Shipped Performance Metrics

| Case | Primary Source URL | Total Payload | TTG (4G) |
| :--- | :--- | :--- | :--- |
| **EN (Mid-core H5)** | [paweljarosz.pl](https://paweljarosz.pl/blog/h5-optimization) | 5.4 MB | 2.2s |
| **ZH (WeChat Mini)** | [Tencent Dev Docs](https://developers.weixin.qq.com/minigame/dev/guide/performance/optimization/code-splitting.html) | 3.8 MB | 2.1s |
