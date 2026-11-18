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

## Case Study: English (Ravalmatic)
- **Source**: [Optimizing HTML5 Games Loading Performance](https://www.ravalmatic.com/blog/optimizing-html5-games-loading-performance/)
- **Context**: "Optimizing game bundles to reduce loading times... modular, stripped-down builds."
- **Measurement**: "The initial bundle was reduced from 45MB to 8MB."

## Case Study: Chinese (WeChat Mini-Game)
- **Source**: [Tencent Mini-Game Dev Docs (Code Splitting)](https://developers.weixin.qq.com/minigame/dev/guide/performance/optimization/code-splitting.html)
- **Context**: "Code-splitting and reducing main package size for cold-start improvement."
- **Measurement**: "Initial main package size reduced from 8.5MB to 3.8MB, cold-start FMP reduced from 6.5s to 2.1s."
